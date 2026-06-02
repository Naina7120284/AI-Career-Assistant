import asyncio
import base64
import os
import tempfile
import edge_tts

from dotenv import load_dotenv
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from groq import Groq

load_dotenv()

router = APIRouter(tags=["voice"])

# =========================
# GROQ CLIENT
# =========================

groq_client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

# =========================
# SYSTEM PROMPT
# =========================

SYSTEM_PROMPT = """
You are Alex, an emotionally intelligent realtime AI companion.

LANGUAGE RULES:
- If user speaks English → reply ONLY in English.
- If user speaks Hindi → reply ONLY in Hindi.
- If user speaks Hinglish → reply naturally in Hinglish.
- Match the user’s language style, tone, and energy naturally.
- Never randomly switch languages.
- Never generate foreign languages unless explicitly asked.

VOICE STYLE:
- Speak naturally and emotionally.
- Keep replies short, clear, and engaging.
- Use 1-4 sentences depending on the request.
- For creative tasks like poems, stories, captions, or emotional replies, give complete and satisfying responses.
- Never cut off important details just to stay short.
- Sound human, warm, and expressive.
- Adapt response length to the user’s request.
- Avoid robotic or repetitive wording.
- Be conversational, not overly formal.

IMPORTANT:
- Focus mainly on the latest message while keeping necessary conversation context.
- If interrupted, stop immediately.
- Do not continue speaking after interruption.
- Avoid unnecessary filler words.
- Prioritize clarity, intelligence, and natural interaction.

CREATIVE RESPONSE OVERRIDE:

- When the user requests a specific format or length, ALWAYS follow it exactly.
- If user asks for a 5-line poem, generate exactly 5 meaningful lines.
- If user asks for 10 ideas, give exactly 10 ideas.
- Never shorten, summarize, or compress creative outputs.
- Creative tasks should feel complete, detailed, and satisfying.
- Prioritize fulfilling the exact user request over keeping responses short.
- Do not reduce output length unless the user explicitly asks for shorter replies.
- For creative, emotional, or detailed responses, give the full answer without cutting important details just to stay short.
"""

# =========================
# VOICE CONVERSATION
# =========================

