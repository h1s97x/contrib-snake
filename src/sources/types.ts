/**
 * 各平台数据源的统一契约：solver / renderer 只认识 Cell[]。
 * 新增平台时，只需在 sources/ 下加一个返回 Promise<Cell[]> 的适配器。
 */
export type Cell = {
  x: number;
  y: number;
  date: string;
  count: number;
  level: number;
};

export const platforms = ["github", "cnb", "gitlab"] as const;
export type Platform = (typeof platforms)[number];

export const isPlatform = (value: string): value is Platform =>
  (platforms as readonly string[]).includes(value);

export type GithubSource = {
  platform: "github";
  username: string;
  githubToken: string;
  baseUrl?: string;
};

export type CnbSource = {
  platform: "cnb";
  username: string;
  token?: string;
  baseUrl?: string;
  metric?: "score" | "commit";
  days?: number;
};

export type GitlabSource = {
  platform: "gitlab";
  username: string;
  token?: string;
  baseUrl?: string;
  days?: number;
};

export type Source = GithubSource | CnbSource | GitlabSource;
