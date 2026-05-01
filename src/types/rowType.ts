import type { Atendimento } from "@/types/types"

export type RowMonth = {
  type: "month"
  label: string
}

export type RowDay = {
  type: "day"
  label: string
}

export type RowData = Atendimento & {
  type: "data"
  arrived?: boolean
  checkInTime?: string
  startTime?: string
}

export type RowType = RowMonth | RowDay | RowData 


