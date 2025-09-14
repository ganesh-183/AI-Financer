require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

// Models
const User = require('./models/User');
const Transaction = require('./models/Transaction');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Username-based user management
app.post('/api/user', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || username.trim().length < 2) {
      return res.status(400).json({ error: 'Username must be at least 2 characters long' });
    }

    // Find existing user or create new one
    let user = await User.findOne({ username: username.trim() });
    if (!user) {
      user = new User({ username: username.trim() });
      await user.save();
    } else {
      user.lastActive = new Date();
      await user.save();
    }

    res.json({
      message: 'User ready',
      user: {
        id: user._id,
        username: user.username,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error setting up user: ' + error.message });
  }
});

// Transaction routes (username-based)
app.get('/api/transactions/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const transactions = await Transaction.find({ userId: user._id }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching transactions: ' + error.message });
  }
});

app.post('/api/transactions/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { desc, amount, type, category } = req.body;
    if (!desc || !amount || !type) {
      return res.status(400).json({ error: 'Invalid transaction data' });
    }

    const transaction = new Transaction({
      userId: user._id,
      desc: desc.trim(),
      amount: parseFloat(amount),
      type,
      category: category || 'general'
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Error creating transaction: ' + error.message });
  }
});

app.delete('/api/transactions/:username/:id', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: user._id
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting transaction: ' + error.message });
  }
});

// EMI calculation endpoint
app.post('/api/emi', (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: 'Error calculating EMI: ' + error.message });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
