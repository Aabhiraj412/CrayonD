# memory.py

import json
import traceback
from langchain.memory import ConversationBufferMemory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, messages_from_dict, messages_to_dict
from supabase import create_client
import os
from config import SUPABASE_URL, SUPABASE_KEY

# Global fallback memory as a safety net
LOCAL_MESSAGES = []

class FallbackChatMessageHistory(BaseChatMessageHistory):
    """A simple in-memory message store that works without external dependencies"""
    
    def __init__(self):
        self.messages = []
    
    def add_message(self, message: BaseMessage) -> None:
        print(f"📝 Adding to local memory: {message.type} - {message.content[:50]}...")
        self.messages.append(message)
        # Also add to global backup
        global LOCAL_MESSAGES
        LOCAL_MESSAGES.append(message)
    
    def clear(self) -> None:
        self.messages = []
        global LOCAL_MESSAGES
        LOCAL_MESSAGES = []

class SupabaseChatMessageHistory(BaseChatMessageHistory):
    def __init__(self, table_name: str, client):
        self.table_name = table_name
        self.session_id = "temp_session"  # You can customize per-user if needed
        self.client = client
        
        # Local backup of messages in case Supabase fails
        self.local_messages = []
        
        # Ensure the table exists
        self._ensure_table_exists()

    def _ensure_table_exists(self):
        """Make sure the table exists by attempting a query"""
        try:
            self.client.table(self.table_name).select("session_id").limit(1).execute()
            print(f"✅ Connected to {self.table_name} table in Supabase")
        except Exception as e:
            print(f"⚠️ Error checking table: {str(e)}")
            print("Please ensure the table exists with columns: session_id, messages")

    @property
    def messages(self) -> list[BaseMessage]:
        return self.get_messages()

    def get_messages(self) -> list[BaseMessage]:
        print(f"📤 Fetching messages from Supabase...")
        try:
            response = self.client.table(self.table_name).select("messages").eq("session_id", self.session_id).execute()
            if response.data and len(response.data) > 0 and response.data[0].get("messages"):
                messages_json = response.data[0]["messages"]
                print(f"🧠 Found messages JSON: {messages_json[:100]}...")
                messages = messages_from_dict(json.loads(messages_json))
                print(f"🧠 Loaded {len(messages)} messages")
                # Update local backup
                self.local_messages = messages.copy()
                return messages
            print("⚠️ No previous messages found")
            return self.local_messages
        except Exception as e:
            print(f"❌ Error getting messages: {str(e)}")
            print(traceback.format_exc())
            # Return our local backup if Supabase fails
            print(f"📋 Returning {len(self.local_messages)} messages from local backup")
            return self.local_messages

    def add_message(self, message: BaseMessage) -> None:
        print(f"📥 Adding message: {message.type} - {message.content[:50]}...")
        try:
            # Check for duplicates before adding
            current_messages = self.get_messages()
            # Simple duplicate check - compare content
            if current_messages and any(
                msg.type == message.type and msg.content == message.content 
                for msg in current_messages[-2:] # Only check last few messages
            ):
                print(f"⚠️ Skipping duplicate message: {message.type}")
                return

            # Add to our local backup
            self.local_messages.append(message)
            
            # Add to global backup with duplicate check
            global LOCAL_MESSAGES
            if not any(msg.type == message.type and msg.content == message.content 
                      for msg in LOCAL_MESSAGES[-2:] if LOCAL_MESSAGES):
                LOCAL_MESSAGES.append(message)
            
            # Use local messages to ensure we have the accurate state
            messages = self.local_messages.copy()
            messages_dict = messages_to_dict(messages)
            messages_json = json.dumps(messages_dict)

            print(f"📝 Storing {len(messages)} messages")

            existing = self.client.table(self.table_name).select("id").eq("session_id", self.session_id).execute()
            if existing.data and len(existing.data) > 0:
                print(f"🔄 Updating existing row: {existing.data[0].get('id')}")
                self.client.table(self.table_name).update({"messages": messages_json}).eq("session_id", self.session_id).execute()
            else:
                print("➕ Inserting new row")
                self.client.table(self.table_name).insert({"session_id": self.session_id, "messages": messages_json}).execute()
            print("✅ Message added to Supabase")
        except Exception as e:
            print(f"❌ Error adding message: {str(e)}")
            print(traceback.format_exc())
            # Already added to local backup, so no recovery needed

    def clear(self) -> None:
        try:
            self.client.table(self.table_name).delete().eq("session_id", self.session_id).execute()
            print("🧹 Memory cleared in Supabase")
        except Exception as e:
            print(f"❌ Error clearing memory: {str(e)}")
            print(traceback.format_exc())
        # Clear local backup too
        self.local_messages = []
        global LOCAL_MESSAGES
        LOCAL_MESSAGES = []

