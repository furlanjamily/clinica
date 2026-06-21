export const doctorProfile = {
  name: "Dr. Michael Reynolds",
  specialty: "Cardiologist",
  avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=80&h=80&fit=crop&crop=face",
}

export const periodTabs = ["Today", "Week", "Month"] as const

export type PeriodTab = (typeof periodTabs)[number]

export const kpiStats = [
  {
    id: "total-patients",
    label: "Total patients",
    value: "27",
    badge: { text: "+1.2%", variant: "positive" as const },
  },
  {
    id: "new-patients",
    label: "New patients",
    value: "3",
  },
  {
    id: "time-for-appt",
    label: "Time for appt",
    value: "42",
    unit: "minutes",
    badge: { text: "+3.8%", variant: "negative" as const },
    showInfo: true,
  },
  {
    id: "patients-age",
    label: "Patients age",
    value: "26",
    unit: "years old",
    showInfo: true,
  },
  {
    id: "pss",
    label: "PSS",
    value: "4.98",
    badge: { text: "+1.2%", variant: "positive" as const },
  },
]

export const diagnosesData = [
  { name: "HTN", value: 24 },
  { name: "Dyslipidemia", value: 20 },
  { name: "CAD/Angina", value: 16 },
  { name: "Arrhythmias", value: 12 },
  { name: "Heart Failure", value: 8 },
  { name: "Post-MI/PCI", value: 6 },
  { name: "Other", value: 14 },
]

export const patientsChartData = [
  { time: "08:00", male: 8, female: 5 },
  { time: "10:00", male: 14, female: 11 },
  { time: "12:00", male: 22, female: 18 },
  { time: "14:00", male: 19, female: 24 },
  { time: "16:00", male: 26, female: 21 },
  { time: "18:00", male: 31, female: 28 },
  { time: "20:00", male: 24, female: 30 },
]

export type PatientListItem = {
  id: string
  name: string
  subtitle: string
  time: string
  avatar: string
}

export const patientsList: PatientListItem[] = [
  {
    id: "1",
    name: "Thompson Carter",
    subtitle: "Consultation",
    time: "20:00",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
  },
  {
    id: "2",
    name: "Harris Reynolds",
    subtitle: "Post-operation",
    time: "22:30",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
  },
  {
    id: "3",
    name: "Laura Mitchell",
    subtitle: "Consultation",
    time: "Feb 6, 9:00",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
  },
  {
    id: "4",
    name: "David Ortiz",
    subtitle: "Consultation",
    time: "Feb 6, 10:15",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
  },
  {
    id: "5",
    name: "Marta Mayfield",
    subtitle: "Follow-up appointment",
    time: "Feb 6, 11:00",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
  },
]

export const lastVisitDetails = {
  patientName: "Thompson Carter",
  demographics: "Male, 28 years",
  patientId: "ECG-CD45-MK9",
  symptoms: ["Fever", "Cough", "Chest Pain"],
  lastChecked: {
    doctor: "Dr. Patel",
    date: "18 Apr 2026",
  },
  observation:
    "Elevated WBC and low oxygen saturation at rest",
  diagnosis:
    "Community-acquired pneumonia (right lower lobe), acute hypoxemic respiratory failure",
  prescriptions: [
    { drug: "Ibuprofen", instruction: "2 times a day" },
    { drug: "Amoxicillin", instruction: "3 times a day" },
    { drug: "Take 1 hour before food", instruction: "" },
  ],
  notes:
    "Patient reported improvement in symptoms but still experiencing fatigue.",
}

export const calendarConfig = {
  monthLabel: "February 2025",
  weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const,
  weekDates: [3, 4, 5, 6, 7, 8, 9],
  selectedDay: 4,
}

export type TimelineEvent = {
  id: string
  title: string
  subtitle?: string
  location: string
  extraLocation?: string
  startTime: string
  endTime: string
  hour: string
  icon: "user" | "team" | "lab" | "surgery" | "prep"
  highlighted?: boolean
}

export const timelineMeta = {
  dateLabel: "February 6, Today, Fri",
  currentTime: "20:34",
}

export const timelineEvents: TimelineEvent[] = [
  {
    id: "1",
    title: "New Patient",
    subtitle: "Patient Thompson",
    location: "Room 305B",
    extraLocation: "Clinic Wing B",
    startTime: "20:00",
    endTime: "20:45",
    hour: "20:00",
    icon: "user",
    highlighted: true,
  },
  {
    id: "2",
    title: "Team Daily Planning",
    location: "Conference Room A1",
    startTime: "21:00",
    endTime: "21:30",
    hour: "21:00",
    icon: "team",
  },
  {
    id: "3",
    title: "Blood Results Ready",
    location: "Lab Center",
    extraLocation: "Floor 2",
    startTime: "22:00",
    endTime: "22:30",
    hour: "22:00",
    icon: "lab",
  },
  {
    id: "4",
    title: "Post-operation",
    subtitle: "Patient Harris",
    location: "West Camp",
    extraLocation: "Room 312",
    startTime: "22:30",
    endTime: "23:25",
    hour: "22:30",
    icon: "surgery",
  },
  {
    id: "5",
    title: "Surgical Preparation",
    location: "OR Prep",
    extraLocation: "Ward 3B",
    startTime: "23:25",
    endTime: "00:45",
    hour: "23:00",
    icon: "prep",
  },
]

export const timelineHours = ["20:00", "21:00", "22:00", "23:00", "00:00"]

export const dashboardWelcome = {
  doctorName: "Dr.Robert",
}

export const weekPeriods = ["Esta Semana", "Semana Anterior", "Este mês", "Este ano"] as const
export type WeekPeriod = (typeof weekPeriods)[number]

export const featuredDoctor = {
  name: "Dr. Salman Hossain",
  specialty: "Cardiologist",
  qualification: "MBBS, MD (Cardiology)",
  availability: {
    days: "Sat - Thu",
    hours: "15:00 PM - 21:00 PM",
  },
  image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&h=400&fit=crop",
}
