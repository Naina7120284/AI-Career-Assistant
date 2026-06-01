from app.services.embedding import create_embedding
from app.services.llm import get_chat_response
from app.db.supabase_client import supabase
from app.config import config

async def find_similar_resume_chunks(query: str, user_id: str):
    """Find relevant resume chunks for a query"""
    
    # Create embedding for the query
    query_embedding = create_embedding(query)
    
    # Search vector database
    result = supabase.rpc(
        "match_resumes",
        {
            "query_embedding": query_embedding,
            "match_threshold": config.SIMILARITY_THRESHOLD,
            "match_count": config.TOP_K_RESULTS
        }
    ).execute()
    
    return result.data

async def get_career_advice(query: str, user_id: str, conversation_history: list = None):
    """Get career advice with RAG from user's resume"""
    
    # Find relevant resume chunks
    relevant_chunks = await find_similar_resume_chunks(query, user_id)
    
    # Combine context
    context = "\n---\n".join([chunk["content"] for chunk in relevant_chunks]) if relevant_chunks else None
    
    # Get LLM response
    response = get_chat_response(query, context, conversation_history)
    
    # Store chat in database
    supabase.table("chats").insert([
        {"user_id": user_id, "session_id": "default", "role": "user", "content": query},
        {"user_id": user_id, "session_id": "default", "role": "assistant", "content": response}
    ]).execute()
    
    return {
        "response": response,
        "sources": [{"content": chunk["content"][:200]} for chunk in relevant_chunks] if relevant_chunks else []
    }