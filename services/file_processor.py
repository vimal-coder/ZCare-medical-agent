
import io
import fitz
from fastapi import UploadFile
from core.config_parser import MAX_IMAGES


def process_uploaded_file(file: UploadFile) -> list[dict]:
    """
    Reads the uploaded file directly into memory and converts PDFs to image bytes.
    Returns a list of dicts: [{"bytes": <raw_bytes>, "mime": "image/png"}, ...]
    No files are saved to disk.
    """
    file_extension = file.filename.split('.')[-1].lower()
    
    # Read the entire file into memory
    file_bytes = file.file.read()
    
    image_list = []
    
    if file_extension == "pdf":
        # Open the PDF from memory bytes
        pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
        
        # Limit processing to MAX_IMAGES pages
        num_pages = min(len(pdf_document), MAX_IMAGES)
        
        for page_num in range(num_pages):
            page = pdf_document.load_page(page_num)
            pix = page.get_pixmap(dpi=150)
            img_bytes = pix.tobytes("png")
            image_list.append({"bytes": img_bytes, "mime": "image/png"})
            
        pdf_document.close()
        
    elif file_extension in ["jpg", "jpeg", "png"]:
        mime = "image/png" if file_extension == "png" else "image/jpeg"
        image_list.append({"bytes": file_bytes, "mime": mime})
    else:
        raise ValueError("Unsupported file format. Please upload a PDF or an Image (JPG/PNG).")
        
    return image_list
