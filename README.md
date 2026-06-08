# AgroScan: AI-Powered Plant Disease Detection System 🌿

AgroScan is a professional, mobile-first agricultural assistant that allows growers, farmers, and agronomists to diagnose crop health issues instantly. By capturing leaf images from a smartphone, the system classifies leaves across 38 distinct crop-disease combinations using a PyTorch ResNet34 Convolutional Neural Network (CNN). It provides crop status diagnostics, cause details, and organic or preventive treatment guidelines.

---

## 🚀 Key Features

* **Instant Leaf Analysis**: Take a photo of an infected leaf or upload it from your library for immediate diagnosis.
* **Scanning Viewfinder Animation**: A high-fidelity viewfinder overlay featuring an animated laser line that pulses vertically over the leaf image during AI processing.
* **Accuracy Certainty Bar**: Renders model confidence scores as visual progress bars with healthy vs. diseased crop status badges.
* **Dual-Database Architecture**: Auto-connects to a production **PostgreSQL** instance. If offline (e.g., local development), it automatically falls back to a local **SQLite** database (`database/plant_disease.db`).
* **Auto-Seeding**: Upon first launch, the server automatically reads, cleans, and seeds all 38 plant disease treatment guidelines into the database.
* **Premium Nature-Inspired UI**: Beautiful emerald/forest green styling supporting responsive light and dark themes.
* **CNN Training Pipeline**: A customizable PyTorch model training script that allows training custom CNNs or fine-tuning pretrained ResNets on new leaf datasets.

---

## 📁 Directory Structure

The repository is organized into distinct, modular directories:

```
├── backend-api/          # Flask REST API server & database routing
│   ├── static/           # Stored uploads of scanned leaves
│   ├── templates/        # Server status layouts
│   ├── app.py            # API Gateway, DB connections, and routes
│   ├── utils.py          # Legacy HTML treatment dictionary
│   └── requirements.txt  # Python package requirements
│
├── ml-model/             # CNN model architectures, pipelines, and weights
│   ├── models/           # Pretrained ResNet34 classification weights (.pth)
│   ├── cnn_pipeline.py   # Dataset augmentations, CNN class, training loop
│   └── model.py          # Softmax inference wrapper & path resolver
│
├── mobile-app/           # React Native Expo mobile application
│   ├── src/
│   │   ├── app/          # Navigation routes (Welcome, Home, Scan, Result, Profile)
│   │   ├── constants/    # Global Colors & Spacing themes
│   │   └── services/     # API Client (multipart uploads & response mapping)
│   └── package.json      # Node dependency registry
│
├── database/             # Relational database configurations
│   ├── plant_disease.db  # Seeding SQLite local database
│   └── schema.sql        # PostgreSQL table definitions
│
└── docs/                 # Architectural plans & API contracts
    └── system_design.md  # System Architecture, ERD, and contracts
```

---

## 🛠️ Tech Stack

* **Frontend**: React Native, Expo, Lucide Icons, React Native Safe Area Context.
* **Backend**: Flask (Python), Flask-CORS, Pillow, psycopg2-binary (PostgreSQL), sqlite3.
* **AI/Machine Learning**: PyTorch, torchvision (ResNet34 Backbone).
* **Database**: PostgreSQL (Production), SQLite (Local Fallback).

---

## ⚙️ Installation & Setup

### 1. Prerequisites
Ensure you have the following installed on your machine:
* Python 3.9+ (Python 3.14 recommended)
* Node.js (v18+) & npm
* Git

---

### 2. Backend API Setup & Startup

1. Navigate to the `backend-api` directory:
   ```bash
   cd backend-api
   ```

2. (Optional) Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows
   .\venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
   *Note: If Python 3.14+ is used, pip will fetch latest PyTorch wheels compatible with CPU.*

4. Launch the Flask API server:
   ```bash
   python app.py
   ```
   *The server will initialize the SQLite database at `database/plant_disease.db` automatically and listen on `http://127.0.0.1:5000`.*

---

### 3. Mobile Frontend Setup & Startup

1. Navigate to the `mobile-app` directory:
   ```bash
   cd ../mobile-app
   ```

2. Install Expo and React Native dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   # Run in Web Mode
   npm run web
   # Or start default Metro Bundler (scannable via Expo Go)
   npm start
   ```

---

### 4. Running the ML CNN Training Pipeline

If you want to train the ResNet34 model or custom CNN on your own datasets (e.g., PlantVillage dataset):

1. Create a `data/` folder inside the `ml-model/` directory, and arrange leaf images in subfolders matching the class labels.
2. Navigate to `ml-model/` and run the pipeline:
   ```bash
   python cnn_pipeline.py
   ```
   *The training pipeline automatically splits data (80/20 train/val), applies random rotations and flips, runs the training epochs, and saves the best model weights to `ml-model/models/plantDisease-resnet34.pth`.*

---

## 🔌 API Contract Reference

* **`GET /health`**: Verifies backend server and shows active database type (SQLite / PostgreSQL).
* **`POST /predict`**: Accepts multipart/form-data images in `image` field and returns structured JSON diagnosis.
* **`GET /scans`**: Retrieves detailed history logs of past leaf scans.

---

## 👥 Maintainers & Owners

* **Tadia Emekson** - [@tadiaemekson](https://github.com/tadiaemekson)
* **Anne Benita** - [@Anne-Benita](https://github.com/Anne-Benita)

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
