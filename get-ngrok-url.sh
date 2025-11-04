#!/bin/bash

echo "🔍 Получение ngrok URL..."
echo ""

# Ждем пока ngrok запустится
sleep 5

# Получаем URL из ngrok API
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | head -n 1)

if [ -z "$NGROK_URL" ]; then
    echo "❌ Не удалось получить ngrok URL"
    echo "Проверьте что ngrok контейнер запущен: docker-compose ps"
    echo "Или откройте веб-интерфейс ngrok: http://localhost:4040"
    exit 1
fi

echo "✅ Ваш API доступен по адресу:"
echo ""
echo "   $NGROK_URL"
echo ""
echo "📊 Веб-интерфейс ngrok (для мониторинга запросов):"
echo "   http://localhost:4040"
echo ""
echo "💡 Обновите FRONTEND_URL в .env файле на:"
echo "   FRONTEND_URL=$NGROK_URL"
echo ""

