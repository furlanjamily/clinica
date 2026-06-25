"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type WeatherData = {
  temperature: number
  weatherCode: number
}

export type LocationSource = "gps" | "ip" | "default"

type WeatherState = {
  data: WeatherData | null
  loading: boolean
  cityLabel: string | null
  locationSource: LocationSource | null
}

type Coords = { latitude: number; longitude: number }

type ResolvedLocation = {
  coords: Coords
  city: string
  source: LocationSource
}

const DEFAULT_LOCATION: ResolvedLocation = {
  coords: { latitude: -23.5505, longitude: -46.6333 },
  city: "São Paulo",
  source: "default",
}

const REFRESH_MS = 30 * 60 * 1000
const GEOLOCATION_MAX_AGE_MS = 45 * 60 * 1000

async function fetchWeather(latitude: number, longitude: number): Promise<WeatherData> {
  const url = new URL("https://api.open-meteo.com/v1/forecast")
  url.searchParams.set("latitude", String(latitude))
  url.searchParams.set("longitude", String(longitude))
  url.searchParams.set("current", "temperature_2m,weather_code")
  url.searchParams.set("timezone", "auto")

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error("weather fetch failed")

  const body = (await res.json()) as {
    current?: { temperature_2m?: number; weather_code?: number }
  }

  const temperature = body.current?.temperature_2m
  const weatherCode = body.current?.weather_code

  if (typeof temperature !== "number" || typeof weatherCode !== "number") {
    throw new Error("invalid weather payload")
  }

  return { temperature: Math.round(temperature), weatherCode }
}

function getCoordsFromGeolocation(): Promise<ResolvedLocation | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          coords: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          },
          city: "Sua localização",
          source: "gps",
        }),
      () => resolve(null),
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: GEOLOCATION_MAX_AGE_MS,
      }
    )
  })
}

async function getCoordsFromIp(): Promise<ResolvedLocation | null> {
  try {
    const res = await fetch("https://ipwho.is/")
    if (!res.ok) return null

    const body = (await res.json()) as {
      success?: boolean
      latitude?: number
      longitude?: number
      city?: string
    }

    if (
      !body.success ||
      typeof body.latitude !== "number" ||
      typeof body.longitude !== "number"
    ) {
      return null
    }

    return {
      coords: { latitude: body.latitude, longitude: body.longitude },
      city: body.city?.trim() || "Local aproximado",
      source: "ip",
    }
  } catch {
    return null
  }
}

async function resolveLocation(): Promise<ResolvedLocation> {
  const gps = await getCoordsFromGeolocation()
  if (gps) return gps

  const ip = await getCoordsFromIp()
  if (ip) return ip

  return DEFAULT_LOCATION
}

export function useLocalWeather() {
  const [state, setState] = useState<WeatherState>({
    data: null,
    loading: true,
    cityLabel: null,
    locationSource: null,
  })
  const lastFetchedAt = useRef(0)
  const locationCache = useRef<{ location: ResolvedLocation; at: number } | null>(null)

  const resolveCoords = useCallback(async (): Promise<ResolvedLocation> => {
    const cached = locationCache.current
    if (cached && Date.now() - cached.at < GEOLOCATION_MAX_AGE_MS) {
      return cached.location
    }

    const location = await resolveLocation()
    locationCache.current = { location, at: Date.now() }
    return location
  }, [])

  const load = useCallback(async () => {
    try {
      const location = await resolveCoords()
      const data = await fetchWeather(location.coords.latitude, location.coords.longitude)
      lastFetchedAt.current = Date.now()
      setState({
        data,
        loading: false,
        cityLabel: location.source === "gps" ? null : location.city,
        locationSource: location.source,
      })
    } catch {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }, [resolveCoords])

  useEffect(() => {
    load()

    const intervalId = window.setInterval(load, REFRESH_MS)

    function onVisibilityChange() {
      if (document.visibilityState !== "visible") return
      if (Date.now() - lastFetchedAt.current >= REFRESH_MS) {
        load()
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [load])

  return state
}
