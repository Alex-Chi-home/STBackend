# Simple Telegram Backend

A REST API backend for a messaging application built with Node.js, Express, TypeScript, and MySQL.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Docker** and **Docker Compose** - [Download](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download](https://git-scm.com/)

## Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd STBackend
   ```

2. **Install dependencies:**
   ```bash
   cd api
   npm install
   cd ..
   ```

## Configuration

1. **Create your environment file:**

   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file** with your own values:

   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5555

   # Database Configuration
   MYSQL_HOST=mysqlDatabase
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_ROOT_PASSWORD=your_password_here
   DATABASE_NAME=simple_telegram

   # JWT Configuration
   JWT_SECRET=your_secret_key_at_least_32_characters

   # Frontend Configuration
   FRONTEND_URL=http://localhost:3000
   ```

   >

## Running the Application

### Using Docker (Recommended)

Start all services (API, MySQL database, and Adminer):

```bash
docker compose -f docker-compose.dev.yml up --build
```

This will start:

- **API server** at `http://localhost:5555`
- **MySQL database** on port 3306
- **Adminer** (database admin tool) at `http://localhost:8080`

To stop all services:

```bash
docker compose -f docker-compose.dev.yml down
```

## Project Structure

```
STBackend/
├── api/                      # Main API application
│   ├── src/
│   │   ├── config/           # Database and app configuration
│   │   ├── controllers/      # Request handlers
│   │   ├── middleware/       # Express middleware (auth, validation)
│   │   ├── models/           # TypeORM entity models
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic
│   │   ├── types/            # TypeScript type definitions
│   │   ├── app.ts            # Express app setup
│   │   └── server.ts         # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.dev.yml    # Development Docker configuration
├── docker-compose.yml        # Production Docker configuration
└── .env.example              # Environment variables template
```

## API Documentation

Base URL: `http://localhost:5555/api`

### Authentication

All endpoints except `/auth/*` require authentication via JWT cookie (automatically set after login/register).

---

### Auth Endpoints

#### Health Check

```javascript
fetch("http://localhost:5555/api/auth/health")
  .then((res) => res.json())
  .then((data) => console.log(data));
// Response: { "status": "ok", "timestamp": "2025-12-09T12:00:00.000Z" }
```

#### Register

```javascript
fetch("http://localhost:5555/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    username: "john_doe",
    email: "john@example.com",
    password: "password123",
  }),
}).then((res) => res.json());
// Response: { "status": "success", "data": { "user": { "id": 1, "username": "john_doe", "email": "john@example.com" } } }
```

#### Login

```javascript
fetch("http://localhost:5555/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    email: "john@example.com",
    password: "password123",
  }),
}).then((res) => res.json());
// Response: { "status": "success", "data": { "user": { "id": 1, "username": "john_doe", "email": "john@example.com" } } }
```

#### Logout

```javascript
fetch("http://localhost:5555/api/auth/logout", {
  method: "POST",
  credentials: "include",
}).then((res) => res.json());
// Response: { "status": "success", "message": "Logged out" }
```

---

### User Endpoints

#### Get Current User

```javascript
fetch("http://localhost:5555/api/user", {
  credentials: "include",
}).then((res) => res.json());
// Response: { "status": "success", "data": { "id": 1, "username": "john_doe", "email": "john@example.com" } }
```

#### Get All Users

```javascript
fetch("http://localhost:5555/api/users", {
  credentials: "include",
}).then((res) => res.json());
// Response: { "status": "success", "data": [{ "id": 1, "username": "john_doe" }, ...] }
```

---

### Chat Endpoints

#### Get User's Chats

```javascript
fetch("http://localhost:5555/api/chats", {
  credentials: "include",
}).then((res) => res.json());
// Response: { "status": "success", "data": [{ "id": 1, "type": "private", "members": [...] }, ...] }
```

#### Create Private Chat

```javascript
fetch("http://localhost:5555/api/chats/private", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    otherUserId: 2,
  }),
}).then((res) => res.json());
// Response: { "status": "success", "data": { "id": 1, "type": "private", "members": [...] } }
```

#### Create Group Chat

```javascript
fetch("http://localhost:5555/api/chats/group", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    name: "My Group",
    memberIds: [2, 3, 4],
  }),
}).then((res) => res.json());
// Response: { "status": "success", "data": { "id": 2, "type": "group", "name": "My Group", "members": [...] } }
```

#### Delete Chat

```javascript
fetch("http://localhost:5555/api/chats/1", {
  method: "DELETE",
  credentials: "include",
}).then((res) => res.json());
// Response: { "status": "success", "data": { "message": "Chat deleted" } }
```

---

### Message Endpoints

#### Get Chat Messages

```javascript
fetch("http://localhost:5555/api/messages/1", {
  credentials: "include",
}).then((res) => res.json());
// Response: { "status": "success", "data": [{ "id": 1, "content": "Hello!", "senderId": 1, "createdAt": "..." }, ...] }
```

#### Send Message

```javascript
fetch("http://localhost:5555/api/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    chatId: 1,
    content: "Hello, World!",
  }),
}).then((res) => res.json());
// Response: { "status": "success", "data": { "id": 1, "content": "Hello, World!", "senderId": 1, "chatId": 1 } }
```

#### Delete Message

```javascript
fetch("http://localhost:5555/api/messages", {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    chatId: 1,
    id: 1,
  }),
}).then((res) => res.json());
// Response: { "status": "success", "data": { "message": "Message deleted" } }
```

---

### Relationship Endpoints

#### Get Relationships

```javascript
fetch("http://localhost:5555/api/relationships", {
  credentials: "include",
}).then((res) => res.json());
// Response: { "status": "success", "data": [{ "id": 1, "type": "friend", "relatedUserId": 2 }, ...] }
```

#### Add Relationship

```javascript
fetch("http://localhost:5555/api/relationships", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    relatedUserId: 2,
    type: "friend", // "friend" | "follower" | "blocked"
  }),
}).then((res) => res.json());
// Response: { "status": "success", "data": { "id": 1, "type": "friend", "relatedUserId": 2 } }
```

---

### WebSocket Events

Connect to WebSocket:

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5555", {
  auth: { token: "your_jwt_token" },
  transports: ["websocket", "polling"],
});

// Connection ready - rejoin chats
socket.on("connection:ready", (data) => {
  console.log("Connected:", data);
  socket.emit("join:chat", chatId);
});

// Join a chat room
socket.emit("join:chat", 1);
socket.on("joined:chat", ({ chatId }) => console.log("Joined chat:", chatId));

// Leave a chat room
socket.emit("leave:chat", 1);

// Receive new messages
socket.on("message:new", (message) => console.log("New message:", message));

// Receive new chats
socket.on("chat:new", (chat) => console.log("New chat:", chat));

// Chat deleted
socket.on("chat:deleted", ({ chatId }) => console.log("Chat deleted:", chatId));

// Typing indicators
socket.emit("typing:start", { chatId: 1 });
socket.emit("typing:stop", { chatId: 1 });
socket.on("user:typing", ({ userId, chatId }) => console.log("User typing..."));
socket.on("user:stopped-typing", ({ userId, chatId }) =>
  console.log("User stopped typing")
);

// Message read status
socket.emit("message:read", { messageId: 1, chatId: 1 });
socket.on("message:read-status", ({ messageId, userId, status }) =>
  console.log("Message read")
);
```
