from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Define your variables with types
    app_name: str = "Fathom Assessment API"
    version: str = "0.1.0"
    
    # Database configuration
    # For SQLite: "sqlite:///./sql_app.db"
    # For Postgres: "postgresql://user:password@localhost/dbname"
    database_url: str = ""

    allow_origins: str = "http://localhost:3000"

    # Configure the loading behavior
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        case_sensitive=False
    )

# Instantiate the settings object
settings = Settings()