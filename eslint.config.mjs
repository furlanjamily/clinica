import nextConfig from "eslint-config-next/core-web-vitals";

export default [
  ...nextConfig,
  {
    rules: {
      // React Compiler rules — disabled until codebase is migrated
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/incompatible-library": "off",
      // Downgrade missing-deps warnings to warn (non-blocking)
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
