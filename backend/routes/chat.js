// routes/chat.js
// This is the "AI feature". The pattern here is sometimes called
// "context stuffing" or lightweight RAG (Retrieval-Augmented Generation):
// instead of fine-tuning a model, we simply fetch the user's own data from
// the database and paste it into the prompt, then ask Claude to reason over
// it. This is the same core idea behind most "chat with your data" products.

const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/', async (req, res) => {
  const { question } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({ error: 'question is required' });
  }

  // Step 1: retrieve - pull this user's own expenses out of the database.
  const expenses = db
    .prepare(
      'SELECT amount, category, description, expense_date FROM expenses WHERE user_id = ? ORDER BY expense_date DESC'
    )
    .all(req.userId);

  if (expenses.length === 0) {
    return res.json({
      answer:
        "You haven't logged any expenses yet, so I don't have anything to analyze. Add a few expenses first and ask me again!",
    });
  }

  // Step 2: format - turn the rows into plain text the model can read.
  const expensesText = expenses
    .map((e) => `${e.expense_date} | ${e.category} | ${e.amount} | ${e.description || 'no note'}`)
    .join('\n');

  const systemPrompt = `You are a friendly personal finance assistant built into an expense tracker app.
You will be given one user's raw expense records (date | category | amount | note) and a question about their own spending.
Rules:
- Only use the data provided below. Never invent numbers.
- Do the arithmetic yourself and show the key figures in your answer.
- If the data can't answer the question, say so plainly instead of guessing.
- Keep the answer short and conversational: 3-5 sentences.`;

  try {
    // Step 3: generate - send the question plus the user's own data to Claude.
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Here are my expenses:\n${expensesText}\n\nQuestion: ${question}`,
        },
      ],
    });

    const answer = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    res.json({ answer });
  } catch (err) {
    console.error('Anthropic API error:', err.message);
    res.status(500).json({
      error: 'The AI assistant is unavailable right now. Check that ANTHROPIC_API_KEY is set correctly in your .env file.',
    });
  }
});

module.exports = router;
