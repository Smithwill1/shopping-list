import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { OfflineBanner } from './OfflineBanner'

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value })
}

afterEach(() => {
  setOnline(true)
})

describe('OfflineBanner', () => {
  it('renders nothing while online', () => {
    setOnline(true)
    render(<OfflineBanner />)
    expect(screen.queryByText(/you're offline/i)).not.toBeInTheDocument()
  })

  it('shows a message when the offline event fires', () => {
    setOnline(true)
    render(<OfflineBanner />)

    setOnline(false)
    fireEvent(window, new Event('offline'))

    expect(screen.getByText(/you're offline/i)).toBeInTheDocument()
  })

  it('hides again when the online event fires', () => {
    setOnline(false)
    render(<OfflineBanner />)
    expect(screen.getByText(/you're offline/i)).toBeInTheDocument()

    setOnline(true)
    fireEvent(window, new Event('online'))

    expect(screen.queryByText(/you're offline/i)).not.toBeInTheDocument()
  })
})
