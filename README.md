# Chatbot Application - Complete Documentation

## 📋 Project Overview

This is a **ChatGPT-like chatbot application** that allows users to:
- Create new conversations
- Send messages to the AI
- View conversation history in a sidebar
- Get responses from Google's Gemini AI
- Persist chat data to MongoDB

The application is built as a **monorepo** with separate frontend and backend, with real-time AI-powered responses.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CHATBOT APPLICATION                      │
├──────────────────────────┬──────────────────────────────────┤
│      FRONTEND (React)    │      BACKEND (Express.js)        │
├──────────────────────────┼──────────────────────────────────┤
│ • Components             │ • API Routes                     │
│ • State Management       │ • Controllers                    │
│ • API Client             │ • Gemini AI Integration         │
│ • Authentication         │ • Database Connection           │
└──────────────────────────┴──────────────────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │   MongoDB Database  │
                    │   (Chat Storage)    │
                    └─────────────────────┘
```

---

## 💻 Technology Stack

### Frontend
- **React 19.2.4** - UI library
- **TypeScript** - Type safety
- **Vite 8.0.8** - Build tool with HMR
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - Pre-built components
- **Zustand** - State management
- **Axios** - HTTP client
- **@clerk/react** - Authentication

### Backend
- **Express.js** - Web server framework
- **TypeScript** - Type safety
- **MongoDB 9.4.1** - Database
- **Mongoose** - MongoDB ODM
- **@google/genai** - Gemini AI API
- **Zod** - Data validation
- **dotenv** - Environment variables

---

## 🎨 Frontend Flow

### 1. **Application Structure**

```
src/
├── pages/
│   ├── ChatPage.tsx          # Main chat interface
│   └── LoginPage.tsx         # Authentication page
├── components/
│   ├── customs/
│   │   ├── ChatArea.tsx      # Message display & input
│   │   ├── Sidebar.tsx       # Chat history sidebar
│   │   └── WelcomeBanner.tsx # Welcome screen
│   ├── ui/button.tsx         # shadcn button
│   └── ProtectedRoute.tsx    # Route protection
├── store/
│   └── useChatStore.tsx      # Zustand state management
└── lib/
    ├── api.ts                # Axios instance
    └── chat.ts               # Helper functions
```

### 2. **User Journey (Frontend)**

#### Step 1: User Authentication
```
User opens app
    ↓
Clerk Authentication check
    ↓
If logged in → Redirect to ChatPage
If not → Show LoginPage
```

#### Step 2: ChatPage Load
```typescript
// pages/ChatPage.tsx
- Renders Sidebar (chat history)
- Renders ChatArea (main chat interface)
- Displays UserButton (logout, profile)
```

#### Step 3: Sidebar - View Chat History
```
Sidebar Component:
1. On mount → Fetch all chats for logged-in user
2. Display list of previous conversations
3. Click chat → Set as active chat
4. "New Chat" button → Clear chat and prepare for new conversation
```

**Code:**
```typescript
useEffect(() => {
  // Fetch chats from API: GET /api/chat/user/:userId
  const loadChats = async () => {
    const res = await api.get(`/chat/user/${user.id}`);
    setChats(mapApiChatSummary(res.data));
  };
  loadChats();
}, [user.id]);
```

#### Step 4: ChatArea - Send Message
```
User types message
    ↓
Clicks Send button or presses Enter
    ↓
handleSendMessage() is called
    ↓
Three scenarios:

SCENARIO A: New Chat
  Input: userId + message
  API Call: POST /api/chat
  Response: New chat object with user & AI messages
  Update: Sidebar refreshes with new chat
           ChatArea displays new conversation

SCENARIO B: Continue Existing Chat
  Input: message only (chatId already set)
  API Call: POST /api/chat/:id/messages
  Response: Updated chat with new messages
  Update: ChatArea adds new messages to display

SCENARIO C: Load Previous Chat
  Input: chatId (from clicking sidebar)
  API Call: GET /api/chat/:id
  Response: Chat object with full message history
  Update: ChatArea displays all messages
```

#### Step 5: Message Display
```
Messages array from store:
[
  { role: "user", content: "Hello" },
  { role: "assistant", content: "Hi! How can I help?" }
]
    ↓
