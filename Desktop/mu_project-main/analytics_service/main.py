import os
import re
from datetime import datetime
from statistics import mean

import pymysql
from dotenv import load_dotenv
from fastapi import FastAPI, Body
from openai import OpenAI  # OpenAI client

# Load .env (DB credentials + OPENAI_API_KEY)
BASE_DIR = os.path.dirname(__file__)
load_dotenv(os.path.join(BASE_DIR, ".env"))

app = FastAPI()

# Create OpenAI client (reads OPENAI_API_KEY from env)
openai_client = OpenAI()


# ---------------- DB CONNECTION ----------------
def get_connection():
    """
    Open a connection to the same MySQL database that Laravel uses.
    Values are read from analytics_service/.env
    """
    return pymysql.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        user=os.getenv("DB_USERNAME", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_DATABASE", "laravel"),
        port=int(os.getenv("DB_PORT", "3306")),
        cursorclass=pymysql.cursors.DictCursor,
    )


# ---------------- BASIC METRICS ----------------
def get_total_sales():
    """
    Total sales from the orders table (all NON-CANCELLED orders).
    Includes: pending, preparing, ready, completed
    Excludes: cancelled
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT COALESCE(SUM(total), 0) AS total_sales
                FROM orders
                WHERE status <> 'cancelled'
                """
            )
            row = cur.fetchone()
            return float(row["total_sales"] or 0)
    finally:
        conn.close()


def get_sales_last_n_days(days: int):
    """
    Sum of orders.total per day for the last N days (all NON-CANCELLED orders).
    """
    days = max(1, min(int(days), 365))
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT DATE(created_at) AS date,
                       COALESCE(SUM(total), 0) AS total_sales
                FROM orders
                WHERE status <> 'cancelled'
                  AND created_at >= CURDATE() - INTERVAL %s DAY
                GROUP BY DATE(created_at)
                ORDER BY DATE(created_at)
                """,
                (days,),
            )
            rows = cur.fetchall()
            labels = [
                row["date"].strftime("%Y-%m-%d")
                if isinstance(row["date"], datetime)
                else str(row["date"])
                for row in rows
            ]
            values = [float(row["total_sales"] or 0) for row in rows]
            return labels, values
    finally:
        conn.close()


# ---------------- ITEM PERFORMANCE ----------------
def get_item_performance(last_n_days: int):
    """
    Fetch all menu items with quantities sold in the last N days.
    Returns a list of dicts: {menu_item_id, item_name, qty}
    """
    last_n_days = max(1, min(int(last_n_days), 365))
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT mi.id AS menu_item_id,
                       mi.name AS item_name,
                       COALESCE(SUM(oi.quantity), 0) AS qty
                FROM menu_items mi
                LEFT JOIN order_items oi ON oi.menu_item_id = mi.id
                LEFT JOIN orders o ON o.id = oi.order_id
                    AND o.status <> 'cancelled'
                    AND o.created_at >= CURDATE() - INTERVAL %s DAY
                GROUP BY mi.id, mi.name
                ORDER BY qty DESC
                """,
                (last_n_days,),
            )
            rows = cur.fetchall()
            for r in rows:
                r["qty"] = float(r["qty"] or 0)
            return rows
    finally:
        conn.close()


def split_top_and_worst_items(all_items, limit=5):
    """
    Build top and worst lists for charts.

    - TOP: highest selling items (only items with qty > 0)
    - WORST: lowest selling items (including zero sales)
    - We do NOT try to de-duplicate; an item can technically be
      both best and worst only if you have very few items, which
      is fine for visualization.
    """
    if not all_items:
        return [], []

    # Top = items that actually sold something, sorted desc
    items_with_sales = [r for r in all_items if (r.get("qty") or 0) > 0]
    sorted_desc = sorted(items_with_sales, key=lambda r: r["qty"], reverse=True)
    top_items = sorted_desc[:limit]

    # Worst = all items (including zero), sorted asc
    sorted_asc = sorted(all_items, key=lambda r: r["qty"])
    worst_items = sorted_asc[:limit]

    return top_items, worst_items


