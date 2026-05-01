import nextConfig from "eslint-config-next/core-web-vitals";

export default [
  ...nextConfig,
  {
    rules: {
      // React Compiler rules — not applicable without the React Compiler transform
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/immutability": "off",
      // Downgrade to warn so it never blocks the build
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
