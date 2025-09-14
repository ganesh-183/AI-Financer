// Budget Planner
const transactionForm = document.getElementById('transaction-form');
const descInput = document.getElementById('desc');
const amountInput = document.getElementById('amount');
const typeSelect = document.getElementById('type');
const transactionsList = document.getElementById('transactions');
const totalIncomeEl = document.getElementById('total-income');
const totalExpensesEl = document.getElementById('total-expenses');
const balanceEl = document.getElementById('balance');
const suggestionsEl = document.getElementById('suggestions');

// Fetch and render transactions
async function fetchTransactions() {
  const res = await fetch('/api/transactions');
  const data = await res.json();
  renderTransactions(data);
}

function renderTransactions(transactions) {
  transactionsList.innerHTML = '';
  let totalIncome = 0, totalExpenses = 0;

  transactions.forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${t.desc} - ₹${t.amount}</span>
      <button onclick="deleteTransaction(${t.id})">❌</button>
    `;
    if (t.type === 'income') totalIncome += t.amount;
    else totalExpenses += t.amount;
    transactionsList.appendChild(li);
  });

  const balance = totalIncome - totalExpenses;
  totalIncomeEl.textContent = totalIncome.toFixed(2);
  totalExpensesEl.textContent = totalExpenses.toFixed(2);
  balanceEl.textContent = balance.toFixed(2);

  generateSavingsSuggestions(totalIncome, totalExpenses, transactions);
}

transactionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const desc = descInput.value.trim();
  const amount = parseFloat(amountInput.value.trim());
  const type = typeSelect.value;

  if (!desc || isNaN(amount)) return;

  await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ desc, amount, type })
  });

  transactionForm.reset();
  fetchTransactions();
});

async function deleteTransaction(id) {
  await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
  fetchTransactions();
}

function generateSavingsSuggestions(income, expenses, transactions) {
  if (transactions.length < 2) {
    suggestionsEl.textContent = "Add more transactions for better suggestions.";
    return;
  }
  const savings = income - expenses;
  let tip = '';
  if (expenses > income) {
    tip = "You are spending more than you earn. Review non-essential expenses.";
  } else if (savings / income < 0.2) {
    tip = "Try to save at least 20% of your income. Small spending cuts can help.";
  } else {
    tip = "Good job! You are saving a healthy portion of your income.";
  }
  suggestionsEl.textContent = tip;
}

// Loan/EMI Calculator
const emiForm = document.getElementById('emi-form');
const loanAmountInput = document.getElementById('loan-amount');
const interestRateInput = document.getElementById('interest-rate');
const loanTenureInput = document.getElementById('loan-tenure');
const emiValueEl = document.getElementById('emi-value');
const totalPaymentEl = document.getElementById('total-payment');
const totalInterestEl = document.getElementById('total-interest');
const loanAdviceEl = document.getElementById('loan-advice');

emiForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const principal = parseFloat(loanAmountInput.value);
  const annualRate = parseFloat(interestRateInput.value);
  const months = parseInt(loanTenureInput.value);

  if (isNaN(principal) || isNaN(annualRate) || isNaN(months)) return;

  const res = await fetch('/api/emi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ principal, annualRate, months })
  });

  const data = await res.json();
  emiValueEl.textContent = data.emi.toFixed(2);
  totalPaymentEl.textContent = data.totalPayment.toFixed(2);
  totalInterestEl.textContent = data.totalInterest.toFixed(2);
  loanAdviceEl.textContent = data.advice;
});

fetchTransactions();
