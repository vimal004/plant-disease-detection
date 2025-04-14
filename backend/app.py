import os
from flask import Flask, request, jsonify
from PIL import Image
import torch
import torch.nn as nn
from torchvision import transforms
from flask_cors import CORS

# Fix OpenMP error
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Lazy-load the model
model = None


# Define the model architecture (same as during training)
class ResNet9(nn.Module):
    def __init__(self, in_channels, num_classes):
        super().__init__()
        self.conv1 = ConvBlock(in_channels, 64)
        self.conv2 = ConvBlock(64, 128, pool=True)
        self.res1 = nn.Sequential(ConvBlock(128, 128), ConvBlock(128, 128))
        self.conv3 = ConvBlock(128, 256, pool=True)
        self.conv4 = ConvBlock(256, 512, pool=True)
        self.res2 = nn.Sequential(ConvBlock(512, 512), ConvBlock(512, 512))
        self.classifier = nn.Sequential(
            nn.MaxPool2d(4), nn.Flatten(), nn.Linear(512, num_classes)
        )

    def forward(self, xb):
        out = self.conv1(xb)
        out = self.conv2(out)
        out = self.res1(out) + out
        out = self.conv3(out)
        out = self.conv4(out)
        out = self.res2(out) + out
        out = self.classifier(out)
        return out


# Define the ConvBlock (used in ResNet9)
def ConvBlock(in_channels, out_channels, pool=False):
    layers = [
        nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1),
        nn.BatchNorm2d(out_channels),
        nn.ReLU(inplace=True),
    ]
    if pool:
        layers.append(nn.MaxPool2d(4))
    return nn.Sequential(*layers)


# Define the class names
class_names = [
    "Apple - Apple scab",
    "Apple - Black rot",
    "Apple - Cedar apple rust",
    "Apple - Healthy",
    "Blueberry - Healthy",
    "Cherry (including sour) - Powdery mildew",
    "Cherry (including sour) - Healthy",
    "Corn (maize) - Cercospora leaf spot Gray leaf spot",
    "Corn (maize) - Common rust",
    "Corn (maize) - Northern Leaf Blight",
    "Corn (maize) - Healthy",
    "Grape - Black rot",
    "Grape - Esca (Black Measles)",
    "Grape - Leaf blight (Isariopsis Leaf Spot)",
    "Grape - Healthy",
    "Orange - Haunglongbing (Citrus greening)",
    "Peach - Bacterial spot",
    "Peach - Healthy",
    "Pepper, bell - Bacterial spot",
    "Pepper, bell - Healthy",
    "Potato - Early blight",
    "Potato - Late blight",
    "Potato - Healthy",
    "Raspberry - Healthy",
    "Soybean - Healthy",
    "Squash - Powdery mildew",
    "Strawberry - Leaf scorch",
    "Strawberry - Healthy",
    "Tomato - Bacterial spot",
    "Tomato - Early blight",
    "Tomato - Late blight",
    "Tomato - Leaf Mold",
    "Tomato - Septoria leaf spot",
    "Tomato - Spider mites Two-spotted spider mite",
    "Tomato - Target Spot",
    "Tomato - Tomato Yellow Leaf Curl Virus",
    "Tomato - Tomato mosaic virus",
    "Tomato - Healthy",
]


# Image preprocessing function
def preprocess_image(image):
    transform = transforms.Compose(
        [
            transforms.Resize((256, 256)),  # Resize to match training size
            transforms.ToTensor(),  # Convert to tensor
        ]
    )
    image = transform(image).unsqueeze(0)  # Add batch dimension
    return image


# Prediction function
def predict_image(image):
    global model
    if model is None:
        # Load model only when needed
        model_path = "plant-disease-model-complete.pth"
        model = torch.load(model_path, map_location=torch.device("cpu"))
        model.eval()
    with torch.no_grad():
        output = model(image)
    _, predicted_idx = torch.max(output, 1)
    predicted_class = class_names[predicted_idx.item()]
    return predicted_class


# Flask API endpoint
@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    try:
        image = Image.open(file.stream).convert("RGB")
        image = preprocess_image(image)
        prediction = predict_image(image)
        return jsonify({"prediction": prediction})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/hello", methods=["GET"])
def hello():
    return "Hello World!"


@app.route("/", methods=["GET"])
def home():
    return "Welcome to Plant Disease Classification API"


# Run the Flask app
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
