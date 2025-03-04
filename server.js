const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { CohereClientV2 } = require("cohere-ai");

dotenv.config();
const app = express();
const corsOptions = {
  origin: [
    "http://localhost:3001",
    "https://health-chat-bot-frontend.vercel.app",
  ],
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type,Authorization",
};
app.use(cors(corsOptions));
app.use(express.json());

// Initialize Cohere API
const cohere = new CohereClientV2({
  token: process.env.COHERE_API_KEY,
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

// Chatbot API
app.post("/chat", async (req, res) => {
  const { message } = req.body;
  console.log(message);
  try {
    const response = await cohere.chat({
      model: "command-r",
      messages: [{ role: "user", content: message }],
    });
    console.log(response.message.content[0].text);
    res.json({ reply: response.message.content[0].text });

  } catch (error) {
    console.error("❌ Cohere API Error:", error);
    res.status(500).json({ error: "Error generating response" });
  }
});

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
