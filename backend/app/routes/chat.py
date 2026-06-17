from app.db.supabase_client import supabase
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from groq import Groq
import os
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional, List

load_dotenv()

router = APIRouter(prefix="/chat", tags=["chat"])

# Initialize Groq client
client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

class ChatRequest(BaseModel):
    message: str
    user_id: str
    session_id: Optional[str] = None
    conversation_history: Optional[List[dict]] = None

class ChatResponse(BaseModel):
    response: str
    sources: List[dict] = []
    is_safe: bool = True

def get_resume_content(user_id: str) -> str:
    """Extract resume content from database"""
    try:
        from app.db.supabase_client import supabase
        
        # Query all resume chunks for this user
        result = supabase.table("resumes").select("content").eq("user_id", user_id).execute()
        
        if result.data and len(result.data) > 0:
            # Combine all chunks
            full_content = "\n".join([chunk["content"] for chunk in result.data])
            print(f"✅ Loaded {len(result.data)} resume chunks ({len(full_content)} characters)")
            return full_content
        else:
            print(f"⚠️ No resume found for user: {user_id}")
            return ""
            
    except Exception as e:
        print(f"❌ Error fetching resume: {e}")
        return ""

@router.post("/ask")
async def ask_question(request: ChatRequest) -> ChatResponse:
    
    print("🔥 CHAT ROUTE VERSION 2 LOADED 🔥")
    print(f"📝 User question: {request.message}")
    
    # Get resume content from database
    resume_content = get_resume_content(request.user_id)
    
    # Build the system prompt with resume context
    if resume_content:
        system_prompt = f"""
You are an advanced AI Career Assistant and emotionally intelligent AI companion.

Your personality should feel:

* friendly
* supportive
* modern
* human-like
* conversational
* emotionally aware
* intelligent
* encouraging

USER'S RESUME CONTENT:
{resume_content[:3000]}

IMPORTANT BEHAVIOR RULES:

1. Use the resume content above to give personalized career advice.
2. Reference specific skills, technologies, projects, internships, and experiences from the resume.
3. Give practical and actionable career guidance.
4. Suggest realistic job roles matching the user's actual skills.
5. Be emotionally supportive when the user sounds confused, stressed, sad, nervous, or demotivated.
6. Match the user's vibe and message length.
7. For casual messages like "hi", "hello", or "can we talk", respond casually and warmly.
8. Do NOT always behave like a strict corporate career bot.
9. Sound natural and human-like like ChatGPT.
10. Use emojis naturally where appropriate.
11. Keep responses clean, modern, and easy to read.
12. Avoid giant paragraphs.
13. Use bullet points and sections for career-related answers.
14. Keep casual conversations short and engaging.

RESPONSE STYLE:

* Friendly and emotionally intelligent
* Professional but not robotic
* Warm and conversational
* Supportive and motivating
* Smart and adaptive

IMPORTANT:

* Only provide detailed resume analysis when the user asks for it.
* If the user wants emotional support or casual conversation, respond naturally.
* Never make up skills that are not present in the resume.

EXAMPLES:

User: "hii"
Assistant:
"Heyy ✨
How’s your day going?"

User: "I'm confused about my career"
Assistant:
"That’s completely normal 😭
You already have good skills — we just need to figure out the best direction for you."

User: "analyze my resume"
Assistant:
"🚀 Resume Analysis

💪 Strengths:
• Strong MERN stack foundation
• Good project experience
• Practical internship exposure

⚠️ Areas to Improve:
• Add more deployment projects
• Improve GitHub portfolio
• Strengthen DSA skills"
"""

    else:
        system_prompt = """
You are a friendly and emotionally intelligent AI Career Assistant.

IMPORTANT:

* The user has not uploaded a resume yet.
* Politely ask them to upload their resume for personalized career guidance.
* Be warm, supportive, and conversational.
* Do not sound robotic or overly corporate.
* Keep responses natural and engaging.
* Use emojis naturally when appropriate.
* You can still have casual conversations even without a resume.
  """

    
    # Build conversation messages
    messages = [
        {"role": "system", "content": system_prompt}
    ]
    
    # Add conversation history if provided
    if request.conversation_history:
        messages.extend(request.conversation_history[-10:])
    
    # Add current message
    messages.append({"role": "user", "content": request.message})

    # =========================
    # SMART MODEL SELECTION
    # =========================

    user_msg = request.message.lower()

    smart_keywords = [
        "code",
        "coding",
        "bug",
        "debug",
        "math",
        "solve",
        "equation",
        "integral",
        "algorithm",
        "logic",
        "python",
        "javascript",
        "react",
        "error",
    ]

    # Default model
    selected_model = "llama-3.1-8b-instant"

    # Use powerful model for hard tasks
    if any(word in user_msg for word in smart_keywords):
        selected_model = "llama-3.3-70b-versatile"

    # =========================
    # AI RESPONSE
    # =========================

    try:
        response = client.chat.completions.create(
            model=selected_model,
            messages=messages,
            temperature=0.7,
            max_tokens=300,
        )

        ai_response = response.choices[0].message.content

        try:
            # Save user message
            supabase.table("chats").insert({
                "user_id": request.user_id,
                "session_id": request.session_id or "default",
                "role": "user",
                "content": request.message
            }).execute()

            # Save AI response
            supabase.table("chats").insert({
                "user_id": request.user_id,
                "session_id": request.session_id or "default",
                "role": "assistant",
                "content": ai_response
            }).execute()

            print("✅ Chat saved to Supabase")

        except Exception as db_error:
            print(f"❌ Chat save failed: {db_error}")

        print(f"✅ AI response generated ({len(ai_response)} characters)")

        return ChatResponse(
            response=ai_response,
            sources=[],
            is_safe=True
        )

    except Exception as e:
        print(f"❌ Groq API error: {e}")

        return ChatResponse(
            response=f"I'm having trouble connecting. Error: {str(e)[:200]}",
            sources=[],
            is_safe=True
        )

    