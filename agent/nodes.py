
from agent.state import MedicalAgentState
from services.groq_client import analyze_medical_images

def analyze_document_node(state: MedicalAgentState) -> MedicalAgentState:
    """
    This node takes the in-memory image data from the state, sends it to the 
    Vision LLM, and updates the state with the extracted medical insights.
    """
    try:
        # Call the function with in-memory image data
        result = analyze_medical_images(state["image_data"])
        
        # Return the updated state
        return {"extracted_data": result, "error": None}
        
    except Exception as e:
        # If the API fails or JSON parsing breaks, record the error
        return {"error": str(e)}