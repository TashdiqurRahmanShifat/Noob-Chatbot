# AI Chatbot

Full-stack AI chatbot application with chat history persistence, built with React and Node.js. Features include session management, dark/light mode, and ChatGPT-style UI.

🔗 **Live Demo**: [noob-chatbot-x2y1.vercel.app](https://noob-chatbot-x2y1.vercel.app)

## Features

- 💬 AI-powered conversations using Nebius AI (GPT-OSS-120B)
- 📝 Persistent chat history stored in MongoDB Atlas
- 🗂️ Multiple chat sessions with sidebar navigation
- 🗑️ Delete individual chat sessions
- 🔒 Secure with rate limiting and CORS protection
- ⏰ Auto-delete chats after 30 days

## Tech Stack

**Frontend**: React, Vite, Tailwind CSS  
**Backend**: Node.js, Express, OpenAI SDK (Nebius AI)

## Local Setup

To run this project locally, you need to run both the server and client with `npm run dev`.

### Backend (Server folder)

```bash
cd Server
npm init -y
npm install express cors dotenv helmet express-rate-limit
npm install openai
```

Create `.env` file:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatbot?retryWrites=true
NEBIUS_API_KEY=your_nebius_api_key
FRONTEND_URL=http://localhost:5173
PORT=5001
```

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd Server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

## Deployment (Vercel)

1. **Backend**: Deploy `Server` folder, add `NEBIUS_API_KEY`,`MONGODB_URI`and `FRONTEND_URL` env vars
2. **Frontend**: Deploy `client` folder, add `VITE_API_URL` env var