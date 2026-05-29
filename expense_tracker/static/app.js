// ==========================================================================
// Expense Tracker Front-End Controller Engine (Unified Income + Expense)
// ==========================================================================

// Global Chart Instances
let categoryChart = null;
let trendChart = null;

// Category Configs with Icons & Colors
const EXPENSE_CATEGORIES = {
    "Food & Dining": { icon: "🍔", color: "#ef4444" },
    "Transport & Fuel": { icon: "🚗", color: "#3b82f6" },
    "Rent & Utilities": { icon: "🏠", color: "#8b5cf6" },
    "Entertainment & Leisure": { icon: "🎬", color: "#ec4899" },
    "Shopping & Apparel": { icon: "🛍️", color: "#f59e0b" },
    "Health & Medical": { icon: "🏥", color: "#10b981" },
    "Education": { icon: "🎓", color: "#6366f1" },
    "Investments & Business": { icon: "💼", color: "#06b6d4" },
    "Others": { icon: "🏷️", color: "#6b7280" }
};

const INCOME_CATEGORIES = {
    "Salary & Wages": { icon: "💼", color: "#10b981" },
    "Investments & Yield": { icon: "📈", color: "#059669" },
    "Gifts & Bonuses": { icon: "🎁", color: "#f59e0b" },
    "Side Hustles": { icon: "💰", color: "#06b6d4" },
    "Others": { icon: "🏷️", color: "#6b7280" }
};

document.addEventListener("DOMContentLoaded", () => {
    // 1. Init Time & Defaults
    initTimeBadge();
    initDateInput();
    
    // 2. Setup Type Toggle Selectors
    initTypeSelectors();

    // 3. Initialize Filters & Load Data
    populateFilterCategories();
    refreshDashboard();

    // 4. Register Event Listeners
    document.getElementById("expense-form").addEventListener("submit", handleAddTransaction);
    document.getElementById("filter-type").addEventListener("change", handleFilterTypeChange);
    document.getElementById("filter-month").addEventListener("change", handleFilterChange);
    document.getElementById("filter-category").addEventListener("change", handleFilterChange);
    document.getElementById("reset-filters-btn").addEventListener("click", resetFilters);
});

/**
 * Tick clock in header.
 */
function initTimeBadge() {
    const timeBadge = document.getElementById("current-time-badge");
    const updateTime = () => {
        const now = new Date();
        timeBadge.textContent = now.toLocaleDateString(undefined, { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        }) + " // " + now.toLocaleTimeString();
    };
    updateTime();
    setInterval(updateTime, 1000);
}

/**
 * Set form date to today.
 */
function initDateInput() {
    const dateInput = document.getElementById("date-input");
    dateInput.value = new Date().toISOString().split("T")[0];
}

/**
 * Add active toggle behaviors to Expense vs Income selectors.
 */
function initTypeSelectors() {
    const expBtn = document.getElementById("type-expense-btn");
    const incBtn = document.getElementById("type-income-btn");
    const typeInput = document.getElementById("type-input");
    const catSelect = document.getElementById("category-select");

    const toggleType = (selectedType) => {
        typeInput.value = selectedType;
        if (selectedType === "expense") {
            expBtn.classList.add("active");
            incBtn.classList.remove("active");
            populateCategoryDropdown(catSelect, EXPENSE_CATEGORIES);
        } else {
            incBtn.classList.add("active");
            expBtn.classList.remove("active");
            populateCategoryDropdown(catSelect, INCOME_CATEGORIES);
        }
    };

    expBtn.addEventListener("click", () => toggleType("expense"));
    incBtn.addEventListener("click", () => toggleType("income"));

    // Initial load: expense
    populateCategoryDropdown(catSelect, EXPENSE_CATEGORIES);
}

/**
 * Populates a select tag with categories.
 */
