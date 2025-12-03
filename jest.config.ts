import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom', // ВАЖНО: jsdom нужен для компонентов
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1', // Алиасы
  },
  // Очистка моков между тестами
  clearMocks: true,
}

export default createJestConfig(config)
