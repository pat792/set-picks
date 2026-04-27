import importPlugin from "eslint-plugin-import";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "functions/**"],
  },
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./src/features",
              from: "./src/pages",
              message: "Features must not import from pages layer.",
            },
            {
              target: "./src/features",
              from: "./src/app",
              message: "Features must not import from app layer.",
            },
            {
              target: "./src/shared",
              from: "./src/features",
              message: "Shared must not depend on features.",
            },
            {
              target: "./src/shared",
              from: "./src/pages",
              message: "Shared must not depend on pages.",
            },
            {
              target: "./src/shared",
              from: "./src/app",
              message: "Shared must not depend on app layer.",
            },
            {
              target: "./src/pages",
              from: "./src/app",
              message: "Pages must not import from app layer.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/pages/**/*.{js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "firebase/firestore",
              message: "Pages must not call Firestore directly; use feature model/api.",
            },
            {
              name: "firebase/auth",
              message: "Pages must not call Firebase auth directly; use feature model/api.",
            },
          ],
          patterns: [
            {
              group: ["**/features/*/api/**"],
              message: "Pages must not import feature api directly; import feature model hooks.",
            },
            {
              group: ["**/shared/lib/firebase/**", "**/shared/lib/firebase"],
              message: "Pages must not import firebase clients directly.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/pages/**/*.{js,jsx}", "src/app/**/*.{js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/features/*/*"],
              message:
                "Import features via their public API only (features/<domain>/index.js).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/**/*.{js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex:
                "^(?:\\.\\./){2,}(?!shared/|pages/|app/)[^/]+\\/(api|model|ui|components)(?:\\/|$)",
              message:
                "Do not import another feature's internals; use a feature public entry point.",
            },
            {
              regex:
                "^(?:\\.\\./)+(?:admin|auth|landing|picks|pools|profile|scoring|standings)/(?!index(?:\\.[^/]+)?$).+",
              message:
                "Cross-feature imports must target feature root only (e.g. ../otherFeature), not deep internals.",
            },
          ],
        },
      ],
    },
  },
  {
    // Model layer must not call Firebase directly; IO belongs in feature `api/`.
    // Duplicates the cross-feature `patterns` from the parent block because
    // ESLint flat config replaces (rather than merges) `no-restricted-imports`
    // when two configs target the same file.
    files: ["src/features/*/model/**/*.{js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "firebase/firestore",
              message:
                "Models must not import firebase/firestore directly; place IO in feature api/.",
            },
            {
              name: "firebase/auth",
              message:
                "Models must not import firebase/auth directly; place IO in feature api/.",
            },
            {
              name: "firebase/functions",
              message:
                "Models must not import firebase/functions directly; place IO in feature api/.",
            },
            {
              name: "firebase/storage",
              message:
                "Models must not import firebase/storage directly; place IO in feature api/.",
            },
            {
              name: "firebase/app-check",
              message:
                "Models must not import firebase/app-check directly; place IO in feature api/.",
            },
          ],
          patterns: [
            {
              regex:
                "^(?:\\.\\./){2,}(?!shared/|pages/|app/)[^/]+\\/(api|model|ui|components)(?:\\/|$)",
              message:
                "Do not import another feature's internals; use a feature public entry point.",
            },
            {
              regex:
                "^(?:\\.\\./)+(?:admin|auth|landing|picks|pools|profile|scoring|standings)/(?!index(?:\\.[^/]+)?$).+",
              message:
                "Cross-feature imports must target feature root only (e.g. ../otherFeature), not deep internals.",
            },
          ],
        },
      ],
    },
  },
];
