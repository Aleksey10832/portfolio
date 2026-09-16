"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import req, {
  ApiError,
  errorMessage,
  logout,
} from "@/lib/api";

import type { PortfolioDocument } from "@/lib/types";
import {
  AboutEditor,
  CollectionEditor,
} from "@/components/AdminEditors";

export default function AdminPage() {
  const router = useRouter();

  const [portfolio, setPortfolio] =
    useState<PortfolioDocument | null>(null);

  const [error, setError] = useState("");
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    let active = true;

    req<PortfolioDocument>(
      "admin/portfolio",
      "GET",
      undefined,
      router,
    )
      .then((data) => {
        if (active) {
          setPortfolio(data);
        }
      })
      .catch((error: unknown) => {
        if (
          active &&
          !(error instanceof ApiError && error.status === 401)
        ) {
          setError(errorMessage(error));
        }
      });

    return () => {
      active = false;
    };
  }, [router]);

  async function exit() {
    setExiting(true);
    setError("");

    try {
      await logout(router);
    } catch (error) {
      setError(errorMessage(error));
      setExiting(false);
    }
  }

  if (!portfolio) {
    return (
      <main className="container loading-screen">
        <span className="eyebrow">Административная панель</span>

        {error ? (
          <>
            <h1>Не удалось открыть панель</h1>
            <p className="error" role="alert">{error}</p>

            <button
              className="button"
              onClick={() => window.location.reload()}
            >
              Повторить
            </button>
          </>
        ) : (
          <p role="status">Проверяем сессию...</p>
        )}
      </main>
    );
  }

  return (
    <main className="container admin-page">
      <header className="admin-header">
        <div>
          <span className="eyebrow">Aleksey10832 / управление</span>
          <h1>Портфолио</h1>
        </div>

        <div className="actions">
          <a
            className="button secondary"
            href="/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Открыть сайт ↗
          </a>

          <button
            className="button secondary"
            onClick={exit}
            disabled={exiting}
          >
            {exiting ? "Выход..." : "Выйти"}
          </button>
        </div>
      </header>

      {error && <p className="error" role="alert">{error}</p>}

      <AboutEditor initial={portfolio.about} />

      <CollectionEditor
        section="skills"
        title="Навыки и умения"
        initial={portfolio.skills}
      />

      <CollectionEditor
        section="jobs"
        title="Прошлые места работы"
        initial={portfolio.jobs}
      />

      <CollectionEditor
        section="projects"
        title="Пэт-проекты"
        initial={portfolio.projects}
      />
    </main>
  );
}