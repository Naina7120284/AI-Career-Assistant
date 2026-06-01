from fastapi import APIRouter
from pydantic import BaseModel
import httpx
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(
    prefix="/api/v1",
    tags=["web"]
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class SearchRequest(BaseModel):
    query: str


async def fetch_search_results(query: str) -> str:
    try:
        async with httpx.AsyncClient(timeout=15) as http:

            url = "https://html.duckduckgo.com/html/"

            response = await http.post(
                url,
                data={"q": query},
                headers={
                    "User-Agent": "Mozilla/5.0"
                }
            )

            html = response.text

            # simple cleanup
            html = html[:5000]

            return html

    except Exception as e:
        print("Search Error:", e)
        return ""


@router.post("/web-search")
async def web_search(request: SearchRequest):
    print(f"Web search query: {request.query}")

    raw_results = await fetch_search_results(request.query)

    system = """
You are a powerful web search AI assistant.

The user explicitly requested WEB SEARCH MODE.

Your job:
- Answer ONLY based on the provided web search results
- Never act like a career coach unless user asks
- Never invent resume information
- Give direct factual answers
- If web results are weak, clearly say:
  "Limited search results found, but here's the best available answer."

Use:
- headings
- bullet points
- concise explanations
"""
    user_content = f"""User searched for: {request.query}

{f'Here are some web results:\n{raw_results}' if raw_results else ''}

Give a clear, detailed, helpful answer."""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_content},
            ],
            temperature=0.4,
            max_tokens=600,
        )
        answer = response.choices[0].message.content
        print(f"Web search answer: {answer[:100]}")
    except Exception as e:
        answer = f"Search failed: {str(e)}"

    return {"response": answer}