/**
 * GitLab 링크 — 엔진 태그 페이지와 그 태그의 파이프라인(qc job 결과).
 * 경로 규칙: 엔진은 developer/artifact/<프로젝트>, 7zip 만 developer/thirdparty-library/7zip.
 */
const GITLAB = "http://gitlab.isarc.inca";

const PATH_OVERRIDE: Record<string, string> = {
  "7zip": "developer/thirdparty-library/7zip",
};

export function gitlabProjectPath(projectName: string): string {
  return PATH_OVERRIDE[projectName] ?? `developer/artifact/${projectName}`;
}

export function gitlabTagUrl(projectName: string, tag: string): string {
  return `${GITLAB}/${gitlabProjectPath(projectName)}/-/tags/${encodeURIComponent(tag)}`;
}

export function gitlabPipelinesUrl(projectName: string, tag: string): string {
  return `${GITLAB}/${gitlabProjectPath(projectName)}/-/pipelines?ref=${encodeURIComponent(tag)}`;
}
