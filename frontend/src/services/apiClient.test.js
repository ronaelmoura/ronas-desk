import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// O apiClient cria a instância do axios em tempo de import (axios.create) e
// registra os interceptors diretamente nela. Para testar o comportamento dos
// interceptors sem depender de rede real, simulamos axios.create capturando
// as funções passadas para interceptors.request.use/interceptors.response.use.
const handlers = {
  request: null,
  responseSucesso: null,
  responseErro: null,
}

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: {
          use: vi.fn((onFulfilled) => {
            handlers.request = onFulfilled
          }),
        },
        response: {
          use: vi.fn((onFulfilled, onRejected) => {
            handlers.responseSucesso = onFulfilled
            handlers.responseErro = onRejected
          }),
        },
      },
    })),
  },
}))

async function carregarApiClient() {
  vi.resetModules()
  return import('./apiClient.js')
}

describe('apiClient - interceptor de requisição', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('anexa o cabeçalho Authorization quando existe um token salvo', async () => {
    const mod = await carregarApiClient()
    localStorage.setItem(mod.CHAVE_TOKEN, 'token-valido')

    const config = handlers.request({ headers: {} })

    expect(config.headers.Authorization).toBe('Bearer token-valido')
  })

  it('não anexa o cabeçalho Authorization quando não há token salvo', async () => {
    await carregarApiClient()

    const config = handlers.request({ headers: {} })

    expect(config.headers.Authorization).toBeUndefined()
  })
})

describe('apiClient - interceptor de resposta', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('repassa a resposta sem alterações quando a requisição é bem-sucedida', async () => {
    await carregarApiClient()
    const resposta = { data: { ok: true } }

    expect(handlers.responseSucesso(resposta)).toBe(resposta)
  })

  it('remove o token salvo e dispara o evento de sessão expirada em erro 401', async () => {
    const mod = await carregarApiClient()
    localStorage.setItem(mod.CHAVE_TOKEN, 'token-valido')

    const ouvinte = vi.fn()
    window.addEventListener(mod.EVENTO_SESSAO_EXPIRADA, ouvinte)

    await expect(
      handlers.responseErro({
        response: { status: 401, data: { message: 'Sessão expirada.' } },
      }),
    ).rejects.toThrow('Sessão expirada.')

    expect(localStorage.getItem(mod.CHAVE_TOKEN)).toBeNull()
    expect(ouvinte).toHaveBeenCalledTimes(1)

    window.removeEventListener(mod.EVENTO_SESSAO_EXPIRADA, ouvinte)
  })

  it('mantém o token salvo e não dispara o evento de sessão expirada em erros diferentes de 401', async () => {
    const mod = await carregarApiClient()
    localStorage.setItem(mod.CHAVE_TOKEN, 'token-valido')

    const ouvinte = vi.fn()
    window.addEventListener(mod.EVENTO_SESSAO_EXPIRADA, ouvinte)

    await expect(
      handlers.responseErro({
        response: { status: 500, data: { message: 'Falha interna.' } },
      }),
    ).rejects.toThrow('Falha interna.')

    expect(localStorage.getItem(mod.CHAVE_TOKEN)).toBe('token-valido')
    expect(ouvinte).not.toHaveBeenCalled()

    window.removeEventListener(mod.EVENTO_SESSAO_EXPIRADA, ouvinte)
  })

  it('usa a mensagem de erro do axios quando a resposta não traz mensagem', async () => {
    await carregarApiClient()

    await expect(
      handlers.responseErro({
        message: 'Network Error',
      }),
    ).rejects.toThrow('Network Error')
  })

  it('usa uma mensagem padrão quando não há mensagem de resposta nem de erro', async () => {
    await carregarApiClient()

    await expect(handlers.responseErro({})).rejects.toThrow(
      'Não foi possível concluir a operação.',
    )
  })

  it('anexa o status HTTP ao erro propagado', async () => {
    await carregarApiClient()

    let erroCapturado
    try {
      await handlers.responseErro({
        response: { status: 403, data: { message: 'Acesso negado.' } },
      })
    } catch (error) {
      erroCapturado = error
    }

    expect(erroCapturado.status).toBe(403)
  })
})
