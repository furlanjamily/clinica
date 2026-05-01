"use client"

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { MedicalRecord } from "@/types"

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
  const paciente = data.paciente
  const agendamento = data.agendamento

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* HEADER */}
        <View style={s.header}>
          <Text style={s.clinic}>CLÍNICA PSICOLÓGICA</Text>
          <Text style={s.sub}>Prontuário Clínico • Atendimento Psicológico</Text>
        </View>

        {/* PACIENTE */}
        <View style={s.box}>
          <View style={s.row}>
            <Field label="Paciente" value={paciente?.nome} />
            <Field label="Idade" value={calcAge(paciente?.dataNascimento)} />
          </View>

          <View style={s.row}>
            <Field label="Sexo" value={paciente?.sexo} />
            <Field label="CPF" value={paciente?.cpf} />
          </View>

          <View style={s.row}>
            <Field label="Telefone" value={paciente?.telefone} />
            <Field label="Profissão" value={paciente?.profissao} />
          </View>
        </View>

        {/* ATENDIMENTO */}
        <View style={s.box}>
          <View style={s.row}>
            <Field label="Profissional" value={agendamento?.profissionalNome} />
            <Field label="Data" value={agendamento?.data} />
          </View>

          <View style={s.row}>
            <Field label="Horário" value={agendamento?.horario} />
            <Field label="Criado em" value={formatDate(data.createdAt)} />
          </View>
        </View>

        {/* CLÍNICO */}
        <Section title="Diagnóstico Clínico" value={data.clinicalDiagnosis} />
        <Section title="Reações ao Diagnóstico" value={data.diagnosisReactions} />
        <Section title="Estado Emocional" value={data.emotionalState} />
        <Section title="Histórico Pessoal / Familiar" value={data.personalHistory} />
        <Section title="Exame Psíquico" value={data.psychicExam} />
        <Section title="Conduta Psicológica" value={data.psychologicalConduct} />
        <Section title="Orientações" value={data.familyGuidance} />

        {/* ASSINATURA */}
        <View style={s.footer}>
          <Text style={s.sign}>Psicólogo Responsável</Text>
          <Text style={s.sign}>Supervisor</Text>
        </View>

      </Page>
    </Document>
  )
}