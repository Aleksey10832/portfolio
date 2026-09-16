"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { errorMessage, login } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();

  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setBusy(true);
    setError("");

    try {
      await login(loginValue, password);
      router.replace("/admin");
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-card">
        <div className="brand-mark">AK</div>

        <span className="eyebrow">Aleksey10832 / управление</span>
        <h1>Вход в панель</h1>

        <p className="muted">
          Доступ только для администратора портфолио.
        </p>

        <form onSubmit={submit}>
          <fieldset disabled={busy} className="form-fields">
            <label>
              Логин
              <input
                autoFocus
                required
                name="login"
                autoComplete="username"
                maxLength={200}
                value={loginValue}
                onChange={(event) =>
                  setLoginValue(event.target.value)
                }
              />
            </label>

            <label>
              Пароль
              <input
                required
                type="password"
                name="password"
                autoComplete="current-password"
                maxLength={1000}
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
              />
            </label>

            <button className="button full-width" type="submit">
              {busy ? "Вход..." : "Войти"}
            </button>
          </fieldset>

          {error && <p className="error" role="alert">{error}</p>}
        </form>
      </section>
    </main>
  );
}