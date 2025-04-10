# memory.py

import json
from langchain.memory import ConversationBufferMemory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.messages import BaseMessage, messages_from_dict, messages_to_dict
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY

class SupabaseChatMessageHistory(BaseChatMessageHistory):
    def __init__(self, table_name: str, client):
        self.table_name = table_name
        self.session_id = "temp_session"
        self.client = client

    @property
    def messages(self) -> list[BaseMessage]:
        return self.get_messages()

    def get_messages(self) -> list[BaseMessage]:
        print(f"📤 Fetching messages from Supabase...")
        response = self.client.table(self.table_name).select("messages").eq("session_id", self.session_id).execute()
        if response.data and len(response.data) > 0:
            messages_json = response.data[0]["messages"]
            print("🧠 Loaded messages:", messages_json)
            return messages_from_dict(json.loads(messages_json))
        print("⚠️ No previous messages found")
        return []

    def add_message(self, message: BaseMessage) -> None:
        print("📥 add_message called with:", message)
        messages = self.get_messages()
        messages.append(message)
        messages_dict = messages_to_dict(messages)
        messages_json = json.dumps(messages_dict)

        print("📝 Storing messages:", messages_json)

        existing = self.client.table(self.table_name).select("id").eq("session_id", self.session_id).execute()
        if existing.data:
            print("🔄 Updating existing row")
            self.client.table(self.table_name).update({"messages": messages_json}).eq("session_id", self.session_id).execute()
        else:
            print("➕ Inserting new row")
            self.client.table(self.table_name).insert({"session_id": self.session_id, "messages": messages_json}).execute()
        print("✅ Message added to Supabase")

    def clear(self) -> None:
        self.client.table(self.table_name).delete().eq("session_id", self.session_id).execute()
        print("🧹 Memory cleared in Supabase")

def get_memory():
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    message_history = SupabaseChatMessageHistory(
        table_name="chat_memory",
        client=supabase
    )

    memory = ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True,
        chat_memory=message_history
    )
    return memory