# ---------------- PAYMENTS ----------------
def get_payment_breakdown(last_n_days=None):

    """
    Count orders by payment_method among orders.

    NOTE: we no longer require paid = 1 because in some schemas
    that field is not used consistently. We only require a
    non-null payment_method.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            base_sql = """
                SELECT UPPER(COALESCE(payment_method, 'UNKNOWN')) AS method,
                       COUNT(*) AS cnt
                FROM orders
                WHERE payment_method IS NOT NULL
            """
            params = []
            if last_n_days is not None:
                base_sql += " AND created_at >= CURDATE() - INTERVAL %s DAY"
                params.append(max(1, min(int(last_n_days), 365)))

            base_sql += " GROUP BY UPPER(COALESCE(payment_method, 'UNKNOWN'))"

            cur.execute(base_sql, params)
            rows = cur.fetchall()
            result = {row["method"]: int(row["cnt"] or 0) for row in rows}
            return result
    finally:
        conn.close()


# ---------------- USERS ----------------
def get_all_user_emails(limit: int = 200):
    """
    Return a list of user emails (up to 'limit').
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT email FROM users ORDER BY id LIMIT %s",
                (limit,),
            )
            rows = cur.fetchall()
            return [r["email"] for r in rows if r.get("email")]
    finally:
        conn.close()


# ---------------- INVENTORY / STOCK ----------------
def get_low_stock_items(threshold: int = 5, limit: int = 10):
    """
    Find menu items with low stock using stock_qty if present, else stock.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT name,
                       COALESCE(stock_qty, stock, 0) AS stock_level
                FROM menu_items
                WHERE COALESCE(stock_qty, stock, 0) <= %s
                ORDER BY stock_level ASC, name ASC
                LIMIT %s
                """,
                (threshold, limit),
            )
            rows = cur.fetchall()
            for r in rows:
                r["stock_level"] = int(r["stock_level"] or 0)
            return rows
    finally:
        conn.close()


# ---------------- FORECASTING ----------------
def linear_forecast(values):
    """
    Forecast tomorrow and next 7 days using recent daily sales.

    - If we have fewer than 4 days of data, we just use the average.
    - Otherwise, we use a simple linear regression BUT we blend
      it with the average and cap extremes so one crazy spike
      won't give a ridiculous forecast.
    """
    if not values:
        return 0.0, 0.0

    n = len(values)
    avg = mean(values)

    # Not enough data: stick with simple average
    if n < 4:
        tomorrow = avg
        next_7 = avg * 7
        return float(tomorrow), float(next_7)

    x = list(range(n))
    y = list(values)

    sum_x = sum(x)
    sum_y = sum(y)
    sum_xx = sum(v * v for v in x)
    sum_xy = sum(x[i] * y[i] for i in range(n))

    denom = n * sum_xx - sum_x * sum_x
    if denom == 0:
        tomorrow = avg
        next_7 = avg * 7
        return float(tomorrow), float(next_7)

    m = (n * sum_xy - sum_x * sum_y) / denom
    b = (sum_y - m * sum_x) / n

    # Base regression forecast
    tomorrow_reg = b + m * n
    next_7_reg = 0.0
    for i in range(1, 8):
        next_7_reg += b + m * (n - 1 + i)

    # Blend regression with average (50/50)
    tomorrow = 0.5 * tomorrow_reg + 0.5 * avg
    next_7 = 0.5 * next_7_reg + 0.5 * (avg * 7)

    # Never negative
    tomorrow = max(tomorrow, 0.0)
    next_7 = max(next_7, 0.0)

    # Cap forecasts to avoid insane numbers:
    # not more than 3x average daily
    max_tomorrow = avg * 3
    if tomorrow > max_tomorrow:
        tomorrow = max_tomorrow

    max_next7 = avg * 7 * 3
    if next_7 > max_next7:
        next_7 = max_next7

    return float(tomorrow), float(next_7)


# ---------------- METRICS SUMMARY & AI ----------------
def extract_windows_from_message(message: str, default_short=7, default_long=30):
    """
    Detect a custom day window in the user's message.

    Supported examples:
    - "last 10 days"
    - "past 21 days"
    - "for 4 days"
    - "best items in 15 days"
    - even just "15 days" somewhere in the text

    Whatever we detect, we use the same value for BOTH the short
    and long windows so charts + items + payments are consistent.
    """
    msg = (message or "").lower()

    # 1) Patterns like "last 10 days", "past 5 days", "for 4 days"
    m = re.search(r"(last|past|for)\s+(\d{1,3})\s+days?", msg)
    if m:
        days = int(m.group(2))
        days = max(1, min(days, 365))
        return days, days

    # 2) Fallback: any "<number> days" in the text
    m = re.search(r"(\d{1,3})\s+days?", msg)
    if m:
        days = int(m.group(1))
        days = max(1, min(days, 365))
        return days, days

    # 3) No hint -> defaults
    return default_short, default_long


