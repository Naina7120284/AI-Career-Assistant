from supabase import create_client, Client
from app.config import config

supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)