import { test as base, type Page } from '@playwright/test'
import { setupDisposableApi, type MockApiState } from './mock-api'

export const test = base.extend<{ mockApi: MockApiState }>({
  mockApi: [
    async ({ page }, use) => {
      const api = await setupDisposableApi(page)
      await use(api)
    },
    { auto: true },
  ],
})

export { expect } from '@playwright/test'

export async function loginAs(
  page: Page,
  role: 'admin' | 'formateur' | 'apprenant' | 'super_admin',
): Promise<void> {
  const token = `mock-${role}-token`
  await page.addInitScript(
    ({ sessionToken }) => {
      sessionStorage.setItem('padci.session_token', sessionToken)
    },
    { sessionToken: token },
  )
}
