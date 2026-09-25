import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useAsyncData } from './useAsyncData'

describe('useAsyncData', () => {
  it('fetches on mount and exposes the result', async () => {
    const fetcher = vi.fn().mockResolvedValue(['a', 'b'])
    const { result } = renderHook(() => useAsyncData('key-1', fetcher, [] as string[]))

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual(['a', 'b'])
    expect(fetcher).toHaveBeenCalledWith('key-1')
  })

  it('does not fetch when the key is null, and starts with loading false', () => {
    const fetcher = vi.fn()
    const { result } = renderHook(() => useAsyncData(null, fetcher, [] as string[]))

    expect(result.current.loading).toBe(false)
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('stops loading instead of hanging forever when the fetch rejects', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useAsyncData('key-1', fetcher, [] as string[]))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual([])
  })

  it('refresh() re-fetches, and also survives a rejection without hanging', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(['first'])
      .mockRejectedValueOnce(new Error('offline'))
    const { result } = renderHook(() => useAsyncData('key-1', fetcher, [] as string[]))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual(['first'])

    await act(async () => {
      await result.current.refresh()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toEqual(['first'])
  })
})
