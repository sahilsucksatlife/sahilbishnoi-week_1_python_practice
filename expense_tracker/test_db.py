import sys
import os

with open("test_output.txt", "w") as f:
    f.write("Starting test...\n")
    try:
        import database
        f.write("Database imported successfully!\n")
        f.write(f"DB path resolves to: {database.DB_PATH}\n")
        
        database.init_db()
        f.write("init_db completed!\n")
        
        database.add_expense(10.5, "Food & Dining", "2026-05-29", "Test expense")
        f.write("add_expense completed!\n")
        
        expenses = database.get_expenses()
        f.write(f"Found expenses: {len(expenses)}\n")
        for exp in expenses:
            f.write(f"- {exp['amount']} in {exp['category']} on {exp['date']}: {exp['notes']}\n")
            
        analytics = database.get_analytics()
        f.write(f"Analytics: {analytics}\n")
        
    except Exception as e:
        f.write(f"Error occurred: {str(e)}\n")
        import traceback
        traceback.print_exc(file=f)
    f.write("Test finished.\n")
