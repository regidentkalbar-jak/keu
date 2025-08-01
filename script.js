document.addEventListener('DOMContentLoaded', () => {
    let balance = 0;
    let totalIncome = 0;
    let totalExpense = 0;
    let transactions = [];

    const currentBalanceEl = document.getElementById('currentBalance');
    const totalIncomeEl = document.getElementById('totalIncome');
    const totalExpenseEl = document.getElementById('totalExpense');
    const transactionHistoryBody = document.getElementById('transactionHistoryBody');
    const monthlyRecapBody = document.getElementById('monthlyRecapBody');

    const incomeAmountInput = document.getElementById('incomeAmount');
    const incomeDescriptionInput = document.getElementById('incomeDescription');
    const incomeCategoryInput = document.getElementById('incomeCategory');
    const addIncomeBtn = document.getElementById('addIncomeBtn');

    const expenseAmountInput = document.getElementById('expenseAmount');
    const expenseDescriptionInput = document.getElementById('expenseDescription');
    const expenseCategoryInput = document.getElementById('expenseCategory');
    const addExpenseBtn = document.getElementById('addExpenseBtn');

    let expenseCategoryChart, monthlyFlowChart;

    // Hilangkan spinner input number
    document.querySelectorAll('input[type=number]').forEach(input => input.setAttribute('type', 'text'));

    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    function cleanNumber(value) {
        return parseInt(value.replace(/\./g, "")) || 0;
    }

    function loadTransactions() {
        balance = parseFloat(localStorage.getItem('financeBalance')) || 0;
        totalIncome = parseFloat(localStorage.getItem('financeTotalIncome')) || 0;
        totalExpense = parseFloat(localStorage.getItem('financeTotalExpense')) || 0;
        transactions = JSON.parse(localStorage.getItem('financeTransactions')) || [];
    }

    function saveTransactions() {
        localStorage.setItem('financeBalance', balance);
        localStorage.setItem('financeTotalIncome', totalIncome);
        localStorage.setItem('financeTotalExpense', totalExpense);
        localStorage.setItem('financeTransactions', JSON.stringify(transactions));
    }

    function updateBalanceDisplay() {
        currentBalanceEl.textContent = `Rp ${formatNumber(balance)}`;
        totalIncomeEl.textContent = `Rp ${formatNumber(totalIncome)}`;
        totalExpenseEl.textContent = `Rp ${formatNumber(totalExpense)}`;
        currentBalanceEl.className = balance < 0 ? "display-5 fw-bold text-danger" : "display-5 fw-bold text-primary";
    }

    function renderTransactionHistory() {
        transactionHistoryBody.innerHTML = '';
        if (transactions.length === 0) {
            transactionHistoryBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Belum ada transaksi.</td></tr>`;
            return;
        }
        transactions.slice().reverse().forEach(t => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${t.date}</td>
                <td class="${t.type === 'pemasukan' ? 'text-success' : 'text-danger'} fw-bold">
                    ${t.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
                </td>
                <td>${t.category}</td>
                <td class="fw-bold">${t.type === 'pemasukan' ? '+' : '-'} Rp ${formatNumber(t.amount)}</td>
                <td>${t.description}</td>
            `;
            transactionHistoryBody.appendChild(row);
        });
    }

    function addTransaction(type, amount, description, category) {
        const date = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });
        transactions.push({ type, amount, description, category, date });
        if (type === 'pemasukan') {
            balance += amount;
            totalIncome += amount;
        } else {
            balance -= amount;
            totalExpense += amount;
        }
        saveTransactions();
        updateBalanceDisplay();
        renderTransactionHistory();
        updateCharts();
        renderMonthlyRecap();
    }

    addIncomeBtn.addEventListener('click', () => {
        const amount = cleanNumber(incomeAmountInput.value);
        const description = incomeDescriptionInput.value.trim();
        const category = incomeCategoryInput.value;
        if (amount <= 0 || description === '') {
            alert('Mohon masukkan pemasukan valid.');
            return;
        }
        addTransaction('pemasukan', amount, description, category);
        incomeAmountInput.value = '';
        incomeDescriptionInput.value = '';
    });

    addExpenseBtn.addEventListener('click', () => {
        const amount = cleanNumber(expenseAmountInput.value);
        const description = expenseDescriptionInput.value.trim();
        const category = expenseCategoryInput.value;
        if (amount <= 0 || description === '') {
            alert('Mohon masukkan pengeluaran valid.');
            return;
        }
        addTransaction('pengeluaran', amount, description, category);
        expenseAmountInput.value = '';
        expenseDescriptionInput.value = '';
    });

    // Format angka saat input
    [incomeAmountInput, expenseAmountInput].forEach(input => {
        input.addEventListener('input', () => {
            const cleaned = cleanNumber(input.value);
            input.value = cleaned ? formatNumber(cleaned) : '';
        });
    });

    function updateCharts() {
        const expenseByCategory = {};
        const monthlyIncome = Array(12).fill(0);
        const monthlyExpense = Array(12).fill(0);

        transactions.forEach(t => {
            const parts = t.date.split('/');
            const month = parseInt(parts[1]) - 1;
            if (t.type === 'pemasukan') {
                monthlyIncome[month] += t.amount;
            } else {
                monthlyExpense[month] += t.amount;
                expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
            }
        });

        // Expense Category Chart
        if (expenseCategoryChart) expenseCategoryChart.destroy();
        expenseCategoryChart = new Chart(document.getElementById('expenseCategoryChart'), {
            type: 'pie',
            data: {
                labels: Object.keys(expenseByCategory),
                datasets: [{
                    data: Object.values(expenseByCategory),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
                }]
            }
        });

        // Monthly Flow Chart
        if (monthlyFlowChart) monthlyFlowChart.destroy();
        monthlyFlowChart = new Chart(document.getElementById('monthlyFlowChart'), {
            type: 'bar',
            data: {
                labels: ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'],
                datasets: [
                    { label: 'Pemasukan', backgroundColor: '#28a745', data: monthlyIncome },
                    { label: 'Pengeluaran', backgroundColor: '#dc3545', data: monthlyExpense }
                ]
            },
            options: { responsive: true, plugins: { legend: { position: 'top' } } }
        });
    }

    function renderMonthlyRecap() {
        monthlyRecapBody.innerHTML = '';
        const recap = {};
        transactions.forEach(t => {
            const [day, month, year] = t.date.split('/');
            const key = `${year}-${month}`;
            if (!recap[key]) recap[key] = { income: 0, expense: 0 };
            if (t.type === 'pemasukan') recap[key].income += t.amount;
            else recap[key].expense += t.amount;
        });
        const sortedKeys = Object.keys(recap).sort();
        sortedKeys.forEach(key => {
            const [year, month] = key.split('-');
            const saldo = recap[key].income - recap[key].expense;
            const monthName = new Date(`${year}-${month}-01`).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${monthName}</td>
                <td>Rp ${formatNumber(recap[key].income)}</td>
                <td>Rp ${formatNumber(recap[key].expense)}</td>
                <td>Rp ${formatNumber(saldo)}</td>
            `;
            monthlyRecapBody.appendChild(row);
        });
        if (sortedKeys.length === 0) {
            monthlyRecapBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Belum ada data.</td></tr>`;
        }
    }

    loadTransactions();
    updateBalanceDisplay();
    renderTransactionHistory();
    updateCharts();
    renderMonthlyRecap();

    if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js');
});
