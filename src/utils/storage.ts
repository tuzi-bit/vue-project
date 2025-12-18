class StorageWrapper implements Storage {
  private storage: Storage

  constructor(storage: Storage) {
    this.storage = storage
  }

  get length(): number {
    return this.storage.length
  }

  clear(): void {
    this.storage.clear()
  }

  getItem(key: string): string | null {
    return this.storage.getItem(key)
  }

  key(index: number): string | null {
    return this.storage.key(index)
  }

  removeItem(key: string): void {
    this.storage.removeItem(key)
  }

  setItem(key: string, value: string): void {
    this.storage.setItem(key, value)
  }
}

export const localStorage = new StorageWrapper(window.localStorage)
export const sessionStorage = new StorageWrapper(window.sessionStorage)