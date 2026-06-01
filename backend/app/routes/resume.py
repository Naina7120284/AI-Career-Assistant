from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from typing import Dict
import PyPDF2
import io
import logging

# =========================================
# ATS SCORE FUNCTION
# =========================================

def calculate_ats_score(resume_text: str):

    score = 0

    text = resume_text.lower()

    # =====================================
    # BASIC STRUCTURE
    # =====================================

    if "education" in text:
        score += 10

    if "skill" in text or "skills" in text:
        score += 10

    if "project" in text or "projects" in text:
        score += 15

    if "experience" in text or "experiences" in text:
        score += 15

    # =====================================
    # ACHIEVEMENTS
    # =====================================

    achievement_words = [
        "improved",
        "developed",
        "built",
        "increased",
        "optimized",
        "%"
    ]

    found = sum(
        1 for word in achievement_words
        if word in text
    )

    score += min(found * 3, 15)

    # =====================================
    # LENGTH CHECK
    # =====================================

    word_count = len(text.split())

    if word_count < 250:
        score -= 10

    elif word_count > 1200:
        score -= 5

    # =====================================
    # CONTACT INFO
    # =====================================

    if "@" in text:
        score += 5

    # =====================================
    # TECH SKILLS
    # =====================================

    tech_keywords = [
        "python",
        "react",
        "node",
        "docker",
        "sql",
        "aws",
        "typescript",
        "next.js",
        "machine learning",
        "tensorflow",
        "pytorch",
        "mongodb"
    ]

    matched = sum(
        1 for skill in tech_keywords
        if skill in text
    )

    score += min(matched * 1.5, 12)

    return int(max(min(score, 100), 25))


# =========================================
# LOGGER
# =========================================

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger(__name__)


# =========================================
# ROUTER
# =========================================

router = APIRouter(
    prefix="/api/v1/resume",
    tags=["resume"]
)


# =========================================
# PDF TEXT EXTRACTION
# =========================================

def extract_text_from_pdf(
    file_bytes: bytes
) -> str:

    try:

        pdf_reader = PyPDF2.PdfReader(
            io.BytesIO(file_bytes)
        )

        text = ""

        for page in pdf_reader.pages:

            page_text = page.extract_text()

            if page_text:
                text += page_text + "\n"

        return text

    except Exception as e:

        logger.error(
            f"PDF extraction error: {e}"
        )

        return ""


