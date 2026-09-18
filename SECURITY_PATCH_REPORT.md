# Security Patch Report

Дата проверки: 2026-09-18

## Сверка с внешним отчётом

Утверждения о `config/database.js`, `middleware/auth.js`, `/api/search`,
`/api/files`, `/api/tools/ping`, `/api/upload`, параметре `sortBy` и JWT не
относятся к этому workspace: таких файлов, endpoint-ов и параметров в текущем
исходном коде нет. Поэтому они не могли быть исправлены в данном репозитории и
не считаются результатом патча. Фактическое состояние проверено по текущему
`src/index.js` и структуре проекта.

## Исправленные проблемы

### Prototype Pollution / IDOR-подобное удаление аккаунтов / повышение прав

- **Файл и поверхность:** `src/index.js`, `POST /donos`, `POST /api/donos`, `GET /requests`, `GET /api/requests`.
- **Эксплуатация:** авторизованный пользователь мог передать произвольные ключи в `donos`. Они попадали в глобальный объект через небезопасное deep merge; затем это состояние использовалось для удаления пользователей по совпадению имени и могло влиять на признак supervisor.
- **Исправление:** удалены глобальное состояние, `deepMerge` и dot-notation parser. Данные доноса теперь ограниченно нормализуются только для логирования и не участвуют в авторизации или удалении пользователей.

### Session fixation и слабая конфигурация session cookie

- **Файл и поверхность:** `src/index.js`, регистрация и login API/HTML.
- **Эксплуатация:** предсказуемый session secret и отсутствие ротации идентификатора после входа упрощали захват/фиксацию сессии; cookie не имела явного `httpOnly` и срока жизни.
- **Исправление:** secret берётся из `SESSION_SECRET` (в production обязателен и должен быть не короче 32 символов), после login/register вызывается `req.session.regenerate`, включены `httpOnly`, `sameSite`, `secure` в production и ограниченный `maxAge`.

### Default credentials / hardcoded secret

- **Файл и поверхность:** `docker-compose.yml`, `src/index.js`.
- **Эксплуатация:** известный пароль `arktur_secret` позволял получить доступ к PostgreSQL при сетевой ошибке конфигурации; session secret был зашит в исходниках.
- **Исправление:** Compose требует `DB_PASSWORD` и `SESSION_SECRET` из окружения; добавлен `.env.example` без рабочих секретов; backend больше не содержит default DB password.

### CORS и CSRF на state-changing запросах

- **Файл и поверхность:** CORS middleware в `src/index.js`, все POST/PUT/PATCH/DELETE endpoints.
- **Эксплуатация:** проверка origin через `startsWith` принимала слишком широкий набор значений, а запросы с чужого origin не блокировались.
- **Исправление:** разрешённые origins сравниваются точно и задаются через `ALLOWED_ORIGINS`; preflight с неизвестного origin отклоняется, state-changing запросы с неизвестного origin получают 403, добавлены базовые security headers.

### Logout через GET

- **Файл и поверхность:** `src/index.js`, `src/views/requests.ejs`.
- **Эксплуатация:** сторонний сайт мог принудительно вызвать GET `/logout` и завершить сессию пользователя.
- **Исправление:** logout переведён на POST-форму.

### Несогласованный источник авторизации в `/api/me`

- **Файл и поверхность:** `src/index.js`, `GET /api/me`.
- **Эксплуатация:** endpoint возвращал supervisor-признак из session state, а не из текущей записи пользователя; после изменения прав в БД UI/API могли получать устаревший статус.
- **Исправление:** `/api/me` повторно читает `id`, `username` и `is_supervisor` из БД и уничтожает сессию для отсутствующего пользователя.

### Уязвимая версия Next.js / RSC

- **Файл и поверхность:** `frontend/package.json`, `frontend/package-lock.json`.
- **Эксплуатация:** проект использовал Next.js 15.1.0 и старые RSC-пакеты, что оставляло известные проблемы в App Router/Server Components.
- **Исправление:** Next.js обновлён до 15.5.25; frontend успешно собран.

## Что проверено и не потребовало исправления

- SQL injection: запросы к PostgreSQL используют параметризованные значения `$1`, `$2` и т.д.; динамической конкатенации SQL не найдено.
- XSS: EJS выводит пользовательские значения через `<%= ... %>`, а React экранирует текстовые значения; `dangerouslySetInnerHTML` не найден.
- IDOR/BOLA для деталей заявки: `/api/requests/:id` и `/requests/:id` ограничивают выборку `r.user_id = req.session.userId`.
- Command injection/RCE, SSRF и unsafe file upload: соответствующих обработчиков, загрузок файлов и выполнения команд в исходниках не найдено.
- JWT: JWT в сервисе не используется.

## Найденные, но не исправленные проблемы

- Нет rate limiting/lockout для login/register; это оставляет возможность brute-force, но не меняет права доступа напрямую.
- `express-session` использует MemoryStore; для нескольких экземпляров и production нужен внешний session store (например, PostgreSQL/Redis).
- `/diagnostics` и Server Actions фронтенда доступны без backend-аутентификации и показывают синтетические operational-метрики; это информационное раскрытие, а не доступ к данным заявок.
- `npm audit` сообщает о транзитивных проблемах в backend (`brace-expansion`, `path-to-regexp`, `postcss`, `qs`, `sharp`) и frontend (`nanoid`, `postcss`). Автоматический `--force` потребовал бы breaking upgrade Next.js до 16; он не применялся. Прямые неиспользуемые `react-server-dom-*` зависимости удалены.

## Быстрые проверки

- `node --check src/index.js` — успешно.
- `git diff --check` — успешно.
- `Set-Location frontend; npm run build` — успешно, Next.js 15.5.25.
- `docker compose config` с `DB_PASSWORD` и `SESSION_SECRET` — успешно.
- `docker build` не выполнен в текущем окружении: Docker Desktop daemon недоступен.
