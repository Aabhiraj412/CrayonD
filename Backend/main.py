# main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage
import uvicorn

from agent import get_response, memory
from memory import add_messages_manually, LOCAL_MESSAGES, clean_duplicates_in_memory
from utils import get_last_user_question

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
        # Clean any duplicates in memory before processing
        clean_duplicates_in_memory(memory)
        
        # Special handling for memory-related questions
        if any(keyword in query.lower() for keyword in ["last question", "previous", "earlier", "what did i ask", "what was my"]):
            print("🔍 Memory-related question detected")
            
            # Get messages from memory
            messages = memory.chat_memory.get_messages()
            
            # For the specific "what was my last question" query, we can directly answer
            if query.lower().strip() in ["what was my last question", "what was my last question?", "what did i ask last"]:
                last_question = get_last_user_question(messages, query)
                
                if last_question:
                    print(f"📋 Found last question: {last_question}")
                    result = f"Your last question was: \"{last_question}\""
                    
                    # Add to memory
                    add_messages_manually(query, result, memory)
                    return {"response": result}
        
        # Use the get_response function for normal processing
        result = get_response(query)
        print(f"🤖 Advisor: {result}")
        
        # ALWAYS manually add messages to ensure they're saved
        add_messages_manually(query, result, memory)
        
        # Check memory status
        current_messages = memory.chat_memory.get_messages()
        print(f"💾 Memory status after response: {len(current_messages)} messages")
        
        return {"response": result}
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        print(traceback.format_exc())
        return {"error": str(e)}

# 📂 Get memory endpoint
@app.get("/memory")
def get_memory_messages():
    print("📤 Fetching messages...")
    try:
        # Clean any duplicates before returning messages
        clean_duplicates_in_memory(memory)
        
        # Try to get messages from the agent's memory
        messages = memory.chat_memory.get_messages()
        
        # If no messages, use our fallback global storage
        if not messages and LOCAL_MESSAGES:
            print("📋 Using LOCAL_MESSAGES fallback")
            messages = LOCAL_MESSAGES
        
        # Format messages as a simple array of strings
        # This will alternate between human and AI messages
        formatted_messages = []
        for msg in messages:
            if hasattr(msg, "content") and msg.content:
                formatted_messages.append(msg.content)
        
        print(f"📤 Returning {len(formatted_messages)} messages")
        return {"messages": formatted_messages}
    except Exception as e:
        print(f"❌ Memory fetch error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        
        # Last resort fallback: try LOCAL_MESSAGES
        try:
            formatted_messages = []
            for msg in LOCAL_MESSAGES:
                if hasattr(msg, "content") and msg.content:
                    formatted_messages.append(msg.content)
            return {"messages": formatted_messages}
        except:
            return {"error": str(e), "messages": []}

@app.post("/clear-memory")
def clear_memory():
    try:
        memory.clear()
        global LOCAL_MESSAGES
        LOCAL_MESSAGES = []
        return {"status": "Memory cleared successfully"}
    except Exception as e:
        print(f"❌ Memory clear error: {str(e)}")
        return {"error": str(e)}

# Add endpoint to debug memory
@app.get("/debug-memory")
def debug_memory():
    """Return detailed memory information for debugging"""
    try:
        messages = memory.chat_memory.get_messages()
        debug_info = []
        
        for i, msg in enumerate(messages):
            debug_info.append({
                "index": i,
                "type": msg.type,
                "content_preview": msg.content[:50] + "..." if len(msg.content) > 50 else msg.content
            })
            
        return {
            "count": len(messages),
            "messages": debug_info,
            "local_backup_count": len(LOCAL_MESSAGES) if LOCAL_MESSAGES else 0
        }
    except Exception as e:
        return {"error": str(e)}

# 🚀 Run server
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
