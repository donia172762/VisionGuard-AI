
# VisionGuard AI
### AI-Powered Workplace Safety Detection

VisionGuard AI is a full-stack computer vision application that analyzes workplace images to identify workers, safety helmets, safety vests, and potential personal protective equipment (PPE) violations.

Built with React, FastAPI, and Roboflow Workflows.

## Features

- Upload workplace images (JPG, PNG, WEBP)
- Run AI-powered object detection
- Detect people, hard hats, and safety vests
- Identify potential missing-PPE indicators
- Display detection confidence scores
- View analysis results in a responsive dashboard

## Tech Stack

**Frontend:** React, Vite, JavaScript, CSS, Lucide React

**Backend:** Python, FastAPI, Uvicorn

**AI:** Roboflow Workflows, Computer Vision, Object Detection

**Version Control:** Git and GitHub

## How It Works

1. A user uploads a workplace image.
2. React sends the image to the FastAPI backend.
3. FastAPI calls the Roboflow Workflow.
4. The AI model returns object detections and confidence scores.
5. The dashboard displays the analysis results.

## Roboflow Integration

Workflow: VisionGuard AI Safety Detection

The Workflow returns structured predictions and an annotated image with bounding boxes.

## Limitations

This project is a prototype, not a certified workplace safety system.

Detection results may contain false positives or missed objects. Missing-PPE flags require human review, and the absence of a detected violation does not establish compliance.

## Future Improvements

- Persistent analysis history
- Advanced detection visualization
- Real-time camera monitoring
- User authentication
- Analytics and reporting

## Author

Donia Said

Computer Engineering Student | Full-Stack Development & UI/UX Design
