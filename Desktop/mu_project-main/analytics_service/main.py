import os
import re
from datetime import datetime, timedelta
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
    Used for line charts and daily average.
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


def get_orders_stats_last_n_days(days: int):
    """
    Total sales and total orders in the last N days.
    Used for 'Total Sales (Last X Days)' and 'Avg Order Value'.
    """
    days = max(1, min(int(days), 365))
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT COUNT(*) AS num_orders,
                       COALESCE(SUM(total), 0) AS total_sales
                FROM orders
                WHERE status <> 'cancelled'
                  AND created_at >= CURDATE() - INTERVAL %s DAY
                """,
                (days,),
            )
            row = cur.fetchone()
            num_orders = int(row["num_orders"] or 0)
            total_sales = float(row["total_sales"] or 0)
            return num_orders, total_sales
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

    We only require a non-null payment_method.
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


def get_inventory_activity_today():
    """
    Return net inventory changes per item for *today*.

    Positive = stock increased, negative = stock decreased.
    Requires an inventory_logs table with a numeric change column
    (quantity_change or change). If not available, returns [].
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            try:
                # Common schema: quantity_change column
                cur.execute(
                    """
                    SELECT mi.name AS item_name,
                           COALESCE(SUM(l.quantity_change), 0) AS net_change
                    FROM inventory_logs l
                    JOIN menu_items mi ON mi.id = l.menu_item_id
                    WHERE DATE(l.created_at) = CURDATE()
                    GROUP BY mi.id, mi.name
                    HAVING net_change <> 0
                    ORDER BY net_change DESC
                    """
                )
            except Exception:
                # Fallback if the column is named 'change'
                try:
                    cur.execute(
                        """
                        SELECT mi.name AS item_name,
                               COALESCE(SUM(l.change), 0) AS net_change
                        FROM inventory_logs l
                        JOIN menu_items mi ON mi.id = l.menu_item_id
                        WHERE DATE(l.created_at) = CURDATE()
                        GROUP BY mi.id, mi.name
                        HAVING net_change <> 0
                        ORDER BY net_change DESC
                        """
                    )
                except Exception:
                    return []

            rows = cur.fetchall()
            for r in rows:
                r["net_change"] = int(r["net_change"] or 0)
            return rows
    finally:
        conn.close()

#------------------
def get_menu_items_updated_today():
    """
    Fallback when we don't have per-change logs.

    Returns items from menu_items whose updated_at is today,
    with their *current* stock level. We don't know the exact
    delta, only that they were touched.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT name,
                       COALESCE(stock_qty, stock, 0) AS stock_level
                FROM menu_items
                WHERE DATE(updated_at) = CURDATE()
                ORDER BY name ASC
                """
            )
            rows = cur.fetchall()
            for r in rows:
                r["stock_level"] = int(r["stock_level"] or 0)
            return rows
    finally:
        conn.close()


# ---------------- TIME-OF-DAY / WEEK HEATMAP ----------------
def get_time_of_day_heatmap(last_n_days: int):
    """
    Build a 7x24 matrix (days x hours) of order counts
    for the last N days.

    Returns (days_labels, hours_list, matrix)
    """
    last_n_days = max(1, min(int(last_n_days), 365))
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT DAYOFWEEK(created_at) AS dow,
                       HOUR(created_at) AS hour,
                       COUNT(*) AS orders_count
                FROM orders
                WHERE status <> 'cancelled'
                  AND created_at >= CURDATE() - INTERVAL %s DAY
                GROUP BY DAYOFWEEK(created_at), HOUR(created_at)
                ORDER BY DAYOFWEEK(created_at), HOUR(created_at)
                """,
                (last_n_days,),
            )
            rows = cur.fetchall()

        # MySQL DAYOFWEEK: 1=Sunday, 7=Saturday
        day_labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        hours = list(range(24))
        matrix = [[0 for _ in hours] for _ in range(7)]

        for row in rows:
            dow = int(row["dow"])  # 1..7
            hour = int(row["hour"])  # 0..23
            count = int(row["orders_count"] or 0)
            day_index = dow - 1  # 0..6
            if 0 <= day_index < 7 and 0 <= hour < 24:
                matrix[day_index][hour] = count

        return day_labels, hours, matrix
    finally:
        conn.close()


# ---------------- FORECASTING ----------------
def linear_forecast(values):
    """
    Forecast tomorrow and next 7 days using recent daily sales.

    - If we have fewer than 4 days of data, we just use the average.
    - Otherwise, we use a simple linear regression blended with average
      and cap extremes so one crazy spike won't give a ridiculous forecast.
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

    # Cap forecasts to avoid insane numbers: not more than 3x average
    max_tomorrow = avg * 3 if avg > 0 else None
    if max_tomorrow is not None and tomorrow > max_tomorrow:
        tomorrow = max_tomorrow

    max_next7 = avg * 7 * 3 if avg > 0 else None
    if max_next7 is not None and next_7 > max_next7:
        next_7 = max_next7

    return float(tomorrow), float(next_7)


