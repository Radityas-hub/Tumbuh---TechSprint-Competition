import {
  BookOpen,
  ClipboardList,
  Home,
  Settings,
  Stethoscope,
  Target,
} from "lucide-react";
import type { ReactNode } from "react";

import type { ChildProfile, Screen } from "./types";

export const initialProfile: ChildProfile = {
  name: "",
  birthDate: "",
  condition: "",
  focusAreas: [],
};

export const navItems: { id: Screen; label: string; icon: ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <Home size={18} /> },
  { id: "roadmap", label: "Roadmap", icon: <Target size={18} /> },
  { id: "progress", label: "Catatan", icon: <ClipboardList size={18} /> },
  { id: "education", label: "Edukasi", icon: <BookOpen size={18} /> },
  { id: "consultation", label: "Konsultasi", icon: <Stethoscope size={18} /> },
  { id: "settings", label: "Pengaturan", icon: <Settings size={18} /> },
];

export const screenPaths: Record<Screen, string> = {
  home: "/",
  onboarding: "/onboarding",
  dashboard: "/dashboard",
  roadmap: "/roadmap",
  progress: "/progress",
  education: "/education",
  consultation: "/consultation",
  handoff: "/backend",
  settings: "/settings",
};

export const homeNavItems = [
  { label: "Home", href: "#home" },
  { label: "How it works", href: "#workflow" },
  { label: "Features", href: "#features" },
];

export const backendContracts = [
  {
    endpoint: "POST /api/children",
    purpose: "Menyimpan profil anak setelah onboarding.",
    fields: "name, birthDate, condition, focusAreas, guardianId",
  },
  {
    endpoint: "POST /api/progress",
    purpose: "Menyimpan catatan teks, foto, atau suara dari orang tua.",
    fields: "childId, inputType, note, mediaUrl, area, createdAt",
  },
  {
    endpoint: "GET /api/children/:id/insights",
    purpose: "Mengambil ringkasan mingguan, alert, dan rekomendasi aktivitas.",
    fields: "summary, alerts, recommendedActivities, roadmap",
  },
  {
    endpoint: "POST /api/documents/analyze",
    purpose:
      "Mengunggah laporan terapi/dokter untuk diekstrak menjadi poin penting.",
    fields: "childId, fileUrl, documentType, extractedTargets",
  },
];

export const dashboardInstructionRoadmap = [
  {
    title: "Kontak mata 5 detik",
    detail:
      "Latih kontak mata singkat saat memberi instruksi sederhana dan jelas.",
    tone: "amber",
  },
  {
    title: "Meminta bantuan dengan kata atau gestur",
    detail:
      "Gunakan pilihan visual agar anak belajar meminta bantuan sebelum frustrasi.",
    tone: "blue",
  },
  {
    title: "Transisi dengan dukungan visual",
    detail:
      "Gunakan dukungan visual seperti timer atau jadwal gambar saat memandu transisi aktivitas.",
    tone: "blue",
  },
];

export const dashboardInstructionActivities = [
  {
    title: "Fokus latihan awal",
    body: "Mulai dari satu target sederhana yang bisa diulang konsisten selama 5-10 menit per hari.",
    area: "Komunikasi",
  },
  {
    title: "Observasi yang perlu dicatat",
    body: "Catat pemicu, konteks, dan respons anak agar backend punya dasar untuk menyusun insight berikutnya.",
    area: "Perilaku",
  },
  {
    title: "Langkah berikutnya",
    body: "Tambahkan 2-3 catatan rutin sebelum menilai apakah target tertentu perlu dinaikkan prioritasnya.",
    area: "Akademik",
  },
];
