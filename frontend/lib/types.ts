export type ProjectStatus =
  | "development"
  | "abandoned"
  | "paused"
  | "completed";

export const statusLabels: Record<ProjectStatus, string> = {
  development: "в разработке",
  abandoned: "брошен",
  paused: "отложен",
  completed: "завершён",
};

export type Section = "skills" | "jobs" | "projects";

export interface AboutBlock {
  text: string;
  photoUrl: string | null;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  order: number;
  repositoryUrl: string | null;
  demoUrl: string | null;
  status: ProjectStatus | null;
}

export type PortfolioItemInput = Omit<PortfolioItem, "id">;

export interface PortfolioDocument {
  about: AboutBlock;
  skills: PortfolioItem[];
  jobs: PortfolioItem[];
  projects: PortfolioItem[];
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  confirmToken?: string | null;
}