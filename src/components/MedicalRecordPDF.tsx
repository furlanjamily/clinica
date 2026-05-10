"use client"

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import type { MedicalRecord } from "@/types"

function calcAge(date?: string | null) {
  if (!date) return "—"
  const birth = new Date(date)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return `${age} anos`
}

function formatDate(date?: string) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("pt-BR")
}

const s = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.4,
  },

  header: {
    borderBottom: "2px solid #000",
    marginBottom: 10,
    paddingBottom: 6,
  },

  clinic: {
    fontSize: 14,
    fontWeight: "bold",
  },

  sub: {
    fontSize: 9,
    color: "#555",
  },

  box: {
    border: "1px solid #000",
    padding: 6,
    marginBottom: 8,
  },

  row: {
    flexDirection: "row",
    gap: 6,
  },

  col: {
    flex: 1,
  },

  label: {
    fontSize: 8,
    color: "#666",
  },

  value: {
    fontSize: 10,
    fontWeight: "bold",
  },

  section: {
    border: "1px solid #000",
    marginBottom: 6,
  },

  sectionTitle: {
    backgroundColor: "#dcdcdc",
    padding: 4,
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
  },

  sectionBody: {
    padding: 6,
    minHeight: 40,
  },

  footer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  sign: {
    width: 200,
    borderTop: "1px solid #000",
    textAlign: "center",
    fontSize: 8,
    paddingTop: 4,
  },
})

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={s.col}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value || "—"}</Text>
    </View>
  )
}

function Section({ title, value }: { title: string; value?: string | null }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionBody}>
        <Text>{value || " "}</Text>
      </View>
    </View>
  )
}

export function MedicalRecordPDF({ data }: { data: MedicalRecord }) {
  const patient = data.patientDetails
  const appointment = data.appointment

  return (
    <Document>
      <Page size="A4" style={s.page}>

        <View style={s.header}>
          <Text style={s.clinic}>CLÍNICA PSICOLÓGICA</Text>
          <Text style={s.sub}>Prontuário Clínico • Atendimento Psicológico</Text>
        </View>

        <View style={s.box}>
          <View style={s.row}>
            <Field label="Paciente" value={patient?.name} />
            <Field label="Idade" value={calcAge(patient?.birthDate)} />
          </View>

          <View style={s.row}>
            <Field label="Sexo" value={patient?.gender} />
            <Field label="CPF" value={patient?.cpf} />
          </View>

          <View style={s.row}>
            <Field label="Telefone" value={patient?.phone} />
            <Field label="Profissão" value={patient?.profession} />
          </View>
        </View>

        <View style={s.box}>
          <View style={s.row}>
            <Field label="Profissional" value={appointment?.professionalName} />
            <Field label="Data" value={appointment?.date} />
          </View>

          <View style={s.row}>
            <Field label="Horário" value={appointment?.slotTime} />
            <Field label="Criado em" value={formatDate(data.createdAt)} />
          </View>
        </View>

        <Section title="Diagnóstico Clínico" value={data.clinicalDiagnosis} />
        <Section title="Reações ao Diagnóstico" value={data.diagnosisReactions} />
        <Section title="Estado Emocional" value={data.emotionalState} />
        <Section title="Histórico Pessoal / Familiar" value={data.personalHistory} />
        <Section title="Exame Psíquico" value={data.psychicExam} />
        <Section title="Conduta Psicológica" value={data.psychologicalConduct} />
        <Section title="Orientações" value={data.familyGuidance} />

        <View style={s.footer}>
          <Text style={s.sign}>Psicólogo Responsável</Text>
          <Text style={s.sign}>Supervisor</Text>
        </View>

      </Page>
    </Document>
  )
}
