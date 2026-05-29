import database
from datetime import datetime, timedelta
import random

# Initialize database schema and tables
database.init_db()

# Categories
EXPENSE_CATEGORIES = [
    "Food & Dining",
    "Transport & Fuel",
    "Rent & Utilities",
    "Entertainment & Leisure",
    "Shopping & Apparel",
    "Health & Medical",
    "Education",
    "Investments & Business",
    "Others"
]

INCOME_CATEGORIES = [
    "Salary & Wages",
    "Investments & Yield",
    "Gifts & Bonuses",
    "Side Hustles",
    "Others"
]

def generate_mock_data():
    today = datetime.now()
    
    # --- 1. Populate Income Logs ---
    # Add regular Salary for the past 3 months
    database.add_transaction(3800.00, "Salary & Wages", (today - timedelta(days=60)).strftime("%Y-%m-01"), "Monthly Salary Deposit", "income")
    database.add_transaction(3800.00, "Salary & Wages", (today - timedelta(days=30)).strftime("%Y-%m-01"), "Monthly Salary Deposit", "income")
    database.add_transaction(3850.00, "Salary & Wages", today.strftime("%Y-%m-01"), "Monthly Salary Deposit", "income")

    # Add Side Hustle earnings
    database.add_transaction(450.00, "Side Hustles", (today - timedelta(days=48)).strftime("%Y-%m-12"), "Freelance Web Design Project", "income")
    database.add_transaction(620.00, "Side Hustles", (today - timedelta(days=18)).strftime("%Y-%m-14"), "Consulting Consultation Hours", "income")
    database.add_transaction(280.00, "Side Hustles", (today - timedelta(days=5)).strftime("%Y-%m-24"), "E-book royalty payout", "income")

    # Add Investment Yields
    database.add_transaction(120.00, "Investments & Yield", (today - timedelta(days=70)).strftime("%Y-%m-10"), "Quarterly Dividend payout", "income")
    database.add_transaction(145.00, "Investments & Yield", (today - timedelta(days=10)).strftime("%Y-%m-10"), "Quarterly Dividend payout", "income")

    # Add Gifts
    database.add_transaction(100.00, "Gifts & Bonuses", (today - timedelta(days=22)).strftime("%Y-%m-08"), "Birthday Gift from Parents", "income")

    # --- 2. Populate Expense Logs ---
    # Rent & Utilities for past 3 months
    database.add_transaction(1200.00, "Rent & Utilities", (today - timedelta(days=60)).strftime("%Y-%m-01"), "Monthly Apartment Rent", "expense")
    database.add_transaction(1200.00, "Rent & Utilities", (today - timedelta(days=30)).strftime("%Y-%m-01"), "Monthly Apartment Rent", "expense")
    database.add_transaction(1250.00, "Rent & Utilities", today.strftime("%Y-%m-01"), "Monthly Apartment Rent & Trash", "expense")

    # Helper for random dates
    def random_date(days_ago_min, days_ago_max):
        delta = random.randint(days_ago_min, days_ago_max)
        target_date = today - timedelta(days=delta)
        return target_date.strftime("%Y-%m-%d")

    # Food & Dining logs
    database.add_transaction(42.50, "Food & Dining", random_date(1, 5), "Dinner with family at Italian Bistro", "expense")
    database.add_transaction(12.80, "Food & Dining", random_date(6, 12), "Coffee and Pastry breakfast run", "expense")
    database.add_transaction(115.00, "Food & Dining", random_date(15, 25), "Weekly grocery restocking", "expense")
    database.add_transaction(8.50, "Food & Dining", random_date(30, 40), "Work lunch snack box", "expense")
    database.add_transaction(98.30, "Food & Dining", random_date(45, 60), "Gourmet dining night out", "expense")

    # Transport logs
    database.add_transaction(45.00, "Transport & Fuel", random_date(2, 7), "Gas tank refill", "expense")
    database.add_transaction(18.50, "Transport & Fuel", random_date(10, 18), "Uber ride home after party", "expense")
    database.add_transaction(48.00, "Transport & Fuel", random_date(48, 55), "Weekly fuel refill", "expense")

    # Shopping
    database.add_transaction(85.00, "Shopping & Apparel", random_date(3, 10), "Summer jacket deal", "expense")
    database.add_transaction(120.00, "Shopping & Apparel", random_date(40, 50), "Comfortable running shoes", "expense")

    # Entertainment
    database.add_transaction(14.99, "Entertainment & Leisure", random_date(1, 4), "Monthly Netflix Subscription", "expense")
    database.add_transaction(14.99, "Entertainment & Leisure", random_date(31, 34), "Monthly Netflix Subscription", "expense")
    database.add_transaction(65.00, "Entertainment & Leisure", random_date(8, 15), "Theme Park Entry Pass", "expense")

    # Medical
    database.add_transaction(35.00, "Health & Medical", random_date(14, 20), "Multivitamins & Supplements", "expense")
    database.add_transaction(75.00, "Health & Medical", random_date(50, 60), "Routine dental checkup co-pay", "expense")

    # Education
    database.add_transaction(49.00, "Education", random_date(22, 30), "Python Coding Masterclass Course", "expense")

    print("Success: Mock transaction records (Income + Expenses) populated to SQLite database.")

if __name__ == "__main__":
    generate_mock_data()
