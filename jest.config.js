/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
const config = {
    clearMocks: true,
    collectCoverage: false,
    coverageDirectory: "coverage",
    moduleDirectories: ["node_modules", "api/__mock__"],
    testMatch: [
        "**/__tests__/**/*.test.js",
        // "**/__tests__/**/*.[jt]s?(x)",
        // "**/?(*.)+(spec|test).[tj]s?(x)"
    ],
    transform: {
        "^.+\\.js$": ["babel-jest", { configFile: "./babel.config.cjs" }],
    },
    extensionsToTreatAsEsm: [],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    testEnvironment: "node",

    // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
    transformIgnorePatterns: ["/node_modules/", "\\.pnp\\.[^\\/]+$"],
};

export default config;
