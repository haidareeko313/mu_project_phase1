import os
from datetime import datetime

import pymysql
from dotenv import load_dotenv
from fastapi import FastAPI

from openai import OpenAI  # <-- new import for OpenAI

# Load .env (DB credentials + OPENAI_API_KEY)
BASE_DIR = os.path.dirname(__file__)
load_dotenv(os.path.join(BASE_DIR, ".env"))

app = FastAPI()

# Create OpenAI client (reads OPENAI_API_KEY from env)
openai_client = OpenAI()


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


def get_sales_last_7_days():
    """
    Sum of orders.total per day for the last 7 days (all NON-CANCELLED orders).

    Returns: (labels, values)
    labels = ['2025-11-01', '2025-11-02', ...]
    values = [150.25, 210.70, ...]
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT DATE(created_at) AS date, COALESCE(SUM(total), 0) AS total_sales
                FROM orders
                WHERE status <> 'cancelled'
                  AND created_at >= CURDATE() - INTERVAL 7 DAY
                GROUP BY DATE(created_at)
                ORDER BY DATE(created_at)
                """
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


def build_metrics_summary(total_sales: float, labels, values) -> str:
    """
    Turn raw numbers into a short text summary that we pass to the AI model.
    """
    lines = []
    lines.append(f"Total sales for all non-cancelled orders (all time): {total_sales:.2f} USD")

    if labels:
        lines.append("Sales over the last 7 days (non-cancelled orders):")
        for d, v in zip(labels, values):
            lines.append(f"- {d}: {v:.2f} USD")
    else:
        lines.append("No non-cancelled orders found in the last 7 days.")

    return "\n".join(lines)


def ask_ai(user_message: str, metrics_summary: str) -> str:
    """
    Use an OpenAI model to create a natural-language answer.

    - If the question is about cafeteria data, it should use the metrics summary.
    - If the question is something general ("what is the color of the sky"),
      it can just answer normally.
    """
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4.1-mini",  # you can change model if you like
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an intelligent assistant inside a cafeteria "
                        "analytics dashboard. You can see some metrics from the "
                        "database. When the user asks about sales, menu items, "
                        "or trends, use ONLY the metrics I give you and explain "
                        "them clearly. When the question is general (for example, "
                        "about the weather or colors), just answer normally."
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

        # Extract the assistant's text
        ai_text = response.choices[0].message.content
        return ai_text.strip()
    except Exception as e:
        # Fallback: if the API fails, return a simple message
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


@app.get("/")
async def root():
    return {"status": "ok", "message": "Python analytics service is running (with DB + AI)"}


@app.post("/analyze")
async def analyze(payload: dict):
    """
    Main endpoint called by Laravel.

    - Reads the user message
    - Computes some metrics from the DB
    - Calls the AI model to craft a natural-language answer
    - Returns KPIs + visualization config (for charts later)
    """
    user_message = (payload.get("message") or "").strip()

    try:
        total_sales = get_total_sales()
        labels, values = get_sales_last_7_days()
        error_msg = None
    except Exception as e:
        total_sales = 0.0
        labels = []
        values = []
        error_msg = str(e)

    metrics_summary = build_metrics_summary(total_sales, labels, values)

    if error_msg:
        assistant_message = (
            "There was a problem reading the database, so I cannot show live metrics right now.\n\n"
            f"Error: {error_msg}"
        )
    else:
        # 💡 This is where we actually ask the LLM to respond like ChatGPT.
        assistant_message = ask_ai(user_message or "(no question provided)", metrics_summary)

    # KPIs for the cards (still simple; we can add more later)
    kpis = [
        {
            "label": "Total Sales (Real)",
            "value": total_sales,
            "unit": "USD",
        },
    ]

    visualizations = [
        {
            "type": "line",
            "title": "Sales - Last 7 Days (Real)",
            "x": labels,
            "y": values,
            "seriesName": "Total Sales",
        },
    ]

    return {
        "assistant_message": assistant_message,
        "kpis": kpis,
        "visualizations": visualizations,
    }
