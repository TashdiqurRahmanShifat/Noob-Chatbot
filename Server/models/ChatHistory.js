import mongoose from "mongoose";

const chatHistorySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true // For faster user-specific queries
    },
    sessionId: {
        type: String,
        required: true,
        index: true // For faster queries
    },
    messages: [{
        role: {
            type: String,
            enum: ['user', 'assistant'],
            required: true
        },
        content: {
            type: String, // question or answer text
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true,
    expires: 2592000 // Auto-delete after 30 days
});

// Compound index for userId + sessionId lookups for faster queries
chatHistorySchema.index({ userId: 1, sessionId: 1 }); 

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

export default ChatHistory;