def build_metrics_summary(
    total_sales: float,
    labels_short,
    values_short,
    labels_long,
    values_long,
    short_days,
    long_days,
    top_items,
    worst_items,
    payment_breakdown,
    forecast_tomorrow,
    forecast_next_7,
    avg_daily_sales,
    low_stock_items,
) -> str:
    """
    Turn raw metrics into a text summary that we pass to the AI model.
    """
    lines = []
    lines.append(f"Total sales for all non-cancelled orders (all time): {total_sales:.2f} USD")
    lines.append("")

    # Short window summary
    lines.append(f"Sales over the last {short_days} days (non-cancelled orders):")
    if labels_short:
        for d, v in zip(labels_short, values_short):
            lines.append(f"- {d}: {v:.2f} USD")
    else:
        lines.append(f"- No non-cancelled orders found in the last {short_days} days.")
    lines.append("")

    # Long window summary
    lines.append(f"Sales over the last {long_days} days (non-cancelled orders):")
    if labels_long:
        for d, v in zip(labels_long, values_long):
            lines.append(f"- {d}: {v:.2f} USD")
    else:
        lines.append(f"- No non-cancelled orders found in the last {long_days} days.")
    lines.append("")

    # Average daily sales
    lines.append(f"Average daily sales over the last {short_days} days: {avg_daily_sales:.2f} USD")
    lines.append("")

    # Top items
    lines.append(f"Top performing menu items in the last {long_days} days (by quantity):")
    if top_items:
        for row in top_items:
            lines.append(f"- {row['item_name']}: {row['qty']} units")
    else:
        lines.append("- No data for top items.")
    lines.append("")

    # Worst items
    lines.append(f"Worst performing menu items in the last {long_days} days (by quantity):")
    if worst_items:
        for row in worst_items:
            lines.append(f"- {row['item_name']}: {row['qty']} units")
    else:
        lines.append("- No data for worst items.")
    lines.append("")

    # Payments
    lines.append(f"Payment breakdown for the last {long_days} days (by orders):")
    if payment_breakdown:
        total_payments = sum(payment_breakdown.values())
        for method, cnt in payment_breakdown.items():
            pct = (cnt / total_payments * 100) if total_payments else 0
            lines.append(f"- {method}: {cnt} payments ({pct:.1f}% of orders)")
    else:
        lines.append("- No payment data found.")
    lines.append("")

    # Forecast
    lines.append(f"Forecast for tomorrow's sales: {forecast_tomorrow:.2f} USD")
    lines.append(f"Forecast for the next 7 days: {forecast_next_7:.2f} USD")
    lines.append("")

    # Low stock
    if low_stock_items:
        lines.append("Low stock items (may require restocking soon):")
        for item in low_stock_items:
            lines.append(f"- {item['name']}: {item['stock_level']} units left")
        lines.append("")

    return "\n".join(lines)


