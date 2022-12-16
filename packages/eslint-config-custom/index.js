module.exports = {
  extends: ["next", "turbo", "prettier"],
  plugins: ["no-only-tests"],
  rules: {
    "no-only-tests/no-only-tests": "error",
    "@next/next/no-html-link-for-pages": "off",
    "react/jsx-key": "off",
  },
};
