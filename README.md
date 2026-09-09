# Ledger — Expense Tracker with an AI Assistant

A full-stack web app where users sign up, log in, and track their own
expenses — plus an AI assistant that answers natural-language questions
about your own spending, powered by the Claude API.

## Features

- User authentication (signup/login) with hashed passwords and JWT sessions
- Add, view, and delete expenses, scoped per user
- Dashboard with total spend, monthly spend, and top category at a glance
- AI chat that reads your own expense data and answers questions about it
  in plain English (e.g. *"What's my biggest spending category?"*)

## Tech Stack

| Layer      | Technology                                  |
|------------|-----------------------------------------------|
| Frontend   | React, Vite, React Router                     |
| Backend    | Node.js, Express                               |
| Database   | SQLite (`better-sqlite3`)                      |
| Auth       | bcrypt, JSON Web Tokens                        |
| AI         | Claude API (`@anthropic-ai/sdk`)               |

## Architecture

```
React (Vite, :5173)  ──HTTP/JSON──►  Express API (:5000)  ──►  SQLite
                                              │
                                              └──►  Claude API (chat feature only)
```

The frontend never talks to the database or Claude directly — every
request goes through the Express server, which is the only place secrets
(the JWT secret and Anthropic API key) ever live.

## Project Structure

```
expense-tracker-ai/
├── backend/
│   ├── server.js            # entry point
│   ├── db.js                 # SQLite schema + connection
│   ├── middleware/auth.js    # JWT verification
│   └── routes/                # auth.js, expenses.js, chat.js
└── frontend/
    └── src/
        ├── api.js
        ├── context/AuthContext.jsx
        ├── pages/             # Login, Signup, Dashboard
        └── components/        # Navbar, ExpenseForm, ExpenseList, AiChat
```

## Getting Started

Requires **Node.js 18+**.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:
- `JWT_SECRET` — any long random string (generate one with
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `ANTHROPIC_API_KEY` — from [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

```bash
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`).

## API Reference

| Method | Endpoint            | Description                  | Auth required |
|--------|----------------------|-------------------------------|:---:|
| POST   | `/api/auth/signup`  | Create an account             | – |
| POST   | `/api/auth/login`   | Log in, receive a JWT         | – |
| GET    | `/api/expenses`     | List your expenses            | ✅ |
| POST   | `/api/expenses`     | Add an expense                | ✅ |
| DELETE | `/api/expenses/:id` | Delete an expense             | ✅ |
| POST   | `/api/chat`         | Ask the AI about your data    | ✅ |

## How It Works

Curious about the reasoning behind the auth flow, the database design, or
how the AI feature is prompted? See **[LEARNING_GUIDE.md](./LEARNING_GUIDE.md)**
for a full breakdown of every concept and file in this project.

## Roadmap

- [ ] Deploy (Render/Railway for the API, Vercel/Netlify for the frontend)
- [ ] Spending chart by category
- [ ] Input validation with `zod`
- [ ] Automated tests (`vitest` / `supertest`)
- [ ] Migrate to PostgreSQL
- [ ] Streaming AI responses

## Troubleshooting

- **"Invalid or expired token"** — log out and back in; the JWT secret
  may have changed since your last login.
- **AI chat says "unavailable"** — check `ANTHROPIC_API_KEY` in
  `backend/.env` and restart the backend after editing it.
- **Frontend can't reach the backend** — confirm the backend terminal
  still shows `Server running on http://localhost:5000`.

## License

MIT
