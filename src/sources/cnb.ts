import { cellsFromDailyCounts, compactDateKey } from "./daily";
import type { Cell } from "./types";

/** CNB 活跃日历：GET https://api.cnb.cool/users/{username}/calendar?year=yyyy */
type CalendarDay = {
  score: number;
  commit_count: number;
  pr_count: number;
  issues_count: number;
  valid_pr_count: number;
  valid_cr_count: number;
};

export type CnbContributionOptions = {
  token?: string;
  baseUrl?: string;
  /** score=与 CNB 热力图颜色一致；commit=提交数 */
  metric?: "score" | "commit";
  /** 统计窗口天数（默认 365） */
  days?: number;
};

export const getCnbUserContribution = async (
  username: string,
  o: CnbContributionOptions = {},
): Promise<Cell[]> => {
  const baseUrl = o.baseUrl ?? "https://api.cnb.cool";
  const token = o.token ?? process.env.CNB_TOKEN;
  const metric = o.metric ?? "score";

  if (!token) throw new Error("Missing CNB token (set CNB_TOKEN or --token)");

  const fetchYear = async (y: number) => {
    const res = await fetch(
      `${baseUrl}/users/${encodeURIComponent(username)}/calendar?year=${y}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok)
      throw new Error(
        `CNB calendar ${y} failed (${res.status}): ` +
          (await res.text().catch(() => res.statusText)),
      );
    return (await res.json()) as Record<string, CalendarDay>;
  };

  const year = new Date().getFullYear();
  // 跨年：拉当年 + 上一年，合并（稀疏 map，缺失即 0）
  const [previous, current] = await Promise.all([
    fetchYear(year - 1),
    fetchYear(year),
  ]);
  const byDate = { ...previous, ...current };

  const metricValue = (e: CalendarDay | undefined): number =>
    !e
      ? 0
      : metric === "score"
        ? e.score
        : e.commit_count + e.issues_count + e.pr_count;

  return cellsFromDailyCounts(
    (d) => metricValue(byDate[compactDateKey(d)]),
    o.days ?? 365,
  );
};
