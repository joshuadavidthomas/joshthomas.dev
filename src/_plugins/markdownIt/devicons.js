export default (md) => {
  const overrides = {
    dockerfile: "docker",
    diff: "git",
    sh: "bash",
    shell: "bash",
    yml: "yaml",
  };

  const fence = md.renderer.rules.fence;

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const info = token.info ? token.info.trim() : "";
    const language = info.split(/\s+/)[0];

    let result = fence(tokens, idx, options, env, self);

    if (language) {
      const iconName = overrides[language] || language;
      result = result.replace(
        /^<pre([^>]*)>/,
        `<pre$1><i class="devicon-${iconName}-plain code-icon"></i>`,
      );
    }

    return result;
  };
};
