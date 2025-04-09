from dotenv import load_dotenv
load_dotenv()

import os
import google.generativeai as genai
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import initialize_agent, AgentType
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.schema import SystemMessage, HumanMessage

from tools.news_tool import get_company_news
from tools.market_tool import compare_competitors
from memory import get_memory  # ✅ Supabase-backed memory
from utils import get_last_user_question, get_conversation_summary

# 🔐 Configure Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# 🤖 LLM Setup
llm = ChatGoogleGenerativeAI(
    model="models/gemini-1.5-flash-latest",
    temperature=0.3,
)

# 🧰 Tools - Wrap in try/except to prevent tool errors from breaking the agent
tools = []
try:
    # Validate tools
    if callable(get_company_news):
        tools.append(get_company_news)
        print("✅ Added news tool")
    
    if callable(compare_competitors):
        tools.append(compare_competitors)
        print("✅ Added market comparison tool")
        
    if not tools:
        print("⚠️ No tools were loaded successfully!")
except Exception as e:
    print(f"❌ Error loading tools: {str(e)}")
    import traceback
    print(traceback.format_exc())

# 🧠 Long-Term Memory
memory = get_memory()

# Create global agent executor
agent_executor = None

def initialize_agent_with_memory():
    global agent_executor
    
    try:
        # Get chat history from memory
        chat_history = memory.chat_memory.get_messages()
        
        # 🧹 Filter invalid/empty messages
        chat_history = [msg for msg in chat_history if hasattr(msg, 'content') and msg.content and msg.content.strip()]
        
        # ⚡ Smart Prompt Building
        if chat_history and len(chat_history) > 0:
            print(f"✅ Found {len(chat_history)} valid chat history items. Initializing agent with memory.")
            
            # Create a summarized history string
            history_summary = get_conversation_summary(chat_history)
            
            # Very explicit system prompt about using chat history
            system_prompt = f"""You are a Competitive Intelligence Advisor who maintains conversation context.

IMPORTANT! CHAT HISTORY SUMMARY:
{history_summary}

When the user asks about previous questions, previous conversations, or "what was my last question",
ALWAYS reference the chat history above to provide context-aware responses.
You MUST acknowledge and recall previous questions and your responses.

If asked "what was my last question?", respond with the last question the user asked based on the chat history.

Help the user analyze competitors, market trends, and company news with this contextual awareness.
"""
            
            prompt = ChatPromptTemplate.from_messages([
                SystemMessage(content=system_prompt),
                MessagesPlaceholder(variable_name="chat_history"),
                ("human", "{input}")
            ])
            
        else:
            print("⚠️ No usable history found. Initializing agent with simpler prompt.")
            
            # Simpler prompt template for first interaction
            prompt = ChatPromptTemplate.from_messages([
                SystemMessage(content="You are a Competitive Intelligence Advisor. Help the user analyze competitors, market trends, and company news."),
                ("human", "{input}")
            ])
        
        # If no tools loaded, provide a basic response capability
        if not tools:
            print("⚠️ No tools available. Creating a simple chat agent without tools.")
        
        # Create the agent
        agent = initialize_agent(
            tools=tools,
            llm=llm,
            agent=AgentType.OPENAI_FUNCTIONS,
            memory=memory,
            prompt=prompt,
            verbose=True,
            handle_parsing_errors=True,
        )
        print("✅ Agent initialized successfully")
        return agent
    except Exception as e:
        print(f"❌ Error initializing agent: {str(e)}")
        import traceback
        print(traceback.format_exc())
        
        # Create a fallback agent that at least returns something
        try:
            print("⚠️ Creating fallback agent")
            simple_prompt = ChatPromptTemplate.from_messages([
                SystemMessage(content="You are a Competitive Intelligence Advisor. Help the user analyze competitors, market trends, and company news."),
                ("human", "{input}")
            ])
            return initialize_agent(
                tools=[],  # No tools in fallback
                llm=llm,
                agent=AgentType.OPENAI_FUNCTIONS,
                memory=memory,
                prompt=simple_prompt,
                verbose=True,
                handle_parsing_errors=True,
            )
        except:
            print("❌ Even fallback agent creation failed!")
            return None  # We'll handle this in get_response

# Initialize the agent when module is loaded
try:
    agent_executor = initialize_agent_with_memory()
    print("✅ Agent executor ready")
except Exception as e:
    print(f"❌ Failed to initialize agent: {str(e)}")
    agent_executor = None

def get_response(user_input):
    """Safely get a response from the agent executor"""
    global agent_executor, memory
    
    if not user_input or not user_input.strip():
        return "Please provide a valid question or request."
    
    try:
        print(f"🔍 Processing user input: {user_input}")
        
        # ALWAYS reinitialize the agent to get fresh memory on EVERY request
        print("🔄 Reinitializing agent to ensure fresh memory context...")
        agent_executor = initialize_agent_with_memory()
        
        # For memory-related questions, use a special approach
        if any(keyword in user_input.lower() for keyword in ["last question", "previous", "earlier", "what did i ask", "what was my"]):
            print("🧠 Memory-related question detected. Adding special handling...")
            
            # Get the last few messages from memory
            messages = memory.chat_memory.get_messages()
            
            if len(messages) >= 2:  # At least one exchange
                # Find the most recent human message that isn't the current query
                previous_questions = [msg.content for msg in messages if msg.type == "human" and msg.content != user_input]
                
                if previous_questions and len(previous_questions) > 0:
                    last_question = previous_questions[-1]
                    print(f"📋 Found last question: {last_question}")
                    
                    # For direct "what was my last question" queries, just answer directly
                    if user_input.lower().strip() in ["what was my last question", "what was my last question?", "what did i ask last"]:
                        return f"Your last question was: \"{last_question}\""
        
        # Run the agent with the input
        if agent_executor:
            response = agent_executor.run(input=user_input)
        else:
            print("⚠️ Agent executor is None, falling back to direct LLM")
            response = llm.invoke("You are a Competitive Intelligence Advisor. " + user_input)
            return response.content
        
        # Verify memory was updated
        messages = memory.chat_memory.get_messages()
        print(f"📝 Current memory length: {len(messages)}")
        
        # Import and use clean_duplicates function to ensure clean memory
        from memory import clean_duplicates_in_memory
        clean_duplicates_in_memory(memory)
        
        return response
    except Exception as e:
        print(f"❌ Error in agent execution: {str(e)}")
        import traceback
        print(traceback.format_exc())
        
        # Fallback to direct LLM if agent fails
        try:
            print("⚠️ Falling back to direct LLM")
            response = llm.invoke("You are a Competitive Intelligence Advisor. " + user_input)
            return response.content
        except:
            return f"I encountered an error processing your request. Please try again with a different question."
