"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import req, { errorMessage } from "@/lib/api";

import {
  statusLabels,
  type AboutBlock,
  type PortfolioItem,
  type PortfolioItemInput,
  type ProjectStatus,
  type Section,
} from "@/lib/types";

export function AboutEditor({ initial }: { initial: AboutBlock }) {
  const router = useRouter();

  const [text, setText] = useState(initial.text);
  const [photoUrl, setPhotoUrl] = useState(initial.photoUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const result = await req<AboutBlock>(
        "admin/about",
        "PUT",
        {
          text,
          photoUrl: photoUrl.trim() || null,
        },
        router,
      );

      setText(result.text);
      setPhotoUrl(result.photoUrl ?? "");
      setNotice("Изменения сохранены.");
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    if (!window.confirm("Очистить текст и фотографию?")) {
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await req<void>("admin/about", "DELETE", undefined, router);

      setText("");
      setPhotoUrl("");
      setNotice("Блок очищен.");
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-card">
      <h2>Краткая информация</h2>

      <form onSubmit={save}>
        <fieldset disabled={busy} className="form-fields">
          <label>
            О себе
            <textarea
              rows={7}
              maxLength={10000}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Что нравится в разработке, какие методы использую..."
            />
          </label>

          <label>
            URL фотографии
            <input
              type="url"
              maxLength={2048}
              value={photoUrl}
              onChange={(event) => setPhotoUrl(event.target.value)}
              placeholder="https://example.com/photo.jpg"
            />
          </label>

          <div className="actions">
            <button className="button" type="submit">
              {busy ? "Сохранение..." : "Сохранить"}
            </button>

            <button
              className="button danger"
              type="button"
              onClick={clear}
            >
              Очистить блок
            </button>
          </div>
        </fieldset>

        {error && <p className="error" role="alert">{error}</p>}
        {notice && <p className="notice" role="status">{notice}</p>}
      </form>
    </section>
  );
}

function emptyItem(section: Section): PortfolioItemInput {
  return {
    title: "",
    description: "",
    order: 0,
    repositoryUrl: null,
    demoUrl: null,
    status: section === "projects" ? "development" : null,
  };
}

function sortItems(items: PortfolioItem[]) {
  return [...items].sort(
    (left, right) =>
      left.order - right.order ||
      left.title.localeCompare(right.title, "ru") ||
      left.id.localeCompare(right.id),
  );
}

export function CollectionEditor({
  section,
  title,
  initial,
}: {
  section: Section;
  title: string;
  initial: PortfolioItem[];
}) {
  const router = useRouter();

  const [items, setItems] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(() => emptyItem(section));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function patch(values: Partial<PortfolioItemInput>) {
    setDraft((current) => ({ ...current, ...values }));
  }

  function reset() {
    setEditingId(null);
    setDraft(emptyItem(section));
  }

  function edit(item: PortfolioItem) {
    setEditingId(item.id);

    setDraft({
      title: item.title,
      description: item.description,
      order: item.order,
      repositoryUrl: item.repositoryUrl,
      demoUrl: item.demoUrl,
      status: item.status,
    });

    setError("");
    setNotice("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const payload: PortfolioItemInput = {
        ...draft,
        title: draft.title.trim(),
        repositoryUrl: draft.repositoryUrl?.trim() || null,
        demoUrl: draft.demoUrl?.trim() || null,
      };

      const path = editingId
        ? `admin/${section}/${editingId}`
        : `admin/${section}`;

      const saved = await req<PortfolioItem>(
        path,
        editingId ? "PUT" : "POST",
        payload,
        router,
      );

      setItems((current) =>
        sortItems([
          ...current.filter((item) => item.id !== saved.id),
          saved,
        ]),
      );

      reset();
      setNotice("Запись сохранена.");
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: PortfolioItem) {
    if (!window.confirm(`Удалить «${item.title}»?`)) {
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await req<void>(
        `admin/${section}/${item.id}`,
        "DELETE",
        undefined,
        router,
      );

      setItems((current) =>
        current.filter((value) => value.id !== item.id),
      );

      if (editingId === item.id) {
        reset();
      }

      setNotice("Запись удалена.");
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-card">
      <div className="admin-section-title">
        <h2>{title}</h2>
        <span className="muted">{items.length} записей</span>
      </div>

      <div className="admin-items">
        {items.map((item) => (
          <div className="admin-item" key={item.id}>
            <div>
              <strong>{item.title}</strong>

              <p className="muted">
                Порядок: {item.order}
                {item.status && ` · ${statusLabels[item.status]}`}
              </p>
            </div>

            <div className="actions">
              <button
                type="button"
                className="button secondary small"
                disabled={busy}
                onClick={() => edit(item)}
              >
                Изменить
              </button>

              <button
                type="button"
                className="button danger small"
                disabled={busy}
                onClick={() => remove(item)}
              >
                Удалить
              </button>
            </div>
          </div>
        ))}

        {!items.length && (
          <p className="muted">Пока нет записей.</p>
        )}
      </div>

      <form onSubmit={save} className="item-form">
        <h3>{editingId ? "Редактирование записи" : "Новая запись"}</h3>

        <fieldset disabled={busy} className="form-fields">
          <div className="form-grid">
            <label>
              {section === "jobs"
                ? "Компания / должность / период"
                : "Название"}

              <input
                required
                maxLength={160}
                value={draft.title}
                onChange={(event) =>
                  patch({ title: event.target.value })
                }
              />
            </label>

            <label>
              Порядок отображения
              <input
                type="number"
                required
                min={0}
                max={100000}
                step={1}
                value={draft.order}
                onChange={(event) =>
                  patch({ order: Number(event.target.value) })
                }
              />
            </label>
          </div>

          <label>
            Подробная информация
            <textarea
              rows={5}
              maxLength={10000}
              value={draft.description}
              onChange={(event) =>
                patch({ description: event.target.value })
              }
            />
          </label>

          {section === "projects" && (
            <>
              <div className="form-grid">
                <label>
                  Ссылка на репозиторий
                  <input
                    type="url"
                    maxLength={2048}
                    value={draft.repositoryUrl ?? ""}
                    onChange={(event) =>
                      patch({ repositoryUrl: event.target.value })
                    }
                    placeholder="https://github.com/..."
                  />
                </label>

                <label>
                  Ссылка после деплоя
                  <input
                    type="url"
                    maxLength={2048}
                    value={draft.demoUrl ?? ""}
                    onChange={(event) =>
                      patch({ demoUrl: event.target.value })
                    }
                    placeholder="https://project.example.com"
                  />
                </label>
              </div>

              <label>
                Статус
                <select
                  value={draft.status ?? "development"}
                  onChange={(event) =>
                    patch({
                      status: event.target.value as ProjectStatus,
                    })
                  }
                >
                  {Object.entries(statusLabels).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </>
          )}

          <div className="actions">
            <button type="submit" className="button">
              {busy
                ? "Сохранение..."
                : editingId
                  ? "Сохранить изменения"
                  : "Добавить"}
            </button>

            {editingId && (
              <button
                type="button"
                className="button secondary"
                onClick={reset}
              >
                Отмена
              </button>
            )}
          </div>
        </fieldset>

        {error && <p className="error" role="alert">{error}</p>}
        {notice && <p className="notice" role="status">{notice}</p>}
      </form>
    </section>
  );
}