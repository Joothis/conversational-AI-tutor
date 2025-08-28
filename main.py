from fastapi import FastAPI
from pydantic import BaseModel
from rag_pipeline import setup_rag_pipeline, process_query
from fastapi.middleware.cors import CORSMiddleware

# --- FastAPI App Initialization ---
app = FastAPI(
    title="Conversational AI Tutor",
    description="An AI tutor that can answer questions based on a knowledge base.",
    version="1.0.0"
)

# --- CORS Middleware ---
# This is important to allow the React frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # The origin of the React app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request Models ---
class QueryRequest(BaseModel):
    question: str

# --- Event Handlers ---
@app.on_event("startup")
def on_startup():
    """This function is called when the application starts."""
    setup_rag_pipeline()

# --- API Endpoints ---
@app.post("/query")
def handle_query(request: QueryRequest):
    """
    Handles a single, stateless query.
    """
    return process_query(request.question, is_chat=False)

@app.post("/chat")
def handle_chat(request: QueryRequest):
    """
    Handles a conversational query, maintaining history.
    """
    return process_query(request.question, is_chat=True)

@app.get("/")
def read_root():
    """
    Root endpoint to check if the server is running.
    """
    return {"message": "Welcome to the Conversational AI Tutor API!"}

# --- Main Execution ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)