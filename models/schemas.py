from pydantic import BaseModel, Field
from typing import List, Optional

# 1. Sub-model for Patient Details
class PatientDetails(BaseModel):
    name: str = Field(default="Unknown", description="The extracted name of the patient.")
    age: str = Field(default="Not found", description="The age of the patient.")
    gender: str = Field(default="Not found", description="The gender of the patient.")
    date_of_report: str = Field(default="Not found", description="The date the report was issued.")

# 2. Main model for the AI Output
class MedicalAnalysisData(BaseModel):
    reasoning: Optional[str] = Field(default="", description="Chain of thought reasoning before returning the final fields")
    is_medical_document: Optional[bool] = Field(default=True, description="Whether the document is recognized as medical")
    error_message: Optional[str] = Field(default="", description="Error message if not a medical document")
    patient_details: PatientDetails
    key_findings: List[str] = Field(
        default_factory=list, 
        description="A list of the most important observations from the report."
    )
    abnormal_values: List[str] = Field(
        default_factory=list, 
        description="Test results or findings flagged as abnormal."
    )
    diagnoses: List[str] = Field(
        default_factory=list, 
        description="Explicit diagnoses mentioned in the report."
    )
    recommendations: List[str] = Field(
        default_factory=list, 
        description="Follow-up actions or advice."
    )
    patient_friendly_summary: str = Field(
        default="No summary generated.", 
        description="A simple, non-medical explanation of the report."
    )

# 3. Model for the final FastAPI Response sent to the frontend
class AnalysisResponse(BaseModel):
    status: str = Field(..., description="Success or error status.")
    message: str = Field(..., description="Information about the process.")
    data: Optional[MedicalAnalysisData] = Field(None, description="The extracted medical data.")