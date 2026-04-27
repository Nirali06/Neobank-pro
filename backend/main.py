# main.py — NeoBank Pro API entry point
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware  # ← ADD THIS
from model import init_db
from auth import router as auth_router
from banking import router as banking_router
from chatbot import router as chatbot_router
from latency import latency_middleware

app = FastAPI(title="NeoBank Pro API", version="5.0.0",
              description="Banking API with LangChain Agent, RAG, Streaming Chatbot")

              # ← ADD THIS FIRST (must be before CORS)
app.add_middleware(SessionMiddleware, secret_key="your-secret-key-change-this")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.middleware("http")(latency_middleware)
init_db()

app.include_router(auth_router)
app.include_router(banking_router)
app.include_router(chatbot_router)

@app.get("/")
def root():
    return {"status": "NeoBank Pro API v5.0 running", "docs": "/docs"}
