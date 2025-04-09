"""Utility functions for the application"""

def get_last_user_question(messages, current_query=""):
    """Extract the last user question from chat history, excluding current query."""
    if not messages:
        return None
    
    # Get all human messages, excluding current query
    human_messages = [msg.content for msg in messages if msg.type == "human" and msg.content != current_query]
    
    # Return the most recent one
    if human_messages:
        return human_messages[-1]
    return None

def get_conversation_summary(messages, max_exchanges=3):
    """Create a readable summary of recent conversation history."""
    if not messages:
        return "No previous conversation history."
    
    # Take the last N exchanges (2 messages per exchange)
    recent_messages = messages[-max_exchanges*2:]
    
    summary = []
    for i, msg in enumerate(recent_messages):
        prefix = "User asked: " if msg.type == "human" else "AI answered: "
        content = msg.content
        
        # Truncate long messages
        if len(content) > 100:
            content = content[:100] + "..."
            
        summary.append(f"{prefix}{content}")
    
    return "\n".join(summary)
