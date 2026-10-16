import { defineStore } from 'pinia'

const STORAGE_KEY = 'wms2_auth'

function loadPersisted() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    const saved = loadPersisted()
    return {
      accessToken: (saved.accessToken as string) || '',
      refreshToken: (saved.refreshToken as string) || '',
      user: (saved.user as Record<string, unknown>) || null
    }
  },
  actions: {
    setLogin(payload: { access_token: string; refresh_token: string }, user: Record<string, unknown>) {
      this.accessToken = payload.access_token
      this.refreshToken = payload.refresh_token
      this.user = user
      this.persist()
    },
    setAccessToken(token: string) {
      this.accessToken = token
      this.persist()
    },
    persist() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ accessToken: this.accessToken, refreshToken: this.refreshToken, user: this.user })
      )
    },
    logout() {
      this.accessToken = ''
      this.refreshToken = ''
      this.user = null
      localStorage.removeItem(STORAGE_KEY)
    }
  }
})
