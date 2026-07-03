module.exports = {
  preset: "jest-expo",
  testPathIgnorePatterns: ["/node_modules/", "/android/", "/ios/"],
  // Default testMatch treats every file under a __tests__ dir as a test
  // file; restrict to *.test.ts so shared helpers (testUtils.ts) can live
  // alongside the tests without Jest trying to run them as suites.
  testMatch: ["**/__tests__/**/*.test.[jt]s?(x)"],
};
