import os
from flask import Flask, request, jsonify, send_from_directory
import database

app = Flask(__name__, static_folder="static")

# Initialize database schemas
database.init_db()

@app.route("/")
def index():
    """Serves the main frontend dashboard."""
    return send_from_directory(app.static_folder, "index.html")

@app.route("/static/<path:path>")
def send_static(path):
    """Explicit static file serving routing just in case."""
    return send_from_directory(app.static_folder, path)

@app.route("/api/expenses", methods=["GET"])
def get_transactions():
    """Retrieves all logged transactions, supporting month, category, and type filters."""
    category = request.args.get("category")
    month = request.args.get("month")        # format: YYYY-MM
    transaction_type = request.args.get("type") # 'income' or 'expense'
    
    try:
        transactions = database.get_transactions(category=category, month=month, transaction_type=transaction_type)
        return jsonify(transactions), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/expenses", methods=["POST"])
def add_transaction():
    """Creates a new transaction record (income or expense)."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    amount = data.get("amount")
    category = data.get("category")
    date = data.get("date")
    notes = data.get("notes", "")
    transaction_type = data.get("type", "expense") # default to expense if unspecified

    if amount is None or not category or not date:
        return jsonify({"error": "Missing required fields (amount, category, date)"}), 400

    if transaction_type not in ("income", "expense"):
        return jsonify({"error": "Invalid transaction type specification"}), 400

    try:
        amount_float = float(amount)
        if amount_float <= 0:
            return jsonify({"error": "Amount must be a positive number"}), 400
    except ValueError:
        return jsonify({"error": "Amount must be a valid number"}), 400

    try:
        transaction_id = database.add_transaction(amount_float, category, date, notes, transaction_type)
        return jsonify({
            "message": "Transaction logged successfully",
            "id": transaction_id
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/expenses/<int:transaction_id>", methods=["DELETE"])
def delete_transaction(transaction_id):
    """Deletes a transaction log by unique identifier."""
    try:
        success = database.delete_transaction(transaction_id)
        if success:
            return jsonify({"message": f"Transaction {transaction_id} deleted successfully"}), 200
        else:
            return jsonify({"error": "Transaction not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/analysis", methods=["GET"])
def get_analysis():
    """Returns dual-track comparative analytics, averages, and visual breakdowns."""
    try:
        analytics = database.get_analytics()
        return jsonify(analytics), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("Starting Flask app. Open http://127.0.0.1:5000 in your browser.")
    app.run(host="127.0.0.1", port=5000, debug=True)
