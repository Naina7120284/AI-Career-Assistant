from openai import OpenAI
from app.config import config
from typing import List

client = OpenAI(api_key=config.OPENAI_API_KEY)

def create_embedding(text: str) -> List[float]:
    """Create embedding for a single text"""
    response = client.embeddings.create(
        model=config.EMBEDDING_MODEL,
        input=text
    )
    return response.data[0].embedding

def create_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """Create embeddings for multiple texts in batch"""
    response = client.embeddings.create(
        model=config.EMBEDDING_MODEL,
        input=texts
    )
    return [data.embedding for data in response.data]