module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
    "/generated/**/*",
  ],
  plugins: ["@typescript-eslint", "import"],
  rules: {
    // ─── Disabled because they cause friction on Windows / in normal TS ───
    "linebreak-style": "off",          // Allows CRLF line endings
    "object-curly-spacing": "off",      // Allows { key } and {key}
    "no-multi-spaces": "off",           // Allows aligned comments
    "max-len": "off",                   // No line-length limit
    "require-jsdoc": "off",             // No forced JSDoc
    "valid-jsdoc": "off",               // No forced JSDoc param validation
    "indent": "off",                    // Prettier/editor handles this
    "eol-last": "off",                  // Doesn't require newline at EOF
    "operator-linebreak": "off",        // Allows ? and : on either line
    "quotes": "off",                    // Allows single or double quotes
    "comma-dangle": "off",              // Allows trailing commas
  },
};