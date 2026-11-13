import { getCnbUserContribution } from "./cnb";
import { getGithubUserContribution } from "./github";
import { getGitlabUserContribution } from "./gitlab";
import type { Cell, Source } from "./types";

export { getCnbUserContribution } from "./cnb";
export { getGithubUserContribution } from "./github";
export { getGitlabUserContribution } from "./gitlab";
export { platforms, isPlatform } from "./types";
export type {
  Cell,
  Platform,
  Source,
  GithubSource,
  CnbSource,
  GitlabSource,
} from "./types";

/** 单一分派点：所有平台在这里产出同一种 Cell[] */
export const getContribution = (source: Source): Promise<Cell[]> => {
  switch (source.platform) {
    case "github":
      return getGithubUserContribution(source.username, {
        githubToken: source.githubToken,
        baseUrl: source.baseUrl,
      });
    case "cnb":
      return getCnbUserContribution(source.username, source);
    case "gitlab":
      return getGitlabUserContribution(source.username, source);
  }
};
