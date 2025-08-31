import os
import re
from langchain.document_loaders import PyPDFLoader, DirectoryLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import SentenceTransformerEmbeddings
from langchain.vectorstores import Chroma
from langchain.chains import RetrievalQA, ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema import SystemMessage, HumanMessage
from dotenv import load_dotenv
import logging

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Configuration ---
KNOWLEDGE_BASE_DIR = "knowledge_base"
CHROMA_PERSIST_DIR = "chroma_db"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-3.5-turbo")

# --- Global Variables ---
qa_chain = None
chat_chain = None
conversation_memory = None

# --- Emotion Detection ---
EMOTION_KEYWORDS = {
    "happy": ["great", "wonderful", "excellent", "perfect", "amazing", "glad", "happy"],
    "explaining": ["let me explain", "here's how", "basically", "in other words", "to understand"],
    "thinking": ["hmm", "well", "let me think", "interesting question", "that's complex"],
    "confused": ["i don't know", "unclear", "not sure", "uncertain", "can't find"],
    "encouraging": ["you can do", "keep trying", "great job", "well done", "good question"],
    "neutral": []  # default
}

def detect_emotion(text: str) -> str:
    """Detects emotion from the AI response text."""
    text_lower = text.lower()
    
    # Check for each emotion's keywords
    emotion_scores = {}
    for emotion, keywords in EMOTION_KEYWORDS.items():
        score = sum(1 for keyword in keywords if keyword in text_lower)
        if score > 0:
            emotion_scores[emotion] = score
    
    # Return emotion with highest score, or 'neutral' if no matches
    if emotion_scores:
        return max(emotion_scores, key=emotion_scores.get)
    
    # Additional heuristics
    if "?" in text:
        return "thinking"
    elif "!" in text:
        return "encouraging"
    
    return "neutral"

def load_documents():
    """Loads documents from the knowledge base directory."""
    documents = []
    
    # Create knowledge_base directory if it doesn't exist
    if not os.path.exists(KNOWLEDGE_BASE_DIR):
        os.makedirs(KNOWLEDGE_BASE_DIR)
        logger.info(f"Created {KNOWLEDGE_BASE_DIR} directory")
        
        # Create a sample document
        sample_path = os.path.join(KNOWLEDGE_BASE_DIR, "sample.txt")
        with open(sample_path, "w") as f:
            f.write("""
Welcome to the AI Tutor System!

This is a sample knowledge base document. You can add your own documents here.

Topics covered:
- Python Programming
- Machine Learning
- Data Science
- Natural Language Processing

Python is a high-level programming language known for its simplicity and readability.
Machine Learning is a subset of AI that enables systems to learn from data.
Data Science combines statistics, programming, and domain expertise to extract insights from data.
Natural Language Processing helps computers understand and generate human language.
            """)
        logger.info("Created sample knowledge base document")
    
    # Load text files
    if os.path.exists(KNOWLEDGE_BASE_DIR):
        txt_loader = DirectoryLoader(KNOWLEDGE_BASE_DIR, glob="*.txt", loader_cls=TextLoader)
        documents.extend(txt_loader.load())
        
        # Also try to load PDF files if they exist
        try:
            pdf_loader = DirectoryLoader(KNOWLEDGE_BASE_DIR, glob="*.pdf", loader_cls=PyPDFLoader)
            pdf_docs = pdf_loader.load()
            if pdf_docs:
                documents.extend(pdf_docs)
        except Exception as e:
            logger.warning(f"Could not load PDF files: {e}")
    
    if not documents:
        logger.warning("No documents found in knowledge base")
        # Create a minimal document to prevent errors
        from langchain.schema import Document
        documents = [Document(page_content="This is an AI tutor system. Add documents to the knowledge_base folder.", metadata={})]
    
    return documents

