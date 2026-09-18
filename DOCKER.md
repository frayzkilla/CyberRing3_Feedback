# Запуск через Docker

## Backend и PostgreSQL

Требуется Docker Desktop с Compose v2.

1. Создайте локальный файл `.env` в корне проекта:

```dotenv
DB_USER=arktur
DB_PASSWORD=замените-на-длинный-случайный-пароль
DB_NAME=arktur_db
SESSION_SECRET=замените-на-случайную-строку-длиной-минимум-32-символа
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

Пароль базы и `SESSION_SECRET` не добавляйте в Git.

2. Соберите и запустите сервисы:

```powershell
docker compose up -d --build
```

3. Откройте backend:

- http://localhost:3000

Проверить состояние контейнеров:

```powershell
docker compose ps
docker compose logs -f app
```

Остановить сервисы:

```powershell
docker compose down
```

Данные PostgreSQL хранятся в Docker volume контейнера. Для полного удаления данных используйте `docker compose down -v`.

## Next.js frontend

Frontend находится в отдельном каталоге и по текущей архитектуре запускается отдельно:

```powershell
Set-Location frontend
npm ci
npm run dev
```

Откройте http://localhost:3001. Frontend проксирует `/api` на backend `http://localhost:3000`.

Для production frontend:

```powershell
Set-Location frontend
npm ci
npm run build
npm start
```

## Быстрый smoke-check

```powershell
Invoke-WebRequest http://localhost:3000/ -UseBasicParsing
Invoke-WebRequest http://localhost:3000/api/me -UseBasicParsing
```

Ожидаемый результат для `/api/me` без авторизации: HTTP 200 и `{"authenticated":false}`.
