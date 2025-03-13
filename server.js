// const express = require("express");
// const cors = require("cors");
// const path = require("path");
// require("dotenv").config();
// const { OpenAI } = require("openai");

// const app = express();
// const PORT = process.env.PORT || 5500;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Serve Static Files (Frontend)
// app.use(express.static(path.join(__dirname)));

// // Initialize OpenAI (correct way for v4.x.x)
// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY,
// });

// // Chatbot API Route
// app.post("/chat", async (req, res) => {
//     const userMessage = req.body.message;
//     try {
//         const response = await openai.chat.completions.create({
//             model: "gpt-3.5-turbo",
//             messages: [{ role: "user", content: userMessage }],
//         });
//         const reply = response.data.choices[0].message.content.trim(); // Extract response text
//         res.json({ reply: reply });
//     } catch (error) {
//         console.error("Error communicating with OpenAI:", error);
//         if (error.code === 'insufficient_quota') {
//             res.status(429).send("You have exceeded your quota. Please check your plan and billing details.");
//         } else {
//             res.status(500).send("Error communicating with AI service");
//         }
//     }
// });

// app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

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
    const userId = req.body.userId; // Assume you send userId with the request

    try {
        // Save the chat message to MongoDB
        const chatMessage = new Chat({
            userId: userId,
            message: userMessage,
        });
        await chatMessage.save();

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