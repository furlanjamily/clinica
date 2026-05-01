import { Chart } from "@/components/ui/Chart";
import { MetricCard } from "@/components/ui/MetricCard";
import { Header } from "@/components/ui/PageHeader";

export default function Dashboard() {
  return (
    <div className="w-full">
      <div>
        <Header title="Dashboard" />
        <p className="text-accent">Obtenha sua atualização mais recente...</p>
      </div>

      <div className="flex gap-6">
        <MetricCard title="Transferências" value="+R$ 178.900" />
        <MetricCard title="Transferências" value="+R$ 178.900" />
        <MetricCard title="Transferências" value="+R$ 178.900" />
      </div>

      <div className="bg-white p-8 border border-slate-100 rounded-2xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="font-bold text-slate-700">Transferências</span>
        </div>

        <Chart /> 
      </div>
    </div>
  )
}