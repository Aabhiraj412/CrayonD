# main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage
import uvicorn

from agent import agent_executor
from memory import get_memory

# 🧠 Shared memory
memory = get_memory()

# 🚀 FastAPI setup
app = FastAPI()

# 🌐 CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 📦 Request schema
class ChatRequest(BaseModel):
    query: str

# 🏠 Root route
@app.get("/")
def read_root():
    return {"message": "🔍 Competitive Intelligence Chatbot is ready!"}

# 💬 Chat endpoint
@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    query = request.query
    print(f"🧠 You: {query}")
    try:
        result = await agent_executor.ainvoke({
            "input": query,
            "chat_history": memory.chat_memory.get_messages()
        })

        memory.chat_memory.add_message(HumanMessage(content=query))
        memory.chat_memory.add_message(AIMessage(content=result["output"]))

        print(f"🤖 Advisor: {result['output']}")
        return {"response": result["output"]}
    except Exception as e:
        print(f"❌ Error: {e}")
        return {"error": str(e)}

# 📂 Get memory endpoint
@app.get("/memory")
def get_memory_messages():
    print("📤 Fetching messages...")
    try:
        messages = memory.chat_memory.get_messages()
        return {"messages": [msg.content for msg in messages]}
    except Exception as e:
        return {"error": str(e)}
    
@app.post("/clear-memory")
def clear_memory():
    memory.clear()
    return {"status": "Memory cleared"}
# 🚀 Run server
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
