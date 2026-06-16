from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from services.file_processor import process_uploaded_file
from agent.graph import medical_agent 
from models.schemas import AnalysisResponse
from services.groq_client import chat_about_analysis

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    analysis_data: dict | None = None
    history: list[dict] | None = None

@router.post("/upload",response_model=AnalysisResponse)
async def upload_medical_report(files: list[UploadFile] = File(...)):
    try:
        if len(files) > 5:
            raise HTTPException(status_code=400, detail="Maximum 5 files allowed.")

        # Step 1: Process the files into in-memory images
        image_data = []
        for file in files:
            image_data.extend(process_uploaded_file(file))
        
        # Step 2: Set up the initial state for LangGraph
        initial_state = {
            "image_data": image_data,
            "extracted_data": None,
            "error": None
        }
        
        # Step 3: Run the Agent workflow!
        result_state = medical_agent.invoke(initial_state)
        
        # Step 4: Handle any errors from the AI processing
        if result_state.get("error"):
            raise HTTPException(status_code=500, detail=result_state["error"])
            
        # Step 4.5: Check if the AI determined it is not a medical document
        data = result_state.get("extracted_data", {})
        is_medical = data.get("is_medical_document", True)
        # Handle cases where LLM returns string "false" instead of boolean
        if isinstance(is_medical, str):
            is_medical = is_medical.lower().strip() not in ("false", "no", "0")
        if not is_medical:
            error_msg = data.get("error_message", "Please upload a medical related report or image.")
            raise HTTPException(status_code=400, detail=error_msg)
            
        # Step 5: Return the beautifully structured data to the frontend
        return {
            "status": "success",
            "message": "Analysis complete.",
            "data": data
        }
        
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/chat")
async def chat_with_report(payload: ChatRequest):
    """Chat endpoint that answers user messages using the analysis_data and conversation history.

    Supports multi-turn conversation by accepting prior message history.
    """
    try:
        message = payload.message.strip()
        analysis = payload.analysis_data

        if not analysis:
            return {"reply": "No analysis data provided. Please upload a medical report first."}

        # Use the LLM to answer with conversation history for context
        reply = chat_about_analysis(message, analysis, history=payload.history)
        return {"reply": reply}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))