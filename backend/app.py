import os
from flask import Flask, request, jsonify
from PIL import Image
import torch
import torch.nn as nn
from torchvision import transforms
from flask_cors import CORS

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

app = Flask(__name__)
CORS(app)

model = None


def ConvBlock(in_channels, out_channels, pool=False):
    layers = [
        nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1),
        nn.BatchNorm2d(out_channels),
        nn.ReLU(inplace=True),
    ]
    if pool:
        layers.append(nn.MaxPool2d(4))
    return nn.Sequential(*layers)


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

# Dictionary with descriptions and treatments
disease_info = {
    "Apple - Apple scab": {
        "description": "Fungal disease causing dark, scabby lesions on leaves and fruit.",
        "treatment": "Apply fungicide early in the season. Remove and destroy fallen leaves.",
    },
    "Apple - Black rot": {
        "description": "Fungal disease causing rotting of fruit and leaves.",
        "treatment": "Prune infected branches. Use appropriate fungicides.",
    },
    "Apple - Cedar apple rust": {
        "description": "Orange spots on leaves due to fungal infection spread from cedar trees.",
        "treatment": "Remove nearby cedar hosts. Apply fungicide during early season.",
    },
    "Apple - Healthy": {
        "description": "No disease detected.",
        "treatment": "No treatment required.",
    },
    "Blueberry - Healthy": {
        "description": "No disease detected.",
        "treatment": "No treatment required.",
    },
    "Cherry (including sour) - Powdery mildew": {
        "description": "White powdery fungal growth on leaves and fruit.",
        "treatment": "Use sulfur-based fungicides. Ensure proper air circulation.",
    },
    "Cherry (including sour) - Healthy": {
        "description": "No disease detected.",
        "treatment": "No treatment required.",
    },
    "Corn (maize) - Cercospora leaf spot Gray leaf spot": {
        "description": "Gray to tan lesions on leaves caused by Cercospora fungus.",
        "treatment": "Use resistant hybrids and fungicides.",
    },
    "Corn (maize) - Common rust": {
        "description": "Rust-colored pustules on leaves caused by fungal spores.",
        "treatment": "Use resistant varieties and apply fungicides if needed.",
    },
    "Corn (maize) - Northern Leaf Blight": {
        "description": "Long gray-green lesions on leaves, leading to reduced yield.",
        "treatment": "Plant resistant hybrids. Apply fungicides at tasseling stage.",
    },
    "Corn (maize) - Healthy": {
        "description": "No disease detected.",
        "treatment": "No treatment required.",
    },
    "Grape - Black rot": {
        "description": "Circular brown lesions on leaves and shriveled black fruit.",
        "treatment": "Apply fungicides and remove infected fruit.",
    },
    "Grape - Esca (Black Measles)": {
        "description": "Interveinal chlorosis and necrotic spots on leaves.",
        "treatment": "Remove infected vines. Avoid water stress.",
    },
    "Grape - Leaf blight (Isariopsis Leaf Spot)": {
        "description": "Angular brown lesions on leaves caused by fungus.",
        "treatment": "Use fungicides and prune infected leaves.",
    },
    "Grape - Healthy": {
        "description": "No disease detected.",
        "treatment": "No treatment required.",
    },
    "Orange - Haunglongbing (Citrus greening)": {
        "description": "Yellow shoots, blotchy mottling of leaves, and bitter fruit.",
        "treatment": "Remove infected trees. Control psyllid vector with insecticides.",
    },
    "Peach - Bacterial spot": {
        "description": "Dark spots on leaves and fruit caused by bacteria.",
        "treatment": "Apply copper-based sprays. Avoid overhead irrigation.",
    },
    "Peach - Healthy": {
        "description": "No disease detected.",
        "treatment": "No treatment required.",
    },
    "Pepper, bell - Bacterial spot": {
        "description": "Water-soaked spots on leaves and fruit.",
        "treatment": "Use certified seeds. Apply bactericides.",
    },
    "Pepper, bell - Healthy": {
        "description": "No disease detected.",
        "treatment": "No treatment required.",
    },
    "Potato - Early blight": {
        "description": "Dark concentric rings on lower leaves, leading to defoliation.",
        "treatment": "Use fungicides like chlorothalonil. Rotate crops.",
    },
    "Potato - Late blight": {
        "description": "Dark blotches on leaves and white mold underneath.",
        "treatment": "Use resistant varieties and systemic fungicides.",
    },
    "Potato - Healthy": {
        "description": "No disease detected.",
        "treatment": "No treatment required.",
    },
    "Raspberry - Healthy": {
        "description": "No disease detected.",
        "treatment": "No treatment required.",
    },
    "Soybean - Healthy": {
        "description": "No disease detected.",
        "treatment": "No treatment required.",
    },
    "Squash - Powdery mildew": {
        "description": "White powdery fungal growth on leaf surfaces.",
        "treatment": "Use sulfur or neem oil. Ensure good airflow.",
    },
    "Strawberry - Leaf scorch": {
        "description": "Purple or red spots on leaves with yellow margins.",
        "treatment": "Remove infected leaves. Use resistant varieties.",
    },
    "Strawberry - Healthy": {
        "description": "No disease detected.",
        "treatment": "No treatment required.",
    },
    "Tomato - Bacterial spot": {
        "description": "Small dark lesions on leaves and fruit, leading to rot.",
        "treatment": "Apply copper-based sprays. Avoid working in wet fields.",
    },
    "Tomato - Early blight": {
        "description": "Dark concentric spots on lower leaves caused by fungus.",
        "treatment": "Use resistant varieties and fungicides like chlorothalonil or copper sprays.",
    },
    "Tomato - Late blight": {
        "description": "Dark patches on leaves and stems, often with white mold.",
        "treatment": "Apply systemic fungicides. Remove infected plants.",
    },
    "Tomato - Leaf Mold": {
        "description": "Yellow spots on top leaf surface and olive mold below.",
        "treatment": "Improve ventilation. Use chlorothalonil or copper-based sprays.",
    },
    "Tomato - Septoria leaf spot": {
        "description": "Small round spots with gray centers and dark borders.",
        "treatment": "Remove infected leaves. Apply fungicides regularly.",
    },
    "Tomato - Spider mites Two-spotted spider mite": {
        "description": "Yellow speckling on leaves caused by mites.",
        "treatment": "Use miticides or insecticidal soaps.",
    },
    "Tomato - Target Spot": {
        "description": "Brown lesions with concentric rings, often confused with early blight.",
        "treatment": "Use fungicides and rotate crops.",
    },
    "Tomato - Tomato Yellow Leaf Curl Virus": {
        "description": "Yellowing and curling of leaves, stunted growth.",
        "treatment": "Use virus-free seedlings. Control whiteflies.",
    },
    "Tomato - Tomato mosaic virus": {
        "description": "Mottled yellow or light green leaves, stunted growth.",
        "treatment": "Remove infected plants. Disinfect tools.",
    },
    "Tomato - Healthy": {
        "description": "No disease detected.",
        "treatment": "No treatment required.",
    },
}


def preprocess_image(image):
    transform = transforms.Compose(
        [transforms.Resize((256, 256)), transforms.ToTensor()]
    )
    image = transform(image).unsqueeze(0)
    return image


def predict_image(image):
    global model
    if model is None:
        model_path = "plant-disease-model-complete.pth"
        model = torch.load(model_path, map_location=torch.device("cpu"))
        model.eval()
    with torch.no_grad():
        output = model(image)
    _, predicted_idx = torch.max(output, 1)
    predicted_class = class_names[predicted_idx.item()]
    return predicted_class


@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    try:
        image = Image.open(file.stream).convert("RGB")
        image_tensor = preprocess_image(image)
        predicted_class = predict_image(image_tensor)

        metadata = disease_info.get(
            predicted_class,
            {
                "description": "Description not available.",
                "treatment": "Treatment information not available.",
            },
        )

        return jsonify(
            {
                "prediction": predicted_class,
                "description": metadata["description"],
                "treatment": metadata["treatment"], 
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/", methods=["GET"])
def home():
    return "Welcome to Plant Disease Classification API"


@app.route("/hello", methods=["GET"])
def hello():
    return "Hello World!"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
