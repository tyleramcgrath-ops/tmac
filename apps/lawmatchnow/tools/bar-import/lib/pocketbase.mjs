// A small PocketBase admin client: superuser login, paged reads, and writes
// with retries and limited concurrency so a 100k-row import doesn't trip the
// host's rate limits or anti-bot page.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export class PocketBase {
  constructor(url, { concurrency = 6, log = () => {} } = {}) {
    this.url = url.replace(/\/$/, '')
    this.token = ''
    this.concurrency = concurrency
    this.log = log
  }

  async request(method, path, body, { retries = 5 } = {}) {
    for (let attempt = 0; ; attempt++) {
      let res, text
      try {
        res = await fetch(this.url + path, {
          method,
          headers: {
            Accept: 'application/json',
            'User-Agent': 'LawMatchNow-BarImport/1.0',
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...(this.token ? { Authorization: this.token } : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
        })
        text = await res.text()
      } catch (err) {
        if (attempt >= retries) throw err
        await sleep(1000 * 2 ** attempt)
        continue
      }
      const json = res.headers.get('content-type')?.includes('json') ? JSON.parse(text || 'null') : null
      // 202/HTML is the host's anti-bot page; 429/5xx are temporary.
      const retryable = res.status === 429 || res.status >= 500 || (res.ok && json === null && method !== 'DELETE')
      if (retryable && attempt < retries) {
        await sleep(1000 * 2 ** attempt)
        continue
      }
      if (!res.ok || (json === null && method !== 'DELETE' && res.status !== 204)) {
        const msg = json?.message ? `${json.message}${json.data && Object.keys(json.data).length ? ` ${JSON.stringify(json.data)}` : ''}` : text.slice(0, 200)
        const err = new Error(`${method} ${path} -> ${res.status}: ${msg}`)
        err.status = res.status
        throw err
      }
      return json
    }
  }

  /** Superuser login (PocketBase 0.23+), falling back to the older admins endpoint. */
  async login(email, password) {
    try {
      const r = await this.request('POST', '/api/collections/_superusers/auth-with-password', { identity: email, password }, { retries: 1 })
      this.token = r.token
    } catch (err) {
      if (err.status !== 404) throw err
      const r = await this.request('POST', '/api/admins/auth-with-password', { identity: email, password }, { retries: 1 })
      this.token = r.token
    }
  }

  collection(name) {
    return this.request('GET', `/api/collections/${encodeURIComponent(name)}`)
  }

  /** Field names of a collection, for both the 0.23+ (`fields`) and older (`schema`) formats. */
  async fieldNames(name) {
    const c = await this.collection(name)
    return new Set([...(c.fields ?? c.schema ?? []).map((f) => f.name), 'id', 'created', 'updated'])
  }

  async *list(collection, { filter = '', fields = '', perPage = 500 } = {}) {
    for (let page = 1; ; page++) {
      const q = new URLSearchParams({ page: String(page), perPage: String(perPage), skipTotal: '1', sort: 'id' })
      if (filter) q.set('filter', filter)
      if (fields) q.set('fields', fields)
      const r = await this.request('GET', `/api/collections/${collection}/records?${q}`)
      yield* r.items
      if (r.items.length < perPage) return
    }
  }

  create(collection, data) {
    return this.request('POST', `/api/collections/${collection}/records`, data)
  }

  update(collection, id, data) {
    return this.request('PATCH', `/api/collections/${collection}/records/${id}`, data)
  }

  remove(collection, id) {
    return this.request('DELETE', `/api/collections/${collection}/records/${id}`)
  }

  /** Runs fn over items with limited concurrency; collects failures instead of stopping. */
  async each(items, fn, onProgress = () => {}) {
    const failures = []
    let i = 0, done = 0
    const worker = async () => {
      while (i < items.length) {
        const item = items[i++]
        try {
          await fn(item)
        } catch (err) {
          failures.push({ item, error: err.message })
        }
        onProgress(++done, items.length)
      }
    }
    await Promise.all(Array.from({ length: Math.min(this.concurrency, items.length) }, worker))
    return failures
  }
}
