import os
import shutil
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CyberSentinel"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "cybersentinel_enterprise_secret_key_change_in_prod_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database (Default: SQLite for local immediate run, supports PostgreSQL)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./cybersentinel.db")
    
    # Tool Paths
    NMAP_PATH: str = os.getenv("NMAP_PATH", shutil.which("nmap") or r"D:\dow software\nmap\nmap.exe")
    TSHARK_PATH: str = os.getenv("TSHARK_PATH", shutil.which("tshark") or "")
    SURICATA_LOG_PATH: str = os.getenv("SURICATA_LOG_PATH", "logs/suricata/eve.json")
    ZEEK_LOG_PATH: str = os.getenv("ZEEK_LOG_PATH", "logs/zeek")
    
    # Threat Intelligence API Keys
    VIRUSTOTAL_API_KEY: str = os.getenv("VIRUSTOTAL_API_KEY", "")
    ABUSEIPDB_API_KEY: str = os.getenv("ABUSEIPDB_API_KEY", "")
    OTX_API_KEY: str = os.getenv("OTX_API_KEY", "")
    NVD_API_KEY: str = os.getenv("NVD_API_KEY", "")
    
    # AI Copilot Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Notification Integrations
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_CHAT_ID: str = os.getenv("TELEGRAM_CHAT_ID", "")
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    ALERT_EMAIL_RECIPIENT: str = os.getenv("ALERT_EMAIL_RECIPIENT", "")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
