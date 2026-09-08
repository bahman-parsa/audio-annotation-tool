import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { api } from '../api'

describe('api', () => {
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('upload', () => {
    it('sends POST with FormData body', async () => {
      const formData = new FormData()
      formData.append('files', new File([''], 'test.wav', { type: 'audio/wav' }))

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ uploaded: 1, matched: 0, errors: [], unmatched: [] }),
      })

      await api.upload('/api/upload', formData)

      expect(fetchSpy).toHaveBeenCalledOnce()
      const [url, options] = fetchSpy.mock.calls[0]
      expect(url).toBe('/api/upload')
      expect(options.method).toBe('POST')
      expect(options.body).toBe(formData)
    })

    it('does NOT set Content-Type header', async () => {
      const formData = new FormData()

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ uploaded: 0, matched: 0, errors: [], unmatched: [] }),
      })

      await api.upload('/api/upload', formData)

      const [, options] = fetchSpy.mock.calls[0]
      expect(options.headers).toBeUndefined()
    })

    it('returns parsed JSON response on success', async () => {
      const response = { uploaded: 2, matched: 1, errors: [], unmatched: [] }
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(response),
      })

      const result = await api.upload<typeof response>('/api/upload', new FormData())

      expect(result).toEqual(response)
    })

    it('throws error with server message on non-2xx response', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: 'No files provided' }),
      })

      await expect(api.upload('/api/upload', new FormData())).rejects.toThrow(
        'No files provided',
      )
    })

    it('throws generic error when response body is not JSON', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('Unexpected token')),
      })

      await expect(api.upload('/api/upload', new FormData())).rejects.toThrow(
        'Internal Server Error',
      )
    })
  })

  describe('get/post/put', () => {
    it('get sends GET request', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      })

      await api.get('/api/items')

      const [url, options] = fetchSpy.mock.calls[0]
      expect(url).toBe('/api/items')
      expect(options.method).toBeUndefined()
    })

    it('post sends POST with JSON body and Content-Type header', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: '1' }),
      })

      await api.post('/api/items', { name: 'test' })

      const [url, options] = fetchSpy.mock.calls[0]
      expect(url).toBe('/api/items')
      expect(options.method).toBe('POST')
      expect(options.body).toBe(JSON.stringify({ name: 'test' }))
      expect(options.headers).toEqual({ 'Content-Type': 'application/json' })
    })

    it('put sends PUT with JSON body and Content-Type header', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: '1' }),
      })

      await api.put('/api/items/1', { name: 'updated' })

      const [url, options] = fetchSpy.mock.calls[0]
      expect(url).toBe('/api/items/1')
      expect(options.method).toBe('PUT')
      expect(options.body).toBe(JSON.stringify({ name: 'updated' }))
      expect(options.headers).toEqual({ 'Content-Type': 'application/json' })
    })
  })
})
