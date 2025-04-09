# 🤖 CrayonD: Competitive Intelligence Advisor Chatbot

An AI-powered Competitive Intelligence (CI) Advisor that provides real-time competitor analysis, strategic insights, and market news summaries. Built with **LangChain**, **FastAPI**, **Supabase VectorDB**, and a modern **React** frontend.

## 📱 Live Demo

- **Web App**: [https://crayon-d-red.vercel.app/](https://crayon-d-red.vercel.app/)
- **Mobile App**: [Download on Expo](https://expo.dev/accounts/abhiraj_dixit/projects/crayon-d/builds/54ea0819-edd1-493d-91c6-7eb407fd9903)

## 🚀 Features

- 🔍 **Advanced Competitor Analysis** – Compare strategies, market share, positioning and trends
- 📊 **Interactive Visualizations** – View comparative data with dynamic charts
- 📰 **Market News Aggregation** – Retrieve, filter and summarize latest market developments
- 📈 **Trend Detection** – Identify emerging patterns across competitors
- 🧠 **Enhanced Memory System** – Context-aware persistent memory with Supabase + pgvector
- 🔄 **Conversation History** – Review and continue previous analysis sessions
- 🧩 **Modular Tool Architecture** – Customizable LangChain agents & tools
- ⚡ **High Performance Backend** – Blazing-fast FastAPI endpoints with async support
- 🎨 **Responsive UI** – Sleek interface optimized for desktop and mobile
- 🔒 **Secure Authentication** – Protected routes and data encryption

## 🗂️ Project Structure

```
/CrayonD/
├── App/
│   ├── assets/                # Main app entrypoint
│   ├── src/                   # React Native components
│   │   └── app/
│   │       ├── Components
│   │       │   ├── assets/
│   │       │   └──Chat.tsx
│   │       └── index.tsx
│   └── app.json              # Expo configuration
├── backend/
│   ├── main.py               # FastAPI app entrypoint
│   ├── agent.py              # LangChain agent setup
│   ├── memory.py             # Supabase memory integration
│   ├── .env                  # API keys and secrets
│   └── tools/
│       ├── news_tool.py      # Market news aggregator
│       └── market_tool.py    # Competitor analysis tool
├── frontend/
│   ├── public/               # Static assets
│   └── src/
│       ├── components/       # React components
│       │   ├── Chat/         # Chat interface components
│       │   └── Home/         # Landing Page
│       ├── styles/           # Global styles and themes
│       ├── App.jsx           # Main app
│       └── index.js          # React entry
└── README.md
```

## 🧠 Memory System

- Uses Supabase with pgvector for persistent memory
- Implements hybrid memory approach:
  - ConversationBufferMemory for recent context
  - VectorStoreRetrieverMemory for long-term knowledge
- Automatic summarization of historical context
- Cross-session memory persistence

## 🔧 Setup Instructions

### 1. Clone the Repo

```bash
git clone https://github.com/Aabhiraj412/CrayonD.git
cd CrayonD
```

### 2. Backend Setup

📁 Navigate to backend:
```bash
cd backend
```

📦 Install dependencies:
```bash
pip install -r requirements.txt
```

🔑 Create `.env`:
```
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_serpapi_or_gemini_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
```

▶️ Run FastAPI:
```bash
uvicorn main:app --reload
```

### 3. Frontend Setup

📁 Navigate to frontend:
```bash
cd ../frontend
```

📦 Install dependencies:
```bash
npm install # or bun install if you're using bun
```

▶️ Start React App:
```bash
npm run dev # or bun dev
```

### 4. Mobile App Setup

📁 Navigate to App:
```bash=
cd ../App
```

📦 Install dependencies:
```bash
npm install
```

▶️ Start Expo:
```bash
expo start
```

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/chat`  | Send a prompt to the chatbot |
| GET    | `/memory` | Retrieve conversation history |
| POST   | `/clear-memory` | Clear memory |

## 🧪 Example Usage

```
🧠 You: Compare Microsoft's cloud strategy with Amazon AWS
🤖 Bot: Microsoft Azure focuses on enterprise integration and hybrid solutions, 
       while AWS leads in market share (33% vs Azure's 22%) and offers broader 
       service options. Azure leverages existing Microsoft relationships, while 
       AWS emphasizes scalability and first-mover advantage...
```

## 📌 Tech Stack

- **LangChain** - For AI agent construction and chain-of-thought processing
- **FastAPI** - High-performance Python web framework
- **React + Vite** - Modern frontend with efficient bundling
- **Supabase (Vector Store)** - For persistent memory and embedding storage
- **Tailwind CSS** - Utility-first CSS framework for styling
- **OpenAI / Gemini / Google Search API** - For AI and search capabilities

## ⚙️ Requirements

### Backend
- Python 3.9+
- FastAPI 0.95+
- LangChain 0.0.235+
- Supabase Python Client 0.8+
- pgvector extension for PostgreSQL
- pytest for testing

### Frontend
- Node.js 16+
- React 18+
- Vite 4+
- Tailwind CSS 3+
- TypeScript 5+ (optional)
- Vitest for testing

### Mobile
- Node.js 16+
- React Native 0.70+
- Expo SDK 46+
- React Navigation 6+
- TypeScript 5+ (optional)

## 🚀 Deployment

### Backend
Currently deployed at:
- [Render](https://render.com)

Other deployment options:
- Railway
- DigitalOcean App Platform
- AWS Lambda with API Gateway
- Google Cloud Run

### Frontend
Currently deployed at:
- Web: [https://crayon-d-red.vercel.app/](https://crayon-d-red.vercel.app/) (Vercel)
- Mobile: [Expo](https://expo.dev/accounts/abhiraj_dixit/projects/crayon-d/builds/54ea0819-edd1-493d-91c6-7eb407fd9903)

Other deployment options:
- Netlify
- GitHub Pages
- AWS Amplify

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built by Abhiraj
