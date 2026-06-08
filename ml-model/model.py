import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import io
import os


class Plant_Disease_Model(nn.Module):

    def __init__(self):
        super().__init__()
        # Load ResNet34
        self.network = models.resnet34(pretrained=True)
        num_ftrs = self.network.fc.in_features
        # Classify into 38 disease categories
        self.network.fc = nn.Linear(num_ftrs, 38)

    def forward(self, xb):
        out = self.network(xb)
        return out


# Transformation mapping used during training
transform = transforms.Compose(
    [transforms.Resize(size=128),
     transforms.ToTensor()])

num_classes = [
    'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___healthy',
    'Blueberry___healthy', 'Cherry_(including_sour)___Powdery_mildew', 'Cherry_(including_sour)___healthy',
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot', 'Corn_(maize)___Common_rust_',
    'Corn_(maize)___Northern_Leaf_Blight', 'Corn_(maize)___healthy', 'Grape___Black_rot',
    'Grape___Esca_(Black_Measles)', 'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', 'Grape___healthy',
    'Orange___Haunglongbing_(Citrus_greening)', 'Peach___Bacterial_spot', 'Peach___healthy',
    'Pepper,_bell___Bacterial_spot', 'Pepper,_bell___healthy', 'Potato___Early_blight',
    'Potato___Late_blight', 'Potato___healthy', 'Raspberry___healthy', 'Soybean___healthy',
    'Squash___Powdery_mildew', 'Strawberry___Leaf_scorch', 'Strawberry___healthy',
    'Tomato___Bacterial_spot', 'Tomato___Early_blight', 'Tomato___Late_blight', 'Tomato___Leaf_Mold',
    'Tomato___Septoria_leaf_spot', 'Tomato___Spider_mites Two-spotted_spider_mite',
    'Tomato___Target_Spot', 'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato___Tomato_mosaic_virus',
    'Tomato___healthy'
]

# Initialize model
model = Plant_Disease_Model()

# Try loading the saved model weights relative to this file
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, 'models/plantDisease-resnet34.pth')

if os.path.exists(model_path):
    print(f"[Model] Loading model weights from: {model_path}")
    model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
else:
    print(f"[Model Warning] Weights file not found at '{model_path}'. Model runs with random initialization.")

model.eval()


def predict_image(img_bytes):
    """
    Takes raw image bytes, runs inference through ResNet34 model,
    and returns predicted class label and softmax confidence percentage.
    """
    img_pil = Image.open(io.BytesIO(img_bytes)).convert('RGB')
    tensor = transform(img_pil)
    xb = tensor.unsqueeze(0)
    
    with torch.no_grad():
        yb = model(xb)
        # Apply softmax to calculate prediction confidence percentage
        probabilities = torch.nn.functional.softmax(yb, dim=1)
        conf, preds = torch.max(probabilities, dim=1)
        
    class_name = num_classes[preds[0].item()]
    confidence_score = float(conf[0].item() * 100)
    
    return class_name, confidence_score
