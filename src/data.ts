export const possiblePrettierFiles: string[] = [
  ".prettierrc",
  ...["json", "yml", "yaml", "json5", "js", "cjs"].map(
    (ext) => `.prettierrc.${ext}`
  ),
  ...["js", "cjs"].map((ext) => `pretter.config.${ext}`),
  ".prettierrc.toml",
];
