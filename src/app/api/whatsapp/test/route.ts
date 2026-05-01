import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendConfirmationWhatsApp, toWhatsAppE164 } from "@/lib/whatsapp"

export async function GET() {
  const amanha = new Date(Date.now() + 1000 * 60 * 60 * 24)
  const data = amanha.toISOString().split("T")[0]

  const toEnv = process.env.TWILIO_WHATSAPP_TO
  if (!toEnv?.trim()) {
    return NextResponse.json(
      { success: false, error: "Defina TWILIO_WHATSAPP_TO no .env" },
      { status: 500 }
    )
  }

  // Create dummy paciente and medico for test
  const paciente = await db.paciente.create({
    data: {
      nome: "Paciente Teste",
      telefone: toEnv.replace(/\D/g, ""),
    },
  })

  const medico = await db.medico.create({
    data: {
      nome: "Dr. João Mendes",
      crm: "12345",
      especialidade: "Clinico Geral",
    },
  })

  const agendamento = await db.agendamento.create({
    data: {
      data,
      horario: "10:00",
      pacienteNome: "Paciente Teste",
      telefone: toEnv.replace(/\D/g, ""),
      profissionalNome: "Dr. João Mendes",
      status: "Agendado",
      whatsappSent: false,
      pacienteId: paciente.id,
      medicoId: medico.id,
    },
  })

  try {
    const msg = await sendConfirmationWhatsApp({
      to: toEnv,
      paciente: agendamento.pacienteNome!,
      data: agendamento.data,
      horario: agendamento.horario,
      profissional: agendamento.profissionalNome!,
    })

    await db.agendamento.update({
      where: { id: agendamento.id },
      data: { status: "AguardandoConfirmacao", whatsappSent: true },
    })

    const e164 = toWhatsAppE164(toEnv)

    return NextResponse.json({
      success: true,
      message: "Twilio aceitou a mensagem (isso não garante entrega no aparelho).",
      agendamentoId: agendamento.id,
      twilio: {
        sid: msg.sid,
        status: msg.status,
        errorCode: msg.errorCode,
        errorMessage: msg.errorMessage,
        to: msg.to,
        from: msg.from,
      },
      resolvedDestinationE164: e164,
      nextSteps: [
        "No Twilio Console → Monitor → Logs → Mensagens: abra o SID acima e veja o status final (delivered, failed, undelivered).",
        "Sandbox: envie do seu WhatsApp o texto de convite (ex.: join <sua-palavra>) para o número do sandbox ANTES de receber mensagens.",
        "Produção (WhatsApp aprovado): fora da janela de 24h com o cliente, só mensagens com template aprovado; texto livre pode falhar com erro 63016.",
      ],
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
