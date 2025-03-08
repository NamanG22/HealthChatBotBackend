const express = require('express');
const router = express.Router();
const ChatSession = require('../../models/ChatSession');
const { v4: uuidv4 } = require('uuid');

// Create new session
router.post('/session', async (req, res) => {
    try {
        const { userEmail } = req.body;

        // First check if user has an active session
        const existingSession = await ChatSession.findOne({ 
            userEmail, 
            isActive: true 
        }).sort({ createdAt: -1 });  // Get the most recent active session

        if (existingSession) {
            // Return existing session
            return res.status(200).json({ 
                sessionId: existingSession.sessionId,
                messages: existingSession.messages 
            });
        }

        // If no active session exists, create new one
        const sessionId = uuidv4();
        const session = await ChatSession.create({
            userEmail,
            sessionId,
            messages: [],
            isActive: true
        });

        res.status(200).json({ 
            sessionId: session.sessionId,
            messages: session.messages 
        });
    } catch (error) {
        console.error('Session creation error:', error);
        res.status(500).json({ message: 'Error creating session' });
    }
});

// Get user sessions
router.get('/session', async (req, res) => {
    try {
        const { userEmail } = req.query;
        const sessions = await ChatSession.find({ 
            userEmail, 
            isActive: true 
        }).sort({ updatedAt: -1 });
        
        res.status(200).json(sessions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sessions' });
    }
});

// End all active sessions for a user on logout
router.post('/session/end-user-sessions', async (req, res) => {
    try {
        const { userEmail } = req.body;

        const result = await ChatSession.updateMany(
            { 
                userEmail,
                isActive: true 
            },
            { 
                isActive: false,
                updatedAt: new Date()
            }
        );

        res.status(200).json({ 
            message: 'All active sessions ended for user',
            count: result.modifiedCount
        });
    } catch (error) {
        console.error('Session end error:', error);
        res.status(500).json({ message: 'Error ending sessions' });
    }
});

module.exports = router;