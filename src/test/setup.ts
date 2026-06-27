import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { server, resetStore } from './mocks'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  resetStore()
})
afterAll(() => server.close())

beforeEach(() => {
  localStorage.clear()
})

if (!globalThis.URL.createObjectURL) {
  globalThis.URL.createObjectURL = (() => 'blob:mock-url') as unknown as (
    obj: Blob | MediaSource
  ) => string
}
if (!globalThis.URL.revokeObjectURL) {
  globalThis.URL.revokeObjectURL = (() => {}) as unknown as (url: string) => void
}