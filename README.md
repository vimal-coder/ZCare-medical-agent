# ZCare Medical Report Analyzer API

ZCare Medical Report Analyzer is a web-based application and API that processes medical reports (like PDFs) and extracts valuable health insights using Vision LLMs and Agentic workflows.

## Features

- **Upload & Analyze**: Upload medical reports to automatically extract and summarize key health information.
- **AI Agent Workflow**: Utilizes LangGraph and LangChain to create an intelligent medical analysis agent.
- **FastAPI Backend**: Robust and fast RESTful API built with FastAPI.
- **Interactive UI**: A simple, easy-to-use frontend built with vanilla HTML, CSS, and JavaScript, served directly from the backend.
- **Groq Integration**: Leverages fast inference via Langchain Groq.
- **PDF Processing**: Extracts text and information from PDFs using PyMuPDF.

## Tech Stack

- **Backend**: Python 3.12+, FastAPI, Uvicorn
- **AI / LLM**: LangChain, LangGraph, Langchain Groq
- **Document Processing**: PyMuPDF (`pymupdf`)
- **Frontend**: HTML, CSS, JavaScript
- **Package Management**: `uv` or `pip`

## Project Structure

```
├── agent/               # LangGraph state, nodes, edges, and prompts
├── api/                 # FastAPI routes and endpoints
├── core/                # Core configuration and utilities
├── frontend/            # Static HTML, CSS, and JS files for the UI
├── models/              # Pydantic models for request/response schemas
├── services/            # Business logic and external service integrations
├── main.py              # Application entry point
├── requirements.txt     # Python dependencies (pip)
├── pyproject.toml       # Project metadata and dependencies (uv)
└── .env                 # Environment variables configuration
```

## Setup & Installation

### 1. Clone the repository

Ensure you are in the project directory.

### 2. Set up the Environment

Create a `.env` file in the root directory and add the necessary API keys (e.g., Groq):

```env
GROQ_API_KEY=your_groq_api_key_here
```

*(Check `config.ini` or `.env.example` if available for more configuration options).*

### 3. Install Dependencies

You can use `uv` (recommended) or `pip` to install dependencies.

**Using `uv`:**
```bash
uv sync
```
*Or, if you don't have uv installed, install it via pip first (`pip install uv`).*

**Using `pip`:**
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Run the Application

Start the FastAPI development server:

```bash
# If using uv
uv run main.py

# If using pip/venv
python main.py
```

Alternatively, you can run uvicorn directly:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Usage

Once the server is running:

- **Frontend Interface**: Open your browser and navigate to `http://localhost:8000/` to interact with the ZCare application.
- **API Documentation**: Go to `http://localhost:8000/docs` to view the interactive Swagger UI and explore the available API endpoints.
- **ReDoc**: Go to `http://localhost:8000/redoc` for alternative API documentation.