Rendered as:
- User messages: Blue bubble, right-aligned
- Assistant messages: Gray bubble, left-aligned
- Loading state: Bouncing dots animation
```

### 3. **State Management (Zustand Store)**

```typescript
// useChatStore.tsx
{
  activeChatId: string | null,        // Currently opened chat ID
  chats: ChatSummary[],               // List of all chats (id, title, updatedAt)
  messages: Message[],                // Messages in active chat
  loading: boolean,                   // Loading state for API calls
  
  // Actions:
  setActiveChatId(chatId)             // Switch to different chat
  setChats(chats)                     // Update chat list
  upsertChat(chat)                    // Add or update single chat
  removeChat(chatId)                  // Delete chat
  setMessages(messages)               // Update messages in current chat
  addMessage(message)                 // Add single message
  setLoading(loading)                 // Toggle loading state
  clearChat()                         // Reset to new chat state
}
```

---

## 🔌 Backend Flow

### 1. **Server Setup**

```typescript
// server.ts
1. Load environment variables with dotenv.config()
2. Connect to MongoDB
3. Start Express server on PORT (default: 5000)
```

### 2. **Express App Configuration**

```typescript
// app.ts
- Enable CORS for frontend communication
- Parse JSON request bodies
- Mount chat routes at /api/chat
- Health check endpoint at GET /
```

### 3. **API Endpoints**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| **POST** | `/api/chat` | Create new chat |
| **POST** | `/api/chat/:id/messages` | Add message to existing chat |
| **GET** | `/api/chat/user/:userId` | Fetch all chats for user |
| **GET** | `/api/chat/:id` | Get single chat with messages |
| **DELETE** | `/api/chat/:id` | Delete a chat |

### 4. **Request Processing Flow**

#### Endpoint: POST /api/chat (Create New Chat)

```
Request arrives:
{
  userId: "user123",
  message: "What is JavaScript?"
}
    ↓
Validation (Zod):
  - Check userId exists
  - Check message not empty
    ↓
If validation fails:
  Return 400 with error details
    ↓
Call generateChatReply([], message):
  → Pass empty array (no history for new chat)
  → Send message to Gemini AI
  → Get AI response back
    ↓
Build chat object:
{
  userId: "user123",
  title: "What is JavaScript?",  // Generated from first message
  messages: [
    { role: "user", content: "What is JavaScript?" },
    { role: "assistant", content: "JavaScript is a programming language..." }
  ],
  timestamps: { createdAt, updatedAt }
}
    ↓
Save to MongoDB
    ↓
Return 201 + chat object to frontend
```

#### Endpoint: POST /api/chat/:id/messages (Add Message)

```
Request arrives with chatId and message:
{
  message: "Tell me more about functions"
}
    ↓
Validation:
  - Check message not empty
    ↓
Fetch chat from MongoDB by ID
    ↓
Extract chat history:
[
  { role: "user", content: "..." },
  { role: "assistant", content: "..." }
]
    ↓
Call generateChatReply(history, message):
  → Pass previous messages (context)
  → Send new message + history to Gemini AI
  → AI generates response based on conversation context
    ↓
Add user message to messages array
Add AI response to messages array
Update chat title if empty
    ↓
Save updated chat to MongoDB
    ↓
Return 200 + updated chat object
```

#### Endpoint: GET /api/chat/user/:userId (Get Chat List)

```
Request arrives with userId
    ↓
Find all chats where userId matches
Sort by updatedAt (newest first)
    ↓
Return only: _id, title, updatedAt (lighter response)
    ↓
Map response:
[
  { _id: "abc123", title: "What is JavaScript?", updatedAt: "2024-04-17..." },
  { _id: "def456", title: "Python tutorial", updatedAt: "2024-04-16..." }
]
```

---

## 🤖 AI Integration (Gemini API)

### 1. **Environment Setup**

```env
# .env file (server root)
GEMINI_API_KEY=AIza_xxxxxxxxxxxxxxxxxxxxx  # Your Google AI API Key
MONGO_URI=mongodb+srv://...               # MongoDB connection
PORT=5000                                 # Server port
```

**⚠️ Important:** `GEMINI_API_KEY` must start with `AIza`, not `AQ.`

### 2. **Gemini Library Setup**

```typescript
// lib/gemini.ts
import { GoogleGenAI } from "@google/genai";

