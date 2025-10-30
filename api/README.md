Social Network API
A production-ready Express.js backend API for a social network with Telegram-like chat functionality.
Setup

Clone the repository:
git clone <repository-url>
cd social-network-api

Install dependencies:
npm install

Create a .env file based on .env.example and fill in your configuration:
cp .env.example .env

Set up MySQL database and update .env with connection details.

Run the application:

Development: npm run dev
Production: npm run build && npm start

API Endpoints

POST /api/auth/register: Register a new user.
POST /api/auth/login: Log in and get a JWT token.
POST /api/chats/private: Create a private chat (requires authentication).
POST /api/chats/group: Create a group chat (requires authentication).
GET /api/chats: Get user's chats (requires authentication).
POST /api/messages: Send a message (requires authentication).
GET /api/messages/:chatId: Get messages for a chat (requires authentication).
POST /api/relationships: Add a relationship (friend, follower, blocked) (requires authentication).
GET /api/relationships: Get user's relationships (requires authentication).

Environment Variables

DATABASE_HOST: MySQL host
DATABASE_PORT: MySQL port
DATABASE_USER: MySQL username
DATABASE_PASSWORD: MySQL password
DATABASE_NAME: MySQL database name
JWT_SECRET: Secret for JWT signing
PORT: Server port

Notes

Set synchronize: false in database.ts for production and use TypeORM migrations.
Ensure passwords are hashed before storage.
Use HTTPS in production for secure communication.
