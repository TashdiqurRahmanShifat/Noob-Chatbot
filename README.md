# AI Chatbot

Full-stack AI chatbot application with **Google Authentication**, chat history persistence, and user-specific data isolation. Built with React, Node.js, Firebase, and MongoDB.

🔗 **Live Demo**: [noob-chatbot-x2y1.vercel.app](https://noob-chatbot-x2y1.vercel.app)

## Features

- 🔐 **Google Sign-In** - Secure authentication via Firebase
- 👤 **User Isolation** - Each user sees only their own chats
- 💬 AI-powered conversations using Nebius AI (GPT-OSS-120B)
- 📝 Persistent chat history stored in MongoDB Atlas
- 🗂️ Multiple chat sessions with sidebar navigation
- 🗑️ Delete individual chat sessions
- 🔒 Secure with JWT,rate limiting and CORS protection
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
JWT_SECRET=your-secure-random-string-change-this
FRONTEND_URL=http://localhost:5173
PORT=5001
```

**Frontend** - Create `client/.env`:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Run the Application

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