// Initialize with API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Functions:
- generateChatReply(history, userMessage) → Generates AI response
```

### 3. **How AI Response is Generated**

```typescript
// generateChatReply flow:

Input:
  history = [
    { role: "user", content: "Hello" },
    { role: "assistant", content: "Hi!" }
  ]
  userMessage = "How are you?"

Process:
1. Format prompt with:
   - System message: "You are a helpful chatbot"
   - Last 8 messages from history (for context)
   - Current user message

2. Example formatted prompt:
   ```
   You are a simple helpful chatbot.
   Keep answers short, clear, and friendly.
   
   Conversation so far:
   User: Hello
   Assistant: Hi!
   
   User: How are you?
   ```

3. Send to Gemini API
4. Get text response back
5. Return response to controller

Output:
  "I'm doing great! How can I help you today?"
```

---

## 📊 Data Models

### Chat Schema (MongoDB)

```typescript
{
  _id: ObjectId,                    // Auto-generated MongoDB ID
  userId: String,                   // Clerk user ID (indexed for fast queries)
  title: String,                    // Chat title (first message truncated)
  messages: [                       // Array of messages
    {
      _id: ObjectId,
      role: "user" | "assistant",   // Who sent the message
      content: String               // Message text
    }
  ],
  createdAt: Date,                  // Auto-created timestamp
  updatedAt: Date                   // Auto-updated timestamp
}
```

### Message Structure (Frontend/Backend)

```typescript
// Frontend
type Message = {
  id: string;                  // Message ID
  role: "user" | "assistant";  // Who sent it
  content: string;             // Message text
};

// Backend (stored in MongoDB)
{
  role: "user" | "assistant",
  content: string
}
```

---

## 🔄 Complete Request-Response Cycle

### Example: User sends "Hello" in new chat

```
STEP 1: FRONTEND
┌─────────────────────────────────┐
│ User types "Hello" and clicks   │
│ Send button                     │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│ handleSendMessage() triggered   │
│ activeChatId is null (new chat) │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│ API Request sent:               │
│ POST /api/chat                  │
│ {                               │
│   userId: "user123",            │
│   message: "Hello"              │
│ }                               │
└─────────────────────────────────┘

STEP 2: BACKEND
┌─────────────────────────────────┐
│ Express receives POST request   │
│ Routes to createNewChat()       │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│ Validate with Zod:              │
│ - userId exists ✓               │
│ - message not empty ✓           │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│ Call generateChatReply([],      │
│   "Hello")                      │
│                                 │
│ Sends to Gemini AI API          │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│ Gemini API responds with:       │
│ "Hello! How can I help you      │
│  today?"                        │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│ Create chat document:           │
│ {                               │
│   userId: "user123",            │
│   title: "Hello",               │
│   messages: [                   │
│     { role: "user",             │
│       content: "Hello" },       │
│     { role: "assistant",        │
│       content: "Hello!..." }    │
│   ]                             │
│ }                               │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│ Save to MongoDB                 │
│ MongoDB returns created chat    │
│ with _id: "5f7d8c4a..."         │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│ Return 201 response to frontend │
│ with complete chat object       │
└─────────────────────────────────┘

