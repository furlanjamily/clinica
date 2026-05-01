"use client";

import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

type Props = {
  date: Date;
  onChange: (date: Date) => void;
};

export function DatePicker({ date, onChange }: Props) {
  return (
    <div className="absolute z-50 bg-white shadow-lg rounded-lg p-4">
      <DayPicker
        mode="single"
        selected={date}
        onSelect={(d) => d && onChange(d)}
      />
    </div>
  );
}