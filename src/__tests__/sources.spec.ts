import { expect, it } from "bun:test";
import { generateSnakeAnimation } from "../generate";
import { parseEntry } from "../outputsOptions";
import { cellsFromDailyCounts, dateKey } from "../sources/daily";
import { getCnbUserContribution } from "../sources/cnb";
import { getGitlabUserContribution } from "../sources/gitlab";
import { getContribution, isPlatform, platforms } from "../sources";

const withFetch = async (
  responder: (url: string) => unknown,
  handler: () => Promise<void>,
) => {
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    return new Response(JSON.stringify(responder(url)), { status: 200 });
  }) as typeof fetch;
  try {
    await handler();
  } finally {
    globalThis.fetch = original;
  }
};

it("registers the supported platforms", () => {
  expect(platforms).toEqual(["github", "cnb", "gitlab"]);
  expect(isPlatform("gitlab")).toBe(true);
  expect(isPlatform("bitbucket")).toBe(false);
});

it("builds a sunday-aligned grid with 5 levels", () => {
  const cells = cellsFromDailyCounts((d) => d.getDate(), 28);
  // 窗口回退到周日对齐后，最多再加 6 天
  expect(cells.length).toBeGreaterThanOrEqual(28);
  expect(cells.length).toBeLessThanOrEqual(34);
  expect(cells[0].y).toBe(0);
  expect(cells.every((c) => c.y >= 0 && c.y <= 6)).toBe(true);
  expect(cells.every((c) => c.level >= 0 && c.level <= 4)).toBe(true);
  expect(cells.at(-1)!.date).toBe(dateKey(new Date()));
});

it("maps the CNB calendar into the common Cell shape", async () => {
  const calendar: Record<string, object> = {};
  for (let i = 1; i < 10; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    calendar[dateKey(d).replace(/-/g, "")] = { score: i, commit_count: i };
  }
  const today = new Date();
  calendar[dateKey(today).replace(/-/g, "")] = {
    score: 100,
    commit_count: 100,
  };
  await withFetch(
    () => calendar,
    async () => {
      const cells = await getContribution({
        platform: "cnb",
        username: "h1s97x",
        token: "fake",
        days: 30,
      });
      expect(cells.at(-1)!.count).toBe(100);
      expect(cells.at(-1)!.level).toBe(4);
      expect(cells.at(-1)!.date).toBe(dateKey(today));
    },
  );
});

it("maps the GitLab calendar into the common Cell shape", async () => {
  const today = new Date();
  await withFetch(
    () => ({ [dateKey(today)]: 5 }),
    async () => {
      const cells = await getGitlabUserContribution("someone", {
        baseUrl: "https://gitlab.example.com",
        days: 30,
      });
      expect(cells.at(-1)!.count).toBe(5);
      expect(cells.at(-1)!.date).toBe(dateKey(today));
    },
  );
});

it("renders an svg through the platform dispatch", async () => {
  const weeks = Array.from({ length: 8 }, (_, x) => ({
    contributionDays: Array.from({ length: 7 }, (_, y) => ({
      contributionCount: (x + y) % 5,
      contributionLevel: "FIRST_QUARTILE",
      weekday: y,
      date: "2026-01-01",
    })),
  }));
  await withFetch(
    () => ({
      data: {
        user: {
          contributionsCollection: { contributionCalendar: { weeks } },
        },
      },
    }),
    async () => {
      const [svg] = await generateSnakeAnimation(
        { platform: "github", username: "h1s97x", githubToken: "fake" },
        [parseEntry("out.svg")],
      );
      expect(svg).toContain("<svg");
    },
  );
});

it("throws a helpful error when the CNB token is missing", async () => {
  const previous = process.env.CNB_TOKEN;
  delete process.env.CNB_TOKEN;
  try {
    await expect(
      getCnbUserContribution("h1s97x", { baseUrl: "https://example.com" }),
    ).rejects.toThrow(/CNB token/);
  } finally {
    if (previous !== undefined) process.env.CNB_TOKEN = previous;
  }
});
