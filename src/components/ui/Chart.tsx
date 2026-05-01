"use client";
import { useState } from "react";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";

export function Chart() {
  const [selectedYear, setSelectedYear] = useState("2024");
  const data: {
    [key: string]: { month: string; received: number; sent: number }[];
  } = {
    2023: [
      { month: "Jan", received: 400, sent: 240 },
      { month: "Fev", received: 300, sent: 180 },
      { month: "Mar", received: 500, sent: 320 },
      { month: "Abr", received: 350, sent: 200 },
      { month: "Mai", received: 600, sent: 410 },
      { month: "Jun", received: 550, sent: 380 },
      { month: "Jul", received: 620, sent: 420 },
      { month: "Ago", received: 700, sent: 480 },
      { month: "Set", received: 680, sent: 460 },
      { month: "Out", received: 720, sent: 500 },
      { month: "Nov", received: 760, sent: 520 },
      { month: "Dez", received: 800, sent: 560 },
    ],

    2024: [
      { month: "Jan", received: 500, sent: 320 },
      { month: "Fev", received: 450, sent: 280 },
      { month: "Mar", received: 650, sent: 420 },
      { month: "Abr", received: 480, sent: 310 },
      { month: "Mai", received: 700, sent: 500 },
      { month: "Jun", received: 720, sent: 520 },
      { month: "Jul", received: 760, sent: 540 },
      { month: "Ago", received: 820, sent: 600 },
      { month: "Set", received: 790, sent: 570 },
      { month: "Out", received: 850, sent: 620 },
      { month: "Nov", received: 880, sent: 640 },
      { month: "Dez", received: 920, sent: 700 },
    ],

    2025: [
      { month: "Jan", received: 650, sent: 420 },
      { month: "Fev", received: 600, sent: 380 },
      { month: "Mar", received: 720, sent: 500 },
      { month: "Abr", received: 690, sent: 470 },
      { month: "Mai", received: 820, sent: 600 },
      { month: "Jun", received: 900, sent: 680 },
      { month: "Jul", received: 950, sent: 720 },
      { month: "Ago", received: 1000, sent: 780 },
      { month: "Set", received: 970, sent: 740 },
      { month: "Out", received: 1050, sent: 820 },
      { month: "Nov", received: 1100, sent: 860 },
      { month: "Dez", received: 1200, sent: 920 },
    ],
  };
  return (
    <>
      <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(e.target.value)}
        className="mb-4 rounded-md border px-3 py-2"
      >
        <option value="2023">2023</option>
        <option value="2024">2024</option>
        <option value="2025">2025</option>
      </select>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data[selectedYear]}>
          <XAxis dataKey="month" padding={{ left: 20, right: 20 }} />{" "}
          <Tooltip />
          <Line
            type="monotone"
            dataKey="received"
            stroke="#9747FF"
            strokeWidth={4}
            dot={false}
            activeDot={{ r: 8 }}
          />
          <Line
            type="monotone"
            dataKey="sent"
            stroke="#624DE3"
            strokeWidth={4}
            dot={false}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
