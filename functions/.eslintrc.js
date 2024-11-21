module.exports = {
  env: {
    node: true, // Ensures Node.js globals like 'require' are defined
    es2021: true, // Allows modern ES features
  },
  extends: [
    "eslint:recommended", // Use ESLint's recommended rules
    "google" // Use Google style guide
  ],
  parserOptions: {
    ecmaVersion: 2021, // Enable ES modules
    sourceType: "module", // Specify ES module syntax
  },
  rules: {
    "no-console": "off", // Allow console statements
    "quotes": ["error", "double"], // Enforce double quotes
    "indent": ["error", 2], // Enforce 2-space indentation
  }
};
