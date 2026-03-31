from flask import Blueprint, request, jsonify
import os
from dotenv import load_dotenv
import google.generativeai as genai
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

chat_bp = Blueprint("chat", __name__)

# Global variables for RAG
vectorstore = None
embeddings = None

def init_rag():
    global vectorstore, embeddings
    logger.info("🎬 Starting RAG Initialization...")
    try:
        kb_path = "/Users/apple/Desktop/TradeLens/rag chatbot/KB.pdf"
        index_path = "/Users/apple/Desktop/TradeLens/backend/faiss_index_backend"
        
        logger.info(f"📍 KB Path: {kb_path}")
        logger.info(f"📍 Index Path: {index_path}")

        # Loading Embeddings
        logger.info("⏳ Loading HuggingFaceEmbeddings (all-MiniLM-L6-v2)...")
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        logger.info("✅ Embeddings loaded.")
        
        if os.path.exists(index_path):
            logger.info("🔍 Loading existing FAISS index...")
            vectorstore = FAISS.load_local(index_path, embeddings, allow_dangerous_deserialization=True)
            logger.info("✅ FAISS Index loaded from disk.")
        elif os.path.exists(kb_path):
            logger.info("📄 Generating new FAISS index from KB.pdf...")
            loader = PyPDFLoader(kb_path)
            data = loader.load()
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
            docs = text_splitter.split_documents(data)
            vectorstore = FAISS.from_documents(documents=docs, embedding=embeddings)
            vectorstore.save_local(index_path)
            logger.info("✅ FAISS Index created and saved.")
        else:
            logger.warning("⚠️ Knowledge base (KB.pdf) not found.")
            return
        
        logger.info("🚀 RAG System Ready.")
        return True
    except Exception as e:
        logger.error(f"❌ RAG Initialization error: {str(e)}")
        # Print full traceback for better debugging
        import traceback
        traceback.print_exc()
        return False

# REMOVED: init_rag() on startup to prevent hangs

@chat_bp.route("/chat", methods=["POST"])
def chat():
    global vectorstore
    logger.info("📩 Received chat request.")
    
    # Lazy Initialization
    if vectorstore is None:
        logger.info("⏳ Vectorstore not initialized, attempting lazy init...")
        success = init_rag()
        if not success:
            logger.error("❌ Lazy RAG initialization failed.")
            return jsonify({
                "response": "Search system is currently initializing. Please try again in 30 seconds.",
                "status": "initializing"
            }), 503

    try:
        data = request.json
        message = data.get("message", "")
        logger.info(f"💬 User Message: {message}")
        
        if not message:
            return jsonify({"error": "Message is required"}), 400
        
        # Configure Gemini
        logger.info("⚙️ Configuring Gemini API...")
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
        model = genai.GenerativeModel('gemini-flash-latest')
        logger.info("✅ Gemini Model initialized.")
        
        context = ""
        # Get context from FAISS if available
        if vectorstore:
            logger.info("🔍 Performing FAISS similarity search...")
            docs = vectorstore.similarity_search(message, k=3)
            context = "\n".join([doc.page_content for doc in docs])
            logger.info("✅ FAISS search complete.")
        else:
            logger.warning("⚠️ Vectorstore not initialized, skipping context.")
        
        system_prompt = (
            "You are TradeLens AI, a helpful stock market assistant. "
            "Use the provided context to answer the user's question. "
            "If the answer isn't in the context, use your general knowledge but mention it's outside the direct TradeLens docs. "
            "Keep responses concise (3-4 sentences). Be professional."
        )
        
        full_prompt = f"{system_prompt}\n\nContext:\n{context}\n\nUser Question: {message}"
        
        logger.info("⏳ Generating response with Gemini...")
        response = model.generate_content(full_prompt)
        answer = response.text
        logger.info("✅ Response generated successfully.")

        return jsonify({
            "response": answer,
            "status": "success"
        })
        
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({
            "error": str(e),
            "response": "Sorry, I'm having trouble responding right now. Please try again.",
            "status": "error"
        }), 500
