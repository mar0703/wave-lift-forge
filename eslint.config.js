import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import boundaries from "eslint-plugin-boundaries";

export default tseslint.config(
  { ignores: ["dist", ".output", ".vinxi"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // ───────────────────────────────────────────────────────────────────────────
  // Architectural boundary rules (eslint-plugin-boundaries)
  //
  // Enforces the directional architecture and isolates the AI analysis layer
  // from the deterministic runtime. See src/lib/ai-analysis/index.ts for the
  // architectural doctrine these rules encode.
  //
  // Direction (one-way, top → bottom):
  //   routes  →  components  →  hooks  →  lib
  //
  // Isolation:
  //   * scripts/         — auxiliary audit/dev tools, must not be a runtime dep
  //   * src/lib/ai-analysis/  — read-only descriptive layer, must not be
  //                              imported by deterministic runtime or UI
  // ───────────────────────────────────────────────────────────────────────────
  {
    files: ["src/**/*.{ts,tsx}", "scripts/**/*.ts", "tests/**/*.ts"],
    plugins: { boundaries },
    settings: {
      "boundaries/include": ["src/**/*", "scripts/**/*", "tests/**/*"],
      // Resolve "@/foo" imports to "./src/foo" for boundary classification.
      "boundaries/alias": { "@": "./src" },
      // Order matters: most-specific patterns must come first so a file in
      // src/lib/ai-analysis/ is classified as "ai-analysis", not "lib".
      "boundaries/elements": [
        { type: "ai-analysis", pattern: "src/lib/ai-analysis/**/*" },
        { type: "lib", pattern: "src/lib/**/*" },
        { type: "components", pattern: "src/components/**/*" },
        { type: "hooks", pattern: "src/hooks/**/*" },
        { type: "routes", pattern: "src/routes/**/*" },
        { type: "scripts", pattern: "scripts/**/*" },
        { type: "tests", pattern: "tests/**/*" },
      ],
    },
    rules: {
      // Files outside the element map (config files, generated files) are
      // intentionally ignored — boundaries should not police them.
      "boundaries/no-unknown": "off",
      "boundaries/no-unknown-files": "off",
      // Rule name kept as "boundaries/element-types" (v5 name) — the v6
      // "boundaries/dependencies" rule schema in plugin 6.0.2 does not yet
      // accept object-form selectors, while string-form selectors are accepted
      // by both. The plugin emits a deprecation warning we accept for now.
      "boundaries/element-types": [
        "error",
        {
          default: "allow",
          rules: [
            // (1) scripts/ must not be imported by src/lib/.
            //     Scripts are auxiliary audit/report tools — they may depend
            //     on lib, but lib must never depend on them.
            {
              from: ["lib", "ai-analysis"],
              disallow: ["scripts"],
              message:
                "src/lib/ must not import from scripts/. Scripts are auxiliary tools and cannot be runtime dependencies.",
            },
            // (2) Runtime must not import the AI analysis layer.
            //     ai-analysis is a read-only descriptive layer; the
            //     deterministic engine, UI components, hooks, and routes
            //     must not take a dependency on it. Tests are exempt.
            {
              from: ["lib", "components", "hooks", "routes"],
              disallow: ["ai-analysis"],
              message:
                "Runtime code must not import from src/lib/ai-analysis/. The AI analysis layer is read-only and cannot influence runtime behaviour.",
            },
            // (3) Directional architecture: dependencies flow downward only.
            //     routes → components → hooks → lib; never the reverse.
            {
              from: ["lib", "ai-analysis"],
              disallow: ["components", "hooks", "routes"],
              message:
                "lib/ must not import from UI layers (components, hooks, routes). Core/runtime cannot depend on UI.",
            },
            {
              from: ["hooks"],
              disallow: ["components", "routes"],
              message: "hooks/ must not import from components/ or routes/.",
            },
            {
              from: ["components"],
              disallow: ["routes"],
              message: "components/ must not import from routes/.",
            },
          ],
        },
      ],
    },
  },
  eslintPluginPrettier,
);
