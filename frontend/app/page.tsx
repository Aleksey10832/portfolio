import type {
  PortfolioDocument,
  PortfolioItem,
} from "@/lib/types";
import { statusLabels } from "@/lib/types";
import NavPanel from "./navPanel";

export const dynamic = "force-dynamic";

async function getPortfolio(): Promise<PortfolioDocument> {
  const backend =
    process.env.API_INTERNAL_URL ?? "http://127.0.0.1:5088";

  const response = await fetch(`${backend}/api/portfolio`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Не удалось загрузить портфолио.");
  }

  return response.json();
}

function ExpandableList({
  items,
  emptyText,
}: {
  items: PortfolioItem[];
  emptyText: string;
}) {
  if (!items.length) {
    return <p className="empty">{emptyText}</p>;
  }

  return (
    <div className="accordion">
      {items.map((item, index) => (
        <details className="accordion-item" key={item.id}>
          <summary>
            <span className="item-index">
              {String(index + 1).padStart(2, "0")}
            </span>

            <span>{item.title}</span>

            <span className="expand-icon" aria-hidden="true">
              +
            </span>
          </summary>

          <div className="accordion-content prose">
            {item.description || "Подробности пока не добавлены."}
          </div>
        </details>
      ))}
    </div>
  );
}

export default async function HomePage() {
  let portfolio: PortfolioDocument;

  try {
    portfolio = await getPortfolio();
  } catch {
    return (
      <main className="container unavailable">
        <span className="eyebrow">Aleksey10832</span>
        <h1>Алексей Куратов</h1>
        <p className="muted">
          Портфолио временно недоступно. Попробуйте открыть страницу позже.
        </p>
      </main>
    );
  }

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="/" aria-label="На главную">
            <span className="brand-mark">AK</span>
            <span>Aleksey10832</span>
          </a>

          <NavPanel></NavPanel>
          {/* <nav aria-label="Разделы портфолио">
            <a href="#about" >Обо мне</a>
            <a href="#skills">Навыки</a>
            <a href="#experience">Опыт</a>
            <a href="#projects">Проекты</a>
          </nav> */}
        </div>
      </header>

      <main className="container">
        <section className="hero" id="about">
          <div className="hero-copy">
            <span className="eyebrow">Портфолио · веб-разработка</span>

            <h1>
              Алексей
              <br />
              <span>Куратов</span>
            </h1>

            <p className="hero-handle">@Aleksey10832</p>

            <div className="about-copy">
              <h2>Краткая информация</h2>

              <p className="prose muted">
                {portfolio.about.text ||
                  "Здесь скоро появится информация обо мне и моём подходе к разработке."}
              </p>
            </div>

            <a className="button" href="#projects">
              Посмотреть проекты <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="portrait">
            {portfolio.about.photoUrl ? (
              // Обычный img позволяет использовать URL,
              // заданный администратором, без image remotePatterns.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={portfolio.about.photoUrl}
                alt="Алексей Куратов"
                width={560}
                height={680}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="portrait-placeholder">
                <span aria-hidden="true">{"</>"}</span>
                <p>Место для фотографии</p>
              </div>
            )}

            <span className="portrait-label">
              ALEKSEY KURATOV / WEB DEVELOPER
            </span>
          </div>
        </section>

        <section className="section" id="skills">
          <div className="section-heading">
            <div>
              <span className="eyebrow">01 / Компетенции</span>
              <h2>Навыки и умения</h2>
            </div>

            <p className="muted">Нажмите на навык, чтобы узнать больше.</p>
          </div>

          <ExpandableList
            items={portfolio.skills}
            emptyText="Навыки пока не добавлены."
          />
        </section>

        <section className="section" id="experience">
          <div className="section-heading">
            <div>
              <span className="eyebrow">02 / Профессиональный путь</span>
              <h2>Прошлые места работы</h2>
            </div>

            <p className="muted">Роли, задачи и полученный опыт.</p>
          </div>

          <ExpandableList
            items={portfolio.jobs}
            emptyText="Информация о работе пока не добавлена."
          />
        </section>

        <section className="section" id="projects">
          <div className="section-heading">
            <div>
              <span className="eyebrow">03 / Практика и эксперименты</span>
              <h2>Пэт-проекты</h2>
            </div>

            <span className="muted">
              {portfolio.projects.length} / всего
            </span>
          </div>

          {portfolio.projects.length ? (
            <div className="projects-grid">
              {portfolio.projects.map((project) => (
                <article className="project-card" key={project.id}>
                  <div className="project-top">
                    <span className="project-icon" aria-hidden="true">
                      {"</>"}
                    </span>

                    {project.status && (
                      <span className={`badge ${project.status}`}>
                        <span aria-hidden="true">●</span>
                        {statusLabels[project.status]}
                      </span>
                    )}
                  </div>

                  <h3>{project.title}</h3>

                  <p className="prose muted">
                    {project.description}
                  </p>

                  <div className="project-links">
                    {project.repositoryUrl && (
                      <a
                        href={project.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Репозиторий ↗
                      </a>
                    )}

                    {project.demoUrl ? (
                      <a
                        href={project.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Открыть проект ↗
                      </a>
                    ) : (
                      <span className="muted">Демо пока нет</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty">Проекты пока не добавлены.</p>
          )}
        </section>
      </main>

      <footer className="container site-footer">
        <span>© {new Date().getFullYear()} Алексей Куратов</span>

        <a
          href="https://github.com/Aleksey10832"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub ↗
        </a>
      </footer>
    </>
  );
}