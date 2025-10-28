// Small storage adapter: uses localStorage in the browser only when
// the env flag USE_LOCAL_STORAGE === 'true'. Otherwise uses an in-memory map.
// This allows switching off persistent localStorage during migration/tests.

type StorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const memory = new Map<string, string>()

const shouldUseLocal = (() => {
  try {
    // process.env.USE_LOCAL_STORAGE is replaced at build time by Next.
    if (typeof window === 'undefined') return false
    return (process.env.USE_LOCAL_STORAGE || 'false') === 'true'
  } catch {
    return false
  }
})()

const storage: StorageLike = {
  getItem(key: string) {
    if (shouldUseLocal && typeof globalThis !== 'undefined' && globalThis.localStorage) {
      try {
        return globalThis.localStorage.getItem(key)
      } catch {
        return memory.get(key) ?? null
      }
    }
    return memory.get(key) ?? null
  },
  setItem(key: string, value: string) {
    if (shouldUseLocal && typeof globalThis !== 'undefined' && globalThis.localStorage) {
      try {
        globalThis.localStorage.setItem(key, value)
        return
      } catch {
        // fallback to memory
      }
    }
    memory.set(key, value)
  },
  removeItem(key: string) {
    if (shouldUseLocal && typeof globalThis !== 'undefined' && globalThis.localStorage) {
      try {
        globalThis.localStorage.removeItem(key)
        return
      } catch {
        // fallback
      }
    }
    memory.delete(key)
  },
}

export { storage }
