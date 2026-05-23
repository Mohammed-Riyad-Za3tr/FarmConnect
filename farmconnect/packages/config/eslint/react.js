// @farmconnect/config/eslint/react.js
// React ESLint flat config — extends base with React + hooks rules.

import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

import base from "./base.js";

/** @type {import("eslint").Linter.FlatConfig[]} */
const react = [
  ...base,
  {
    files: ["**/*.tsx", "**/*.jsx"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      // React
      "react/react-in-jsx-scope": "off", // React 17+ JSX transform
      "react/prop-types": "off", // We use TypeScript
      "react/self-closing-comp": "error",
      "react/jsx-no-useless-fragment": ["error", { allowExpressions: true }],
      "react/display-name": "off",

      // Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default react;
