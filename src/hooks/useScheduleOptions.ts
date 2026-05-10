"use client"

import { useEffect, useState } from "react"

type ScheduleDoctor = {
  id: number
  name: string
  shift?: string | null
}

type SchedulePatient = {
  id: number
  name: string
  phone?: string | null
  email?: string | null
  birthDate?: string | null
  maritalStatus?: string | null
  education?: string | null
  religion?: string | null
  profession?: string | null
}

export function useScheduleOptions() {
  const [doctors, setDoctors] = useState<ScheduleDoctor[]>([])
  const [patients, setPatients] = useState<SchedulePatient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/schedule/options")
        const data = await res.json()

        setDoctors(data?.doctors ?? [])
        setPatients(data?.patients ?? [])
      } catch (err) {
        console.error("Erro ao carregar opções:", err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return { doctors, patients, loading }
}
