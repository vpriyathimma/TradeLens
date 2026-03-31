# TradeLens RAG Chatbot - Stock Insights
import streamlit as st
import os
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate

from dotenv import load_dotenv
load_dotenv()

# Page config
st.set_page_config(page_title="TradeLens Chat", page_icon="📈", layout="centered")

# Custom CSS for TradeLens theme
st.markdown("""
<style>
    .stApp {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    }
    .main-title {
        background: linear-gradient(135deg, #E8A0B0 0%, #D4A0B0 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-align: center;
        font-size: 2.5rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
    }
    .subtitle {
        text-align: center;
        color: #a0a0a0;
        margin-bottom: 2rem;
    }
    .chat-message {
        padding: 1rem;
        border-radius: 1rem;
        margin-bottom: 1rem;
    }
    .user-message {
        background: rgba(232, 160, 176, 0.1);
        border: 1px solid rgba(232, 160, 176, 0.3);
    }
    .bot-message {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
</style>
""", unsafe_allow_html=True)

# Header
st.markdown('<h1 class="main-title">📈 TradeLens Chat</h1>', unsafe_allow_html=True)
st.markdown('<p class="subtitle">AI-powered stock insights from your knowledge base</p>', unsafe_allow_html=True)

# Use HuggingFace embeddings (free, no API limits)
@st.cache_resource
def get_vectorstore():
    if os.path.exists("faiss_index_hf"):
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        return FAISS.load_local("faiss_index_hf", embeddings, allow_dangerous_deserialization=True)
    
    loader = PyPDFLoader("KB.pdf")
    data = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000)
    docs = text_splitter.split_documents(data)
    
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    vectorstore = FAISS.from_documents(documents=docs, embedding=embeddings)
    vectorstore.save_local("faiss_index_hf")
    return vectorstore

# Initialize chat history
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display chat history
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

try:
    vectorstore = get_vectorstore()
    retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 5})
    llm = ChatGoogleGenerativeAI(model="models/gemini-1.5-flash", temperature=0)

    system_prompt = (
        "You are TradeLens AI, a friendly stock insights assistant. "
        "Answer using the context provided. Be concise and helpful. "
        "Use bullet points for clarity when listing information."
        "\n\n{context}"
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}"),
    ])

    if query := st.chat_input("Ask about stocks, Nifty BeES, market trends..."):
        # Add user message
        st.session_state.messages.append({"role": "user", "content": query})
        with st.chat_message("user"):
            st.markdown(query)
        
        # Generate response
        with st.chat_message("assistant"):
            with st.spinner("Analyzing..."):
                question_answer_chain = create_stuff_documents_chain(llm, prompt)
                rag_chain = create_retrieval_chain(retriever, question_answer_chain)
                response = rag_chain.invoke({"input": query})
                answer = response["answer"]
            st.markdown(answer)
            st.session_state.messages.append({"role": "assistant", "content": answer})

except Exception as e:
    st.error(f"Error: {str(e)}")

# Sidebar with suggestions
with st.sidebar:
    st.markdown("### 💡 Try asking:")
    st.markdown("- What is Nifty BeES?")
    st.markdown("- What stocks should I invest in?")
    st.markdown("- Explain market trends")
    st.markdown("- What are the risks?")
    st.markdown("---")
    st.markdown("*Powered by TradeLens*")
