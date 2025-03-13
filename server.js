const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5500;

// Middleware
app.use(cors());
app.use(express.json());

// Serve Static Files (Frontend)
app.use(express.static(path.join(__dirname)));

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Chatbot API Route
app.post("/chat", async (req, res) => {
    const userMessage = req.body.message;
    try {
        const result = await model.generateContent(userMessage);
        const response = result.response.text(); // Extract response text
        res.json({ reply: response });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ reply: "Error: Failed to connect to AI" });
    }
});

// Start Server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