function populateCategoryDropdown(dropdown, categoriesObj) {
    dropdown.innerHTML = '<option value="" disabled selected>Select a category</option>';
    for (const [name, meta] of Object.entries(categoriesObj)) {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = `${meta.icon} ${name}`;
        dropdown.appendChild(opt);
    }
}

/**
 * Populates the history list filter category dropdown dynamically.
 */
function populateFilterCategories() {
    const filterCat = document.getElementById("filter-category");
    filterCat.innerHTML = '<option value="ALL">All Categories</option>';
    
    // Add all categories from both sets, ignoring duplicates
    const allCats = new Set([
        ...Object.keys(EXPENSE_CATEGORIES),
        ...Object.keys(INCOME_CATEGORIES)
    ]);

    allCats.forEach(catName => {
        const meta = EXPENSE_CATEGORIES[catName] || INCOME_CATEGORIES[catName];
        const opt = document.createElement("option");
        opt.value = catName;
        opt.textContent = `${meta.icon} ${catName}`;
        filterCat.appendChild(opt);
    });
}

/**
 * Synchronizes dashboard analytics and list records.
 */
async function refreshDashboard() {
    try {
        await Promise.all([
            fetchAnalytics(),
            fetchTransactionsList()
        ]);
    } catch (error) {
        console.error("Refresh error:", error);
    }
}

/**
 * Fetches dashboard analytics.
 */
async function fetchAnalytics() {
    try {
        const response = await fetch("/api/analysis");
        if (!response.ok) throw new Error("Analytics failed to load.");
        
        const data = await response.json();
        updateKPICards(data);
        renderCharts(data);
    } catch (err) {
        console.error("Analytics fetch fail:", err);
    }
}

/**
 * Fetches log history transactions list.
 */
async function fetchTransactionsList() {
    const filterType = document.getElementById("filter-type").value;
    const filterMonth = document.getElementById("filter-month").value;
    const filterCategory = document.getElementById("filter-category").value;

    let path = "/api/expenses";
    const params = [];

    if (filterType && filterType !== "ALL") {
        params.push(`type=${filterType}`);
    }
    if (filterMonth) {
        params.push(`month=${filterMonth}`);
    }
    if (filterCategory && filterCategory !== "ALL") {
        params.push(`category=${encodeURIComponent(filterCategory)}`);
    }

    if (params.length > 0) {
        path += "?" + params.join("&");
    }

    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error("List load failed.");
        const transactions = await response.json();
        renderLogsTable(transactions);
    } catch (err) {
        console.error("List fetch fail:", err);
    }
}

/**
 * Renders KPICard values.
 */
function updateKPICards(data) {
    document.getElementById("total-income-val").textContent = formatCurrency(data.total_income);
    document.getElementById("total-expense-val").textContent = formatCurrency(data.total_expense);
    
    const balanceVal = document.getElementById("net-balance-val");
    balanceVal.textContent = formatCurrency(data.net_savings);

    // Apply color warning if balance goes below zero
    if (data.net_savings < 0) {
        balanceVal.classList.add("negative");
    } else {
        balanceVal.classList.remove("negative");
    }
}

/**
 * Renders Table Log entries.
 */
