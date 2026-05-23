// @farmconnect/config/eslint/node.js
// Node.js ESLint flat config — extends base with Node-specific rules.

import globals from "globals";

import base from "./base.js";

/** @type {import("eslint").Linter.FlatConfig[]} */
const node = [
  ...base,
  {
    files: ["**/*.ts", "**/*.mts", "**/*.cts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-process-exit": "off", // replaced by consistent-return / proper shutdown
    },
  },
];

export default node;