def forecast_series(values, days_ahead: int):
    """
    Produce a daily forecast series for the next `days_ahead` days
    using the same logic as `linear_forecast`.
    """
    days_ahead = max(1, int(days_ahead))
    if not values:
        return [0.0] * days_ahead

    n = len(values)
    avg = mean(values)

    # Not enough history: flat forecast at the average
    if n < 4:
        return [float(max(avg, 0.0))] * days_ahead

    x = list(range(n))
    y = list(values)

    sum_x = sum(x)
    sum_y = sum(y)
    sum_xx = sum(v * v for v in x)
    sum_xy = sum(x[i] * y[i] for i in range(n))

    denom = n * sum_xx - sum_x * sum_x
    if denom == 0:
        return [float(max(avg, 0.0))] * days_ahead

    m = (n * sum_xy - sum_x * sum_y) / denom
    b = (sum_y - m * sum_x) / n

    series = []
    for i in range(1, days_ahead + 1):
        reg = b + m * (n - 1 + i)
        blended = 0.5 * reg + 0.5 * avg
        blended = max(blended, 0.0)
        if avg > 0:
            max_allowed = avg * 3
            if blended > max_allowed:
                blended = max_allowed
        series.append(float(blended))

    return series


# ---------------- MESSAGE PARSING ----------------
def extract_windows_from_message(message: str, default_short=7, default_long=30):
    """
    (Kept for backwards compatibility, currently not used directly.)

    Detect a custom day window in the user's message.

    Supported examples:
    - "last 10 days"
    - "past 21 days"
    - "for 4 days"
    - "best items in 15 days"
    - even just "15 days" somewhere in the text
    """
    msg = (message or "").lower()

    m = re.search(r"(last|past|for)\s+(\d{1,3})\s+days?", msg)
    if m:
        days = int(m.group(2))
        days = max(1, min(days, 365))
        return days, days

    m = re.search(r"(\d{1,3})\s+days?", msg)
    if m:
        days = int(m.group(1))
        days = max(1, min(days, 365))
        return days, days

    return default_short, default_long


def find_explicit_days(message: str):
    """
    Look for 'last 10 days', 'past 5 days', 'for 3 days' or '10 days' in the text.
    Returns an int or None.
    """
    msg = (message or "").lower()

    m = re.search(r"(last|past|for)\s+(\d{1,3})\s+days?", msg)
    if m:
        days = int(m.group(2))
        return max(1, min(days, 365))

    m = re.search(r"(\d{1,3})\s+days?", msg)
    if m:
        days = int(m.group(1))
        return max(1, min(days, 365))

    return None


