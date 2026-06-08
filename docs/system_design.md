# System Design: AgroScan Plant Disease Detection System

This document outlines the architecture, database schema, machine learning pipeline, API contracts, and user flows for the AgroScan system.

---

## 1. System Architecture

AgroScan uses a client-server architecture consisting of a mobile frontend, an AI-powered inference backend, and a PostgreSQL database.

```mermaid
graph TD
    A[React Native Mobile App] -->|HTTPS POST Image| B[Flask API Gateway]
    B -->|Query / Insert Scan| C[PostgreSQL Database]
    B -->|Inference Request| D[PyTorch CNN Model]
    D -->|Prediction & Confidence| B
    B -->|JSON Response| A
```

- **Frontend (Mobile App)**: Built with React Native Expo, providing image capture, library picking, scan analysis visualization, and treatment recommendations.
- **Backend (Flask API)**: Orchestrates request handling, database persistence, and runs PyTorch model inference.
- **Database (PostgreSQL)**: Stores users, scan histories, and detailed crop disease descriptions and treatments.
- **AI Model (PyTorch ResNet/CNN)**: Classifies leaf images into 38 distinct crop-disease categories.

---

## 2. Database Schema (PostgreSQL)

The database tracks users, saves crop scans (referencing images and results), and stores treatment/prevention lookup data.

```mermaid
erDiagram
    USERS ||--o{ SCANS : "performs"
    TREATMENTS ||--o{ SCANS : "classifies as"
    
    USERS {
        UUID id PK
        VARCHAR username
        VARCHAR email UK
        VARCHAR password_hash
        TIMESTAMP created_at
    }
    
    SCANS {
        UUID id PK
        UUID user_id FK "nullable"
        VARCHAR image_path
        VARCHAR crop_type
        VARCHAR predicted_disease
        NUMERIC confidence
        TIMESTAMP created_at
    }
    
    TREATMENTS {
        VARCHAR disease_key PK
        VARCHAR crop
        VARCHAR disease_name
        TEXT cause
        TEXT[] prevention_steps
        TIMESTAMP created_at
    }
```

---

## 3. ML Model Input & Output Formats

### Input Format
- **Data Source**: RGB images of plant leaves (JPG, PNG, WEBP).
- **Preprocessing Pipeline**:
  1. **Resize**: Rescaled to $128 \times 128$ pixels.
  2. **Tensor Conversion**: Scaled pixel values to $[0.0, 1.0]$.
  3. **Batch Dimension**: Unsqueezed to shape `[1, 3, 128, 128]`.
- **Normalization** (if applicable): Channel-wise mean and standard deviation.

### Output Format
- **Logits**: Vector of shape `[1, 38]` containing classification scores.
- **Softmax Probability**: Softmax applied to logits to obtain prediction probabilities.
- **Prediction Label**: Argmax maps index to class key (e.g., `Tomato___Bacterial_spot`).
- **Confidence Score**: The highest class probability, converted to a percentage (e.g., `96.45%`).

---

## 4. API Contracts

### 4.1. Health Check
Checks backend service and database connectivity.
- **Endpoint**: `GET /health`
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "database": "connected",
  "model_loaded": true,
  "timestamp": "2026-06-08T10:00:00Z"
}
```

### 4.2. Image Classification & Disease Detection
Submit a leaf image for disease diagnosis.
- **Endpoint**: `POST /predict`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `image` or `file`: Binary image data.
  - `user_id` (optional): UUID of the logged-in user.
- **Response `200 OK`**:
```json
{
  "prediction": "Tomato___Bacterial_spot",
  "confidence": 98.45,
  "crop": "Tomato",
  "disease": "Bacterial Spot",
  "cause": "Caused by four species of Xanthomonas bacteria, invading wet plant tissue.",
  "prevention": [
    "Use pathogen-free certified seeds.",
    "Minimize overwatering and overhead irrigation.",
    "Apply copper-containing bactericides."
  ]
}
```
- **Response `400 Bad Request`**:
```json
{
  "error": "No image file uploaded."
}
```

### 4.3. User Scan History
Retrieve past scans for a specific user.
- **Endpoint**: `GET /scans`
- **Query Params**: `user_id=<UUID>`
- **Response `200 OK`**:
```json
{
  "scans": [
    {
      "id": "e932b13c-fb82-4148-8df0-1014cc67fb30",
      "image_path": "uploads/20260608_101530.jpg",
      "crop_type": "Tomato",
      "predicted_disease": "Tomato___Bacterial_spot",
      "confidence": 98.45,
      "created_at": "2026-06-08T09:15:30Z"
    }
  ]
}
```

---

## 5. User Interaction Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Farmer / User
    participant App as Mobile App (Expo)
    participant API as Flask Backend
    participant DB as PostgreSQL
    participant Model as ResNet34 Model

    User->>App: Opens App & goes to Camera screen
    User->>App: Captures leaf photo or selects from Gallery
    App->>User: Displays selected image preview
    User->>App: Taps "Analyze"
    App->>API: POST /predict (image binary)
    alt Server is offline / Timeout
        API-->>App: Network Error
        App->>User: Prompts "Offline Demo Mode" fallback
        User->>App: Confirms Demo Mode
        App->>App: Loads mock prediction details
    else Server is online
        API->>Model: predict_image(image_bytes)
        Model-->>API: Returns class index & logits
        API->>API: Compute Softmax confidence & map metadata
        API->>DB: INSERT INTO scans (user_id, image, crop, disease, confidence)
        DB-->>API: Saved scan record
        API-->>App: Returns JSON payload (disease, confidence, prevention)
    end
    App->>User: Navigates to Result Screen with beautiful details card
```