function renderLogsTable(transactions) {
    const tbody = document.getElementById("logs-tbody");
    const noLogsMsg = document.getElementById("no-logs-msg");
    const countBadge = document.getElementById("logs-count");

    tbody.innerHTML = "";
    countBadge.textContent = `${transactions.length} item${transactions.length === 1 ? "" : "s"}`;

    if (transactions.length === 0) {
        noLogsMsg.style.display = "flex";
        return;
    }

    noLogsMsg.style.display = "none";

    transactions.forEach(tx => {
        const tr = document.createElement("tr");
        
        // 1. Date
        const tdDate = document.createElement("td");
        tdDate.className = "row-date";
        tdDate.textContent = formatDateString(tx.date);
        tr.appendChild(tdDate);

        // 2. Type Badge
        const tdType = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = `type-badge ${tx.type}`;
        badge.textContent = tx.type;
        tdType.appendChild(badge);
        tr.appendChild(tdType);

        // 3. Category
        const tdCat = document.createElement("td");
        tdCat.className = "row-category";
        const meta = EXPENSE_CATEGORIES[tx.category] || INCOME_CATEGORIES[tx.category] || { icon: "🏷️" };
        tdCat.textContent = `${meta.icon} ${tx.category}`;
        tr.appendChild(tdCat);

        // 4. Amount (+ for income, - for expense)
        const tdAmt = document.createElement("td");
        tdAmt.className = `row-amount ${tx.type}-amount`;
        const prefix = tx.type === "income" ? "+" : "-";
        tdAmt.textContent = `${prefix}${formatCurrency(tx.amount)}`;
        tr.appendChild(tdAmt);

        // 5. Notes
        const tdNotes = document.createElement("td");
        tdNotes.className = "row-notes";
        tdNotes.textContent = tx.notes || "—";
        tdNotes.title = tx.notes || "";
        tr.appendChild(tdNotes);

        // 6. Action
        const tdAction = document.createElement("td");
        tdAction.className = "row-action";
        
        const delBtn = document.createElement("button");
        delBtn.className = "btn-delete";
        delBtn.innerHTML = `
            <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
        `;
        delBtn.onclick = () => handleDeleteTransaction(tx.id);
        
        tdAction.appendChild(delBtn);
        tr.appendChild(tdAction);

        tbody.appendChild(tr);
    });
}

/**
 * Builds analytical charts.
 */
