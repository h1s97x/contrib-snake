# Contributing

Thanks for your interest in improving **snk**! This document explains how to
set up a development environment, run the project, and what to expect when you
open an issue or a pull request.

## Development setup

snk is built with [Bun](https://bun.sh). Generating a snake from a real
contribution graph also requires a token for the platform you query.

```bash
# install dependencies
bun install

# type-check
bun run type

# formatter / linter check
bun run lint

# run the test suite
bun test
```

## Generating a snake locally

The CLI reads `platform`, `user` and the matching token from command-line flags,
`INPUT_*` (GitHub Action style) or `PLUGIN_*` (CNB plugin style) variables.
`github_user_name` / `--github_user` are kept as legacy aliases.

```bash
# github
bun src/cli.ts --platform=github --user=<your-name> --github_token=<token> \
  --output=dist/github-snake.svg \
  --output=dist/github-snake-dark.svg?palette=github-dark

# cnb
CNB_TOKEN=<token> bun src/cli.ts --platform=cnb --user=<your-name> \
  --output=dist/cnb-snake.svg

# via Action-style environment variables
INPUT_PLATFORM=github \
INPUT_USER_NAME=<your-name> \
INPUT_GITHUB_TOKEN=<token> \
INPUT_OUTPUTS=$'dist/github-snake.svg\ndist/github-snake-dark.svg?palette=github-dark' \
bun src/cli.ts
```

> Without a token the GitHub GraphQL API returns `401`, so a real generation
> needs a personal access token with read access to your contribution calendar.
> CNB pipelines inject `CNB_TOKEN` automatically.

## Project layout

- `src/cli.ts` — entry point (GitHub Action + CNB plugin + CLI).
- `src/sources/` — platform adapters; each one produces the same `Cell[]`.
  `github.ts` (GraphQL), `cnb.ts` (calendar API), `gitlab.ts` (`calendar.json`),
  `daily.ts` (date-keyed grid helper), `index.ts` (dispatch).
- `src/generate.ts` — orchestration: fetch → path → SVG.
- `src/solver/` — computes the snake path that "eats" the contribution cells.
- `src/render/` — turns the grid + path into an animated SVG.
- `src/palettes.ts`, `src/outputsOptions.ts` — color / output configuration.
- `action.yml` — GitHub Action definition.
- `Dockerfile`, `entrypoint.sh` — CNB Docker plugin.

## Adding a platform

Add `src/sources/<platform>.ts` returning `Promise<Cell[]>`, register it in
`src/sources/types.ts` and `src/sources/index.ts`, add palettes, and cover the
adapter with an offline test in `src/__tests__/`.

## Contribution policy

This project is open to contributions.

- **Issues** and **pull requests** are both welcome.
- Fork the repo, make your change, and open a PR against `main`.
- Keep changes focused and add or adjust tests where relevant.
- For larger or API/rendering changes, opening an issue first to discuss is
  appreciated but not required.

## Running the tests

Most tests are offline (they render synthetic grids and mock the platform
APIs). One integration test fetches a real GitHub contribution graph and
therefore needs `GITHUB_TOKEN` to pass.
