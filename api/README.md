# Docker Compose Watch - Руководство

## 🚀 Быстрый старт

### Режим разработки с автоматическим обновлением


#### 1. **Docker Compose Watch **

```bash
docker compose -f docker-compose.dev.yml watch
```

#### 2. **Обычный режим разработки**

```bash

docker compose -f docker-compose.dev.yml up
```

## Adminer - подключение к БД

1. Откройте http://localhost:8080
2. Заполните форму:
   - **Сервер**: `mysqlDatabase`
   - **Пользователь**: `root`
   - **Пароль**: из `.env` → `MYSQL_ROOT_PASSWORD`
   - **База данных**: из `.env` → `DATABASE_NAME`
   

#### 3. **Production режим**

```bash

docker compose up -d

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
