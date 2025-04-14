const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyAhLSNxek1FO343UFH1pDNKoAXFDUN8L1g");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const express = require("express");
const app = express();
app.use(express.json());
const cors = require("cors");
app.use(cors());
//hello
app.post("/gemini", async (req, res) => {
  try {
    const { prompt } = req.body;
    const result = await model.generateContent(prompt);
    res.json({ response: result.response.text() });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ error: "Error generating content" });
  }
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
