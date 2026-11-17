import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// A form submitted before hydration falls back to a native GET, which puts every field in the URL.
const formMethod = {
  meta: {
    type: "problem",
    messages: { get: 'A <form> with onSubmit needs method="post" or an action, so a submit before hydration never puts its fields in the URL.' },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== "JSXIdentifier" || node.name.name !== "form") return;
        const attribute = (name) => node.attributes.find((a) => a.type === "JSXAttribute" && a.name.name === name);
        if (!attribute("onSubmit") || attribute("action")) return;
        if (attribute("method")?.value?.value === "post") return;
        context.report({ node, messageId: "get" });
      },
    };
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.tsx"],
    plugins: { app: { rules: { "form-method": formMethod } } },
    rules: { "app/form-method": "error" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-e2e/**",
    "test-results/**",
    "playwright-report/**",
    "blob-report/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".claude/**",
    ".agents/**",
  ]),
]);

export default eslintConfig;
