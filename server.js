const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { CohereClientV2 } = require("cohere-ai");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

dotenv.config();
const app = express();
const corsOptions = {
  origin: "*",
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

const JWT_SECRET = process.env.JWT_SECRET

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  console.log(name);
  console.log(email);
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });

    await newUser.save();
    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token, userId: user._id, name: user.name });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/profile", async (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});
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
