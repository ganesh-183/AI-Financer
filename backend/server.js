const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory transactions store
let transactions = [];

// Routes
app.get('/api/transactions', (req, res) => {
  res.json(transactions);
});

app.post('/api/transactions', (req, res) => {
  const { desc, amount, type } = req.body;
  if (!desc || !amount || !type) {
    return res.status(400).json({ error: 'Invalid transaction data' });
  }
  const transaction = { id: Date.now(), desc, amount: parseFloat(amount), type };
  transactions.push(transaction);
  res.json(transaction);
});

app.delete('/api/transactions/:id', (req, res) => {
  const id = parseInt(req.params.id);
  transactions = transactions.filter(t => t.id !== id);
  res.json({ message: 'Transaction deleted' });
});

// Loan/EMI calculation endpoint
app.post('/api/emi', (req, res) => {
  const { principal, annualRate, months } = req.body;
  if (!principal || !annualRate || !months) {
    return res.status(400).json({ error: 'Invalid loan data' });
  }
  const monthlyRate = annualRate / 12 / 100;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
              (Math.pow(1 + monthlyRate, months) - 1);

  const totalPayment = emi * months;
  const totalInterest = totalPayment - principal;

  // Generate advice
  const ratio = totalPayment / principal;
  let advice = '';
  if (ratio > 1.8) {
    advice = "The interest cost is high relative to the loan. Consider a shorter tenure or lower rate.";
  } else if (emi / principal > 0.05) {
    advice = "Your EMI seems manageable. Ensure your monthly EMI is under 40% of your income.";
  } else {
    advice = "This loan plan appears sustainable based on the provided values.";
  }

  res.json({ emi, totalPayment, totalInterest, advice });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