def split_documents(documents):
    """Splits documents into smaller chunks."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )
    texts = text_splitter.split_documents(documents)
    logger.info(f"Split documents into {len(texts)} chunks")
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
    logger.info("Vector store created and persisted")
    return vector_store

def get_qa_chain():
    """Initializes and returns the QA chain for single queries."""
    global qa_chain
    
    if qa_chain is None:
        embeddings = SentenceTransformerEmbeddings(model_name=EMBEDDING_MODEL)
        vector_store = Chroma(
            persist_directory=CHROMA_PERSIST_DIR,
            embedding_function=embeddings
        )
        retriever = vector_store.as_retriever(search_kwargs={"k": 3})
        
        # Custom prompt template for better responses
        prompt_template = """You are a helpful AI tutor. Use the following pieces of context to answer the question at the end.
        If you don't know the answer, just say that you don't know, don't try to make up an answer.
        Always be encouraging and supportive in your responses.
        
        Context: {context}
        
        Question: {question}
        
        Helpful Answer:"""
        
        PROMPT = PromptTemplate(
            template=prompt_template,
            input_variables=["context", "question"]
        )
        
        # Initialize the language model
        llm = ChatOpenAI(
            temperature=0.7,
            model_name=LLM_MODEL,
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=retriever,
            return_source_documents=True,
            chain_type_kwargs={"prompt": PROMPT}
        )
    
    return qa_chain

def get_chat_chain():
    """Initializes and returns the conversational chain with memory."""
    global chat_chain, conversation_memory
    
    if chat_chain is None:
        embeddings = SentenceTransformerEmbeddings(model_name=EMBEDDING_MODEL)
        vector_store = Chroma(
            persist_directory=CHROMA_PERSIST_DIR,
            embedding_function=embeddings
        )
        retriever = vector_store.as_retriever(search_kwargs={"k": 3})
        
        # Set up memory for conversational context
        conversation_memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True,
            output_key="answer"
        )
        
        # Custom conversational prompt
        custom_prompt = """You are a friendly and helpful AI tutor having a conversation with a student.
        Use the following pieces of context and the chat history to answer the question.
        If you don't know the answer, just say so politely. Always be encouraging and supportive.
        Remember previous questions and build upon them when relevant.
        
        Context: {context}
        
        Chat History: {chat_history}
        
        Student's Question: {question}
        
        Your Response:"""
        
        CONV_PROMPT = PromptTemplate(
            template=custom_prompt,
            input_variables=["context", "chat_history", "question"]
        )
        
        # Initialize the language model
        llm = ChatOpenAI(
            temperature=0.7,
            model_name=LLM_MODEL,
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        
        chat_chain = ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=retriever,
            memory=conversation_memory,
            return_source_documents=True,
            combine_docs_chain_kwargs={"prompt": CONV_PROMPT}
        )
    
    return chat_chain

def process_query(query: str, is_chat: bool = False):
    """
    Processes a query using the appropriate chain.
    Returns both text and emotion.
    """
    try:
        if is_chat:
            chain = get_chat_chain()
            result = chain({"question": query})
            answer = result.get("answer", "I'm sorry, I couldn't find an answer.")
        else:
            chain = get_qa_chain()
            result = chain({"query": query})
            answer = result.get("result", "I'm sorry, I couldn't find an answer.")
        
        # Detect emotion from the answer
        emotion = detect_emotion(answer)
        
        # Log the interaction
        logger.info(f"Query: {query[:50]}... | Emotion: {emotion}")
        
        return {
            "text": answer,
            "emotion": emotion,
            "sources": [doc.metadata.get("source", "Unknown") for doc in result.get("source_documents", [])][:3]
        }
        
    except Exception as e:
        logger.error(f"Error processing query: {e}")
        return {
            "text": "I apologize, but I encountered an error processing your question. Please try rephrasing it.",
            "emotion": "confused",
            "sources": []
        }

def reset_conversation():
    """Resets the conversation memory."""
    global conversation_memory
    if conversation_memory:
        conversation_memory.clear()
        logger.info("Conversation memory cleared")

def setup_rag_pipeline():
    """Sets up the entire RAG pipeline."""
    try:
        if not os.path.exists(CHROMA_PERSIST_DIR):
            logger.info("Setting up RAG pipeline...")
            documents = load_documents()
            texts = split_documents(documents)
            create_vector_store(texts)
            logger.info("RAG pipeline setup complete.")
        else:
            logger.info("RAG pipeline already set up. Loading existing vector store.")
            # Verify the vector store is accessible
            embeddings = SentenceTransformerEmbeddings(model_name=EMBEDDING_MODEL)
            vector_store = Chroma(
                persist_directory=CHROMA_PERSIST_DIR,
                embedding_function=embeddings
            )
            logger.info(f"Vector store loaded with {vector_store._collection.count()} documents")
    except Exception as e:
        logger.error(f"Error setting up RAG pipeline: {e}")
        raise

# --- Main Execution ---
if __name__ == "__main__":
    # This will be executed when you run the script directly
    setup_rag_pipeline()
    
    # Example usage:
    print("\n--- Testing Single Query ---")
    result1 = process_query("What is Python?")
    print(f"Answer: {result1['text'][:200]}...")
    print(f"Emotion: {result1['emotion']}")
    
    print("\n--- Testing Chat Mode ---")
    result2 = process_query("Tell me about machine learning", is_chat=True)
    print(f"Answer: {result2['text'][:200]}...")
    print(f"Emotion: {result2['emotion']}")
    
    result3 = process_query("What are its applications?", is_chat=True)
    print(f"Follow-up Answer: {result3['text'][:200]}...")
    print(f"Emotion: {result3['emotion']}")