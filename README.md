# Ledger — Expense Tracker with an AI Assistant

A full-stack web app: users sign up, log in, and track their own expenses.
A built-in AI assistant answers plain-English questions about your spending
("How much did I spend on food this month?") by reading your own saved data
and reasoning over it with Claude.

This is a complete, working project — tested end to end while building it.
You just need to add your own Anthropic API key to turn the AI feature on.

---

## 1. What it demonstrates (for your resume)

| Skill area          | What's in this project                                              |
|----------------------|----------------------------------------------------------------------|
| Frontend             | React (with hooks + Context), client-side routing, calling a REST API |
| Backend              | Node.js + Express REST API, middleware, route protection             |
| Database             | SQL schema design, SQLite via `better-sqlite3`, parameterized queries |
| Auth                 | Password hashing (bcrypt), JSON Web Tokens (JWT), protected routes    |
| AI integration       | Prompting an LLM with a user's own data (retrieval-style context injection) |
| Full-stack wiring    | CORS, environment variables, frontend/backend split, API design      |

That combination — auth + CRUD + a real AI feature that's actually useful,
not bolted on — is exactly what "full-stack + AI" means on a resume.

---

## 2. How it's built (architecture)

```
┌─────────────────┐        HTTP/JSON         ┌──────────────────┐
│   React app      │  ───────────────────►    │  Express server   │
│  (Vite, port     │  ◄───────────────────    │  (port 5000)       │
│   5173)          │                           │                    │
└─────────────────┘                           │  - /api/auth       │
                                               │  - /api/expenses   │
                                               │  - /api/chat  ─────┼──► Claude API
                                               └─────────┬──────────┘
                                                          │
                                                          ▼
                                                 ┌──────────────────┐
                                                 │  SQLite database  │
                                                 │  (data.sqlite)    │
                                                 └──────────────────┘
```

The frontend never talks to the database or to Claude directly — it only
ever talks to your Express server, and the server is the only thing holding
the Anthropic API key. This is the standard, secure pattern: **never call
a paid AI API directly from client-side code**, or anyone who opens your
browser's dev tools can steal your key and run up your bill.

### Folder structure

```
expense-tracker-ai/
├── backend/
│   ├── server.js          # entry point, wires everything together
│   ├── db.js               # SQLite connection + table setup
│   ├── middleware/auth.js  # verifies JWT on protected routes
│   └── routes/
│       ├── auth.js         # signup, login
│       ├── expenses.js     # CRUD for expenses
│       └── chat.js         # the AI feature
└── frontend/
    └── src/
        ├── api.js                    # fetch() wrapper for the backend
        ├── context/AuthContext.jsx   # shares logged-in user across the app
        ├── pages/
        │   ├── Login.jsx
        │   ├── Signup.jsx
        │   └── Dashboard.jsx
        └── components/
            ├── Navbar.jsx
            ├── ExpenseForm.jsx
            ├── ExpenseList.jsx
            └── AiChat.jsx             # the AI feature's UI
```

---

## 3. Setup — get it running locally

You'll need **Node.js 18+** installed. Check with `node -v` in a terminal.

### Step 1: Backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in two things:

1. **`JWT_SECRET`** — any long random string. Generate one with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. **`ANTHROPIC_API_KEY`** — get a free key at
   [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys).
   New accounts get a small amount of free credit, which is more than enough
   to build and demo this project.

Then start the server:

```bash
npm run dev
```

You should see `Server running on http://localhost:5000`. Leave this
terminal open.

### Step 2: Frontend

Open a **new** terminal tab:

```bash
cd frontend
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`). Sign up for an
account, add a few expenses, then try the "Ask about your spending" box.

---

## 4. How the pieces work (the teaching part)

### Authentication: bcrypt + JWT

When you sign up, your password is **never stored as-is**. `bcryptjs` runs
it through a one-way hashing function — even if someone stole the database,
they couldn't read your password back out, only verify guesses against the
hash. That's `bcrypt.hashSync(password, 10)` in `routes/auth.js`.

When you log in successfully, the server creates a **JWT** (JSON Web
Token) — a signed piece of text containing your user id, valid for 7 days.
The frontend stores it in `localStorage` and attaches it to every future
request as `Authorization: Bearer <token>`. The `middleware/auth.js` file
checks that header on every protected route, so an expense route always
knows *which* user is asking, without you needing a server-side session
store.

### The database: SQLite + `better-sqlite3`

SQLite stores the whole database as a single file (`data.sqlite`) — no
separate database server to install, which is why this project runs with
zero setup. `better-sqlite3` is a synchronous SQL library: no `await`
needed for queries, which makes the code easier to read as a beginner.
Every query uses **parameterized placeholders** (`?`) instead of pasting
user input into the SQL string — this is what prevents SQL injection
attacks. Look at any line like:

```js
db.prepare('SELECT * FROM users WHERE email = ?').get(email);
```

If you later want Postgres or MySQL for a "real" deployment, the concepts
transfer directly — you'd mostly swap this file for a library like `pg`
and keep the same route logic.

### The REST API

Each resource gets its own file under `routes/`, and each route follows
plain REST conventions:

| Method | Path              | Does what                        |
|--------|-------------------|-----------------------------------|
| POST   | /api/auth/signup  | create an account                 |
| POST   | /api/auth/login   | log in, get a token                |
| GET    | /api/expenses     | list your expenses                |
| POST   | /api/expenses     | add an expense                    |
| DELETE | /api/expenses/:id | delete one of your expenses       |
| POST   | /api/chat         | ask the AI about your data        |

### The AI feature: how it actually answers your questions

This is the part worth understanding deeply, since it's what makes this
an "AI project" rather than just a CRUD app.

Claude doesn't have access to your database. Instead, `routes/chat.js`
does three things every time you ask a question:

1. **Retrieve** — pull *your* expense rows out of SQLite (`WHERE user_id = ?`,
   so you only ever see your own data).
2. **Format** — turn those rows into a plain-text table Claude can read.
3. **Generate** — send that text plus your question to Claude, with a system
   prompt that says: *only use the data given, do the math yourself, and say
   so if the data can't answer the question.*

This pattern — fetch relevant data, paste it into the prompt, ask the model
to reason over it — is a lightweight version of what's called
**Retrieval-Augmented Generation (RAG)** in the industry. Real production
RAG systems add a vector database to find *relevant* documents out of
millions; here, since one user's expense list is small, we just send all
of it. Understanding this distinction is a great thing to be able to
explain in an interview.

### The frontend: React Context instead of prop-drilling

`AuthContext.jsx` holds "who is logged in" in one place, so any component
(`Navbar`, `Dashboard`, route guards) can call `useAuth()` to read or
change it, instead of passing `user` down through every component by hand.
`App.jsx` uses `react-router-dom` to show `Login`/`Signup` when logged out
and redirect to `Dashboard` when logged in.

---

## 5. Suggestions to make this even stronger

Roughly in order of effort vs. resume impact:

1. **Deploy it.** A live link matters more than almost anything else on a
   resume. Backend → [Render](https://render.com) or
   [Railway](https://railway.app) (free tiers exist). Frontend →
   [Vercel](https://vercel.com) or [Netlify](https://netlify.com). Swap
   `VITE_API_URL` to point at your deployed backend.
2. **Add input validation with `zod`** on the backend instead of manual
   `if` checks — a very commonly requested library in job postings.
3. **Add a spending chart** (e.g. `recharts`) on the dashboard — "amount by
   category" as a pie or bar chart. Visual, and easy to demo.
4. **Pagination or date filtering** on the expense list once you have more
   data — shows you think about scale.
5. **Write a few tests** with `vitest` (frontend) or `jest`/`supertest`
   (backend, testing the API routes) — testing is one of the most-asked-about
   skills in interviews for junior roles.
6. **Move from SQLite to Postgres** (e.g. free tier on
   [Neon](https://neon.tech) or [Supabase](https://supabase.com)) —
   shows you understand the tradeoffs between embedded and client-server
   databases.
7. **Streaming AI responses** — use Anthropic's streaming API so answers
   appear word-by-word like a real chat product, instead of waiting for
   the full response.
8. **Rate-limit the `/api/chat` route** (e.g. with `express-rate-limit`) —
   a real product-thinking touch, since LLM calls cost money per request.

Pick 2–3, not all 8 — a project with a few thoughtful extensions beats one
with everything half-done.

## 6. Suggested resume bullet points

Adapt these to what you actually built and can speak to confidently in an
interview:

- Built a full-stack expense tracker (React, Node.js/Express, SQLite) with
  JWT authentication and bcrypt password hashing, supporting full CRUD on
  user-scoped data.
- Designed and integrated an AI assistant feature using the Claude API that
  answers natural-language questions about a user's own financial data by
  dynamically injecting retrieved records into the model's context.
- Implemented a REST API with protected routes, parameterized SQL queries,
  and token-based session management.

## 7. Troubleshooting

- **"Invalid or expired token, please log in again"** — log out and back
  in; your `JWT_SECRET` may have changed since you last logged in (each
  restart with a different `.env` invalidates old tokens).
- **AI chat says "unavailable right now"** — check `ANTHROPIC_API_KEY` in
  `backend/.env` is set to a real key with no quotes around it, and that
  you restarted the backend after editing `.env`.
- **Frontend can't reach the backend** — make sure the backend terminal is
  still running and shows `Server running on http://localhost:5000`.
- **`npm install` fails on `better-sqlite3`** — it compiles a small native
  module; make sure you have a recent Node.js (18+) and, on Linux, that
  `python3` and `make` are installed.