def get_memory():
    try:
        print(f"🔌 Connecting to Supabase at {SUPABASE_URL[:20]}...")
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
    except Exception as e:
        print(f"❌ Error setting up Supabase memory: {str(e)}")
        print(traceback.format_exc())
        # Return a fallback memory that works locally
        fallback = FallbackChatMessageHistory()
        return ConversationBufferMemory(memory_key="chat_history", return_messages=True, chat_memory=fallback)

# Helper to manually add messages to memory
def add_messages_manually(human_message, ai_response, memory_obj):
    """Manually add a message pair to memory in case the agent doesn't do it"""
    try:
        # Check if these messages already exist in memory
        current_messages = memory_obj.chat_memory.get_messages()
        
        # Check for human message duplicates
        if not any(msg.type == "human" and msg.content == human_message for msg in current_messages[-4:] if current_messages):
            memory_obj.chat_memory.add_message(HumanMessage(content=human_message))
            print("✅ Manually added human message")
        else:
            print("⚠️ Skipping duplicate human message")
            
        # Check for AI message duplicates
        if not any(msg.type == "ai" and msg.content == ai_response for msg in current_messages[-4:] if current_messages):
            memory_obj.chat_memory.add_message(AIMessage(content=ai_response))
            print("✅ Manually added AI message")
        else:
            print("⚠️ Skipping duplicate AI message")
            
        return True
    except Exception as e:
        print(f"❌ Error manually adding messages: {str(e)}")
        print(traceback.format_exc())
        return False

# Function to clean memory of duplicates
def clean_duplicates_in_memory(memory_obj):
    """Remove duplicate messages from memory"""
    try:
        messages = memory_obj.chat_memory.get_messages()
        if not messages:
            return False
            
        # Track seen messages to detect duplicates
        seen_messages = set()
        unique_messages = []
        
        for msg in messages:
            # Create a tuple of (type, content) as a unique identifier
            message_id = (msg.type, msg.content)
            if message_id not in seen_messages:
                seen_messages.add(message_id)
                unique_messages.append(msg)
        
        # If we removed duplicates, update the memory
        if len(unique_messages) < len(messages):
            print(f"🧹 Cleaned {len(messages) - len(unique_messages)} duplicate messages")
            
            # If using Supabase, we need special handling
            if hasattr(memory_obj.chat_memory, "local_messages"):
                memory_obj.chat_memory.local_messages = unique_messages
                
                # Re-save to Supabase
                try:
                    messages_dict = messages_to_dict(unique_messages)
                    messages_json = json.dumps(messages_dict)
                    
                    memory_obj.chat_memory.client.table(
                        memory_obj.chat_memory.table_name
                    ).update(
                        {"messages": messages_json}
                    ).eq(
                        "session_id", memory_obj.chat_memory.session_id
                    ).execute()
                    print("✅ Updated Supabase with cleaned messages")
                except Exception as e:
                    print(f"❌ Error updating Supabase: {str(e)}")
            
            # Update global backup
            global LOCAL_MESSAGES
            LOCAL_MESSAGES = unique_messages
            
            return True
        return False
    except Exception as e:
        print(f"❌ Error cleaning duplicates: {str(e)}")
        return False
