// routes/expenses.js
// Standard CRUD (Create, Read, Update, Delete) routes for a user's expenses.
// Every query is scoped by "WHERE user_id = ?" so one user can never see or
// edit another user's data, even if they guess an expense id.

const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth); // every route below this line requires a valid login token

// GET /api/expenses - list the logged-in user's expenses, newest first
router.get('/', (req, res) => {
  const expenses = db
    .prepare('SELECT * FROM expenses WHERE user_id = ? ORDER BY expense_date DESC, id DESC')
    .all(req.userId);
  res.json(expenses);
});

// POST /api/expenses - add a new expense
router.post('/', (req, res) => {
  const { amount, category, description, expense_date } = req.body;

  if (amount === undefined || !category || !expense_date) {
    return res.status(400).json({ error: 'amount, category and expense_date are required' });
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }

  const result = db
    .prepare(
      'INSERT INTO expenses (user_id, amount, category, description, expense_date) VALUES (?, ?, ?, ?, ?)'
    )
    .run(req.userId, amount, category, description || '', expense_date);

  const created = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/expenses/:id - edit an existing expense
router.put('/:id', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);

  if (!existing) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  const { amount, category, description, expense_date } = req.body;

  db.prepare(
    'UPDATE expenses SET amount = ?, category = ?, description = ?, expense_date = ? WHERE id = ?'
  ).run(
    amount ?? existing.amount,
    category ?? existing.category,
    description ?? existing.description,
    expense_date ?? existing.expense_date,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/expenses/:id
router.delete('/:id', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);

  if (!existing) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

module.exports = router;