STEP 3: FRONTEND (Response)
┌─────────────────────────────────┐
│ Receive chat response            │
│ Store chat ID: "5f7d8c4a..."    │
│ Set as activeChatId             │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│ Update Zustand store:           │
│ - messages: [user msg, AI msg]  │
│ - activeChatId: "5f7d8c4a..."  │
│ - loading: false                │
│ - upsertChat: add new chat to   │
│   sidebar list                  │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│ ChatArea component re-renders   │
│ Shows:                          │
│ - Blue bubble: "Hello"          │
│ - Gray bubble: "Hello! How..."  │
│ - Sidebar: New chat in history  │
└─────────────────────────────────┘
```

---

## 🔑 Key Features Explained

### 1. **Chat Persistence**
- Every message is saved to MongoDB immediately
- User can refresh page and see full conversation history
- Chat history loads from database when user clicks on it

### 2. **Conversation Context**
- Previous messages are included when generating new responses
- Gemini AI understands the conversation flow
- Last 8 messages used to maintain context

### 3. **Authentication**
- Clerk handles user login/signup
- Each chat is linked to userId
- Users only see their own chats

### 4. **Real-time UI Updates**
- Messages display instantly
- Loading animation while waiting for AI response
- Sidebar updates when new chat created

### 5. **Error Handling**
- Validation errors return detailed messages
- API errors caught with try-catch
- Fallback UI states for failed requests

---

## 📁 File Structure Reference

```
chatbot/
├── client/                              # Frontend (React)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── ChatPage.tsx            # Main layout
│   │   │   └── LoginPage.tsx           # Auth page
│   │   ├── components/
│   │   │   ├── customs/
│   │   │   │   ├── ChatArea.tsx        # Message display/input
│   │   │   │   ├── Sidebar.tsx         # Chat history
│   │   │   │   └── WelcomeBanner.tsx   # Welcome screen
│   │   │   └── ui/button.tsx           # shadcn button
│   │   ├── store/useChatStore.tsx      # State management
│   │   └── lib/
│   │       ├── api.ts                  # Axios setup
│   │       └── chat.ts                 # Helper functions
│   ├── .env.local                       # Frontend env vars
│   └── package.json
│
├── server/                              # Backend (Express)
│   ├── src/
│   │   ├── controllers/
│   │   │   └── chat.controller.ts      # Request handlers
│   │   ├── routes/
│   │   │   └── chat.route.ts           # API endpoints
│   │   ├── models/
│   │   │   └── chat.model.ts           # MongoDB schema
│   │   ├── lib/
│   │   │   └── gemini.ts               # AI integration
│   │   ├── config/
│   │   │   └── db.ts                   # MongoDB connection
│   │   ├── utils/
│   │   │   └── zodValidation.ts        # Request validation
│   │   ├── app.ts                      # Express app setup
│   │   └── server.ts                   # Server entry point
│   ├── .env                             # Backend env vars
│   └── package.json
│
└── README.md, etc.
```

---

## 🚀 Running the Application

### Prerequisites
```bash
# Install Node.js
# Create MongoDB Atlas account: https://www.mongodb.com/cloud/atlas
# Create Google AI API key: https://aistudio.google.com/app/apikey
```

### Backend Setup
```bash
cd server

# 1. Install dependencies
npm install

# 2. Create .env file with:
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/chatbot
GEMINI_API_KEY=AIza_xxxxx...

# 3. Start server
npm run dev
```

### Frontend Setup
```bash
cd client

# 1. Install dependencies
npm install

# 2. Create .env.local with:
VITE_API_URL=http://localhost:5000/api
VITE_CLERK_PUBLISHABLE_KEY=pk_xxx...

# 3. Start development server
npm run dev
```

---

## 🐛 Troubleshooting

### "GEMINI_API_KEY is not defined"
- **Cause:** Environment variable not loaded
- **Solution:** 
  - Verify `.env` file in server root (not src/)
  - API key must start with `AIza`
  - Restart server after changing .env

### "Failed to connect to MongoDB"
- **Cause:** Invalid MONGO_URI or network issue
- **Solution:**
  - Check connection string in .env
  - Ensure IP whitelist in MongoDB Atlas includes your IP

### "Can't find module '@/components/customs/ChatArea'"
- **Cause:** File path alias not working
- **Solution:** Check vite.config.ts has correct alias configuration

### Messages not persisting
- **Cause:** MongoDB connection issue
- **Solution:**
  - Check MongoDB is running
  - Verify MONGO_URI in .env

---

## 📝 Summary

This application demonstrates a complete full-stack chatbot with:
- ✅ React frontend with real-time UI
- ✅ Express.js backend with REST API
- ✅ MongoDB for data persistence
- ✅ Gemini AI for intelligent responses
- ✅ Clerk authentication
- ✅ Zustand state management
- ✅ TypeScript for type safety

The flow is: **User Input → Frontend → Backend Validation → Gemini AI → Response → Save to DB → Display in UI**

Each component works together to create a seamless ChatGPT-like experience! 🎉
