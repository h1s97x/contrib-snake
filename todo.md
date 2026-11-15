# TODO

> 收敛收尾状态快照：2026-11-14，当前 HEAD `6abaf45`。

## 待办

- [ ] 在 GitHub 仓库 `h1s97x/contrib-snake` 的 _Settings → Secrets and
      variables → Actions_ 添加 `CNB_TOKEN`（CNB 访问令牌，需 `repo-code:rw`）。
      `.github/workflows/sync-cnb.yml` 目前因缺少该 secret 走「跳过」分支，
      GitHub → CNB 的反向兜底同步并未真正生效。
      完成判据：直接在 GitHub 改一个文件后，CNB `main` 出现
      `chore: sync from github` 提交。

- [ ] 把 `v3.5.0` tag 补到 GitHub 镜像。CNB 侧已有（插件镜像由它构建），
      GitHub 侧 tags 仍为空；`.cnb.yml` 的 `push_tags: true` 本次未带过去。
      方式：重新触发 CNB → GitHub 同步，或用有写权限的 GitHub 凭据推 tag。
      完成判据：`git ls-remote --tags https://github.com/h1s97x/contrib-snake.git`
      能看到 `v3.5.0`。

- [ ] 用真实 token 端到端验证 CNB / GitLab 适配器。目前只有
      `src/__tests__/sources.spec.ts` 的 mock 测试；CNB 需要 `CNB_TOKEN`，
      GitLab 用 `PRIVATE-TOKEN` 读私有贡献。
      完成判据：两个平台各跑一次 `bun src/cli.ts` 并成功产出 SVG。

- [ ] 评估 GitLab 数据源的长期风险：
      `https://gitlab.com/users/{user}/calendar.json` 是用户主页接口，不是
      `/api/v4` 稳定 API，可能随 GitLab 版本变化。备选方案是改用
      `/api/v4/users/:id/events` 聚合事件并自行分页。

- [ ] 给 `action.yml` 的新输入补 CI 覆盖：`platform` / `cnb_token` /
      `gitlab_token` / `metric` / `days` / `base_url`。当前
      `.github/workflows/main.yml` 的 `test-action` 只跑默认 GitHub 路径。
      完成判据：CI 里至少有一个非 GitHub 平台的离线冒烟 job。

- [ ] 在真实 CNB 流水线里跑一次新插件镜像
      `docker.cnb.cool/h1s97x/plugins/contrib-snake:latest`（已发布，
      revision `6abaf45`）。
      进展：profile 仓库 `h1s97x/h1s97x` 已接入（`h1s97x/h1s97x#11`，每日
      定时流水线新增 `contrib-snake` stage，`theme: both`）；CLI 侧已用真实
      `CNB_TOKEN` 产出 `snake.svg` / `snake-dark.svg`，尚未跑过 Docker 镜像本身。
      完成判据：一次 pipeline 成功生成 `snake.svg` / `snake-dark.svg`。

- [ ] 轮换对话里出现过的 CNB 访问令牌（令牌名 `test`），并确认它没有被写进
      任何仓库文件。

- [ ] 把外部 workflow 中的 `uses: h1s97x/gh-snake@main` 换成
      `uses: h1s97x/contrib-snake@main`（旧名目前依赖 GitHub 重定向）。

## 可选

- [ ] 已归档的 `h1s97x/plugins/cnb-snake` 加一条指向新仓库的迁移提示（仓库
      已只读，需先确认能否改描述/文档）。
- [ ] 明确发版规则：`package.json` 为 `3.5.0`、tag 为 `v3.5.0`，后续统一
      bump 与 tag 命名。

## 已完成（备查）

- 单仓库收敛：`src/sources/` 适配 GitHub / CNB / GitLab；`cnb-snake` 已归档只读。
- 双端改名完成，仓库内 `gh-snake` 残留为 0；CNB 与 GitHub 的 `main` 一致。
- 类型检查、prettier、40 个离线测试通过；GitHub Actions `main` 在 `6abaf45`
  成功（含真实 GitHub GraphQL 集成测试与 `uses: ./` 的 Action 实跑）。
- `v3.5.0` → CNB 构建 `cnb-k6b-1k7b6f1jt` 成功，插件镜像 `:latest` 已发布。
- 反向同步 workflow 改为幂等且缺凭据时跳过，不再报红。
