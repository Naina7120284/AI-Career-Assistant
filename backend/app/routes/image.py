from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import Groq
import os
import base64
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(
    prefix="/api/v1/image",
    tags=["image"]
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


class ImageAnalyzeRequest(BaseModel):
    image_base64: str          # raw base64, no data URI prefix
    mime_type: str = "image/jpeg"   # image/jpeg, image/png, image/webp
    user_prompt: str = "What is in this image? Describe it in detail."


@router.post("/analyze")
async def analyze_image(request: ImageAnalyzeRequest):
    print(f"Image analysis request | type: {request.mime_type} | prompt: {request.user_prompt[:60]}")

    # Validate mime type
    allowed = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}
    if request.mime_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type '{request.mime_type}'. Use JPEG, PNG, or WebP."
        )

    # Validate base64 (basic check)
    try:
        base64.b64decode(request.image_base64, validate=True)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image data.")

    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",  # Groq vision model
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                # Groq vision accepts data URIs
                                "url": f"data:{request.mime_type};base64,{request.image_base64}"
                            },
                        },
                        {
                            "type": "text",
                            "text": request.user_prompt,
                        },
                    ],
                }
            ],
            temperature=0.5,
            max_tokens=600,
        )

        answer = response.choices[0].message.content
        print(f"Image analysis done ({len(answer)} chars)")
        return {"response": answer}

    except Exception as e:
        print(f"Image analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")