
from typing import TypedDict, List, Optional, Dict, Any

class MedicalAgentState(TypedDict):
    # The input: In-memory image data [{"bytes": <raw_bytes>, "mime": "image/png"}, ...]
    image_data: List[Dict[str, Any]]
    
    # The output: The structured JSON from Groq
    extracted_data: Optional[Dict[str, Any]]
    
    # Error handling: Catch any issues
    error: Optional[str]