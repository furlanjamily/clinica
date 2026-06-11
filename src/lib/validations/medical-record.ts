import { z } from "zod"

const optionalString = z.string().nullish()

/** Campos clínicos editáveis do prontuário. */
export const ClinicalChartFieldsSchema = z.object({
  clinicalDiagnosis: optionalString,
  diagnosisReactions: optionalString,
  emotionalState: optionalString,
  personalHistory: optionalString,
  psychicExam: optionalString,
  psychologicalConduct: optionalString,
  familyGuidance: optionalString,
})

export const CreateMedicalRecordSchema = ClinicalChartFieldsSchema.extend({
  appointmentId: z.number().int().positive(),
})

export const UpdateMedicalRecordSchema = ClinicalChartFieldsSchema.extend({
  id: z.number().int().positive(),
})

export const DeleteMedicalRecordSchema = z.object({
  id: z.number().int().positive(),
})
