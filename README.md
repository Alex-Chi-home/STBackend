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

````bash

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


### Docker (рекомендуется)

```bash
# Запустить все сервисы
docker-compose up -d

# Проверить статус
docker-compose ps

# Просмотреть логи
docker-compose logs -f api
````

## 🌐 Деплой

### Быстрый деплой на удаленный сервер

Полное руководство по деплою находится в [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

**Краткие шаги:**

1. Подготовить сервер (Docker, Docker Compose)
2. Клонировать репозиторий
3. Создать .env файл с production переменными
4. Настроить HTTPS (Let's Encrypt)
5. Настроить Nginx как обратный прокси
6. Запустить `docker-compose up -d`

### Проверка перед деплоем

Используйте [PRE_DEPLOYMENT_CHECKLIST.md](./PRE_DEPLOYMENT_CHECKLIST.md) для проверки всех требований.

## 🔒 Безопасность

Все критические проблемы безопасности исправлены:

- ✅ Удалены hardcoded пароли
- ✅ Переменные окружения в .env файле
- ✅ HTTPS обязателен в production
- ✅ Отключен Adminer в production
- ✅ Health checks настроены
- ✅ Rate limiting включен

Дополнительные рекомендации в [SECURITY_RECOMMENDATIONS.md](./SECURITY_RECOMMENDATIONS.md)

## 📚 API Endpoints

### Аутентификация

- `POST /api/auth/register` - Регистрация пользователя
- `POST /api/auth/login` - Вход в систему
- `GET /api/auth/health` - Проверка здоровья приложения

### Чаты

- `POST /api/chats/private` - Создать приватный чат
- `POST /api/chats/group` - Создать групповой чат
- `GET /api/chats` - Получить чаты пользователя

### Сообщения

- `POST /api/messages` - Отправить сообщение
- `GET /api/messages/:chatId` - Получить сообщения чата

### Отношения

- `POST /api/relationships` - Добавить отношение
- `GET /api/relationships` - Получить отношения пользователя

## 📖 Документация

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Полное руководство по деплою
- [PRE_DEPLOYMENT_CHECKLIST.md](./PRE_DEPLOYMENT_CHECKLIST.md) - Чек-лист перед деплоем
- [SECURITY_RECOMMENDATIONS.md](./SECURITY_RECOMMENDATIONS.md) - Рекомендации по безопасности
- [api/README.md](./api/README.md) - Документация API

## 🧪 Тестирование

Используйте Postman коллекцию: `STBackend_API_Tests.postman_collection.json`

```bash
# Или используйте curl
curl -X POST http://localhost:5555/api/auth/health
```

## 📊 Переменные окружения

Все переменные окружения описаны в [api/.env.example](./api/.env.example)

**Важные переменные для production:**

- `NODE_ENV=production`
- `MYSQL_PASSWORD` - минимум 32 символа
- `JWT_SECRET` - минимум 32 символа
- `FRONTEND_URL` - URL вашего фронтенда

## 🐛 Решение проблем

### Приложение не запускается

```bash
docker-compose logs api
```

### Проблемы с базой данных

```bash
docker-compose logs mysqlDatabase
docker-compose restart mysqlDatabase
```

### Очистить все и начать заново

```bash
docker-compose down -v
docker-compose up -d
```

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи: `docker-compose logs -f api`
2. Проверьте health endpoint: `curl http://localhost:5555/api/auth/health`
3. Обратитесь к документации в папке проекта

## 📄 Лицензия

MIT
