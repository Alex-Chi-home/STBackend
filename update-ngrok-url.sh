#!/bin/bash

echo ""
echo "========================================"
echo "  Обновление NGROK_URL в .env"
echo "========================================"
echo ""

echo "Получение нового ngrok URL..."

# Получаем URL
NEW_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$NEW_URL" ]; then
    echo "ОШИБКА: Не удалось получить ngrok URL"
    echo "Убедитесь, что контейнер ngrok запущен."
    echo "Выполните: docker-compose ps ngrok"
    exit 1
fi

echo "Новый URL: $NEW_URL"
echo ""
echo "Обновляем .env файл..."

# Создаем резервную копию
cp .env .env.backup

# Обновляем .env файл
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|NGROK_URL=https://.*\.ngrok-free\.app|NGROK_URL=$NEW_URL|g" .env
else
    # Linux
    sed -i "s|NGROK_URL=https://.*\.ngrok-free\.app|NGROK_URL=$NEW_URL|g" .env
fi

if [ $? -eq 0 ]; then
    echo ".env файл обновлен успешно!"
else
    echo "ОШИБКА: Не удалось обновить .env файл"
    exit 1
fi

echo ""
echo "Перезапускаем API контейнер..."
docker-compose restart api

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "  Готово!"
    echo "========================================"
    echo ""
    echo "Новый NGROK URL: $NEW_URL"
    echo ""
    echo "API перезапущен и готов к работе!"
    echo ""
    echo "Проверьте работу:"
    echo "  curl $NEW_URL/api/auth/health"
    echo ""
    echo "Веб-интерфейс ngrok:"
    echo "  http://localhost:4040"
    echo ""
    echo "========================================"
else
    echo ""
    echo "ОШИБКА: Не удалось перезапустить API контейнер"
    echo "Выполните вручную: docker-compose restart api"
    exit 1
fi

echo ""

