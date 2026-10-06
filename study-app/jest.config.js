/** @type {import("ts-jest").TsJestTransformerOptions} */
const tsJest = ["ts-jest", { tsconfig: "tsconfig.jest.json" }];

/** @type {import("jest").Config} */
export default {
  collectCoverageFrom: ["webapp/src/**/*.{ts,tsx}", "!**/*.test.{ts,tsx}", "!**/generated/**", "!**/test-support/**", "!webapp/src/main.tsx"],
  projects: [
    {
      displayName: "webapp",
      testEnvironment: "jsdom",
      transform: { "^.+\\.tsx?$": tsJest },
      testMatch: ["<rootDir>/webapp/src/**/*.test.{ts,tsx}"],
      setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    },
  ],
};
