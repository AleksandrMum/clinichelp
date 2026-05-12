# ClinicHelp

Веб-приложение для управления клиникой: расписание врачей, запись пациентов на приём, управление услугами.

Курсовой проект Мумладзе А.С., ЮФУ ИКТИБ, группа КТбо3-2.

## Состав системы

| Компонент | Технологии | Порт |
|-----------|-----------|------|
| **client** | React 19, Vite, React Router | 80 (nginx) / 5173 (dev) |
| **server** | Node.js, Express 5, Sequelize, JWT | 3000 |
| **postgres** | PostgreSQL 16 | 5433 (хост) / 5432 (внутри) |

## Роли пользователей

- **admin** — управление учётными записями (создание, редактирование, деактивация), просмотр аудит-лога.
- **manager** — управление пациентами, услугами, расписанием врачей (еженедельные правила и разовые исключения), создание и управление записями на приём, просмотр расписания врачей.
- **doctor** — просмотр своего расписания, своих записей на приём и списка пациентов (только чтение).

## Требования

- [Docker](https://docs.docker.com/get-docker/) и Docker Compose v2+.

## Запуск

```bash
docker compose up --build -d
```

При первом запуске автоматически выполняются:
1. Миграции БД (`npm run db:migrate`).
2. Создание первого администратора (`npm run user:create-first-admin`).

После запуска:
- Клиент: **http://localhost**
- Swagger UI: **http://localhost:3000/api-docs**

### Стартовая учётка

| Логин | Пароль | Роль |
|-------|--------|------|
| admin | admin123 | admin |

Пользователей с ролями doctor и manager создайте через панель администратора (раздел «Пользователи»).

## Остановка

```bash
docker compose down
```

Данные БД сохраняются в Docker volume `clinichelp_pg_data`. Для полного сброса данных:

```bash
docker compose down -v
```

## Логи

```bash
# все сервисы
docker compose logs -f

# конкретный сервис
docker compose logs -f server
docker compose logs -f client
docker compose logs -f postgres
```

## Пересборка

```bash
docker compose up --build -d
```

Пересборка одного сервиса:

```bash
docker compose build --no-cache server
docker compose up -d server
```

## Переменные окружения

Задаются в `docker-compose.yml`. Основные:

| Переменная | Описание | По умолчанию |
|------------|----------|-------------|
| `DB_HOST` | Хост PostgreSQL | postgres |
| `DB_PORT` | Порт PostgreSQL | 5432 |
| `DB_NAME` | Имя базы данных | clinichelp |
| `DB_USER` | Пользователь БД | postgres |
| `DB_PASSWORD` | Пароль БД | postgres |
| `JWT_SECRET` | Секрет для подписи JWT | (задан в compose) |
| `JWT_EXPIRES_IN` | Время жизни токена | 24h |
| `FIRST_ADMIN_LOGIN` | Логин первого admin | admin |
| `FIRST_ADMIN_PASSWORD` | Пароль первого admin | admin123 |
| `FIRST_ADMIN_FULL_NAME` | ФИО первого admin | Администратор |

## Локальная разработка (без Docker)

Требуется Node.js 22+ и работающий PostgreSQL.

### Сервер

```bash
cd server
npm install
```

Создайте файл `server/.env` с переменными подключения к БД (см. таблицу выше), затем:

```bash
npm run db:migrate
npm run user:create-first-admin
npm run dev
```

Сервер запустится на `http://localhost:3000`.

### Клиент

```bash
cd client
npm install
npm run dev
```

Клиент запустится на `http://localhost:5173`. API-запросы направляются на `http://localhost:3000/api` (настроено в `client/.env`).

## Реализовано в MVP

### Администратор
- Управление пользователями (создание, редактирование, деактивация).
- Просмотр аудит-лога с фильтрами (дата, тип действия, пользователь, сущность).

### Менеджер
- Управление пациентами (список, создание, поиск).
- Управление услугами (список, создание, редактирование, деактивация).
- Управление расписанием врача — еженедельные правила и разовые исключения (day off, extra shift).
- Просмотр недельного расписания врача (визуальная сетка с записями).
- Создание записей на приём (выбор пациента, врача, услуги, дня и времени с визуальной линейкой доступности).
- Список записей на день с фильтром по врачу и действиями (подтвердить, завершить, отменить).

### Врач
- Просмотр своего недельного расписания (визуальная сетка).
- Просмотр своих записей на приём.
- Просмотр списка пациентов (только чтение).

### Общее
- Авторизация по логину и паролю (JWT).
- Настройки профиля (ФИО, телефон, смена пароля) для любой роли.
- Ролевая маршрутизация и защита маршрутов на клиенте и сервере.

## Структура проекта

```
ClinicHelp/
├── client/                 # React SPA
│   ├── src/
│   │   ├── auth/           # AuthProvider, roles
│   │   ├── layout/         # ProtectedLayout, Sidebar
│   │   ├── pages/
│   │   │   ├── admin/      # AdminUsersPage, AdminAuditPage
│   │   │   ├── manager/    # Patients, Services, Schedule, Appointments
│   │   │   └── common/     # SchedulePage, AppointmentsPage, Settings, Login
│   │   ├── router/         # AppRouter, navigation
│   │   ├── services/       # API-клиенты (api.js, auth.js, schedule.js, ...)
│   │   └── styles/         # CSS
│   ├── Dockerfile
│   └── nginx.conf
├── server/                 # Express API
│   ├── src/
│   │   ├── controllers/    # HTTP-обработчики
│   │   ├── services/       # Бизнес-логика
│   │   ├── middlewares/     # Auth, roleGuard, scope-фильтры
│   │   ├── routes/         # Маршруты API
│   │   └── scripts/        # create-first-admin
│   ├── db/
│   │   ├── config/         # Sequelize config
│   │   ├── migrations/     # Миграции
│   │   └── models/         # Модели Sequelize
│   ├── Dockerfile
│   └── openapi.yaml
└── docker-compose.yml
```
