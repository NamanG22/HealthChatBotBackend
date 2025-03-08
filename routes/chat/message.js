const express = require('express');
const router = express.Router();
const ChatSession = require('../../models/ChatSession');

router.post('/message', async (req, res) => {
    try {
        const { userEmail, sessionId, message } = req.body;

        console.log("userEmail", userEmail);
        console.log("sessionId", sessionId);
        console.log("message", message);

        const updatedSession = await ChatSession.findOneAndUpdate(
            { userEmail, sessionId, isActive: true },
            { 
                $push: { 
                    messages: {
                        role: message.sender === 'user' ? 'user' : 'assistant',
                        content: message.text
                    }
                }
            },
            { new: true }
        );

        if (!updatedSession) {
            return res.status(404).json({ message: 'Session not found' });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Message saving error:', error);
        res.status(500).json({ message: 'Error saving message' });
    }
});

module.exports = router;