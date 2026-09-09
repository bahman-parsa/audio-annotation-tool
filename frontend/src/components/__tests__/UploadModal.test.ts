import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import UploadModal from '../UploadModal.vue'

vi.mock('@/services/api', () => ({
  api: {
    upload: vi.fn(),
  },
}))

import { api } from '@/services/api'

describe('UploadModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the upload form with file inputs and upload button', () => {
    const wrapper = mount(UploadModal)

    expect(wrapper.find('h2').text()).toBe('Upload Audio & Transcripts')
    const fileInputs = wrapper.findAll('input[type="file"]')
    expect(fileInputs.length).toBe(2)
    const uploadButton = wrapper.findAll('button').find((b) => b.text().includes('Upload'))
    expect(uploadButton).toBeDefined()
  })

  it('upload button is disabled when no files selected and no JSON entered', () => {
    const wrapper = mount(UploadModal)

    const uploadButton = wrapper.findAll('button').find((b) => b.text().includes('Upload'))
    expect(uploadButton!.attributes('disabled')).toBeDefined()
  })

  it('shows file names after files are selected', async () => {
    const wrapper = mount(UploadModal)

    const fileInput = wrapper.find('input[type="file"]')
    const files = [
      new File([''], 'audio1.wav', { type: 'audio/wav' }),
      new File([''], 'audio2.wav', { type: 'audio/wav' }),
    ]

    Object.defineProperty(fileInput.element, 'files', {
      value: files,
      writable: false,
    })
    await fileInput.trigger('change')

    expect(wrapper.text()).toContain('audio1.wav')
    expect(wrapper.text()).toContain('audio2.wav')
  })

  it('calls api.upload with correct FormData on submit', async () => {
    vi.mocked(api.upload).mockResolvedValueOnce({
      uploaded: 1,
      matched: 0,
      errors: [],
      unmatched: [],
    })

    const wrapper = mount(UploadModal)

    const fileInput = wrapper.find('input[type="file"]')
    const file = new File(['content'], 'test.wav', { type: 'audio/wav' })
    Object.defineProperty(fileInput.element, 'files', {
      value: [file],
      writable: false,
    })
    await fileInput.trigger('change')

    const uploadButton = wrapper.findAll('button').find((b) => b.text().includes('Upload'))
    await uploadButton!.trigger('click')

    expect(api.upload).toHaveBeenCalledOnce()
    const [url, formData] = vi.mocked(api.upload).mock.calls[0]
    expect(url).toBe('/api/upload')
    expect(formData).toBeInstanceOf(FormData)
  })

  it('displays success status message after successful upload', async () => {
    vi.mocked(api.upload).mockResolvedValueOnce({
      uploaded: 2,
      matched: 1,
      errors: [],
      unmatched: [],
    })

    const wrapper = mount(UploadModal)

    const fileInput = wrapper.find('input[type="file"]')
    const file = new File(['content'], 'test.wav', { type: 'audio/wav' })
    Object.defineProperty(fileInput.element, 'files', {
      value: [file],
      writable: false,
    })
    await fileInput.trigger('change')

    const uploadButton = wrapper.findAll('button').find((b) => b.text().includes('Upload'))
    await uploadButton!.trigger('click')
    await vi.dynamicImportSettled()

    expect(wrapper.text()).toContain('Uploaded 2 file(s)')
    expect(wrapper.text()).toContain('Matched 1 transcript(s)')
  })

  it('emits uploaded event when upload succeeds', async () => {
    vi.mocked(api.upload).mockResolvedValueOnce({
      uploaded: 1,
      matched: 0,
      errors: [],
      unmatched: [],
    })

    const wrapper = mount(UploadModal)

    const fileInput = wrapper.find('input[type="file"]')
    const file = new File(['content'], 'test.wav', { type: 'audio/wav' })
    Object.defineProperty(fileInput.element, 'files', {
      value: [file],
      writable: false,
    })
    await fileInput.trigger('change')

    const uploadButton = wrapper.findAll('button').find((b) => b.text().includes('Upload'))
    await uploadButton!.trigger('click')
    await vi.dynamicImportSettled()

    expect(wrapper.emitted('uploaded')).toHaveLength(1)
  })

  it('displays error message when upload fails', async () => {
    vi.mocked(api.upload).mockRejectedValueOnce(new Error('Network error'))

    const wrapper = mount(UploadModal)

    const fileInput = wrapper.find('input[type="file"]')
    const file = new File(['content'], 'test.wav', { type: 'audio/wav' })
    Object.defineProperty(fileInput.element, 'files', {
      value: [file],
      writable: false,
    })
    await fileInput.trigger('change')

    const uploadButton = wrapper.findAll('button').find((b) => b.text().includes('Upload'))
    await uploadButton!.trigger('click')
    await vi.dynamicImportSettled()

    expect(wrapper.text()).toContain('Upload failed: Network error')
  })

  it('emits close when clicking the X button', async () => {
    const wrapper = mount(UploadModal)

    const closeButton = wrapper.findAll('button').find((b) => b.text() === '\u2715')
    await closeButton!.trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emits close when clicking the backdrop', async () => {
    const wrapper = mount(UploadModal)

    const overlay = wrapper.find('.fixed')
    await overlay.trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
