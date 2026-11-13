import * as fs from "node:fs";
import * as path from "node:path";
import { generateSnakeAnimation, type Source } from "./generate";
import { parseOutputsOption } from "./outputsOptions";
import { isPlatform, platforms, type Platform } from "./sources";

// 极简输入读取：同时兼容 GitHub Action 的 INPUT_* 与 CNB 插件的 PLUGIN_*
const getInput = (name: string) =>
  process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] || "";

const getPluginSetting = (name: string) =>
  process.env[`PLUGIN_${name.toUpperCase()}`] || "";

const parseArgs = (argv: string[]) => {
  const args: Record<string, string | string[]> = {};
  for (let i = 2; i < argv.length; i++) {
    const m = argv[i].match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) continue;
    const key = m[1];
    const val = m[2] ?? "";
    const cur = args[key];
    if (Array.isArray(cur)) cur.push(val);
    else if (cur !== undefined) args[key] = [cur, val];
    else args[key] = val;
  }
  return args;
};

const first = (...values: (string | undefined)[]) =>
  values.map((v) => v?.trim()).find((v): v is string => !!v);

const main = async () => {
  const args = parseArgs(process.argv);
  const flag = (name: string) =>
    typeof args[name] === "string" ? (args[name] as string) : undefined;
  const read = (name: string) =>
    first(flag(name), getPluginSetting(name), getInput(name));

  const platformRaw = read("platform") ?? "github";
  if (!isPlatform(platformRaw))
    throw new Error(
      `unsupported platform "${platformRaw}" (expected ${platforms.join(" | ")})`,
    );
  const platform: Platform = platformRaw;

  const username = first(
    flag("user"),
    flag("username"),
    flag("github_user"), // legacy
    getInput("user_name"),
    getInput("github_user_name"), // legacy
    getPluginSetting("username"),
    platform === "cnb" ? process.env.CNB_BUILD_USER : undefined,
  );

  if (!username)
    throw new Error(
      "user_name is required (--user / PLUGIN_USERNAME / INPUT_USER_NAME / INPUT_GITHUB_USER_NAME)",
    );

  const tokenByPlatform: Record<Platform, (string | undefined)[]> = {
    github: [
      flag("github_token"),
      getInput("github_token"),
      process.env.GITHUB_TOKEN,
    ],
    cnb: [getInput("cnb_token"), process.env.CNB_TOKEN],
    gitlab: [getInput("gitlab_token"), process.env.GITLAB_TOKEN],
  };
  const token =
    first(
      flag("token"),
      getPluginSetting("token"),
      ...tokenByPlatform[platform],
    ) ?? "";

  const metric = read("metric") === "commit" ? "commit" : "score";
  const daysRaw = Number(read("days") ?? 365);
  const days = Number.isFinite(daysRaw) && daysRaw > 0 ? daysRaw : 365;
  const baseUrl = read("base_url") || undefined;

  const outputArgs: string[] = Array.isArray(args.output)
    ? args.output
    : typeof args.output === "string"
      ? [args.output]
      : [];

  // 既支持 `bun src/cli.ts --output=...`（可多次），也支持 Action / 插件的环境变量
  const envOutputs = [
    getInput("outputs"),
    ...(getPluginSetting("outputs")
      ? [getPluginSetting("outputs")]
      : [getPluginSetting("output")]),
  ];

  const outputsRaw = [
    ...outputArgs,
    ...(outputArgs.length ? [] : envOutputs),
    getInput("svg_out_path"), // 兼容旧字段
  ]
    .flatMap((x) => (x ?? "").split("\n"))
    .map((x) => x.trim())
    .filter(Boolean);

  const source: Source =
    platform === "github"
      ? { platform, username, githubToken: token, baseUrl }
      : platform === "cnb"
        ? { platform, username, token, baseUrl, metric, days }
        : { platform, username, token, baseUrl, days };

  const outputs = parseOutputsOption(
    outputsRaw,
    platform === "github" ? "default" : platform,
  );

  const results = await generateSnakeAnimation(source, outputs);

  outputs.forEach((out, i) => {
    const result = results[i];
    if (out?.filename && result) {
      console.log(`writing to ${out.filename}`);
      fs.mkdirSync(path.dirname(out.filename), { recursive: true });
      fs.writeFileSync(out.filename, result);
    }
  });
};

main().catch((e) => {
  console.error(`::error::${e?.message ?? e}`);
  process.exit(1);
});
