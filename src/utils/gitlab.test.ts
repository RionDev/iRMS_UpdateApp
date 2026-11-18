import { describe, expect, it } from "vitest";
import { gitlabPipelinesUrl, gitlabProjectPath, gitlabTagUrl } from "./gitlab";

describe("gitlab links", () => {
  it("엔진은 developer/artifact 아래", () => {
    expect(gitlabProjectPath("ixtepe")).toBe("developer/artifact/ixtepe");
    expect(gitlabTagUrl("ixtepe", "1.0.0.0")).toBe(
      "http://gitlab.isarc.inca/developer/artifact/ixtepe/-/tags/1.0.0.0",
    );
  });

  it("7zip 은 thirdparty-library 아래", () => {
    expect(gitlabProjectPath("7zip")).toBe("developer/thirdparty-library/7zip");
  });

  it("파이프라인은 태그 ref 필터", () => {
    expect(gitlabPipelinesUrl("ixtebin", "1.0.0.0")).toBe(
      "http://gitlab.isarc.inca/developer/artifact/ixtebin/-/pipelines?ref=1.0.0.0",
    );
  });
});
