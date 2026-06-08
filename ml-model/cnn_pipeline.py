import os
import time
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, random_split
from torchvision import transforms, models
from PIL import Image

# -------------------------------------------------------------
# 1. Custom CNN Architecture for Plant Disease Classification
# -------------------------------------------------------------
class PlantDiseaseCNN(nn.Module):
    """
    A custom CNN model designed for crop leaf disease classification.
    Consists of 4 convolutional blocks followed by fully connected layers with dropout.
    """
    def __init__(self, num_classes=38):
        super(PlantDiseaseCNN, self).__init__()
        
        # Block 1: Input [3, 128, 128] -> Output [32, 64, 64]
        self.conv1 = nn.Conv2d(in_channels=3, out_channels=32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.relu1 = nn.ReLU()
        self.pool1 = nn.MaxPool2d(kernel_size=2, stride=2)
        
        # Block 2: Input [32, 64, 64] -> Output [64, 32, 32]
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        self.relu2 = nn.ReLU()
        self.pool2 = nn.MaxPool2d(2, 2)
        
        # Block 3: Input [64, 32, 32] -> Output [128, 16, 16]
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(128)
        self.relu3 = nn.ReLU()
        self.pool3 = nn.MaxPool2d(2, 2)
        
        # Block 4: Input [128, 16, 16] -> Output [256, 8, 8]
        self.conv4 = nn.Conv2d(128, 256, kernel_size=3, padding=1)
        self.bn4 = nn.BatchNorm2d(256)
        self.relu4 = nn.ReLU()
        self.pool4 = nn.MaxPool2d(2, 2)
        
        # Fully Connected Layers
        # Flat features: 256 channels * 8 width * 8 height = 16384
        self.fc1 = nn.Linear(256 * 8 * 8, 512)
        self.relu_fc = nn.ReLU()
        self.dropout = nn.Dropout(p=0.5)
        self.fc2 = nn.Linear(512, num_classes)
        
    def forward(self, x):
        x = self.pool1(self.relu1(self.bn1(self.conv1(x))))
        x = self.pool2(self.relu2(self.bn2(self.conv2(x))))
        x = self.pool3(self.relu3(self.bn3(self.conv3(x))))
        x = self.pool4(self.relu4(self.bn4(self.conv4(x))))
        
        # Flatten
        x = x.view(x.size(0), -1)
        
        # Dense layers
        x = self.relu_fc(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)
        return x

# -------------------------------------------------------------
# 2. ResNet34 Transfer Learning Pipeline
# -------------------------------------------------------------
class ResNet34Transfer(nn.Module):
    """
    A transfer learning model using ResNet34 pretrained on ImageNet
    with a custom classification head.
    """
    def __init__(self, num_classes=38, pretrained=True):
        super(ResNet34Transfer, self).__init__()
        self.network = models.resnet34(pretrained=pretrained)
        num_ftrs = self.network.fc.in_features
        self.network.fc = nn.Linear(num_ftrs, num_classes)
        
    def forward(self, x):
        return self.network(x)

# -------------------------------------------------------------
# 3. Custom Dataset Loader for Leaf Images
# -------------------------------------------------------------
class PlantLeafDataset(Dataset):
    """
    A custom PyTorch Dataset that loads plant leaves from a structured directory.
    Assumes subfolders represent class categories.
    """
    def __init__(self, root_dir, transform=None):
        self.root_dir = root_dir
        self.transform = transform
        self.images = []
        self.labels = []
        
        # List classes (subdirectories)
        if os.path.exists(root_dir):
            self.classes = sorted([d for d in os.listdir(root_dir) if os.path.isdir(os.path.join(root_dir, d))])
            self.class_to_idx = {cls_name: i for i, cls_name in enumerate(self.classes)}
            
            for cls_name in self.classes:
                cls_dir = os.path.join(root_dir, cls_name)
                for img_name in os.listdir(cls_dir):
                    if img_name.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                        self.images.append(os.path.join(cls_dir, img_name))
                        self.labels.append(self.class_to_idx[cls_name])
        else:
            self.classes = []
            self.class_to_idx = {}
            print(f"[Dataset Warning] Path '{root_dir}' does not exist.")

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        img_path = self.images[idx]
        image = Image.open(img_path).convert('RGB')
        label = self.labels[idx]
        
        if self.transform:
            image = self.transform(image)
            
        return image, label

# -------------------------------------------------------------
# 4. Training and Validation Loop Functions
# -------------------------------------------------------------
def train_epoch(model, dataloader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    
    for images, labels in dataloader:
        images, labels = images.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item() * images.size(0)
        _, preds = torch.max(outputs, 1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)
        
    epoch_loss = running_loss / total
    epoch_acc = correct / total
    return epoch_loss, epoch_acc

def evaluate(model, dataloader, criterion, device):
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0
    
    with torch.no_grad():
        for images, labels in dataloader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            
            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)
            
    val_loss = running_loss / total
    val_acc = correct / total
    return val_loss, val_acc

# -------------------------------------------------------------
# 5. Main Training Pipeline Orchestration
# -------------------------------------------------------------
def run_training_pipeline(data_dir='./data', model_type='resnet', num_epochs=10, batch_size=32, lr=0.001):
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"[Training Pipeline] Starting pipeline using device: {device}")
    
    # Image Augmentations & Preprocessing
    train_transform = transforms.Compose([
        transforms.Resize((128, 128)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ToTensor(),
        # ImageNet normalization standard
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((128, 128)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # Initialize Dataset
    if not os.path.exists(data_dir):
        print(f"[Training Pipeline] Error: Data directory '{data_dir}' not found.")
        print("[Training Pipeline] Create a folder with subfolders for each of the 38 plant disease classes.")
        return None
        
    full_dataset = PlantLeafDataset(root_dir=data_dir, transform=train_transform)
    num_samples = len(full_dataset)
    print(f"[Training Pipeline] Loaded {num_samples} images across {len(full_dataset.classes)} classes.")
    
    if num_samples == 0:
        print("[Training Pipeline] Error: No images loaded. Exiting.")
        return None
        
    # Train / Val Split (80% / 20%)
    val_size = int(num_samples * 0.2)
    train_size = num_samples - val_size
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])
    
    # Assign specific transform for validation
    val_dataset.dataset.transform = val_transform
    
    # Dataloaders
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    
    # Model Selection
    if model_type.lower() == 'resnet':
        model = ResNet34Transfer(num_classes=len(full_dataset.classes), pretrained=True)
        print("[Model] Using ResNet34 Pretrained Backbone.")
    else:
        model = PlantDiseaseCNN(num_classes=len(full_dataset.classes))
        print("[Model] Using Custom 4-Layer Convolutional Network (PlantDiseaseCNN).")
        
    model = model.to(device)
    
    # Loss & Optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)
    
    # Train Loop
    best_acc = 0.0
    for epoch in range(num_epochs):
        start_time = time.time()
        
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc = evaluate(model, val_loader, criterion, device)
        
        duration = time.time() - start_time
        print(f"Epoch [{epoch+1}/{num_epochs}] ({duration:.1f}s) - "
              f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc*100:.2f}% | "
              f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc*100:.2f}%")
        
        # Save best weights
        if val_acc > best_acc:
            best_acc = val_acc
            os.makedirs('./models', exist_ok=True)
            torch.save(model.state_dict(), './models/plantDisease-resnet34.pth')
            print(f" -> Best model weights saved with Val Acc: {val_acc*100:.2f}%")
            
    print("[Training Pipeline] Completed! Best Validation Accuracy: {:.2f}%".format(best_acc * 100))
    return model

if __name__ == '__main__':
    # Dry run script structure
    print("CNN Pipeline definitions loaded successfully.")
