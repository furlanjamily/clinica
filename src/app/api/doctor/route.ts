import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireRole, requireSession } from "@/lib/auth/api-guard"
import {
  createUserForDoctor,
  removeUserForDoctor,
  syncUserForDoctor,
} from "@/lib/auth/doctor-user"
import { handleApiError } from "@/lib/errors/error-handler"
import { parseWith } from "@/lib/validations/parse"
import {
  CreateDoctorSchema,
  UpdateDoctorSchema,
  DeleteDoctorSchema,
} from "@/lib/validations/doctor"
import { doctorInputToDb, toDoctorDTO } from "@/lib/domain/doctor-dto"
import type { Prisma } from "@/generated/prisma/client"

export async function GET() {
  try {
    await requireSession()
    const doctors = await db.doctor.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      include: {
        specialty: true,
        users: { select: { id: true, image: true }, take: 1 },
      },
    })
    return NextResponse.json(doctors.map(toDoctorDTO))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: Request) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN")
    const data = parseWith(CreateDoctorSchema, await req.json())
    const doctor = await db.doctor.create({
      data: doctorInputToDb(data) as unknown as Prisma.DoctorCreateInput,
      include: {
        specialty: true,
        users: { select: { id: true, image: true }, take: 1 },
      },
    })
    const loginAccount = await createUserForDoctor(doctor)
    return NextResponse.json(
      { ...toDoctorDTO(doctor), loginAccount },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: Request) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN")
    const { id, ...data } = parseWith(UpdateDoctorSchema, await req.json())
    const doctor = await db.doctor.update({
      where: { id },
      data: doctorInputToDb(data),
      include: {
        specialty: true,
        users: { select: { id: true, image: true }, take: 1 },
      },
    })
    await syncUserForDoctor(doctor)
    return NextResponse.json(toDoctorDTO(doctor))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: Request) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN")
    const { id } = parseWith(DeleteDoctorSchema, await req.json())
    await removeUserForDoctor(id)
    // Soft delete: preserva agendamentos/histórico (FK Restrict).
    await db.doctor.update({ where: { id }, data: { deletedAt: new Date(), active: false } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
