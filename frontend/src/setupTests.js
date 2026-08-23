import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Sem `globals: true` no vitest.config, a limpeza automática do
// testing-library não é registrada sozinha — fazemos isso explicitamente
// para garantir que cada teste comece com um DOM limpo.
afterEach(() => {
  cleanup()
})
