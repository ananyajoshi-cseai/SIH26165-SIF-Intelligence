from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    database_url: str
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    use_groq_llm: bool = False
    enable_sentence_transformers: bool = False
    fatigue_max_adjustment: int = 8
    cors_origins: list[str] = [
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://192.168.1.78:5173",
        "https://oilsentinel.vercel.app",
    ]

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        extra="ignore",
    )


settings = Settings()