# ---------------- METRICS SUMMARY & AI ----------------
def build_metrics_summary(
    total_sales_all_time: float,
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
    num_orders_short,
    total_sales_short_period,
    avg_order_value_short,
) -> str:
    """
    Turn raw metrics into a text summary that we pass to the AI model.
    """
    lines = []
    lines.append(
        f"Total sales for all non-cancelled orders (all time): {total_sales_all_time:.2f} USD"
    )
    lines.append("")

    # Short window summary
    lines.append(f"Sales over the last {short_days} days (non-cancelled orders):")
    if labels_short:
        for d, v in zip(labels_short, values_short):
            lines.append(f"- {d}: {v:.2f} USD")
    else:
        lines.append(f"- No non-cancelled orders found in the last {short_days} days.")
    lines.append("")

    # Short window totals
    lines.append(
        f"Total sales in the last {short_days} days: {total_sales_short_period:.2f} USD"
    )
    lines.append(
        f"Number of orders in the last {short_days} days: {num_orders_short} orders"
    )
    lines.append(
        f"Average order value in the last {short_days} days: {avg_order_value_short:.2f} USD"
    )
    lines.append(
        f"Average daily sales over the last {short_days} days: {avg_daily_sales:.2f} USD"
    )
    lines.append("")

    # Long window summary
    lines.append(f"Sales over the last {long_days} days (non-cancelled orders):")
    if labels_long:
        for d, v in zip(labels_long, values_long):
            lines.append(f"- {d}: {v:.2f} USD")
    else:
        lines.append(f"- No non-cancelled orders found in the last {long_days} days.")
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
    total_sales_all_time,
    values_short,
    short_days,
    top_items,
    worst_items,
    forecast_tomorrow,
    forecast_next_7,
    avg_daily_sales,
    payment_breakdown,
    low_stock_items,
    num_orders_short,
    total_sales_short_period,
    avg_order_value_short,
    heatmap_days,
    heatmap_hours,
    heatmap_matrix,
):
    """
    Concise, business-style alerts and insights.
    """
    alerts = []

    def add(msg):
        """Add at most 5 concise alerts."""
        if msg and len(alerts) < 5:
            alerts.append(msg)

    # ---- Sales behaviour vs average ----
    if values_short:
        last_day = values_short[-1]
        avg_short = mean(values_short)
        if avg_short > 0:
            diff_pct = (last_day - avg_short) / avg_short * 100
            if diff_pct <= -20:
                add(
                    f"📉 Sales on the most recent day are about {abs(diff_pct):.1f}% "
                    f"below the average for the last {short_days} days."
                )
            elif diff_pct >= 20:
                add(
                    f"📈 Sales on the most recent day are about {diff_pct:.1f}% "
                    f"above the average for the last {short_days} days."
                )

        if len(values_short) >= 2:
            prev_day = values_short[-2]
            if prev_day > 0:
                day_change = (last_day - prev_day) / prev_day * 100
                direction = "up" if day_change >= 0 else "down"
                add(
                    f"📊 Day-over-day change: sales are {abs(day_change):.1f}% {direction} "
                    "versus the previous day."
                )

    # ---- No sales at all ----
    if total_sales_all_time == 0:
        add(
            "⚠️ No non-cancelled orders were found. If this is unexpected, "
            "check order statuses and imports."
        )

    # ---- Product performance ----
    if top_items:
        best = top_items[0]
        add(
            f"🏆 Best seller in the selected period: '{best['item_name']}' "
            f"with {best['qty']} units."
        )

    if worst_items:
        worst = worst_items[0]
        add(
            f"🧊 Weak performer: '{worst['item_name']}' with only {worst['qty']} units "
            "sold in the selected period."
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
                f"💳 Payment mix: CASH {cash_pct:.1f}% ({cash} orders), "
                f"QR {qr_pct:.1f}% ({qr} orders)"
            )
            if other > 0:
                text += f", OTHER {other_pct:.1f}% ({other} orders)."
            else:
                text += "."
            add(text)

    # ---- Average order value ----
    if num_orders_short > 0:
        add(
            f"💵 Average order value in the last {short_days} days is "
            f"{avg_order_value_short:.2f} USD over {num_orders_short} orders."
        )

    # ---- Forecast ----
    if forecast_next_7 > 0 and avg_daily_sales > 0:
        weekly_avg = avg_daily_sales * 7
        diff = forecast_next_7 - weekly_avg
        diff_pct = diff / weekly_avg * 100 if weekly_avg else 0

        if abs(diff_pct) < 10:
            desc = "roughly in line with a typical week"
        elif diff_pct > 0:
            desc = f"about {diff_pct:.1f}% higher than a typical week"
        else:
            desc = f"about {abs(diff_pct):.1f}% lower than a typical week"

        add(
            f"🔮 Forecast for the next 7 days is around {forecast_next_7:.2f} USD, "
            f"{desc}."
        )

    # ---- Inventory: low stock ----
    if low_stock_items:
        top_low = low_stock_items[:3]
        names = ", ".join(
            f"{i['name']} ({i['stock_level']})" for i in top_low
        )
        add(
            f"📦 Low stock: {names}. Consider restocking soon."
        )

    # ---- Heatmap: busiest time ----
    if heatmap_days and heatmap_hours and heatmap_matrix:
        max_v = 0
        best_day = None
        best_hour = None
        for d_idx, row in enumerate(heatmap_matrix):
            for h_idx, v in enumerate(row):
                if v > max_v:
                    max_v = v
                    best_day = heatmap_days[d_idx]
                    best_hour = heatmap_hours[h_idx]

        if max_v > 0 and best_day is not None and best_hour is not None:
            add(
                f"🕒 Busiest time in the selected period is around {best_day} at "
                f"{best_hour:02d}:00 with about {max_v} orders."
            )

    return alerts


