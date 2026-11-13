# contrib-snake

[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/h1s97x/gh-snake/main.yml?label=action&style=flat-square)](https://github.com/h1s97x/gh-snake/actions/workflows/main.yml)
[![GitHub release](https://img.shields.io/github/release/h1s97x/gh-snake.svg?style=flat-square)](https://github.com/h1s97x/gh-snake/releases/latest)
[![GitHub marketplace](https://img.shields.io/badge/marketplace-snake-blue?logo=github&style=flat-square)](https://github.com/h1s97x/gh-snake)
![type definitions](https://img.shields.io/npm/types/typescript?style=flat-square)
![code style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)

Generates a snake game from a user contribution grid. One codebase, multiple
platforms: **GitHub**, **CNB** and **GitLab** (plus any platform you add an
adapter for).

Canonical repository: `h1s97x/plugins/contrib-snake` (CNB). The GitHub mirror
`h1s97x/gh-snake` is kept for GitHub Action / Marketplace references.

<picture>
  <source
    media="(prefers-color-scheme: dark)"
    srcset="https://raw.githubusercontent.com/h1s97x/h1s97x/main/snake-dark.svg"
  />
  <source
    media="(prefers-color-scheme: light)"
    srcset="https://raw.githubusercontent.com/h1s97x/h1s97x/main/snake.svg"
  />
  <img
    alt="github contribution grid snake animation"
    src="https://raw.githubusercontent.com/h1s97x/h1s97x/main/snake.svg"
  />
</picture>

Pull a user's contribution graph, make it a snake game, generate a snake path
where the cells get eaten in an orderly fashion and write an animated
[svg](https://raw.githubusercontent.com/h1s97x/h1s97x/main/snake.svg). Colors
can be customized via the `outputs` option.

## Supported platforms

| `platform` | Data source                                  | Token                                                                | Default palette |
| ---------- | -------------------------------------------- | -------------------------------------------------------------------- | --------------- |
| `github`   | GitHub GraphQL `contributionsCollection`     | `github_token` (defaults to the action token)                        | `github`        |
| `cnb`      | `https://api.cnb.cool/users/{user}/calendar` | `CNB_TOKEN` / `cnb_token`                                            | `cnb`           |
| `gitlab`   | `{base}/users/{user}/calendar.json`          | optional `GITLAB_TOKEN` / `gitlab_token` (for private contributions) | `gitlab`        |

All adapters produce the same `Cell[]` shape, so the solver and the SVG renderer
are completely platform independent. See [Adding a platform](#adding-a-platform).

## Usage

### GitHub Action

Add a workflow to your profile repo (e.g. `.github/workflows/snake.yml`):

```yaml
on:
  schedule:
    - cron: "0 6 * * *" # every day
  workflow_dispatch:

permissions:
  contents: write

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - name: generate snake svg
        uses: h1s97x/gh-snake@main
        with:
          github_user_name: ${{ github.repository_owner }}
          outputs: |
            snake.svg
            snake-dark.svg?palette=github-dark

      - name: commit and push
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add snake.svg snake-dark.svg
          git commit -m "chore: update contribution snake" || exit 0
          git push
```

The same action works for the other platforms — set `platform` and pass the
matching token, for example:

```yaml
- uses: h1s97x/gh-snake@main
  with:
    platform: gitlab
    user_name: my-gitlab-user
    gitlab_token: ${{ secrets.GITLAB_TOKEN }}
    outputs: |
      snake.svg
      snake-dark.svg?palette=gitlab-dark
```

Then embed it in your `README.md`:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="snake-dark.svg" />
  <source media="(prefers-color-scheme: light)" srcset="snake.svg" />
  <img alt="contribution snake" src="snake.svg" />
</picture>
```

[example with cron job](https://github.com/h1s97x/h1s97x/blob/main/.github/workflows/snake.yml)

### CNB pipeline plugin

This repository also builds a CNB Docker plugin. Pushing a tag publishes
`docker.cnb.cool/h1s97x/plugins/contrib-snake:latest` automatically:

```yaml
main:
  "crontab: 0 0 * * *":
    - name: contribution-snake
      stages:
        - name: generate
          image: docker.cnb.cool/h1s97x/plugins/contrib-snake:latest
          settings:
            theme: both
            output: snake.svg
        - name: commit-back
          image: oven/bun:1.3
          script: |
            git config user.name "cnb-bot"
            git config user.email "bot@cnb.cool"
            git add snake.svg snake-dark.svg
            git diff --cached --quiet || git commit -m "chore: update snake [skip ci]"
            git push
```

| setting    | description                                                           | default     |
| ---------- | --------------------------------------------------------------------- | ----------- |
| `platform` | `github` / `cnb` / `gitlab`                                           | `cnb`       |
| `username` | user name; falls back to `CNB_BUILD_USER`                             | —           |
| `token`    | platform token (`CNB_TOKEN` is injected in CNB pipelines)             | —           |
| `days`     | contribution window in days                                           | `365`       |
| `metric`   | `score` / `commit` (CNB only)                                         | `score`     |
| `theme`    | `light` / `dark` / `both`                                             | `both`      |
| `output`   | base output file; `both` also writes `<name>-dark.svg`                | `snake.svg` |
| `outputs`  | multi-line output list with query options; overrides `theme`/`output` | —           |
| `base_url` | self-hosted platform API base url                                     | —           |

Settings from the former `cnb-snake` plugin (`username`, `days`, `metric`,
`theme`, `output`) are unchanged.

### CLI

```bash
# github
bun src/cli.ts --platform=github --user=h1s97x --github_token=<token> \
  --output=dist/snake.svg \
  --output=dist/snake-dark.svg?palette=github-dark

# cnb
CNB_TOKEN=<token> bun src/cli.ts --platform=cnb --user=h1s97x \
  --output=dist/snake.svg --output=dist/snake-dark.svg?palette=cnb-dark

# gitlab (self-hosted instance)
bun src/cli.ts --platform=gitlab --user=someone \
  --base_url=https://gitlab.example.com \
  --output=dist/snake.svg?palette=gitlab-light
```

Flags: `--platform`, `--user` (`--username`, legacy `--github_user`), `--token`,
`--github_token`, `--metric`, `--days`, `--base_url`, `--output` (repeatable).
The CLI also reads `INPUT_*` (GitHub Action) and `PLUGIN_*` (CNB plugin)
environment variables.

### dark mode

![dark mode](https://github.com/user-attachments/assets/6b900b64-0cdc-43f0-a234-e11dba8e786e)

For **dark mode** support on GitHub, use this [special syntax](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-syntax/basic-writing-and-formatting-syntax#specifying-the-theme-an-image-is-shown-to) in your readme (shown above).

## Adding a platform

1. Add `src/sources/<platform>.ts` exporting a function that returns
   `Promise<Cell[]>` (`{ x, y, date, count, level }`). `cellsFromDailyCounts`
   in `src/sources/daily.ts` builds the grid for date-keyed calendars.
2. Add the platform to `platforms` / `Source` in `src/sources/types.ts` and a
   `case` in `getContribution` (`src/sources/index.ts`).
3. Add `<platform>-light` / `<platform>-dark` palettes to `src/palettes.ts`.

## Migrating from cnb-snake

`h1s97x/plugins/cnb-snake` is archived: its CNB data source, plugin entrypoint,
palettes and multi-platform groundwork now live here. Replace the plugin image
with `docker.cnb.cool/h1s97x/plugins/contrib-snake:latest`; all `settings` keys
stay valid.

The CNB repository is now `h1s97x/plugins/contrib-snake` (the old `gh-snake`
slug redirects). The GitHub mirror is still `h1s97x/gh-snake`, so the Action
reference `h1s97x/gh-snake@main` and the badges above remain valid.

## Implementation

[solver algorithm](./src/solver/README.md)

## Contributing

Contributions are welcome! This project is open to issues, feature requests, and pull requests.

- **Issues**: open an issue for bugs or ideas.
- **Pull requests**: fork the repo, make your change on a branch, and open a PR against `main`. Keep changes focused and add or update tests where relevant.
- Larger changes are welcome too — open an issue first if you'd like to discuss direction.

## License

Distributed under the [MIT License](./LICENSE).
