import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "expenses.db")

def get_connection():
    """Returns a connection to the SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the transactions table schema and handles migration cleanups."""
    with get_connection() as conn:
        cursor = conn.cursor()
        
        # Drop old single-track table if it exists
        cursor.execute("DROP TABLE IF EXISTS expenses")
        
        # Create unified transaction table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amount REAL NOT NULL,
                category TEXT NOT NULL,
                date TEXT NOT NULL,
                notes TEXT,
                type TEXT NOT NULL CHECK(type IN ('income', 'expense'))
            )
        """)
        conn.commit()

def add_transaction(amount, category, date, notes, transaction_type):
    """Adds a new transaction (income or expense) to the database."""
    try:
        parsed_date = datetime.strptime(date, "%Y-%m-%d")
        date_str = parsed_date.strftime("%Y-%m-%d")
    except ValueError:
        date_str = datetime.now().strftime("%Y-%m-%d")

    assert transaction_type in ("income", "expense"), "Invalid transaction type"

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO transactions (amount, category, date, notes, type) VALUES (?, ?, ?, ?, ?)",
            (float(amount), category.strip(), date_str, notes.strip() if notes else "", transaction_type)
        )
        conn.commit()
        return cursor.lastrowid

def get_transactions(category=None, month=None, transaction_type=None):
    """Retrieves list of transactions matching specified filter parameters."""
    query = "SELECT id, amount, category, date, notes, type FROM transactions WHERE 1=1"
    params = []

    if category:
        query += " AND category = ?"
        params.append(category)
    
    if month:
        query += " AND date LIKE ?"
        params.append(f"{month}%")
        
    if transaction_type:
        query += " AND type = ?"
        params.append(transaction_type)
    
    query += " ORDER BY date DESC, id DESC"

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def delete_transaction(transaction_id):
    """Removes a transaction by unique identifier."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM transactions WHERE id = ?", (transaction_id,))
        conn.commit()
        return cursor.rowcount > 0

def get_analytics():
    """Computes total sums, category segment percentages, and timeline records for both types."""
    analytics = {
        "total_income": 0.0,
        "total_expense": 0.0,
        "net_savings": 0.0,
        "expense_breakdown": [],
        "income_breakdown": [],
        "top_expense_category": "None",
        "average_expense": 0.0,
        "monthly_trend": []
    }

    with get_connection() as conn:
        cursor = conn.cursor()
        
        # 1. Total Income
        cursor.execute("SELECT SUM(amount) FROM transactions WHERE type = 'income'")
        inc = cursor.fetchone()[0]
        analytics["total_income"] = float(inc) if inc else 0.0

        # 2. Total Expense
        cursor.execute("SELECT SUM(amount) FROM transactions WHERE type = 'expense'")
        exp = cursor.fetchone()[0]
        analytics["total_expense"] = float(exp) if exp else 0.0

        # Net Balance
        analytics["net_savings"] = round(analytics["total_income"] - analytics["total_expense"], 2)

        # 3. Expense Breakdown (Category Sum & Percentage)
        if analytics["total_expense"] > 0:
            cursor.execute("""
                SELECT category, SUM(amount) as cat_total 
                FROM transactions 
                WHERE type = 'expense'
                GROUP BY category 
                ORDER BY cat_total DESC
            """)
            exp_rows = cursor.fetchall()
            exp_breakdown = []
            for r in exp_rows:
                cat_total = float(r["cat_total"])
                percentage = (cat_total / analytics["total_expense"]) * 100
                exp_breakdown.append({
                    "category": r["category"],
                    "total": cat_total,
                    "percentage": round(percentage, 2)
                })
            analytics["expense_breakdown"] = exp_breakdown
            analytics["top_expense_category"] = exp_breakdown[0]["category"]

        # 4. Income Breakdown
        if analytics["total_income"] > 0:
            cursor.execute("""
                SELECT category, SUM(amount) as cat_total 
                FROM transactions 
                WHERE type = 'income'
                GROUP BY category 
                ORDER BY cat_total DESC
            """)
            inc_rows = cursor.fetchall()
            inc_breakdown = []
            for r in inc_rows:
                cat_total = float(r["cat_total"])
                percentage = (cat_total / analytics["total_income"]) * 100
                inc_breakdown.append({
                    "category": r["category"],
                    "total": cat_total,
                    "percentage": round(percentage, 2)
                })
            analytics["income_breakdown"] = inc_breakdown

        # 5. Average spent per log (for expense type only)
        cursor.execute("SELECT AVG(amount) FROM transactions WHERE type = 'expense'")
        avg_exp = cursor.fetchone()[0]
        analytics["average_expense"] = round(float(avg_exp), 2) if avg_exp else 0.0

        # 6. Monthly Comparative Trend (group by month, sum by type)
        # We need a cross-tabulation or simple union aggregation.
        # Let's get all distinct months first, then query sums.
        cursor.execute("""
            SELECT DISTINCT strftime('%Y-%m', date) as month 
            FROM transactions 
            ORDER BY month ASC
        """)
        months = [r["month"] for r in cursor.fetchall()]
        
        monthly_trend = []
        for m in months:
            cursor.execute("SELECT SUM(amount) FROM transactions WHERE type = 'income' AND date LIKE ?", (f"{m}%",))
            m_inc = cursor.fetchone()[0]
            
            cursor.execute("SELECT SUM(amount) FROM transactions WHERE type = 'expense' AND date LIKE ?", (f"{m}%",))
            m_exp = cursor.fetchone()[0]
            
            monthly_trend.append({
                "month": m,
                "income": float(m_inc) if m_inc else 0.0,
                "expense": float(m_exp) if m_exp else 0.0
            })
        analytics["monthly_trend"] = monthly_trend

    return analytics
