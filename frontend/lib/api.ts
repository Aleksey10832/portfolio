"use client";

import { del, get, set } from "idb-keyval";
import type { Tokens } from "./types";

interface RouterLike {
  replace(href: string): void;
}

const STORAGE_KEY = "portfolio-admin-session";
const LOCK_KEY = "portfolio-admin-session-lock";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Не удалось выполнить запрос.";
}

async function throwResponseError(response: Response): Promise<never> {
  let message = `Ошибка запроса: ${response.status}`;

  try {
    const data = await response.json();

    if (data.errors) {
      message = Object.values(data.errors).flat().join(" ");
    } else {
      message = data.message ?? data.detail ?? data.title ?? message;
    }
  } catch {
    // Ответ может быть пустым или содержать HTML от прокси.
  }

  if (response.status === 429) {
    message = "Слишком много попыток. Подождите минуту.";
  }

  throw new ApiError(response.status, message);
}

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    return throwResponseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  return (text ? JSON.parse(text) : undefined) as T;
}

function send(
  path: string,
  method: string,
  body?: object,
  accessToken?: string,
) {
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return fetch(`/api/back/${path.replace(/^\/+/, "")}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    credentials: "omit",
  });
}

async function withSessionLock<T>(
  callback: () => Promise<T>,
): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request(LOCK_KEY, callback);
  }

  return callback();
}

/**
 * Новая пара уже действует до confirm.
 * Confirm только досрочно закрывает окно повторной выдачи
 * по старому refresh.
 */
async function confirmStored(tokens: Tokens): Promise<Tokens> {
  if (!tokens.confirmToken) {
    return tokens;
  }

  const response = await send("session/confirm", "POST", {
    confirmToken: tokens.confirmToken,
  });

  if (!response.ok && response.status !== 401) {
    await throwResponseError(response);
  }

  // 401 здесь может означать истечение 30 секунд.
  // Новая access/refresh-пара при этом остаётся действующей.
  const clean: Tokens = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };

  await set(STORAGE_KEY, clean);

  return clean;
}

let refreshPromise: Promise<boolean> | null = null;

function refreshTokens(failedAccessToken: string): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = withSessionLock(async () => {
    let stored = await get<Tokens>(STORAGE_KEY);

    if (!stored?.refreshToken) {
      return false;
    }

    // Пока запрос ждал блокировку, другая вкладка
    // могла уже обновить токены.
    if (stored.accessToken !== failedAccessToken) {
      await confirmStored(stored);
      return true;
    }

    stored = await confirmStored(stored);

    const response = await send("session/refresh", "POST", {
      refreshToken: stored.refreshToken,
    });

    if (response.status === 401) {
      await del(STORAGE_KEY);
      return false;
    }

    const tokens = await readResponse<Tokens>(response);

    // Сначала сохраняем всю новую пару, затем подтверждаем.
    // Если confirm оборвётся, новая пара не потеряется.
    await set(STORAGE_KEY, tokens);

    await confirmStored(tokens);

    return true;
  }).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function login(
  loginValue: string,
  password: string,
): Promise<void> {
  await withSessionLock(async () => {
    const response = await send("session/login", "POST", {
      login: loginValue,
      password,
    });

    const tokens = await readResponse<Tokens>(response);
    await set(STORAGE_KEY, tokens);
  });
}

export default async function req<T>(
  url: string,
  method = "GET",
  value?: object,
  router?: RouterLike,
): Promise<T> {
  // Не более двух обновлений — никакой бесконечной рекурсии.
  for (let attempt = 0; attempt < 3; attempt++) {
    const tokens = await get<Tokens>(STORAGE_KEY);

    const response = await send(
      url,
      method,
      value,
      tokens?.accessToken,
    );

    if (response.status !== 401) {
      return readResponse<T>(response);
    }

    if (
      !tokens?.refreshToken ||
      attempt === 2 ||
      !(await refreshTokens(tokens.accessToken))
    ) {
      router?.replace("/admin/login");
      throw new ApiError(401, "Войдите в административную панель.");
    }
  }

  throw new ApiError(401, "Не удалось восстановить сессию.");
}

export async function logout(router: RouterLike): Promise<void> {
  // Сначала отзываем сессию на сервере.
  await req<void>("session/logout", "POST", undefined, router);

  await withSessionLock(async () => {
    await del(STORAGE_KEY);
  });

  router.replace("/admin/login");
}