import { Prisma, ProjectStatus } from '@prisma/client';

export const profileSeed: Prisma.ProfileCreateInput = {
  name: 'Алексей Куратов',
  description:
    'Веб-разработчик, специализирующийся на серверной части (backend) и создании веб-приложений. ' +
    'В своих проектах использую современный стек технологий .NET. ' +
    'Также работал с клиентской частью (frontend) на фреймворках Next.js и React.',
  links: {
    create: [
      { label: 'GitHub', url: 'https://github.com/Aleksey10832' },
      { label: 'Telegram', url: 'https://t.me/aleksey10831' },
      { label: 'Сайт', url: 'https://me.akuranet.ru' },
    ],
  },
  skills: {
    create: [
      { name: 'Backend-разработка на ASP.NET Core' },
      { name: 'Разработка на языке C#' },
      { name: 'Работа с ORM Entity Framework Core' },
      { name: 'Управление базами данных PostgreSQL' },
      { name: 'Веб-парсинг с использованием AngleSharp' },
      { name: 'Разработка системы аутентификации и авторизации' },
      { name: 'Создание механизма пользовательских сессий' },
      { name: 'Проектирование архитектуры и API' },
      { name: 'Кэширование данных с помощью Redis' },
    ],
  },
  experience: {
    create: [
      {
        company: 'БПОУ ОГКУиПТ',
        position: 'Лаборант',
        period: '9 месяцев',
        achievements: [
          'Обслуживание компьютеров (программное и физическое)',
          'Техническая организация мероприятий',
          'Сетевое обслуживание',
          'Работа с документами (задачи методиста)',
        ],
      },
    ],
  },
  projects: {
    create: [
      {
        name: 'Локальный сервер для чтения ранобе и книг',
        description:
          'Кастомный сервис для чтения ранобе с уникальными ролями на чтение, редактирование и загрузку, ' +
          'поддержкой нескольких сессий с разных устройств и парсингом ранобе с открытых источников. ' +
          'В демо-версии регистрация пока недоступна.',
        repositoryUrl: 'https://github.com/Aleksey10832/RanobeLib',
        status: ProjectStatus.IN_DEVELOPMENT,
      },
      {
        name: 'Сайт портфолио',
        description: 'Лендинг-страница с редактором её содержания.',
        repositoryUrl: 'https://github.com/Aleksey10832/portfolio',
        status: ProjectStatus.COMPLETED,
      },
      {
        name: 'Spam Bot',
        description:
          'Рассылка сообщений (рекламы) через юзерботов по базе аккаунтов, которую можно заполнить ' +
          'идентификаторами пользователей Telegram через встроенный сбор идентификаторов из групп и бесед.',
        repositoryUrl: 'https://github.com/Aleksey10832/spam_bot',
        status: ProjectStatus.ABANDONED,
      },
      {
        name: 'Stroidom (курсовая работа)',
        description:
          'Проект для изучения Nest.js, сдан как курсовая работа. Уже не соответствует текущим навыкам.',
        repositoryUrl: 'https://github.com/Aleksey10832/Stroidom',
        status: ProjectStatus.ABANDONED,
      },
    ],
  },
};
