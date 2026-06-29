export type SafeUserDTO = {
  id: string
  name: string | null
  email: string
  role: string | null
  active: boolean
  doctorId: number | null
  doctorName: string | null
  image: string | null
}

export function toSafeUser(user: {
  id: string
  name: string | null
  email: string
  role: string | null
  active: boolean
  doctorId: number | null
  image?: string | null
  doctor?: { name: string } | null
}): SafeUserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    doctorId: user.doctorId,
    doctorName: user.doctor?.name ?? null,
    image: user.image ?? null,
  }
}
