export default [
  {
    ignores: ["supabase/functions/**"],
  },
  {
    name: "Supabase Functions (Deno)",
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        Deno: "readonly",
        Response: "readonly",
        Request: "readonly",
        Headers: "readonly",
        fetch: "readonly",
        console: "readonly",
        crypto: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
      },
    },
    files: ["supabase/functions/**/*.{js,ts}"],
    rules: {
      "no-unused-vars": ["error", { varsIgnorePattern: "^_" }],
      "no-undef": "error",
    },
  },
];
