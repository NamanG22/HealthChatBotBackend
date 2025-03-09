const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { CohereClientV2 } = require("cohere-ai");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

const sessionRouter = require('./routes/chat/session');
const messageRouter = require('./routes/chat/message');

dotenv.config();
const app = express();
const corsOptions = {
  origin: [
    "http://localhost:3000",           // Local development
    "https://chat.santesys.in"         // Production frontend
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
};
app.use(cors(corsOptions));
app.use(express.json());

// If you're using Express 4.x, you might also need this for preflight requests
app.options('*', cors(corsOptions));

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

app.use('/api/chat', sessionRouter);
app.use('/api/chat', messageRouter);

app.get('/verify-token', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Return the email associated with the token
    res.json({ email: decoded.email });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}); 

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
    res.json({ token, userId: user._id, name: user.name, email: user.email });
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
    (async () => {
      const res = await cohere.chat({
        model: 'command-r-plus-08-2024',
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      });

  console.log("res", res);
  console.log(res.message.content[0].text);
  res.json({ reply: res.message.content[0].text });
  })();
    // const response = await cohere.chat({
    //   model: "command-r",
    //   messages: [{ role: "user", content: message }],
    // });

  } catch (error) {
    console.error("❌ Cohere API Error:", error);
    res.status(500).json({ error: "Error generating response" });
  }
});

app.get("/chats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const chats = await ChatSession.find({ userId }).sort({ createdAt: -1 });

    res.json(chats.map(chat => ({ sessionId: chat._id, title: chat.title })));
  } catch (error) {
    console.error("❌ Fetch Chats Error:", error);
    res.status(500).json({ error: "Error fetching chats" });
  }
});
// ✅ API to Load a Specific Chat
app.get("/chat/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const chat = await ChatSession.findById(sessionId);

    res.json(chat ? chat.messages : []);
  } catch (error) {
    console.error("❌ Fetch Chat Error:", error);
    res.status(500).json({ error: "Error fetching chat session" });
  }
})

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
