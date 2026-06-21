/** Formas de pagamento aceitas no pagamento vinculado a um agendamento. */
export const PAYMENT_METHODS: string[] = [
  "Dinheiro",
  "Cartão de Crédito",
  "Cartão de Débito",
  "Pix",
  "Convênio",
  "Transferência",
]

/** Formas de pagamento de transações avulsas (inclui opções administrativas). */
export const TRANSACTION_PAYMENT_METHODS: string[] = [
  ...PAYMENT_METHODS,
  "Boleto",
  "Não aplicável",
]

export const RECEITA_CATEGORIAS: string[] = [
  "Avaliação",
  "Pacote ou combo",
  "Convênio / coparticipação",
  "Venda de material",
  "Taxa administrativa",
  "Juros ou multa recebida",
  "Outros",
]

export const DESPESA_CATEGORIAS: string[] = [
  "Aluguel e condomínio",
  "Energia, água e gás",
  "Material de consumo",
  "Equipamento e manutenção",
  "Marketing e divulgação",
  "Software e assinaturas",
  "Impostos e taxas",
  "Salários e encargos",
  "Honorários (contador, advogado, etc.)",
  "Telefonia e internet",
  "Seguros",
  "Limpeza e copa",
  "Treinamento e cursos",
  "Transporte e combustível",
  "Despesas bancárias",
  "Outros",
]
