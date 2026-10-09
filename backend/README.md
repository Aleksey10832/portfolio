# Portfolio Backend

Цифровая визитка: GraphQL API на NestJS, данные в PostgreSQL через Prisma.

Стек: TypeScript, Node.js, NestJS, Prisma, GraphQL (Apollo), PostgreSQL, Docker.

## Запуск через Docker (рекомендуется)

```bash
cd backend
docker compose up --build
```

При старте контейнер `api` применяет миграции (`prisma migrate deploy`),
а если таблица профилей пуста, заполняет БД демонстрационными данными.

Apollo Sandbox: http://localhost:3000/graphql

## Локальный запуск без Docker

Нужен PostgreSQL. Скопируйте `.env.example` в `.env` и выполните:

```bash
npm install
npm run start:dev
```

## Пример запроса

```graphql
query {
  profile {
    name
    description
    links { label url }
    skills { name }
    experience { company position period achievements }
    projects { name repositoryUrl status }
  }
}
```

## Структура

- `prisma/` — схема БД и миграции.
- `src/prisma/` — подключение к БД (`PrismaService`).
- `src/database/` — автозаполнение БД при первом запуске.
- `src/profile/` — GraphQL-модели, резолверы (API) и сервис (запросы к данным).
