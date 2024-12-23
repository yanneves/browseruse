/** @type {import('prettier').Options} */
const config = {
  plugins: [
    "prettier-plugin-svelte",
    "prettier-plugin-tailwindcss",
    "@ianvs/prettier-plugin-sort-imports",
  ],
  overrides: [{ files: "*.svelte", options: { parser: "svelte" } }],
};

export default config;
