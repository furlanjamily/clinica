"use client"

import { useEffect, useState } from "react"

type Doctor = {
  id: number
  nome: string
  turno?: string
}

type Patient = {
  id: number
  nome: string
  telefone?: string
  email?: string
  dataNascimento?: string
  estadoCivil?: string
  escolaridade?: string
  religiao?: string
  profissao?: string
}

export function useScheduleOptions() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/schedule/options")
        const data = await res.json()

        console.log("OPTIONS:", data)

        setDoctors(data?.medicos ?? [])
        setPatients(data?.pacientes ?? [])
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