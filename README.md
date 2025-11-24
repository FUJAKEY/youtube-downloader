# StreamMaster — загрузчик YouTube и TikTok

Многоуровневое Node.js-приложение с авторизацией, личным кабинетом и выбором качества загрузки. Репозиторий содержит сервер на Express, хранилище пользователей в SQLite и статический превью-сайт, автоматически публикуемый GitHub Pages через Actions v4.

## Возможности
- Регистрация и вход с JWT (HttpOnly cookie) и bcrypt-хешированием паролей.
- Личный кабинет с формой загрузки YouTube/TikTok и выбором качества от 360p до максимума.
- Разделение по слоям: controllers, services, middleware, routes, views, public assets.
- GitHub Actions (setup-node v4 + deploy-pages v4) собирает статический превью-сайт.

## Локальный запуск
```bash
npm install
npm run dev  # http://localhost:3000
```

## GitHub Pages
Workflow `.github/workflows/pages.yml` собирает содержимое `public/` в `pages-dist` и публикует в Pages. Основной функционал требует запущенного сервера, статичная версия служит витриной интерфейса.

## Переменные окружения
- `PORT` — порт сервера (по умолчанию 3000).
- `JWT_SECRET` — секрет для подписи JWT (обязательно заменить в проде).

## Структура
- `src/server.js` — точка входа Express.
- `src/controllers` / `routes` / `middleware` / `services` — бизнес-логика и маршруты.
- `src/views` — EJS-страницы (главная, аутентификация, дашборд).
- `public` — статические ассеты (CSS, JS, статичная версия главной страницы).
- `scripts/build-pages.js` — сборка статического превью для GitHub Pages.
