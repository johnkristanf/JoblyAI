# JoblyAI 🚀

> Your Intelligent Assistant for the Modern Job Search.

JoblyAI is a full-stack, AI-powered platform designed to revolutionize the way candidates find, apply for, and prepare for jobs. By leveraging advanced Large Language Models (LLMs) and asynchronous task processing, JoblyAI offers personalized resume tailoring, intelligent job matching, and comprehensive interview preparation.

---

## 🌟 Key Features

### For the Users
- **AI-Powered Job Search**: Natural language querying to find jobs on LinkedIn and JSearch via RapidAPI, supported by LangChain agents.
- **Smart Resume Matching**: Upload your resume (PDF) and let the AI instantly analyze and match your skills against job listings.
- **Automated Resume Tailoring**: Automatically generate custom-tailored PDF resumes optimized for specific job descriptions. Uses Server-Sent Events (SSE) for real-time generation feedback.
- **Employer Insights**: Instantly gather insights about potential employers using intelligent web scraping and LLM analysis.
- **Interview Preparation**: Generate custom interview processes and potential questions based on the target job and employer.

### Under the Hood (For Developers & Recruiters)
- **Asynchronous Processing**: Heavy tasks like resume parsing and LLM matching are offloaded to **Celery** workers with a **Redis** message broker.
- **Real-time Streaming**: Utilizes **Server-Sent Events (SSE)** to stream LLM responses back to the client during resume tailoring.
- **Scalable Storage**: Secure document handling using **AWS S3** with presigned URLs for temporary, safe access to PDFs.
- **Caching Layer**: Employs **Redis** to cache employer insights and external API responses, significantly reducing latency and API costs.
- **Agentic AI**: Built with **LangChain** and **LangGraph** to create autonomous agents capable of utilizing tools (like job search APIs) and maintaining user-specific memory.

---

## 💻 Tech Stack

### Frontend (Client)
- **Framework**: React Router v7 (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Radix UI Primitives, `clsx`, `tailwind-merge`
- **State Management**: Zustand, React Query (@tanstack/react-query)
- **Forms & Validation**: React Hook Form
- **PDF Rendering**: `react-pdf`

### Backend (Server)
- **Framework**: FastAPI (Python 3)
- **Database**: PostgreSQL with SQLAlchemy (Asyncpg) & Alembic (Migrations)
- **Message Broker & Cache**: Redis
- **Background Tasks**: Celery
- **AI / LLMs**: OpenAI GPT Models, LangChain, LangGraph
- **Cloud & Storage**: AWS S3 (Boto3)
- **PDF Processing**: PyMuPDF (`fitz`), Playwright (for dynamic PDF generation/scraping), Firecrawl

---

## 🏗 Architecture Overview

1. **Client-Server Communication**: The React frontend communicates with the FastAPI backend via RESTful APIs and SSE streams.
2. **Auth**: JWT-based authentication securing endpoints and user-specific document access.
3. **Task Queueing**: When a user requests job matching, the FastAPI server enqueues a Celery task and immediately returns a `task_id`. The client polls or listens for completion.
4. **Data Persistence**: Asynchronous SQLAlchemy handles robust interactions with the PostgreSQL database, storing user preferences, saved jobs, and resume metadata.
5. **AI Tooling**: LangChain agents hold conversational memory in `MemorySaver` and utilize external tools (JSearch, LinkedIn APIs) to fetch real-time market data.

---

## 📁 Project Structure

```text
JoblyAI/
├── client/                     # Frontend Application
│   ├── app/                    # React Router Application Logic
│   ├── components/             # Reusable UI Components
│   ├── package.json            # Node Dependencies
│   └── vite.config.ts          # Vite Configuration
│
└── server/                     # Backend Application
    ├── alembic/                # Database Migrations
    ├── src/                    # Application Source Code
    │   ├── auth/               # Authentication Logic
    │   ├── celery/             # Background Tasks & Workers
    │   ├── job/                # Job Search, Matching & Saving API
    │   ├── resume/             # Resume Upload, Tailoring & S3 Integration
    │   └── utils.py            # Shared Utilities
    ├── requirements.txt        # Python Dependencies
    └── docker-compose.yml      # Infrastructure (Postgres, Redis, Celery)
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (3.11+)
- [Docker & Docker Compose](https://www.docker.com/) (for Redis and Postgres)
- AWS Account (S3 Buckets configured)
- OpenAI API Key

### Local Setup

**1. Clone the repository**
```bash
git clone https://github.com/johnkristanf/JoblyAI.git
cd JoblyAI
```

**2. Start Infrastructure (Database & Redis)**
```bash
cd server
docker-compose up -d
```

**3. Setup the Backend Server**
```bash
cd server

# Create virtual environment and install dependencies via uv
uv sync

# Activate the virtual environment
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Run migrations
alembic upgrade head

# Start the FastAPI server
uv run uvicorn src.main:app --reload --host 0.0.0.0
```

**4. Start the Celery Worker**
*(In a new terminal window within the `/server` directory)*
```bash
cd server
uv run celery -A src.celery worker --loglevel=info
```

**5. Setup the Frontend Client**
*(In a new terminal window within the `/client` directory)*
```bash
npm install
npm run dev
```
*The client will be available at `http://localhost:5173`.*

---

## 🔮 Future Enhancements
- [ ] End-to-End Testing pipeline with Playwright or Cypress.
- [ ] Expanded AI mock-interview voice interactions (Deepgram & ElevenLabs).

---
*Crafted with precision for the modern candidate.*
