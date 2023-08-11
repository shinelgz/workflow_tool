/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testMatch: [
		'**/*.test.ts', // 所有 js/ts/jsx/tsx
	],
	setupFilesAfterEnv: ['<rootDir>/src/__tests__/utils/setup-test-env.ts'],
};
