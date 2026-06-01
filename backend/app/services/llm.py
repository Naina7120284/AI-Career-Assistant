# import os
# import json
# from groq import Groq
# from app.config import Config

# class LLMService:
#     def __init__(self):
#         self.api_key = os.getenv("GROQ_API_KEY")
#         self.client = Groq(api_key=self.api_key)
#         self.model = "llama-3.1-8b-instant"

#     # Make sure this is indented exactly like the __init__ above it!
#     async def analyze_resume(self, resume_text: str) -> dict:
#         system_prompt = """
# You are an advanced AI Career Assistant and smart career companion.

# Your personality should feel:

# - friendly
# - modern
# - intelligent
# - supportive
# - conversational
# - professional but not robotic

# ANALYSIS GOALS:

# * Evaluate resume quality like a real ATS system.
# * Detect technical skills, tools, frameworks, platforms, and soft skills accurately.
# * Understand the user's real career direction based on projects, internships, certifications, and technologies.
# * Give intelligent and personalized career insights.
# * Provide realistic job role recommendations.
# * Identify strengths, weaknesses, missing skills, and improvement opportunities.

# STRICT RULES:

# 1. Return ONLY valid JSON.
# 2. Do NOT include markdown, explanations, or extra text.
# 3. Be highly specific and context-aware.
# 4. Detect exact technologies mentioned in the resume.
# 5. Avoid generic advice.
# 6. Make every analysis unique to the resume content.
# 7. ATS score should realistically reflect resume quality.
# 8. Suggestions should be practical and actionable.
# 9. Recommended roles must match the user's actual skills and projects.
# 10. Prefer modern tech role recommendations when relevant.
# 11. Extract both technical and professional skills.
# 12. Consider project quality, internships, certifications, and tools while scoring.

# SCORING GUIDELINES:

# * ATS Score:
#   Evaluate formatting, clarity, keywords, projects, skills, and professional impact.

# * Resume Quality:
#   Evaluate overall professionalism, readability, structure, and technical depth.

# * Market Demand:
#   Estimate how strong the candidate is for the current tech job market.

# REQUIRED JSON FORMAT:
# {
# "ats_score": <integer 0-100>,

# ```
# "resume_quality": <integer 0-100>,

# "market_demand": <integer 0-100>,

# "extracted_skills": [
#     "Skill 1",
#     "Skill 2",
#     "Skill 3",
#     "Skill 4",
#     "Skill 5"
# ],

# "recommended_roles": [
#     "Role 1",
#     "Role 2"
# ],

# "strengths": [
#     "Strength 1",
#     "Strength 2"
# ],

# "weaknesses": [
#     "Weakness 1",
#     "Weakness 2"
# ],

# "ai_suggestions": [
#     "Specific actionable suggestion 1",
#     "Specific actionable suggestion 2",
#     "Specific actionable suggestion 3"
# ]
# ```

# }

# IMPORTANT RESPONSE STYLE:

# Write responses like ChatGPT.
# Make responses visually beautiful and easy to read.
# Use emojis naturally and professionally.
# Use proper spacing, bullet points, and sections.
# Avoid giant paragraphs.
# Keep replies engaging and modern.
# Sound human and conversational.
# Make the user feel encouraged and motivated.

# FORMATTING RULES:

# Use headings like:
# 🚀 Career Insights
# 💡 Suggestions
# 🔥 Strengths
# ⚠️ Areas to Improve
# Use short bullet points.
# Add line breaks between sections.
# Highlight important skills clearly.
# Keep responses structured and readable.
# Never dump one giant paragraph.

# PERSONALIZATION RULES:

# Use the user's resume content to give personalized advice.
# Mention specific technologies, projects, and strengths from the resume.
# Give practical career guidance.
# Suggest realistic job roles based on actual skills.

# USER RESUME:
# {resume_content[:3000]}

# IMPORTANT:
# If no resume exists, politely ask the user to upload one first.
# """


#         try:
#             response = self.client.chat.completions.create(
#                 model=self.model,
#                 messages=[
#                     {"role": "system", "content": system_prompt},
#                     {"role": "user", "content": f"Analyze this resume content: {resume_text}"}
#                 ],
#                 temperature=0.2, # Slightly higher for more unique recommendations
#                 response_format={"type": "json_object"}
#             )
            