# =========================================
# UPLOAD RESUME
# =========================================

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    user_id: str = Query(...)
) -> Dict:

    logger.info(
        f"Starting upload process for: {file.filename}"
    )

    # =========================================
    # ONLY PDF
    # =========================================

    if not file.filename.lower().endswith(".pdf"):

        raise HTTPException(
            status_code=400,
            detail="Only PDF resumes are allowed."
        )

    try:

        contents = await file.read()

        resume_text = extract_text_from_pdf(
            contents
        )

        if not resume_text.strip():

            raise HTTPException(
                status_code=400,
                detail="Resume appears empty."
            )

        # =========================================
        # AI ANALYSIS
        # =========================================

        from app.services.llm import llm_service

        analysis_data = (
            await llm_service.analyze_resume(
                resume_text
            )
        )

        # =========================================
        # REAL ATS SCORE
        # =========================================

        real_ats_score = int(
            calculate_ats_score(resume_text)
        )

        # =========================================
        # EXTRACTED SKILLS
        # =========================================

        extracted_skills = analysis_data.get(
            "extracted_skills",
            []
        )

        if not isinstance(extracted_skills, list):
            extracted_skills = []

        # =========================================
        # DYNAMIC RESUME QUALITY
        # =========================================

        resume_quality = int(
            (
                real_ats_score * 0.75
            ) +
            (
                len(extracted_skills) * 1.2
            )
        )

        resume_quality = min(
            max(resume_quality, 35),
            90
        )

        # =========================================
        # INTERVIEW SKILLS
        # =========================================

        communication_keywords = [
            "team",
            "lead",
            "managed",
            "presentation",
            "communication",
            "collaboration",
            "client",
            "scrum",
            "mentor",
            "speaker",
            "coordinated"
        ]

        leadership_keywords = [
            "leader",
            "captain",
            "organized",
            "initiated",
            "supervised",
            "ownership",
            "responsible"
        ]

        achievement_keywords = [
           "improved",
           "increased",
            "optimized",
            "reduced",
            "achieved",
            "delivered",
              "%",
            "award",
             "winner"
          ]

        communication_score = sum(
            1 for word in communication_keywords
            if word in resume_text.lower()
        )
        leadership_score = sum(
            1 for word in leadership_keywords
            if word in resume_text.lower()
        )

        achievement_score = sum(
            1 for word in achievement_keywords
            if word in resume_text.lower()
        )

        interview_skills = int(

            35 +
            (communication_score * 4) +
            (leadership_score * 5) +
            (achievement_score * 3) +
            (real_ats_score * 0.35) 

        )

        interview_skills = min(
            max(interview_skills, 45),
            95
        )

        # =========================================
        # MARKET DEMAND
        # =========================================

        high_demand_skills = [
            "react",
            "next.js",
            "typescript",
            "node",
            "docker",
            "kubernetes",
            "aws",
            "ai",
            "machine learning",
            "python",
            "cloud",
            "devops",
            "mongodb",
            "sql",
            "fastapi"
        ]

        market_matches = sum(
            1 for skill in high_demand_skills
            if skill in resume_text.lower()
        )

        market_demand = min(
            max(
                35 + (market_matches * 5),
                30
            ),
            98
        )

        # =========================================
        # DATABASE
        # =========================================

        from app.db.supabase_client import supabase

        # DELETE OLD RESUME

        supabase.table("resumes") \
            .delete() \
            .eq("user_id", user_id) \
            .execute()

        # INSERT NEW RESUME

        supabase.table("resumes").insert({

            "user_id": user_id,

            "content": resume_text,

            "filename": file.filename,

            "ats_score": real_ats_score,

            "extracted_skills":
                extracted_skills,

            "recommendations":
                analysis_data.get(
                    "recommended_roles",
                    []
                ),

            "ai_suggestions":
                analysis_data.get(
                    "ai_suggestions",
                    []
                ),

            "resume_quality":
                resume_quality,

            "interview_skills":
                interview_skills,

            "market_demand":
                market_demand

        }).execute()

        # =========================================
        # SAVE USER SKILLS
        # =========================================

        supabase.table("user_skills") \
            .upsert({

                "user_id": user_id,

                "communication":
                    min(real_ats_score + 5, 95),

                "problem_solving":
                    min(real_ats_score + 2, 92),

                "leadership":
                    75 if "lead" in resume_text.lower() else 55,

                "technical_skills":
                    min(real_ats_score, 95),

                "overall_score":
                    real_ats_score

            },
            on_conflict="user_id"
        ).execute()

        # =========================================
        # AI RECOMMENDATIONS
        # =========================================

        ai_suggestions = (
            analysis_data.get(
                "ai_suggestions",
                []
            )
        )

        # DELETE OLD RECOMMENDATIONS

        supabase.table(
            "skill_recommendations"
        ).delete().eq(
            "user_id",
            user_id
        ).execute()

        # INSERT NEW RECOMMENDATIONS

        for suggestion in ai_suggestions:

            supabase.table(
                "skill_recommendations"
            ).insert({

                "user_id": user_id,

                "title": suggestion,

                "description": suggestion,

                "type": "AI Recommendation"

            }).execute()

        # =========================================
        # RESPONSE
        # =========================================

        return {

            "success": True,

            "message":
                "Resume analyzed successfully",

            "ats_score":
                real_ats_score,

            "extracted_skills":
                extracted_skills,

            "recommendations":
                analysis_data.get(
                    "recommended_roles",
                    []
                ),

            "ai_suggestions":
                ai_suggestions,

            "resume_quality":
                resume_quality,

            "interview_skills":
                interview_skills,

            "market_demand":
                market_demand
        }

    except Exception as e:

        logger.error(
            f"Critical upload error: {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# =========================================
# GET LATEST RESUME
# =========================================

@router.get("/latest")
async def get_latest_resume(
    user_id: str = Query(...)
):

    try:

        from app.db.supabase_client import supabase

        response = (
            supabase
            .table("resumes")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

        if not response.data:

            return {
                "success": False
            }

        return {

            "success": True,

            "review":
                response.data[0]

        }

    except Exception as e:

        logger.error(str(e))

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )