module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/$1',
    '^@types/(.*)$': '<rootDir>/types/$1',
    '^@constants/(.*)$': '<rootDir>/constants/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1',
    '^@utility/(.*)$': '<rootDir>/utility/$1',
    '^@messaging/(.*)$': '<rootDir>/messaging/$1',
    '^@prismaService/(.*)$': '<rootDir>/prisma/$1',
    '^@redis/(.*)$': '<rootDir>/redis/$1',
    '^@libs/(.*)$': '<rootDir>/libs/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
  },
  modulePaths: ['<rootDir>'], // equivale a baseUrl
  testTimeout: 30000,
};