class VoiceConversation:

    def __init__(self):

        self.is_speaking = False
        self.stop_speaking = False
        self.current_task = None
        self.history = []

    # =========================
    # INTERRUPT
    # =========================

    def interrupt(self):

        print("🛑 INTERRUPT")

        self.stop_speaking = True
        self.is_speaking = False

        if self.current_task:
            self.current_task.cancel()
            self.current_task = None

    # =========================
    # PROCESS AUDIO
    # =========================

    async def process_audio(
        self,
        websocket: WebSocket,
        audio_base64: str,
        voice_type: str
    ):

        try:

            # reset interrupt
            self.stop_speaking = False

            audio_bytes = base64.b64decode(audio_base64)

            # save temp audio
            with tempfile.NamedTemporaryFile(
                delete=False,
                suffix=".webm"
            ) as tmp_audio:

                tmp_audio.write(audio_bytes)
                tmp_path = tmp_audio.name

            # =========================
            # SPEECH TO TEXT
            # =========================

            with open(tmp_path, "rb") as file:

                transcription = (
                    groq_client.audio.transcriptions.create(
                        file=(tmp_path, file.read()),
                        model="whisper-large-v3",
                        response_format="text",
                         language="hi",
                    )
                )

            os.unlink(tmp_path)

            text = str(transcription).strip()

            if not text:
                return

            # remove garbage
            ignored = [
                ".",
                "you",
                "thank you",
                "thanks",
                "bye",
                "🎵"
            ]

            if text.lower() in ignored:
                return

            if len(text) < 2:
                return

            print("USER:", text)

            # =========================
            # AI RESPONSE
            # =========================

            ai_response = await self.get_ai_response(text)

            if self.stop_speaking:
                return

            # =========================
            # SPEAK
            # =========================

            await self.speak_response(
                websocket,
                ai_response,
                voice_type
            )

        except asyncio.CancelledError:

            print("⚠️ Task cancelled")

        except Exception as e:

            print("VOICE ERROR:", e)

            try:
                await websocket.send_json({
                    "type": "error",
                    "message": str(e)
                })
            except:
                pass

    # =========================
    # GET AI RESPONSE
    # =========================

    async def get_ai_response(
        self,
        user_message: str
    ):

        messages = [

            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },

            *self.history[-6:],

            {
                "role": "user",
                "content": user_message
            }
        ]

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.8,
            max_tokens=200
        )

        answer = (
            response.choices[0]
            .message.content
        )

        self.history.append({
            "role": "user",
            "content": user_message
        })

        self.history.append({
            "role": "assistant",
            "content": answer
        })

        return answer

    # =========================
    # SPEAK RESPONSE
    # =========================

    async def speak_response(
        self,
        websocket: WebSocket,
        text: str,
        voice_type: str
    ):

        self.is_speaking = True

        try:

            print("🎤 ACTIVE VOICE:", voice_type)

            # =========================
            # LANGUAGE DETECTION
            # =========================

            hindi_chars = any(
                '\u0900' <= ch <= '\u097F'
                for ch in text
            )

            # =========================
            # VOICE SELECTION
            # =========================

            if hindi_chars:

                if voice_type == "male":
                    voice_name = "hi-IN-MadhurNeural"
                else:
                    voice_name = "hi-IN-SwaraNeural"

            else:

                if voice_type == "male":
                    voice_name = "en-US-GuyNeural"
                else:
                    voice_name = "en-US-JennyNeural"

            print("🗣️ USING:", voice_name)
            print("STEP 1")

            # =========================
            # GENERATE TTS
            # =========================

            communicate = edge_tts.Communicate(
                text=text,
                voice=voice_name
            )

            print("STEP 2")

            temp_file = tempfile.NamedTemporaryFile(
                delete=False,
                suffix=".mp3"
            )

            temp_path = temp_file.name

            temp_file.close()

            await communicate.save(temp_path)

            print("STEP 3")

            # interrupted
            if self.stop_speaking:
                os.unlink(temp_path)
                return

            # old task
            if asyncio.current_task() != self.current_task:
                os.unlink(temp_path)
                return

            with open(temp_path, "rb") as f:
                audio_bytes = f.read()

            os.unlink(temp_path)

            audio_b64 = (
                base64.b64encode(audio_bytes)
                .decode()
            )

            await websocket.send_json({
                "type": "audio_chunk",
                "data": audio_b64
            })

            await websocket.send_json({
                "type": "response_end"
            })

        except asyncio.CancelledError:

            print("⚠️ TTS cancelled")

        except Exception as e:

            print("TTS ERROR:", e)

            try:
                await websocket.send_json({
                    "type": "tts_error",
                    "message": str(e)
                })
            except:
                pass

        finally:

            self.is_speaking = False

    # =========================
    # PROCESS INTERRUPT
    # =========================

    async def process_interrupt(self):

        self.interrupt()

# =========================
# WEBSOCKET
# =========================

@router.websocket("/voice/ws/conversation")
async def websocket_endpoint(
    websocket: WebSocket
):

    await websocket.accept()

    print("✅ Voice Connected")

    conv = VoiceConversation()

    try:

        while True:

            data = await websocket.receive_json()

            # =========================
            # AUDIO
            # =========================

            if data.get("type") == "audio":

                voice_type = data.get(
                    "voice",
                    "female"
                )

                print("🎯 SELECTED:", voice_type)

                # cancel previous task
                if conv.current_task:

                    conv.current_task.cancel()

                # create new task
                conv.current_task = asyncio.create_task(
                    conv.process_audio(
                        websocket,
                        data.get("data"),
                        voice_type
                    )
                )

            # =========================
            # INTERRUPT
            # =========================

            elif data.get("type") == "interrupt":

                await conv.process_interrupt()

                await websocket.send_json({
                    "type": "interrupt_ack"
                })

    except WebSocketDisconnect:

        print("❌ Client disconnected")

    except Exception as e:

        print("SOCKET ERROR:", e)