def build_alerts(
    total_sales,
    values_short,
    short_days,
    top_items,
    worst_items,
    forecast_tomorrow,
    forecast_next_7,
    avg_daily_sales,
    payment_breakdown,
    low_stock_items,
):
    """
    More professional, business-style alerts and insights.
    """
    alerts = []

    # ---- Sales behaviour vs average ----
    if values_short:
        last_day = values_short[-1]
        avg_short = mean(values_short)
        diff = last_day - avg_short
        diff_pct = (diff / avg_short * 100) if avg_short else 0

        if avg_short > 0 and diff_pct <= -20:
            alerts.append(
                f"📉 Recent sales are about {abs(diff_pct):.1f}% below the "
                f"average for the last {short_days} days. Investigate potential "
                "reasons such as holidays, schedule changes, or menu issues."
            )
        elif diff_pct >= 20:
            alerts.append(
                f"📈 Recent sales are approximately {diff_pct:.1f}% higher than the "
                f"average for the last {short_days} days. Consider reinforcing "
                "what worked (promotions, new items, timing, etc.)."
            )

        # Trend compared to previous day (if available)
        if len(values_short) >= 2:
            prev_day = values_short[-2]
            if prev_day > 0:
                day_change = (last_day - prev_day) / prev_day * 100
                direction = "up" if day_change >= 0 else "down"
                alerts.append(
                    f"📊 Day-over-day change: sales are {abs(day_change):.1f}% {direction} "
                    "compared to the previous day within the selected window."
                )

    # ---- No sales at all ----
    if total_sales == 0:
        alerts.append(
            "⚠️ No non-cancelled orders were found. If this is unexpected, "
            "review order statuses and data imports."
        )

    # ---- Product performance ----
    if top_items:
        best = top_items[0]
        alerts.append(
            f"🏆 Best seller: '{best['item_name']}' with {best['qty']} units in the "
            "selected period. Consider using it in promotions or combo offers."
        )

    if worst_items:
        worst = worst_items[0]
        alerts.append(
            f"🧊 Weak performer: '{worst['item_name']}' with only {worst['qty']} units "
            "sold in the selected period. Review its recipe, pricing, or visibility."
        )

    # ---- Payment mix ----
    if payment_breakdown:
        total_payments = sum(payment_breakdown.values())
        if total_payments > 0:
            cash = payment_breakdown.get("CASH", 0)
            qr = payment_breakdown.get("QR", 0)
            other = total_payments - cash - qr

            cash_pct = cash / total_payments * 100
            qr_pct = qr / total_payments * 100
            other_pct = other / total_payments * 100 if other > 0 else 0

            text = (
                f"💳 Payment mix (selected period): CASH {cash_pct:.1f}% ({cash} orders), "
                f"QR {qr_pct:.1f}% ({qr} orders)"
            )
            if other > 0:
                text += f", OTHER {other_pct:.1f}% ({other} orders)."
            else:
                text += "."
            alerts.append(text)

    # ---- Forecast ----
    if forecast_next_7 > 0 and avg_daily_sales > 0:
        weekly_avg = avg_daily_sales * 7
        diff = forecast_next_7 - weekly_avg
        diff_pct = diff / weekly_avg * 100 if weekly_avg else 0

        if abs(diff_pct) < 10:
            desc = "roughly in line with recent performance"
        elif diff_pct > 0:
            desc = f"about {diff_pct:.1f}% higher than the recent weekly average"
        else:
            desc = f"about {abs(diff_pct):.1f}% lower than the recent weekly average"

        alerts.append(
            f"🔮 Next 7 days forecast is approximately {forecast_next_7:.2f} USD, "
            f"{desc}. Use this to plan staffing and inventory."
        )

    # ---- Inventory ----
    if low_stock_items:
        names = ", ".join(f"{i['name']} ({i['stock_level']})" for i in low_stock_items[:5])
        alerts.append(
            f"📦 Low stock: {names}. Review purchase orders to avoid stockouts on "
            "popular items."
        )

    return alerts


def ask_ai(user_message: str, metrics_summary: str) -> str:
    """
    Use an OpenAI model to create a natural-language answer.
    """
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an intelligent assistant inside a cafeteria "
                        "analytics dashboard. You can see metrics from the "
                        "database. When the user asks about sales, menu items, "
                        "payments, inventory, or trends, use ONLY the metrics I give "
                        "you and explain them clearly with a business-oriented tone. "
                        "When the question is general (for example, about the "
                        "weather or colors), just answer normally. Be concise and "
                        "practical."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"User question:\n{user_message}\n\n"
                        f"Here are the current metrics you can use:\n{metrics_summary}"
                    ),
                },
            ],
            max_tokens=400,
        )

        ai_text = response.choices[0].message.content
        return ai_text.strip()
    except Exception as e:
        fallback_lines = [
            "🔥 Hi from Python, now connected to your database!",
            "",
            "(There was a problem using the AI model, so this is a simple fallback message.)",
            "",
            metrics_summary,
            "",
            f"Error from AI service: {e}",
        ]
        return "\n".join(fallback_lines)


# ---------------- FASTAPI ENDPOINTS ----------------
@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "Python analytics service is running (with DB + AI + advanced analytics)",
    }


