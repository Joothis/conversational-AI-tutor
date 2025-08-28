import os
from langchain.document_loaders import PyPDFLoader, DirectoryLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import SentenceTransformerEmbeddings
from langchain.vectorstores import Chroma
from langchain.chains import RetrievalQA
from langchain.memory import ConversationBufferMemory
from langchain.chat_models import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()

# --- Configuration ---
KNOWLEDGE_BASE_DIR = "knowledge_base"
CHROMA_PERSIST_DIR = "chroma_db"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
LLM_MODEL = "gpt-3.5-turbo" # or any other model you have access to

# --- Global Variables ---
qa_chain = None

def load_documents():
    """Loads documents from the knowledge base directory."""
    # Using TextLoader for .txt files
    loader = DirectoryLoader(KNOWLEDGE_BASE_DIR, glob="*.txt", loader_cls=TextLoader)
    documents = loader.load()
    return documents


def split_documents(documents):
    """Splits documents into smaller chunks."""
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    texts = text_splitter.split_documents(documents)
    return texts


def create_vector_store(texts):
    """Creates and persists a Chroma vector store."""
    embeddings = SentenceTransformerEmbeddings(model_name=EMBEDDING_MODEL)
    vector_store = Chroma.from_documents(
        documents=texts,
        embedding=embeddings,
        persist_directory=CHROMA_PERSIST_DIR
    )
    vector_store.persist()
    return vector_store


def get_qa_chain():
    """Initializes and returns the QA chain."""
    global qa_chain
    if qa_chain is None:
        embeddings = SentenceTransformerEmbeddings(model_name=EMBEDDING_MODEL)
        vector_store = Chroma(
            persist_directory=CHROMA_PERSIST_DIR,
            embedding_function=embeddings
        )
        retriever = vector_store.as_retriever(search_kwargs={"k": 2})
        
        # Set up memory for conversational context
        memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )

        # Initialize the language model
        # Make sure you have OPENAI_API_KEY set in your .env file
        llm = ChatOpenAI(temperature=0.7, model_name=LLM_MODEL)

        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=retriever,
            return_source_documents=True,
            memory=memory
        )
    return qa_chain


def process_query(query: str, is_chat: bool = False):
    """
    Processes a query using the QA chain.
    For chat, it uses the existing chain with memory.
    For a single query, it creates a new chain to avoid using past history.
    """
    chain = get_qa_chain()
    result = chain({"query": query})
    
    answer = result.get("result", "I'm sorry, I couldn't find an answer.")
    
    # Simple emotion logic
    emotion = "explaining" if "I don't know" not in answer else "confused"
    
    return {"text": answer, "emotion": emotion}


def setup_rag_pipeline():
    """Sets up the entire RAG pipeline if the vector store doesn't exist."""
    if not os.path.exists(CHROMA_PERSIST_DIR):
        print("Setting up RAG pipeline...")
        documents = load_documents()
        texts = split_documents(documents)
        create_vector_store(texts)
        print("RAG pipeline setup complete.")
    else:
        print("RAG pipeline already set up.")

# --- Main Execution ---
if __name__ == "__main__":
    # This will be executed when you run the script directly
    # It's useful for initial setup and testing
    setup_rag_pipeline()
    
    # Example usage:
    # print(process_query("What is Python?"))
    # print(process_query("What are lists in Python?", is_chat=True))
    # print(process_query("What about tuples?", is_chat=True))