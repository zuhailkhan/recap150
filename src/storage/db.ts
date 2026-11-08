// Minimal IndexedDB wrapper. Three stores: cards (by id), meta (by name), log (auto id).
const DB_NAME = 'recap150'
const DB_VERSION = 1

let dbPromise: Promise<IDBDatabase> | null = null

function open(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      db.createObjectStore('cards', { keyPath: 'id' })
      db.createObjectStore('meta', { keyPath: 'name' })
      db.createObjectStore('log', { autoIncrement: true })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

const wrap = <T>(req: IDBRequest<T>) => new Promise<T>((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error) })

export async function getAll<T>(store: 'cards' | 'meta' | 'log'): Promise<T[]> {
  const db = await open()
  return wrap(db.transaction(store).objectStore(store).getAll() as IDBRequest<T[]>)
}

export async function put(store: 'cards' | 'meta' | 'log', value: unknown): Promise<void> {
  const db = await open()
  const tx = db.transaction(store, 'readwrite')
  tx.objectStore(store).put(value)
  await new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error) })
}

export async function replaceAll(data: { cards: unknown[]; meta: unknown[]; log: unknown[] }): Promise<void> {
  const db = await open()
  const tx = db.transaction(['cards', 'meta', 'log'], 'readwrite')
  for (const s of ['cards', 'meta', 'log'] as const) tx.objectStore(s).clear()
  for (const c of data.cards) tx.objectStore('cards').put(c)
  for (const m of data.meta) tx.objectStore('meta').put(m)
  for (const l of data.log) tx.objectStore('log').add(l)
  await new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error) })
}
