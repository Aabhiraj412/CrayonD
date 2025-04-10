# agent.py

from dotenv import load_dotenv
load_dotenv()

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import initialize_agent, AgentType
from langchain.tools import tool
import google.generativeai as genai
import os

from tools.news_tool import get_company_news
from tools.market_tool import compare_competitors
from memory import get_memory  # ✅ this gets Supabase-based memory

# 🔐 Configure Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
# 🤖 LLM Setup
llm = ChatGoogleGenerativeAI(
    model="models/gemini-1.5-flash-latest",
    temperature=0.3,
)
# 🧠 Long-Term Memory from Supabase
memory = get_memory()

# 🧰 Tools
tools = [get_company_news, compare_competitors]

# 🤖 Agent with memory
agent_executor = initialize_agent(
    tools=tools,
    llm=llm,
    agent=AgentType.CONVERSATIONAL_REACT_DESCRIPTION,
    memory=memory,
    verbose=True,
    handle_parsing_errors=True,
)