def ask_ai(user_message: str, metrics_summary: str) -> str:
    """
    Use an OpenAI model to create a natural-language answer.

    We also instruct it to ALWAYS include recommended actions.
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
                        "Always finish your answer with a short section titled "
                        "'Recommended actions' and include 1–3 bullet points with "
                        "concrete, practical suggestions for the cafeteria manager. "
                        "When the question is general (for example, about the "
                        "weather or colors), just answer normally, but still try "
                        "to provide 1–2 simple suggested follow-up actions if it "
                        "makes sense."
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

    # 0) Time window override from frontend filter (window_days) – optional
    override_days = None
    wd = payload.get("window_days")
    if isinstance(wd, (int, float)):
        override_days = int(wd)

    # Decide which window to use:
    # 1) If the user explicitly said "... for 2 days", that wins.
    # 2) Else if the frontend filter is set, use that.
    # 3) Else fall back to 7 / 30 days defaults.
    explicit_days = find_explicit_days(user_message)

    if explicit_days is not None:
        short_days = long_days = explicit_days
    elif override_days:
        override_days = max(1, min(override_days, 365))
        short_days = long_days = override_days
    else:
        short_days, long_days = 7, 30

    kpis = []
    visualizations = []
    alerts = []
    assistant_message = None

    # 1) Pull metrics from DB
    try:
        total_sales_all_time = get_total_sales()
        labels_short, values_short = get_sales_last_n_days(short_days)
        labels_long, values_long = get_sales_last_n_days(long_days)

        num_orders_short, total_sales_short_period = get_orders_stats_last_n_days(
            short_days
        )
        avg_order_value_short = (
            total_sales_short_period / num_orders_short if num_orders_short else 0.0
        )

        all_items = get_item_performance(last_n_days=long_days)
        top_items, worst_items = split_top_and_worst_items(all_items, limit=5)

        payment_breakdown = get_payment_breakdown(last_n_days=long_days)

        avg_daily_sales = mean(values_short) if values_short else 0.0
        forecast_tomorrow, forecast_next_7 = linear_forecast(values_short)

        forecast_values = forecast_series(values_short, short_days)

        low_stock_items = get_low_stock_items(threshold=5, limit=10)

        heatmap_days, heatmap_hours, heatmap_matrix = get_time_of_day_heatmap(
            short_days
        )

        error_msg = None
    except Exception as e:
        total_sales_all_time = 0.0
        labels_short, values_short = [], []
        labels_long, values_long = [], []
        num_orders_short, total_sales_short_period = 0, 0.0
        avg_order_value_short = 0.0
        all_items = []
        top_items, worst_items = [], []
        payment_breakdown = {}
        avg_daily_sales = 0.0
        forecast_tomorrow, forecast_next_7 = 0.0, 0.0
        forecast_values = []
        low_stock_items = []
        heatmap_days, heatmap_hours, heatmap_matrix = [], [], []
        error_msg = str(e)

    # 2) Build metrics summary for the AI
    metrics_summary = build_metrics_summary(
        total_sales_all_time,
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
        num_orders_short,
        total_sales_short_period,
        avg_order_value_short,
    )

    # 3) Build alerts (independent of AI)
    if error_msg:
        alerts = [f"⚠️ Database error: {error_msg}"]
    else:
        alerts = build_alerts(
            total_sales_all_time,
            values_short,
            short_days,
            top_items,
            worst_items,
            forecast_tomorrow,
            forecast_next_7,
            avg_daily_sales,
            payment_breakdown,
            low_stock_items,
            num_orders_short,
            total_sales_short_period,
            avg_order_value_short,
            heatmap_days,
            heatmap_hours,
            heatmap_matrix,
        )

    # 4) Special-case: list user emails
    if "email" in lower_msg and "user" in lower_msg and "list" in lower_msg:
        emails = get_all_user_emails(limit=500)
        if emails:
            assistant_message = (
                "Here are the user emails in your database:\n"
                + "\n".join(f"- {e}" for e in emails)
            )
        else:
            assistant_message = "I could not find any user emails in your database."

    # 5) Special-case: inventory increases today
       
    if (
        assistant_message is None
        and ("inventory" in lower_msg or "stock" in lower_msg)
        and ("today" in lower_msg or "happened" in lower_msg or "change" in lower_msg or "changes" in lower_msg)
    ):
        activities = get_inventory_activity_today()

        if activities:
            # We have real net changes from inventory_logs
            increases = [a for a in activities if a["net_change"] > 0]
            decreases = [a for a in activities if a["net_change"] < 0]

            lines = ["Here is today’s inventory activity (net changes):", ""]
            if increases:
                lines.append("Increases:")
                for a in increases:
                    lines.append(f"- {a['item_name']}: +{a['net_change']} units")
                lines.append("")

            if decreases:
                lines.append("Decreases (sales / adjustments):")
                for a in decreases:
                    lines.append(f"- {a['item_name']}: {a['net_change']} units")
                lines.append("")

            assistant_message = "\n".join(lines)
        else:
            # No logs: fall back to menu_items.updated_at
            updated_today = get_menu_items_updated_today()
            if updated_today:
                lines = [
                    "I didn't find detailed inventory change logs, "
                    "but these items were updated today with their current stock levels:",
                    "",
                ]
                for row in updated_today:
                    lines.append(f"- {row['name']}: {row['stock_level']} units in stock now")
                lines.append(
                    "\nNote: because there are no per-change logs, I can’t tell "
                    "exactly how many units they increased or decreased today."
                )
                assistant_message = "\n".join(lines)
            else:
                assistant_message = (
                    "I couldn't find any recorded inventory changes for today. "
                    "If you edited stock directly in the menu items table but "
                    "updated_at is not today, those edits will not appear as "
                    "“today’s activity”."
                )



    # 6) Special-case: cash vs QR payments
    if assistant_message is None and "cash" in lower_msg and "qr" in lower_msg:
        try:
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

    # 7) Normal path – use the AI for a smart answer
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

    # 8) KPIs (3 cards: total all time, total window, forecast next 7 days)
    kpis = [
        {
            "label": "Total Sales (All Time)",
            "value": total_sales_all_time,
            "unit": "USD",
            "note": "All non-cancelled orders, entire history",
        },
        {
            "label": f"Total Sales (Last {short_days} Days)",
            "value": total_sales_short_period,
            "unit": "USD",
            "note": "Non-cancelled orders in the selected window",
        },
        {
            "label": "Forecast – Next 7 Days",
            "value": forecast_next_7,
            "unit": "USD",
            "note": f"Trend-based forecast using the last {short_days} days",
        },
    ]

    # 9) Visualization configs for the frontend
    visualizations = []

    # Historical sales line chart
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

    # Forecast line chart for the same horizon
    if forecast_values and values_short:
        try:
            last_label = labels_short[-1]
            start_date = datetime.strptime(last_label, "%Y-%m-%d")
        except Exception:
            start_date = datetime.utcnow()

        forecast_labels = [
            (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
            for i in range(1, short_days + 1)
        ]

        visualizations.append(
            {
                "id": "forecast_short",
                "type": "line",
                "title": f"Forecast - Next {short_days} Days",
                "x": forecast_labels,
                "y": forecast_values,
                "seriesName": "Forecast Sales",
            }
        )
            # Forecast line for the next 7 days (for the second chart)
    # We turn the total 7-day forecast into a per-day forecast series.
    if values_short and forecast_next_7 > 0:
        per_day = forecast_next_7 / 7.0

        start_date = datetime.today().date() + timedelta(days=1)
        forecast_labels = []
        forecast_values = []

        for i in range(7):
            d = start_date + timedelta(days=i)
            forecast_labels.append(d.strftime("%Y-%m-%d"))
            forecast_values.append(per_day)

        visualizations.append(
            {
                "id": "forecast_7d",
                "type": "line",
                "title": "Forecast - Next 7 Days",
                "x": forecast_labels,
                "y": forecast_values,
                "seriesName": "Forecast",
            }
        )


    # Top items bar chart
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

    # Worst items bar chart
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

    # Time-of-day / weekday heatmap
    if heatmap_days and heatmap_hours and heatmap_matrix:
        visualizations.append(
            {
                "id": "traffic_heatmap",
                "type": "heatmap",
                "title": f"Traffic Heatmap (Last {short_days} Days)",
                "days": heatmap_days,
                "hours": heatmap_hours,
                "matrix": heatmap_matrix,
            }
        )

    return {
        "assistant_message": assistant_message,
        "kpis": kpis,
        "visualizations": visualizations,
        "alerts": alerts,
    }
