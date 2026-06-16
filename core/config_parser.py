
import os
import configparser
from dotenv import load_dotenv

# 1. Load sensitive keys from .env file
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("CRITICAL: GROQ_API_KEY is missing. Please check your .env file.")

# 2. Load general app settings from config.ini
config = configparser.ConfigParser()
config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config.ini')
config.read(config_path)

# Extract commonly used variables for easy importing
VISION_MODEL_ID = config['MODEL']['vision_model_id']
MAX_IMAGES = int(config['MODEL']['max_images_per_request'])
MAX_TOKENS = int(config['MODEL']['max_tokens'])
TEMPERATURE = float(config['MODEL']['temperature'])
