// Global username variable
let currentUsername = localStorage.getItem('ai-financer-username') || '';

// DOM Elements
const usernameSection = document.getElementById('username-section');
const mainApp = document.getElementById('main-app');
const usernameForm = document.getElementById('username-form');
const usernameInput = document.getElementById('username-input');
const currentUsernameEl = document.getElementById('current-username');
const changeUserBtn = document.getElementById('change-user-btn');

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

// Username management
usernameForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  if (!username || username.length < 2) {
    alert('Username must be at least 2 characters long');
    return;
  }

  try {
    const res = await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });

    const data = await res.json();
    if (res.ok) {
      currentUsername = username;
      localStorage.setItem('ai-financer-username', username);
      showMainApp();
      fetchTransactions();
    } else {
      alert(data.error || 'Error setting up user');
    }
  } catch (error) {
    alert('Error connecting to server');
  }
});

changeUserBtn.addEventListener('click', () => {
  showUsernameSection();
});

function showMainApp() {
  usernameSection.style.display = 'none';
  mainApp.style.display = 'block';
  currentUsernameEl.textContent = currentUsername;
}

function showUsernameSection() {
  usernameSection.style.display = 'block';
  mainApp.style.display = 'none';
  usernameInput.value = '';
}

// Initialize app
if (currentUsername) {
  showMainApp();
  fetchTransactions();
} else {
  showUsernameSection();
}

// Fetch and render transactions
async function fetchTransactions() {
  if (!currentUsername) return;

  try {
    const res = await fetch(`/api/transactions/${currentUsername}`);
    if (res.ok) {
      const data = await res.json();
      renderTransactions(data);
    } else {
      console.error('Error fetching transactions');
    }
  } catch (error) {
    console.error('Error fetching transactions:', error);
  }
}

function renderTransactions(transactions) {
  transactionsList.innerHTML = '';
  let totalIncome = 0, totalExpenses = 0;

  transactions.forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${t.desc} - ₹${t.amount}</span>
      <button onclick="deleteTransaction('${t._id}')">❌</button>
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

  if (!desc || isNaN(amount) || !currentUsername) return;

  try {
    await fetch(`/api/transactions/${currentUsername}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ desc, amount, type })
    });

    transactionForm.reset();
    fetchTransactions();
  } catch (error) {
    console.error('Error adding transaction:', error);
  }
});

async function deleteTransaction(id) {
  if (!currentUsername) return;

  try {
    await fetch(`/api/transactions/${currentUsername}/${id}`, { method: 'DELETE' });
    fetchTransactions();
  } catch (error) {
    console.error('Error deleting transaction:', error);
  }
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
