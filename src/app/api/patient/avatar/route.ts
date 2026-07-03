import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireSession } from "@/lib/auth/api-guard"
import { NotFoundError, ValidationError } from "@/lib/errors/custom-errors"
import { handleApiError } from "@/lib/errors/error-handler"
import { toPatientDTO } from "@/lib/domain/patient-dto"
import { saveAvatarUpload } from "@/lib/upload/avatar"
import { PatientAvatarUploadSchema } from "@/lib/validations/patient"
import { parseWith } from "@/lib/validations/parse"

export async function POST(req: Request) {
  try {
    await requireSession()
    const formData = await req.formData()
    const file = formData.get("file")
    const patientIdField = formData.get("patientId")

    if (!(file instanceof File)) {
      throw new ValidationError("Arquivo não informado.")
    }

    const { patientId } = parseWith(PatientAvatarUploadSchema, {
      patientId: patientIdField,
    })

    const existing = await db.patient.findFirst({
      where: { id: patientId, deletedAt: null },
    })
    if (!existing) throw new NotFoundError("Paciente não encontrado.")

    const upload = await saveAvatarUpload(file)
    const patient = await db.patient.update({
      where: { id: patientId },
      data: { image: upload.fileUrl },
    })

    return NextResponse.json(
      { ...upload, patient: toPatientDTO(patient) },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
