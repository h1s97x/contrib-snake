import { cellsFromDailyCounts, dateKey } from "./daily";
import type { Cell } from "./types";

export type GitlabContributionOptions = {
  /** 可选：PRIVATE-TOKEN，用于读取私有贡献 */
  token?: string;
  /** 自建实例地址，默认 https://gitlab.com */
  baseUrl?: string;
  days?: number;
};

/**
 * GitLab 贡献日历：GET {baseUrl}/users/{username}/calendar.json
 * 返回 { "YYYY-MM-DD": count }。该接口是 GitLab 用户主页使用的公开接口，
 * 不是 /api/v4 的稳定 API；token 仅用于读取私有贡献。
 */
export const getGitlabUserContribution = async (
  username: string,
  o: GitlabContributionOptions = {},
): Promise<Cell[]> => {
  const baseUrl = o.baseUrl ?? "https://gitlab.com";
  const token = o.token ?? process.env.GITLAB_TOKEN;

  const res = await fetch(
    `${baseUrl}/users/${encodeURIComponent(username)}/calendar.json`,
    {
      headers: {
        ...(token ? { "PRIVATE-TOKEN": token } : {}),
        Accept: "application/json",
      },
    },
  );

  if (!res.ok)
    throw new Error(
      `GitLab calendar failed (${res.status}): ` +
        (await res.text().catch(() => res.statusText)),
    );

  const data = (await res.json()) as Record<string, number>;
  const byDate = new Map(
    Object.entries(data).map(([date, count]) => [date, Number(count) || 0]),
  );

  return cellsFromDailyCounts(
    (d) => byDate.get(dateKey(d)) ?? 0,
    o.days ?? 365,
  );
};