@app.post("/analyze")
async def analyze(payload: dict = Body(...)):
    """
    Main endpoint called by Laravel.
    """
    user_message = (payload.get("message") or "").strip()
    lower_msg = user_message.lower()

    # Dynamic date windows from the message (e.g. "last 15 days")
    short_days, long_days = extract_windows_from_message(user_message, 7, 30)
        # Make sure these variables always exist, even if something fails later
    kpis = []
    visualizations = []
    alerts = []
    assistant_message = None


    # 1) Pull metrics from DB
    try:
        total_sales = get_total_sales()
        labels_short, values_short = get_sales_last_n_days(short_days)
        labels_long, values_long = get_sales_last_n_days(long_days)

        all_items = get_item_performance(last_n_days=long_days)
        top_items, worst_items = split_top_and_worst_items(all_items, limit=5)

        payment_breakdown = get_payment_breakdown(last_n_days=long_days)

        avg_daily_sales = mean(values_short) if values_short else 0.0
        forecast_tomorrow, forecast_next_7 = linear_forecast(values_short)

        low_stock_items = get_low_stock_items(threshold=5, limit=10)

        error_msg = None
    except Exception as e:
        total_sales = 0.0
        labels_short, values_short = [], []
        labels_long, values_long = [], []
        top_items, worst_items = [], []
        payment_breakdown = {}
        avg_daily_sales = 0.0
        forecast_tomorrow, forecast_next_7 = 0.0, 0.0
        low_stock_items = []
        error_msg = str(e)

    # 2) Build metrics summary for the AI
    metrics_summary = build_metrics_summary(
        total_sales,
        labels_short,
        values_short,
        labels_long,
        values_long,
        short_days,
        long_days,
        top_items,
        worst_items,
        payment_breakdown,
        forecast_tomorrow,
        forecast_next_7,
        avg_daily_sales,
        low_stock_items,
    )

    # 3) Build alerts (independent of AI)
    if error_msg:
        alerts = [f"⚠️ Database error: {error_msg}"]
    else:
        alerts = build_alerts(
            total_sales,
            values_short,
            short_days,
            top_items,
            worst_items,
            forecast_tomorrow,
            forecast_next_7,
            avg_daily_sales,
            payment_breakdown,
            low_stock_items,
        )

    assistant_message = None

    # ---- Special-case questions: user emails ----
    if "email" in lower_msg and "user" in lower_msg and "list" in lower_msg:
        emails = get_all_user_emails(limit=500)
        if emails:
            assistant_message = (
                "Here are the user emails in your database:\n"
                + "\n".join(f"- {e}" for e in emails)
            )
        else:
            assistant_message = "I could not find any user emails in your database."

    # ---- Special-case: cash vs QR in a given period ----
    if assistant_message is None and "cash" in lower_msg and "qr" in lower_msg:
        try:
            # Reuse the same window the user requested (short_days)
            breakdown = get_payment_breakdown(last_n_days=short_days)
        except Exception as e:
            assistant_message = (
                "Sorry, I couldn't read payment data right now.\n"
                f"Error: {e}"
            )
        else:
            cash = breakdown.get("CASH", 0)
            qr = breakdown.get("QR", 0)
            other = sum(breakdown.values()) - cash - qr

            assistant_message = (
                f"In the last {short_days} days, I see:\n"
                f"- CASH payments: {cash} orders\n"
                f"- QR payments: {qr} orders\n"
            )
            if other > 0:
                assistant_message += f"- Other payment methods: {other} orders\n"

            if cash == 0 and qr == 0 and other == 0:
                assistant_message += (
                    "There were no orders with a payment method recorded "
                    "in this period."
                )

    # ---- Normal path – use the AI for a smart answer ----
    if assistant_message is None:
        if error_msg:
            assistant_message = (
                "There was a problem reading the database, so I cannot show live "
                "metrics right now.\n\n"
                f"Error: {error_msg}"
            )
        else:
            assistant_message = ask_ai(
                user_message or "(no question provided)", metrics_summary
            )

    # 6) KPIs for the cards
        kpis = [
        {
            "label": "Total Sales (All Time)",
            "value": total_sales,
            "unit": "USD",
            "note": "All non-cancelled orders, entire history",
        },
        {
            "label": f"Daily Average (Last {short_days} Days)",
            "value": avg_daily_sales,
            "unit": "USD",
            "note": "Average of daily totals in the selected window",
        },
        {
            "label": "Forecast – Next 7 Days",
            "value": forecast_next_7,
            "unit": "USD",
            "note": f"Trend-based forecast from the last {short_days} days (capped to avoid outliers)",
        },
    ]


    # 7) Visualization configs for the frontend
    visualizations = []

    visualizations.append(
        {
            "id": "sales_7d",
            "type": "line",
            "title": f"Sales - Last {short_days} Days",
            "x": labels_short,
            "y": values_short,
            "seriesName": "Total Sales",
        }
    )

    visualizations.append(
        {
            "id": "sales_30d",
            "type": "line",
            "title": f"Sales - Last {long_days} Days",
            "x": labels_long,
            "y": values_long,
            "seriesName": "Total Sales",
        }
    )

    if top_items:
        visualizations.append(
            {
                "id": "top_items",
                "type": "bar",
                "title": f"Top Items (Last {long_days} Days)",
                "x": [row["item_name"] for row in top_items],
                "y": [float(row["qty"] or 0) for row in top_items],
                "seriesName": "Units Sold",
            }
        )

    if worst_items:
        visualizations.append(
            {
                "id": "worst_items",
                "type": "bar",
                "title": f"Worst Items (Last {long_days} Days)",
                "x": [row["item_name"] for row in worst_items],
                "y": [float(row["qty"] or 0) for row in worst_items],
                "seriesName": "Units Sold",
            }
        )

    return {
        "assistant_message": assistant_message,
        "kpis": kpis,
        "visualizations": visualizations,
        "alerts": alerts,
    }
