import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import connectDB from "./config/db.js";
import ChatHistory from "./models/ChatHistory.js";

const app = express(); // Initialize Express App

// Connect to MongoDB
connectDB();

// Security Middlewares
app.use(helmet());
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:3000", // Allow only this origin.Rest can't access
        credentials: true,
    })
)

// Each IP address can make a maximum of 100 requests per 15-minute period
// After 15 minutes, the counter resets for that IP
const limiter=rateLimit({
    windowMs:15*60*1000, // 15 minutes
    max:100, // limit each IP to 100 requests per windowMs
    standardHeaders:true,
    legacyHeaders:false,
    message:"Too many requests"
})

app.use(limiter);
app.use(express.json({limit:"10mb"})); // Allow express to parse json data with limit of 10mb

const client = new OpenAI({
    baseURL: "https://api.tokenfactory.nebius.com/v1/",
    apiKey: process.env.NEBIUS_API_KEY
})
 
app.post("/api/chatbot", async (req,res) => {
    try{
        const {queries, sessionId}=req.body; // Get query and session ID
        if(!queries){
            return res.status(400).json({ error:"Queries are required." });
        }

        const messages=[
            {
                role:"system",
                content:"You are a chatbot assistant. Provide clear, concise replies that capture the key points and main ideas. Keep replies within 1000 tokens. Be direct and focus on the most important information."
            },
            {
                role:"user",
                content:`Give answer to the following question in a clear and concise manner, highlighting the key points:\n\n${queries}`
            }
        ];

        const response = await client.chat.completions.create({
            model:"openai/gpt-oss-120b",
            messages:messages,
            max_tokens:2000, // Limit response to 2000 tokens to control response length
            temperature:0.3, // Lower temperature for more focused responses
        });

        const reply=response.choices[0].message.content;
        if(!reply){
            return res.status(500).json({ error:"Failed to generate response." });
        }
        
        // Save chat to MongoDB
        if(sessionId) { // Only save if sessionId is provided
            await ChatHistory.findOneAndUpdate(
                { sessionId }, // Find chat by sessionId
                { 
                    $push: { // Push new messages to the messages array
                        messages: [
                            { role: 'user', content: queries }, // User's question
                            { role: 'assistant', content: reply } // AI's reply
                        ]
                    }
                },
                { upsert: true, new: true } // Update if exists, else create new
            );
        }
        
        res.json({reply}); // Send back the chatbot reply
    } catch(error){
        console.error("Error in /api/chatbot:",error);
        res.status(500).json({ error:"Internal Server Error", details:error.message });
    }
})

// Get chat history for a session
app.get("/api/chatbot/history/:sessionId", async (req, res) => {
    try {
        const { sessionId } = req.params;
        const history = await ChatHistory.findOne({ sessionId });
        
        if (!history) {
            return res.json({ messages: [] });
        }
        
        res.json({ messages: history.messages });
    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({ error: "Failed to fetch chat history" });
    }
});

// Get all chat sessions
app.get("/api/chatbot/sessions", async (req, res) => {
    try {
        const sessions = await ChatHistory.find()
            .select('sessionId createdAt messages') // Return only necessary fields
            .sort({ createdAt: -1 }) // Most recent sessions first
            .limit(50); // Only return the latest 50 sessions
        
        res.json({ sessions });
    } catch (error) {
        console.error("Error fetching sessions:", error);
        res.status(500).json({ error: "Failed to fetch sessions" });
    }
});

// Delete a chat session
app.delete("/api/chatbot/history/:sessionId", async (req, res) => {
    try {
        const { sessionId } = req.params; // Extract sessionId from URL parameters
        await ChatHistory.findOneAndDelete({ sessionId });
        res.json({ success: true, message: "Chat deleted successfully" });
    } catch (error) {
        console.error("Error deleting chat:", error);
        res.status(500).json({ error: "Failed to delete chat" });
    }
});

// Port Configuration for Backend Server
const PORT=process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});