#             # The AI's real answer
#             return json.loads(response.choices[0].message.content)
#         except Exception as e:
#             # Fallback that still follows the format so the app doesn't crash
#             return {
#                 "ats_score": 0,
#                 "extracted_skills": ["Analysis Failed"],
#                 "recommended_roles": ["N/A"],
#                 "ai_suggestions": [f"Error: {str(e)}"],
#                 "resume_quality": 0,
#                 "market_demand": 0
#             }

#     async def get_chat_response(
#         self, 
#         message: str, 
#         context: str = None, 
#         conversation_history: list = None
#     ) -> str:
#         system_prompt = """You are a helpful career assistant...""" 
        
#         # ... (rest of your existing get_chat_response code) ...
#         messages = [{"role": "system", "content": system_prompt}]
#         if conversation_history:
#             messages.extend(conversation_history[-6:])
#         messages.append({"role": "user", "content": message})
        
#         try:
#             response = self.client.chat.completions.create(
#                 model=self.model,
#                 messages=messages,
#                 temperature=0.3,
#                 max_tokens=200
#             )
#             return response.choices[0].message.content
#         except Exception as e:
#             return f"Error: {str(e)}"

# # Create one instance to be used across the app
# llm_service = LLMService()


import os
import json
from groq import Groq


class LLMService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")

        self.client = Groq(
            api_key=self.api_key
        )

        self.model = "llama-3.1-8b-instant"

    # =========================================
    # RESUME ANALYSIS
    # =========================================
    async def analyze_resume(
        self,
        resume_text: str
    ) -> dict:

        system_prompt = f"""
You are an advanced AI Career Assistant and ATS Resume Analyzer.

Your job is to deeply analyze resumes like a real hiring system.

IMPORTANT RULES:

1. Return ONLY valid JSON
2. No markdown
3. No explanation text
4. No extra formatting
5. Be highly personalized
6. Detect real technologies from the resume
7. Give realistic ATS score
8. Give intelligent recommendations
9. Suggestions must depend on the actual resume
10. Recommended roles must match real skills

REQUIRED JSON FORMAT:

{{
  "ats_score": 85,

  "resume_quality": 90,

  "market_demand": 88,

  "extracted_skills": [
    "React",
    "Node.js",
    "MongoDB"
  ],

  "recommended_roles": [
    "Full Stack Developer",
    "Backend Developer"
  ],

  "strengths": [
    "Strong MERN stack projects",
    "Good backend architecture knowledge"
  ],

  "weaknesses": [
    "Missing cloud deployment experience",
    "Limited DevOps exposure"
  ],

  "ai_suggestions": [
    "Learn Docker and Kubernetes",
    "Build scalable production projects",
    "Improve system design knowledge",
    "Practice DSA regularly",
    "Strengthen resume ATS keywords"
  ]
}}

USER RESUME:

{resume_text[:3000]}
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,

                messages=[
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": "Analyze this resume"
                    }
                ],

                temperature=0.3,

                response_format={
                    "type": "json_object"
                }
            )

            content = (
                response
                .choices[0]
                .message
                .content
            )

            parsed = json.loads(content)

            return parsed

        except Exception as e:
            print(
                "Resume Analysis Error:",
                str(e)
            )

            return {
                "ats_score": 0,

                "resume_quality": 0,

                "market_demand": 0,

                "extracted_skills": [],

                "recommended_roles": [],

                "strengths": [],

                "weaknesses": [],

                "ai_suggestions": [
                    "Failed to generate AI suggestions"
                ]
            }

    # =========================================
    # CHAT RESPONSE
    # =========================================
    async def get_chat_response(
        self,
        message: str,
        context: str = None,
        conversation_history: list = None
    ) -> str:

        system_prompt = """
You are a smart AI Career Assistant.

Help users with:
- careers
- interviews
- resumes
- skills
- learning
- roadmap guidance
"""

        messages = [
            {
                "role": "system",
                "content": system_prompt
            }
        ]

        if conversation_history:
            messages.extend(
                conversation_history[-6:]
            )

        if context:
            messages.append({
                "role": "system",
                "content": context
            })

        messages.append({
            "role": "user",
            "content": message
        })

        try:
            response = (
                self.client
                .chat
                .completions
                .create(
                    model=self.model,

                    messages=messages,

                    temperature=0.4,

                    max_tokens=300
                )
            )

            return (
                response
                .choices[0]
                .message
                .content
            )

        except Exception as e:
            return f"Error: {str(e)}"


# =========================================
# GLOBAL INSTANCE
# =========================================
llm_service = LLMService()