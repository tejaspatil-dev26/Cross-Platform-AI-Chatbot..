# 🤖 Cross-Platform AI Chatbot

> **Build once, deploy everywhere!** A unified, cross-platform AI chatbot ecosystem powered by **FastAPI**, **LangChain**, and **ChromaDB**, featuring a sleek, draggable **React + Vite + Tailwind CSS** chat widget ready to embed into any web application or website with a single `<script>` tag.

---

## ✨ Features

- **🌐 Cross-Platform Embeddable Widget**: Lightweight, responsive floating chat bubble and window that can be embedded into any HTML page or web app via a single script tag. Supports dragging, custom headers, quick prompts, and document uploads.
- **🧠 Pluggable AI Providers**:
  - **Ollama**: Run private, local LLMs like `llama3.2`, `mistral`, or `deepseek-r1`.
  - **Google Gemini**: Cloud-powered generative AI using Gemini API.
  - **Mock Mode**: Zero-dependency instant response testing without API keys or local LLM setup.
- **📚 Advanced Retrieval-Augmented Generation (RAG)**:
  - **Multi-Format Ingestion**: Supports PDF (`PyMuPDF`), Word (`python-docx`), PowerPoint (`python-pptx`), Excel (`openpyxl`), Images with OCR (`pytesseract`), RTF, Markdown, Code, and Plain Text.
  - **Embeddings & Vector Store**: Dense semantic embeddings via `sentence-transformers` stored in a persistent local `ChromaDB` vector store.
  - **Pre-warmed Engine**: Background model pre-warming for near-instant upload parsing and question answering.
- **⚡ Unified One-Click Launcher**: Integrated `start.bat` and `launcher.py` with automated dependency checking, virtual environment creation, port cleanup (8000 & 5173), and graceful multi-server management.
- **🌌 Interactive Demo Page**: Includes a starry interactive testing page (`test_website.html`) showcasing live widget integration.

---

## 🏗️ Project Architecture

```
Cross-Platform-AI-Chatbot/
├── backend/
│   ├── app/
│   │   ├── api/v1/            # Chat & Upload REST API endpoints
│   │   ├── core/              # Settings & configurations
│   │   ├── db/chroma/         # ChromaDB vector store persistence
│   │   ├── schemas/           # Pydantic request/response models
│   │   ├── services/
│   │   │   ├── ai/            # Gemini, Ollama, and Mock AI clients
│   │   │   └── rag/           # Document processor, chunker, retriever, vector store
│   │   └── main.py            # FastAPI entry point & static file server
│   ├── uploaded_files/        # User-uploaded document storage
│   ├── requirements.txt       # Python backend dependencies
│   ├── .env.example           # Environment template
│   └── .env                   # Local configuration (gitignored)
├── widget/
│   ├── src/                   # React components, Tailwind styling, icons
│   ├── package.json           # Node.js dependencies & build scripts
│   ├── vite.config.js         # Vite single-bundle configuration
│   └── dist/                  # Compiled production widget (chat-widget.js)
├── launcher.py                # Cross-platform background server orchestrator
├── start.bat                  # One-click Windows launch script
├── stop.bat                   # Port release & cleanup utility
└── test_website.html          # Demo website testing live widget injection
```

---

## 🚀 Quick Start (One-Click)

On **Windows**, you can start both the backend and frontend with a single click:

```cmd
start.bat
```

The script will automatically:
1. Verify Python 3.10+ and Node.js.
2. Initialize the Python virtual environment (`backend/venv`).
3. Install backend dependencies from `requirements.txt`.
4. Install frontend npm packages and build the production bundle (`widget/dist/chat-widget.js`).
5. Launch the FastAPI server on `http://localhost:8000` and open the demo site at `http://localhost:8000/test`.

To stop all servers and free ports 8000 and 5173:
```cmd
stop.bat
```

---

## 🛠️ Manual Setup

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Run FastAPI server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Widget Setup

```bash
cd widget

# Install npm packages
npm install

# Start development server
npm run dev

# Or build the embeddable standalone bundle
npm run build
```

---

## ⚙️ Configuration (`backend/.env`)

Copy `.env.example` to `.env` in the `backend/` folder and configure your preferred AI provider:

```ini
# AI Provider options: mock, ollama, gemini
AI_PROVIDER=ollama

# Ollama settings (used when AI_PROVIDER=ollama)
OLLAMA_MODEL=llama3.2
OLLAMA_BASE_URL=http://localhost:11434

# Gemini settings (used when AI_PROVIDER=gemini)
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🔌 Embedding the Widget into Any Website

Add the following snippet before the closing `</body>` tag on any webpage:

```html
<script type="module">
  const host = 'http://localhost:8000'; // or your deployed backend URL
  const script = document.createElement('script');
  script.type = 'module';
  script.src = `${host}/chat-widget.js`;
  document.body.appendChild(script);
</script>
```

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/chat` | Send a user message and receive AI / RAG response |
| `POST` | `/api/v1/upload` | Upload a document for parsing, chunking, and indexing |
| `GET` | `/api/v1/upload` | List all indexed documents |
| `DELETE` | `/api/v1/upload/{doc_id}` | Delete a document from the vector store |
| `GET` | `/chat-widget.js` | Serves the standalone bundled widget script |
| `GET` | `/test` | Serves the demo test website |
| `GET` | `/docs` | Interactive Swagger API documentation |

---

## 📄 License

This project is licensed under the MIT License.
