/* global process */
import { defineConfig, devices } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const PORT = process.env.E2E_PORT || '4173'
const HOST = process.env.E2E_HOST || '127.0.0.1'
const BASE_URL = process.env.E2E_BASE_URL || `http://${HOST}:${PORT}`
const SHOULD_START_SERVER = !process.env.E2E_BASE_URL

const localEnvPath = path.resolve('.env.e2e.local')
if (fs.existsSync(localEnvPath)) {
  const lines = fs.readFileSync(localEnvPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const equalIndex = trimmed.indexOf('=')
    if (equalIndex === -1) continue
    const key = trimmed.slice(0, equalIndex).trim()
    const value = trimmed.slice(equalIndex + 1).trim()
    if (key && !process.env[key]) {
      process.env[key] = value
    }
  }
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1100 }
      }
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 7']
      }
    }
  ],
  webServer: SHOULD_START_SERVER
    ? {
        command: `npx vite --host ${HOST} --port ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 120 * 1000
      }
    : undefined
})
