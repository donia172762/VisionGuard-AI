
import os
import tempfile

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from inference_sdk import InferenceHTTPClient
from starlette.concurrency import run_in_threadpool

load_dotenv()

app = FastAPI(title="VisionGuard AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

API_KEY = os.getenv("ROBOFLOW_API_KEY")
WORKSPACE = os.getenv("ROBOFLOW_WORKSPACE")
WORKFLOW = os.getenv("ROBOFLOW_WORKFLOW")

@app.get("/")
def home():
    return {"message": "VisionGuard AI Backend is running!"}

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    if file.content_type not in (
        "image/jpeg", "image/png", "image/webp"
    ):
        raise HTTPException(400, "Unsupported image format")

    image_bytes = await file.read(10 * 1024 * 1024 + 1)

    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(413, "Image exceeds 10 MB")

    if not all([API_KEY, WORKSPACE, WORKFLOW]):
        raise HTTPException(500, "Roboflow configuration missing")

    suffix = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp"
    }[file.content_type]

    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            suffix=suffix, delete=False
        ) as temp:
            temp.write(image_bytes)
            temp_path = temp.name

        def run_detection():
            client = InferenceHTTPClient(
                api_url="https://serverless.roboflow.com",
                api_key=API_KEY
            )

            return client.run_workflow(
                workspace_name=WORKSPACE,
                workflow_id=WORKFLOW,
                images={"image": temp_path},
                use_cache=False
            )

        result = await run_in_threadpool(run_detection)

        return {
            "status": "success",
            "filename": file.filename,
            "result": result
        }

    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Roboflow analysis failed. Check backend logs."
        )

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