function renderCharts(data) {
    const noCatOverlay = document.getElementById("no-category-data");
    const noTrendOverlay = document.getElementById("no-trend-data");

    // --- 1. Expense Category Breakdown Doughnut Chart ---
    // Specifically handles user request: "what category has what percentage of expenses"
    if (!data.expense_breakdown || data.expense_breakdown.length === 0) {
        noCatOverlay.classList.add("show");
        if (categoryChart) {
            categoryChart.destroy();
            categoryChart = null;
        }
    } else {
        noCatOverlay.classList.remove("show");
        
        const labels = data.expense_breakdown.map(c => c.category);
        const totals = data.expense_breakdown.map(c => c.total);
        const colors = data.expense_breakdown.map(c => (EXPENSE_CATEGORIES[c.category] || { color: "#6b7280" }).color);

        const ctx = document.getElementById("categoryChart").getContext("2d");
        
        if (categoryChart) {
            categoryChart.destroy();
        }

        categoryChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: labels,
                datasets: [{
                    data: totals,
                    backgroundColor: colors,
                    borderWidth: 1,
                    borderColor: "rgba(17, 19, 24, 0.8)",
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "right",
                        labels: {
                            color: "#9ca3af",
                            font: { family: "Outfit", size: 10 },
                            boxWidth: 10
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const val = context.raw;
                                const pct = data.expense_breakdown[context.dataIndex].percentage;
                                return ` Spent: ${formatCurrency(val)} (${pct}%)`;
                            }
                        }
                    }
                },
                cutout: "65%"
            }
        });
    }

    // --- 2. Comparative Trend Line Chart (Income vs Expense) ---
    if (!data.monthly_trend || data.monthly_trend.length === 0) {
        noTrendOverlay.classList.add("show");
        if (trendChart) {
            trendChart.destroy();
            trendChart = null;
        }
    } else {
        noTrendOverlay.classList.remove("show");
        
        const months = data.monthly_trend.map(t => formatMonthLabel(t.month));
        const incomes = data.monthly_trend.map(t => t.income);
        const expenses = data.monthly_trend.map(t => t.expense);

        const ctxTrend = document.getElementById("trendChart").getContext("2d");
        
        if (trendChart) {
            trendChart.destroy();
        }

        trendChart = new Chart(ctxTrend, {
            type: "line",
            data: {
                labels: months,
                datasets: [
                    {
                        label: "Incoming (Income)",
                        data: incomes,
                        borderColor: "#10b981",
                        borderWidth: 3,
                        pointBackgroundColor: "#10b981",
                        pointHoverRadius: 6,
                        tension: 0.35,
                        fill: false
                    },
                    {
                        label: "Outgoing (Expense)",
                        data: expenses,
                        borderColor: "#6366f1",
                        borderWidth: 3,
                        pointBackgroundColor: "#6366f1",
                        pointHoverRadius: 6,
                        tension: 0.35,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: "top",
                        labels: {
                            color: "#9ca3af",
                            font: { family: "Outfit", size: 10 },
                            boxWidth: 10
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` ${context.dataset.label}: ${formatCurrency(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: "rgba(255, 255, 255, 0.03)" },
                        ticks: { color: "#9ca3af", font: { family: "Outfit", size: 10 } }
                    },
                    y: {
                        grid: { color: "rgba(255, 255, 255, 0.03)" },
                        ticks: { 
                            color: "#9ca3af", 
                            font: { family: "Outfit", size: 10 },
                            callback: value => "$" + value
                        }
                    }
                }
            }
        });
    }
}

/**
 * Handle submit logs.
 */
async function handleAddTransaction(e) {
    const amountInput = document.getElementById("amount-input");
    const categorySelect = document.getElementById("category-select");
    const dateInput = document.getElementById("date-input");
    const notesInput = document.getElementById("notes-input");
    const typeInput = document.getElementById("type-input");
    const submitBtn = document.getElementById("add-expense-btn");

    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;
    const date = dateInput.value;
    const notes = notesInput.value;
    const type = typeInput.value;

    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a positive transaction amount.");
        return;
    }
    if (!category) {
        alert("Please select a transaction category.");
        return;
    }
    if (!date) {
        alert("Please enter a valid calendar date.");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.firstElementChild.textContent = "Saving Record...";

    const payload = { amount, category, date, notes, type };

    try {
        const response = await fetch("/api/expenses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Failed to save record.");
        }

        // Reset inputs
        amountInput.value = "";
        categorySelect.selectedIndex = 0;
        notesInput.value = "";
        initDateInput();

        await refreshDashboard();
    } catch (err) {
        alert("Error saving record: " + err.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.firstElementChild.textContent = "Add Record";
    }
}

/**
 * Dispatches DELETE request.
 */
async function handleDeleteTransaction(id) {
    if (!confirm("Are you sure you want to delete this transaction record?")) {
        return;
    }

    try {
        const response = await fetch(`/api/expenses/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Failed to delete record.");
        }

        await refreshDashboard();
    } catch (err) {
        alert("Could not delete record: " + err.message);
    }
}

/**
 * Filter change triggers.
 */
function handleFilterChange() {
    fetchTransactionsList();
}

/**
 * Custom type filter handler.
 */
function handleFilterTypeChange() {
    fetchTransactionsList();
}

/**
 * Resets filter selectors.
 */
function resetFilters() {
    document.getElementById("filter-type").selectedIndex = 0;
    document.getElementById("filter-month").value = "";
    document.getElementById("filter-category").selectedIndex = 0;
    fetchTransactionsList();
}

// ==========================================================================
// Formatting & Utilities
// ==========================================================================

function formatCurrency(val) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
    }).format(val || 0);
}

function formatDateString(str) {
    const parts = str.split("-");
    if (parts.length !== 3) return str;
    const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        timeZone: 'UTC'
    });
}

function formatMonthLabel(monthStr) {
    const parts = monthStr.split("-");
    if (parts.length !== 2) return monthStr;
    const date = new Date(Date.UTC(parts[0], parts[1] - 1, 1));
    return date.toLocaleDateString(undefined, { 
        month: 'short', 
        year: '2-digit',
        timeZone: 'UTC'
    });
}
