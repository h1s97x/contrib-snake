import type { Cell } from "./types";

/** 本地日期 -> YYYY-MM-DD */
export const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

/** 本地日期 -> YYYYMMDD（CNB calendar 接口的键格式） */
export const compactDateKey = (d: Date) => dateKey(d).replace(/-/g, "");

/**
 * 把「某天的活跃数」映射成与 GitHub 贡献墙同构的 Cell[]：
 * 一列一周、y 为星期（0=周日），覆盖最近 days 天并回退到周日对齐。
 * level 用非零值的四分位点切成 0~4。
 */
export const cellsFromDailyCounts = (
  getCount: (date: Date) => number,
  days = 365,
): Cell[] => {
  const window = Math.max(1, Math.floor(days));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  start.setDate(start.getDate() - (window - 1));
  start.setDate(start.getDate() - start.getDay());

  const raw: Omit<Cell, "level">[] = [];
  const cursor = new Date(start);
  let x = 0;
  while (cursor <= today) {
    raw.push({
      x,
      y: cursor.getDay(),
      date: dateKey(cursor),
      count: getCount(cursor),
    });
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getDay() === 0) x++;
  }

  const values = raw
    .map((c) => c.count)
    .filter((v) => v > 0)
    .sort((a, b) => a - b);
  const q = (p: number) =>
    values[Math.min(values.length - 1, Math.floor(p * values.length))] ?? 0;

  return raw.map((c) => ({
    ...c,
    level:
      c.count <= 0
        ? 0
        : c.count <= q(0.25)
          ? 1
          : c.count <= q(0.5)
            ? 2
            : c.count <= q(0.75)
              ? 3
              : 4,
  }));
};
