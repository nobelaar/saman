import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGeolocation } from './useGeolocation'

const coords = { lat: 10.488, lng: -66.866 }

function mockSuccess() {
  vi.stubGlobal('navigator', {
    geolocation: {
      getCurrentPosition: (cb: PositionCallback) =>
        setTimeout(() =>
          cb({ coords: { latitude: coords.lat, longitude: coords.lng } } as GeolocationPosition)
        ),
    },
  })
}

function mockError() {
  vi.stubGlobal('navigator', {
    geolocation: {
      getCurrentPosition: (_cb: PositionCallback, errCb: PositionErrorCallback) =>
        errCb({ code: 1, message: 'denied' } as GeolocationPositionError),
    },
  })
}

function mockUnsupported() {
  vi.stubGlobal('navigator', { geolocation: undefined } as unknown as Navigator)
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('useGeolocation', () => {
  it('exposes loading=false and coords=null initially then resolves coords', async () => {
    mockSuccess()
    const { result } = renderHook(() => useGeolocation())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.coords).toEqual(coords)
    expect(result.current.error).toBeNull()
  })

  it('sets error and no coords when permission denied', async () => {
    mockError()
    const { result } = renderHook(() => useGeolocation())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.coords).toBeNull()
    expect(result.current.error).not.toBeNull()
  })

  it('returns error when geolocation is not supported', async () => {
    mockUnsupported()
    const { result } = renderHook(() => useGeolocation())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.coords).toBeNull()
    expect(result.current.error).not.toBeNull()
  })
})