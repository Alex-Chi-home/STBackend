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

## API Health Check

Once running, verify the API is working:

```bash
curl http://localhost:5555/api/auth/health
```
