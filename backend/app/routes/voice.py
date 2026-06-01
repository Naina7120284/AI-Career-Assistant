import asyncio
import base64
import os
import tempfile

import edge_tts

from dotenv import load_dotenv
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from pydantic import BaseModel
from groq import Groq

load_dotenv()

router = APIRouter(
    prefix="/voice",
    tags=["voice"]
)

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# =========================
# SYSTEM PROMPT
# =========================

SYSTEM_PROMPT = """
You are Alex, an emotionally intelligent realtime AI companion.

CRITICAL LANGUAGE RULES:
- Hindi and Urdu are DIFFERENT languages. Hindi is written in Devanagari script
  and spoken by people in India. Urdu uses Nastaliq script. If someone speaks
  Hindi, ALWAYS respond in Hindi — NEVER say they are speaking Urdu.
- If user speaks Hindi → reply in Hindi (Devanagari is fine, keep it natural).
- If user speaks English → reply in English.
- If user speaks Hinglish (Hindi + English mixed) → reply in Hinglish naturally.
- Match the user's language exactly. Never randomly switch.
- NEVER accuse a Hindi speaker of speaking Urdu or another language.

PERSONALITY:
- Warm, intelligent, emotionally aware, engaging.
- Sound like a real human companion — supportive and natural.
- Never robotic, dry, or scripted.

VOICE STYLE:
- Keep casual replies short and sweet (1-3 sentences).
- For poems, stories, explanations, or emotional conversations → give full,
  complete, satisfying responses. Never cut these short.
- Adapt length to the request naturally.
- Avoid repetitive phrases and generic AI wording.

INTELLIGENCE:
- Understand the deeper meaning behind the user's message.
- Use recent conversation context naturally.
- Give smart, relevant, meaningful responses.
- Respond creatively when creativity is needed.

IMPORTANT:
- If interrupted, stop immediately.
- Do not continue speaking after interruption.
- Avoid filler words and unnecessary repetition.
"""

# =========================
# REQUEST MODEL
# =========================

class TTSRequest(BaseModel):
    text: str

# =========================
# VOICE SESSION
# =========================

class VoiceConversation:

    def __init__(self):
        self.history       = []
        self.is_speaking   = False
        self.stop_speaking = False
        self.current_task  = None

    def interrupt(self):
        print("🛑 INTERRUPT")
        self.stop_speaking = True
        self.is_speaking   = False
        if self.current_task:
            self.current_task.cancel()
            self.current_task = None

    async def process_audio(
        self,
        websocket: WebSocket,
        audio_base64: str,
        voice_type: str
    ):
        try:
            self.stop_speaking = False

            audio_bytes = base64.b64decode(audio_base64)

            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as f:
                f.write(audio_bytes)
                tmp_path = f.name

            # =========================
            # TRANSCRIPTION
            # ✅ FIX: Pass language="hi" so Whisper treats ambiguous South
            # Asian speech as Hindi instead of guessing Urdu/Punjabi/etc.
            # Whisper still transcribes English correctly even with this hint
            # because it detects code-switching within the audio itself.
            # =========================

            with open(tmp_path, "rb") as f:
                transcription = groq_client.audio.transcriptions.create(
                    file=(tmp_path, f.read()),
                    model="whisper-large-v3",
                    response_format="text",
                    language="hi",   # ✅ Treat ambiguous audio as Hindi
                )

            os.unlink(tmp_path)

            user_text = str(transcription).strip()

            if not user_text or len(user_text) < 2:
                return

            # Filter noise/echo
            ignored = {".", "🎵", "you", "thank you", "thanks", "bye", "okay", "ok"}
            if user_text.lower() in ignored:
                return

            print("USER:", user_text)

            ai_response = await self.get_ai_response(user_text)

            if self.stop_speaking:
                return

            await self.speak_response(websocket, ai_response, voice_type)

        except asyncio.CancelledError:
            print("⚠️ Task cancelled")

        except Exception as e:
            print("VOICE ERROR:", e)
            try:
                await websocket.send_json({"type": "error", "message": str(e)})
            except Exception:
                pass

    async def get_ai_response(self, user_message: str):
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            *self.history[-6:],
            {"role": "user", "content": user_message},
        ]

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.8,
            max_tokens=200,
        )

        answer = response.choices[0].message.content

        self.history.append({"role": "user",      "content": user_message})
        self.history.append({"role": "assistant", "content": answer})

        return answer

    async def speak_response(
        self,
        websocket: WebSocket,
        text: str,
        voice_type: str
    ):
        self.is_speaking = True

        try:
            # Detect Hindi by checking for Devanagari characters.
            # If the response contains Devanagari, use the Hindi TTS voice.
            # This ensures the voice always matches the language of the text,
            # regardless of what language the user spoke in.
            has_devanagari = any('\u0900' <= ch <= '\u097F' for ch in text)

            if has_devanagari:
                voice_name = "hi-IN-MadhurNeural" if voice_type == "male" else "hi-IN-SwaraNeural"
            else:
                voice_name = "en-US-GuyNeural" if voice_type == "male" else "en-US-JennyNeural"

            print(f"🎤 ACTIVE VOICE: {voice_type} | 🗣️ USING: {voice_name}")

            communicate = edge_tts.Communicate(text=text, voice=voice_name)

            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as f:
                temp_path = f.name

            await communicate.save(temp_path)

            if self.stop_speaking:
                os.unlink(temp_path)
                return

            if asyncio.current_task() != self.current_task:
                os.unlink(temp_path)
                return

            with open(temp_path, "rb") as f:
                audio_bytes = f.read()

            os.unlink(temp_path)

            audio_b64 = base64.b64encode(audio_bytes).decode()

            await websocket.send_json({"type": "audio_chunk", "data": audio_b64})
            await websocket.send_json({"type": "response_end"})

        except asyncio.CancelledError:
            print("⚠️ TTS cancelled")

        except Exception as e:
            print("TTS ERROR:", e)
            try:
                await websocket.send_json({"type": "tts_error", "message": str(e)})
            except Exception:
                pass

        finally:
            self.is_speaking = False


# =========================
# WEBSOCKET
# =========================

@router.websocket("/ws/conversation")
async def voice_websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("✅ Voice Connected")

    conv = VoiceConversation()

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "audio":
                voice_type = data.get("voice", "female")
                print("🎯 SELECTED:", voice_type)

                if conv.current_task:
                    conv.current_task.cancel()

                conv.current_task = asyncio.create_task(
                    conv.process_audio(websocket, data.get("data"), voice_type)
                )

            elif data.get("type") == "interrupt":
                conv.interrupt()
                await websocket.send_json({"type": "interrupt_ack"})

    except WebSocketDisconnect:
        print("❌ Client disconnected")

    except Exception as e:
        print("SOCKET ERROR:", e)


# =========================
# NORMAL TTS API
# =========================

@router.post("/advanced-speak")
async def advanced_speak(request: TTSRequest):
    try:
        communicate = edge_tts.Communicate(text=request.text, voice="en-US-JennyNeural")
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as f:
            temp_path = f.name
        await communicate.save(temp_path)
        return FileResponse(temp_path, media_type="audio/mpeg", filename="response.mp3")
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(500, f"Voice generation failed: {str(e)}")