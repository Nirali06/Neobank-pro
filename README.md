# ⬡ NeoBank Pro

A full-stack digital banking application with an AI-powered chatbot, RAG knowledge base, LangChain-style agent, streaming UX, and UI automation bot.

---

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the App](#running-the-app)
- [Environment Variables](#environment-variables)
- [Google Sign-In Setup](#google-sign-in-setup)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [AI Chatbot Guide](#ai-chatbot-guide)
- [UI Automation Bot](#ui-automation-bot)
- [API Reference](#api-reference)
- [Demo Account](#demo-account)
- [Troubleshooting](#troubleshooting)
- [Author](#author)

---

## Features

### Banking Operations
- Deposit, Withdraw, Transfer funds
- Real-time balance display
- Full transaction history with filtering
- Account types: Savings, Checking, Premium

### Authentication
- Email + password Sign Up / Sign In / Sign Out
- Google OAuth Sign-In (via Google Identity Services)
- Session persists across page refreshes (token validated on mount)
- Secure SHA-256 password hashing
- Bearer token session management

### AI Chatbot
- **Streaming UX** — responses appear word-by-word in real time (SSE)
- **RAG System** — TF-IDF retrieval from 5000+ word knowledge base
- **LangChain Agent** — ReAct pattern with 5 tools (balance, transactions, spending stats, account info, RAG search)
- **UI Automation Bot** — chatbot can operate the dashboard UI automatically
- Persistent chat history per user
- Quick suggestion chips
- Tool usage badges on each response

### UI Automation (Playwright-style)
- Animated cursor moves across the screen
- Navigates to correct tab automatically
- Types values into input fields character-by-character
- Executes real banking API calls
- Shows status bar with step-by-step progress
- Error handling with clear failure messages

### Bank Knowledge Base
The chatbot can answer questions about:
- ATM fees and daily limits
- Transaction fees (NEFT, IMPS, RTGS, UPI)
- Account types (Savings, Checking, Premium)
- DICGC insurance coverage
- Security features and fraud protection
- How to open an account (KYC process)
- Contact methods and support channels
- Password reset and lost card procedures
- Data encryption and privacy policy
- Monthly and daily transaction limits

---

## Project Structure

```
neobank-pro/
│
├── backend/
│   ├── main.py               # FastAPI entry point — wires all routers
│   ├── model.py              # DB schema, Pydantic models, auth helpers
│   ├── auth.py               # /auth routes: register, login, logout, Google
│   ├── banking.py            # /account routes: deposit, withdraw, transfer
│   ├── chatbot.py            # /chat routes: streaming SSE, history
│   ├── rag_engine.py         # RAG retrieval: TF-IDF similarity search
│   ├── langchain_agent.py    # ReAct agent: tool planning + execution
│   ├── playwright_bot.py     # NLP command parser → UI action list
│   ├── knowledge_base.py     # 5000+ word bank policy document store
│   └── requirements.txt      # Python dependencies
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.jsx                        # Root: session validation + routing
    │   ├── index.js                       # React entry point
    │   └── components/
    │       ├── AuthPage.jsx               # Sign In / Sign Up + Google button
    │       ├── Dashboard.jsx              # Banking UI with bot-ready input IDs
    │       ├── ChatBot.jsx                # Streaming chat panel + SSE handler
    │       └── BotAutomation.jsx          # Animated cursor UI automation
    └── package.json
```

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Python 3.9+ | Runtime |
| FastAPI | Web framework |
| Uvicorn | ASGI server |
| SQLite | Database (auto-created) |
| Pydantic v2 | Request/response validation |
| SHA-256 (hashlib) | Password hashing |
| TF-IDF (stdlib math/re) | RAG retrieval engine |
| urllib.request (stdlib) | Anthropic API calls |
| google-auth | Google JWT verification |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| React Scripts 5 | Build tooling (CRA) |
| EventSource / fetch streaming | SSE for real-time chat |
| Google Identity Services | Google Sign-In button |
| CSS-in-JS (inline styles) | Styling |

---

## Prerequisites

- **Python** 3.9 or higher
- **Node.js** 16 or higher
- **npm** 8 or higher
- (Optional) **Anthropic API key** for Claude-powered AI responses
- (Optional) **Google Client ID** for Google Sign-In

---

## Installation

### 1. Clone or download the project

```bash
cd neobank-pro
```

### 2. Backend setup

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend setup

```bash
cd frontend
npm install --legacy-peer-deps
```

---

## Running the App

Open **two terminals** side by side.

### Terminal 1 — Backend

```bash
cd neobank-pro/backend
source venv/bin/activate

# Optional: set Anthropic API key for Claude AI responses
export ANTHROPIC_API_KEY=your_key_here   # Linux/Mac
# set ANTHROPIC_API_KEY=your_key_here    # Windows

uvicorn main:app --reload
```

Backend runs at: `http://localhost:8000`
Swagger docs at: `http://localhost:8000/docs`

### Terminal 2 — Frontend

```bash
cd neobank-pro/frontend
npm start
```

Frontend runs at: `http://localhost:3000`

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Optional | Enables Claude AI responses in chatbot. Without it, the chatbot uses rule-based fallback answers — still works but less intelligent. Get one at console.anthropic.com |

---

## Google Sign-In Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → **APIs & Services** → **Credentials**
3. Click **Create Credentials** → **OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Add to **Authorized JavaScript origins**: `http://localhost:3000`
6. Copy the **Client ID**

Then replace in two places:

**`backend/auth.py` line 75:**
```python
GOOGLE_CLIENT_ID = "YOUR_CLIENT_ID.apps.googleusercontent.com"
```

**`frontend/src/components/AuthPage.jsx` line 18:**
```js
const GOOGLE_CLIENT_ID = "YOUR_CLIENT_ID.apps.googleusercontent.com";
```

Restart both servers after making these changes.

---

## Backend Architecture

### `model.py` — Foundation
Defines all SQLite tables and shared helpers used by every other module.

```
Tables:
  users          — id, full_name, email, password (SHA-256), created_at
  sessions       — token, user_id, created_at
  accounts       — id, user_id, balance, acc_type, created_at
  transactions   — id, account_id, type, amount, note, timestamp
  chat_history   — id, user_id, role, content, timestamp
```

### `rag_engine.py` — RAG Retrieval
Implements Retrieval-Augmented Generation using TF-IDF similarity.

```
Flow:
  Query string
      ↓
  tokenize() — lowercase, remove stop words
      ↓
  tfidf_score() — TF × IDF for each query token vs each document
  + jaccard_similarity() — bonus for tag overlap
      ↓
  Top-K documents returned as context string
```

No external vector database needed — runs entirely on Python stdlib.

### `langchain_agent.py` — ReAct Agent
Implements the **Reason + Act** pattern from scratch (no LangChain package required).

```
Tools available:
  get_balance        → live account balance from DB
  get_transactions   → last N transactions from DB
  get_spending_stats → total in/out/net from DB
  get_account_info   → account type, creation date
  rag_search         → knowledge base retrieval

Flow:
  User message → plan_tools() selects tools by keyword matching
              → each tool called and result collected
              → context string assembled
              → injected into Claude system prompt
              → Claude generates grounded response
```

### `playwright_bot.py` — Command Parser
Parses natural language commands into structured UI action lists.

```
Input:  "deposit 5000 and then withdraw 300 for food"
Output: [
  { action: "deposit",  amount: 5000, note: "" },
  { action: "withdraw", amount: 300,  note: "food" }
]

Supported:
  deposit [amount] [for note]
  withdraw [amount] [for note]
  transfer [amount] to [email] [for note]
  go to [tab]
  show balance / show history
```

### `chatbot.py` — Streaming Orchestrator
The main chatbot router. Handles three types of incoming messages:

```
1. Show transactions intent
   → parse_show_transactions() detects "show last 5"
   → returns SSE event type: "show_transactions"
   → frontend navigates to history tab + highlights rows

2. Automation command
   → build_action_sequence() parses into action list
   → validate_actions() checks balance
   → returns SSE event type: "automation"
   → frontend's BotAutomation.jsx executes

3. Normal chat
   → langchain_agent.run() calls tools
   → Claude API streamed token by token
   → SSE event type: "delta" per token
   → SSE event type: "meta" with tool names used
```

---

## Frontend Architecture

### `App.jsx` — Session Management
On mount, validates stored token against `/auth/me`. If valid, restores session silently. If expired, clears localStorage and shows sign-in. Shows a spinner while checking.

### `AuthPage.jsx` — Authentication
- Email/password form with client-side validation
- Google Identity Services button (renders Google's official button)
- `autoComplete="new-password"` on password fields prevents browser autofill on load
- `Field` component defined **outside** `AuthPage` to prevent cursor-loss bug on re-render

### `Dashboard.jsx` — Banking UI
- Bot-automation ready: all inputs have `id="bot-amount-input"`, `id="bot-note-input"`, `id="bot-email-input"`
- All tabs have `data-tab="deposit"` etc. for bot navigation
- Submit buttons have `botMode` guard: `if (botMode) return;` prevents human click during bot automation
- `highlightedTxns` state: highlights specific rows when chatbot's "show transactions" fires

### `ChatBot.jsx` — Streaming Chat Panel
- Uses `fetch()` with `response.body.getReader()` to consume SSE stream
- Renders messages word-by-word as tokens arrive
- Handles 5 SSE event types: `delta`, `done`, `meta`, `automation`, `show_transactions`
- `botKey` state: incremented per command, passed as `key` prop to `BotAutomation` to force clean remount
- Tool usage badges shown below each assistant message

### `BotAutomation.jsx` — UI Automation
- `hasRunRef` prevents React StrictMode's double-mount from executing actions twice
- `moveCursorOverButton()` animates cursor to submit button but never calls `el.click()`
- `typeIntoInput()` sets full value at once via `nativeInputValueSetter` — prevents character corruption
- `executeAction()` makes the single API call — no other code path calls the banking API

---

## AI Chatbot Guide

### Ask about your account
```
What is my balance?
Show my recent transactions
Show last 5 transactions
Show deposit transactions
My spending summary
How much have I spent this month?
```

### Ask about bank policies
```
What are ATM fees?
What is DICGC insurance?
What are daily transaction limits?
How do I open an account?
What is a Premium account?
How secure is NeoBank?
How do I reset my password?
What is the interest rate on savings?
How do I report fraud?
What are NEFT charges?
What is IMPS?
How do I block my card?
```

### Automate UI operations
```
deposit 5000
withdraw 300 for food
deposit 1000 and then withdraw 500
transfer 2000 to user@example.com for rent
go to history
show balance
navigate to deposit
```

---

## UI Automation Bot

When you type an automation command in the chatbot, the bot:

1. Parses the command → extracts action, amount, note, email
2. Validates balance (checks if sufficient funds)
3. Shows animated cursor on screen
4. Navigates to correct tab (cursor clicks the tab)
5. Types amount into input field
6. Types note and email if provided
7. Moves cursor over submit button (visual only)
8. Calls the banking API directly (one call, no button click)
9. Shows result in chat: ✅ success or ❌ error with reason
10. Refreshes account balance

**Why actions never execute twice:** `hasRunRef` in `BotAutomation.jsx` blocks React StrictMode's second mount from re-running automation. `botKey` in `ChatBot.jsx` resets `hasRunRef` for each new command by forcing a clean component remount.

---

## API Reference

### Auth Routes
| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/auth/register` | `{full_name, email, password, initial_deposit?, acc_type?}` | Create account |
| POST | `/auth/login` | `{email, password}` | Sign in |
| POST | `/auth/logout` | — | Sign out (deletes session token) |
| GET | `/auth/me` | — | Get current user (validates token) |
| POST | `/auth/google` | `{id_token}` | Google Sign-In |

### Account Routes (all require `Authorization: Bearer <token>`)
| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/account` | — | Get balance + account info |
| GET | `/account/transactions?limit=50` | — | Transaction history |
| POST | `/account/deposit` | `{amount, note?}` | Deposit funds |
| POST | `/account/withdraw` | `{amount, note?}` | Withdraw funds |
| POST | `/account/transfer` | `{to_email, amount, note?}` | Transfer to another user |

### Chat Routes (all require `Authorization: Bearer <token>`)
| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/chat/stream` | `{message}` | Streaming SSE chat endpoint |
| GET | `/chat/history` | — | Last 50 chat messages |
| DELETE | `/chat/history` | — | Clear chat history |

---

## Demo Account

```
Email:    demo@neobank.com
Password: demo1234
Balance:  ₹25,000 (with sample transaction history)
```

Click **Autofill ↗** on the Sign In page to fill credentials automatically.

---

## Troubleshooting

### `npm start` fails with `react-scripts: not found`
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm start
```

### Backend crashes on startup
Make sure you are in the `backend/` directory when running uvicorn:
```bash
cd neobank-pro/backend
uvicorn main:app --reload
```

### Chatbot gives generic responses
Set your Anthropic API key:
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```
Without it, the chatbot uses rule-based fallback answers. Banking operations and knowledge base Q&A still work fully.

### Google Sign-In button not appearing
- Ensure `GOOGLE_CLIENT_ID` is set in both `auth.py` and `AuthPage.jsx`
- Ensure `http://localhost:3000` is in your OAuth client's Authorized JavaScript origins
- Check browser console for GSI script errors

### Actions executing twice in development
This is fixed by `hasRunRef` in `BotAutomation.jsx`. If you still see it, ensure you are using the latest `BotAutomation.jsx` and `ChatBot.jsx`. The root cause is React StrictMode's intentional double-mount in development — it does NOT happen in production builds (`npm run build`).

### CORS errors in browser console
Ensure the backend is running on port 8000 and the frontend on port 3000. The backend's CORS config allows only `http://localhost:3000`.

### Database reset
Delete `neobank.db` from the `backend/` folder and restart the server. It will be recreated with the demo user.

```bash
rm neobank-pro/backend/neobank.db
uvicorn main:app --reload
```

###Author




