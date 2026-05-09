/**
 * Curriculum Library — sumber roadmap/kurikulum awal per anak.
 *
 * Setiap item punya metadata:
 * - `area`          — focus area (Komunikasi / Motorik / Perilaku / Akademik)
 * - `ageMinMonths`  — usia minimum (inklusif)
 * - `ageMaxMonths`  — usia maksimum (inklusif)
 * - `conditionTags` — kondisi yang cocok; kosong = universal
 * - `priority`      — bobot dasar saat kondisi/area sangat cocok
 *
 * `selectCurriculumForChild()` memfilter library ini berdasarkan profil
 * anak (kondisi, usia, focus area, rutinitas, kebutuhan) lalu scoring +
 * dedup per area → menghasilkan roadmap yang memang ditulis ulang
 * untuk anak itu, bukan template identik.
 */

import type { FocusAreaLabel } from "./children";

export type ConditionTag =
  | "autism"
  | "adhd"
  | "down_syndrome"
  | "dyslexia"
  | "speech_delay"
  | "undiagnosed";

export type CurriculumItem = {
  id: string;
  area: FocusAreaLabel;
  title: string;
  detail: string;
  evidence: string[];
  ageMinMonths: number;
  ageMaxMonths: number;
  conditionTags: ConditionTag[]; // kosong = universal
  routineHints?: string[]; // substring rutinitas yang mengangkat skor
  supportNeedHints?: string[]; // substring kebutuhan yang mengangkat skor
  priority: number; // 1-5, makin tinggi makin awal masuk
};

/** Mapping UI condition text → ConditionTag standar. */
export function mapConditionToTag(condition: string | null | undefined): ConditionTag {
  const lower = (condition ?? "").toLowerCase();
  if (lower.includes("autism")) return "autism";
  if (lower.includes("adhd")) return "adhd";
  if (lower.includes("down")) return "down_syndrome";
  if (lower.includes("disleks") || lower.includes("dysle")) return "dyslexia";
  if (lower.includes("bicara") || lower.includes("speech")) return "speech_delay";
  return "undiagnosed";
}

/** Usia anak dalam bulan dari tanggal lahir ISO. */
export function childAgeInMonths(birthDate: string | Date | null | undefined) {
  if (!birthDate) return null;
  const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  const days = now.getDate() - birth.getDate();
  const total = years * 12 + months - (days < 0 ? 1 : 0);
  return Math.max(0, total);
}

// Shorthand rentang usia.
const TODDLER = { min: 18, max: 36 }; // 1.5 – 3 tahun
const PRESCHOOL = { min: 30, max: 60 }; // 2.5 – 5 tahun
const EARLY_SCHOOL = { min: 54, max: 96 }; // 4.5 – 8 tahun
const SCHOOL = { min: 84, max: 144 }; // 7 – 12 tahun
const ANY = { min: 0, max: 240 };

export const curriculumLibrary: CurriculumItem[] = [
  // -------- KOMUNIKASI --------
  // Autism, early
  {
    id: "com.autism.eye-contact-routine",
    area: "Komunikasi",
    title: "Kontak mata 5 detik di rutinitas pagi",
    detail:
      "Latih kontak mata singkat saat memanggil nama anak menjelang aktivitas favorit. Pakai jeda 3 detik sebelum memberi prompt.",
    evidence: [
      "Catat berapa kali anak menoleh spontan",
      "Tandai momen saat kontak mata >3 detik",
    ],
    ageMinMonths: TODDLER.min,
    ageMaxMonths: PRESCHOOL.max,
    conditionTags: ["autism", "speech_delay"],
    routineHints: ["visual pagi", "transisi"],
    priority: 5,
  },
  {
    id: "com.autism.request-with-card",
    area: "Komunikasi",
    title: "Meminta dengan kartu pilihan",
    detail:
      "Tawarkan 2 kartu gambar benda yang ingin dicapai. Biarkan anak menyerahkan/menunjuk kartu sebelum dapat objek.",
    evidence: [
      "Dokumentasikan kartu yang paling sering dipakai",
      "Catat apakah anak menolak atau antusias",
    ],
    ageMinMonths: TODDLER.min,
    ageMaxMonths: EARLY_SCHOOL.max,
    conditionTags: ["autism", "speech_delay", "down_syndrome"],
    priority: 5,
  },
  // Speech delay specifics
  {
    id: "com.speech.label-objects-daily",
    area: "Komunikasi",
    title: "Labeli 5 benda rutin tiap hari",
    detail:
      "Pilih 5 benda yang sering dipakai (sikat gigi, cangkir, mainan). Ucapkan nama + tunjuk setiap kali dipakai selama 1 minggu.",
    evidence: [
      "Catat benda mana yang mulai dilabeli anak sendiri",
      "Hitung upaya peniruan bunyi per hari",
    ],
    ageMinMonths: TODDLER.min,
    ageMaxMonths: PRESCHOOL.max,
    conditionTags: ["speech_delay", "autism", "down_syndrome", "undiagnosed"],
    priority: 5,
  },
  {
    id: "com.speech.two-word-combine",
    area: "Komunikasi",
    title: "Gabungkan 2 kata saat meminta",
    detail:
      "Dorong frasa 2 kata (mis. 'mau susu', 'buka pintu') sebelum dipenuhi. Beri contoh sekali, tunggu anak meniru.",
    evidence: [
      "Catat frasa 2 kata spontan yang muncul",
      "Tandai situasi yang paling sukses",
    ],
    ageMinMonths: PRESCHOOL.min,
    ageMaxMonths: EARLY_SCHOOL.max,
    conditionTags: ["speech_delay", "down_syndrome", "undiagnosed"],
    priority: 4,
  },
  // ADHD
  {
    id: "com.adhd.one-instruction-check",
    area: "Komunikasi",
    title: "Satu instruksi, satu konfirmasi",
    detail:
      "Saat memberi perintah, minta anak mengulang dengan kata sendiri sebelum mulai. Kurangi lupa di tengah jalan.",
    evidence: [
      "Catat instruksi yang paling sering lupa",
      "Bandingkan durasi selesai sebelum/sesudah minta konfirmasi",
    ],
    ageMinMonths: PRESCHOOL.min,
    ageMaxMonths: SCHOOL.max,
    conditionTags: ["adhd", "undiagnosed"],
    priority: 4,
  },
  // Universal
  {
    id: "com.universal.share-book-10min",
    area: "Komunikasi",
    title: "10 menit baca cerita bersama",
    detail:
      "Baca buku bergambar 1 halaman, ajukan 1 pertanyaan tentang gambar. Ulangi tiap malam.",
    evidence: ["Catat buku favorit", "Perhatikan kata-kata baru yang dipakai anak"],
    ageMinMonths: TODDLER.min,
    ageMaxMonths: SCHOOL.max,
    conditionTags: [],
    priority: 2,
  },

  // -------- MOTORIK --------
  {
    id: "mot.down.transfer-small-objects",
    area: "Motorik",
    title: "Pindahkan 10 benda kecil pakai jari",
    detail:
      "Pindahkan kacang/manik antar mangkuk dengan jari telunjuk-ibu jari. Targetkan 10 benda per sesi 5 menit.",
    evidence: [
      "Waktu total untuk 10 benda",
      "Catat jari mana yang masih sulit",
    ],
    ageMinMonths: TODDLER.min,
    ageMaxMonths: PRESCHOOL.max,
    conditionTags: ["down_syndrome", "autism", "undiagnosed"],
    priority: 5,
  },
  {
    id: "mot.universal.obstacle-path",
    area: "Motorik",
    title: "Jalur rintangan dalam ruangan",
    detail:
      "Susun 3-5 rintangan dari bantal/kardus untuk dilompati atau dilewati. Ajak anak 10 menit sehari.",
    evidence: [
      "Catat rintangan yang paling disukai",
      "Amati keseimbangan saat lompat-jongkok",
    ],
    ageMinMonths: TODDLER.min,
    ageMaxMonths: EARLY_SCHOOL.max,
    conditionTags: ["adhd", "autism", "down_syndrome", "undiagnosed"],
    priority: 3,
  },
  {
    id: "mot.dyslexia.cross-body-coordination",
    area: "Motorik",
    title: "Latihan silang tubuh 5 menit",
    detail:
      "Sentuh lutut kiri dengan tangan kanan dan sebaliknya, berulang. Bantu koordinasi bilateral.",
    evidence: [
      "Waktu sampai gerakan lancar",
      "Catat apakah anak bingung arah",
    ],
    ageMinMonths: PRESCHOOL.min,
    ageMaxMonths: SCHOOL.max,
    conditionTags: ["dyslexia", "adhd", "undiagnosed"],
    priority: 4,
  },
  {
    id: "mot.universal.scissors-tracing",
    area: "Motorik",
    title: "Menggunting garis lurus",
    detail:
      "Pakai gunting anak, potong sepanjang garis tebal. 5-10 menit sesi dampingi dari samping.",
    evidence: [
      "Akurasi potong di garis",
      "Catat pegangan gunting yang paling stabil",
    ],
    ageMinMonths: PRESCHOOL.min,
    ageMaxMonths: EARLY_SCHOOL.max,
    conditionTags: [],
    priority: 2,
  },

  // -------- PERILAKU --------
  {
    id: "beh.autism.visual-schedule-3",
    area: "Perilaku",
    title: "Jadwal visual 3 aktivitas",
    detail:
      "Susun 3 kartu aktivitas berurutan (mis. main → bereskan → camilan). Anak memindah kartu ke kolom 'selesai' tiap langkah.",
    evidence: [
      "Catat aktivitas yang paling butuh prompt",
      "Amati reaksi saat urutan berubah",
    ],
    ageMinMonths: TODDLER.min,
    ageMaxMonths: EARLY_SCHOOL.max,
    conditionTags: ["autism", "adhd"],
    routineHints: ["transisi", "visual pagi"],
    priority: 5,
  },
  {
    id: "beh.adhd.timer-transition",
    area: "Perilaku",
    title: "Timer visual sebelum transisi",
    detail:
      "Set timer pasir/digital 2-3 menit sebelum ganti aktivitas. Tunjukkan timer pada anak, transisi dimulai saat habis.",
    evidence: [
      "Catat transisi mana yang tidak butuh timer lagi",
      "Bandingkan intensitas protes",
    ],
    ageMinMonths: PRESCHOOL.min,
    ageMaxMonths: SCHOOL.max,
    conditionTags: ["adhd", "autism"],
    routineHints: ["transisi", "reminder", "rutinitas"],
    priority: 5,
  },
  {
    id: "beh.universal.calm-corner",
    area: "Perilaku",
    title: "Pojok tenang singkat",
    detail:
      "Siapkan area kecil dengan 2 benda menenangkan. Saat overload, dampingi anak 3-5 menit tanpa bicara dulu.",
    evidence: [
      "Catat pemicu yang paling sering",
      "Durasi sampai anak kembali tenang",
    ],
    ageMinMonths: TODDLER.min,
    ageMaxMonths: EARLY_SCHOOL.max,
    conditionTags: ["autism", "adhd", "undiagnosed"],
    priority: 4,
  },
  {
    id: "beh.universal.emotion-name",
    area: "Perilaku",
    title: "Labeli emosi sebelum tidur",
    detail:
      "Sebutkan 1 emosi yang muncul hari ini (senang/marah/takut) dan penyebabnya. 2-3 menit sebelum tidur.",
    evidence: [
      "Catat emosi yang paling sering muncul",
      "Tandai situasi pemicu",
    ],
    ageMinMonths: PRESCHOOL.min,
    ageMaxMonths: SCHOOL.max,
    conditionTags: [],
    routineHints: ["emosi", "sebelum tidur"],
    priority: 3,
  },

  // -------- AKADEMIK --------
  {
    id: "aca.dyslexia.phonics-daily",
    area: "Akademik",
    title: "Bunyi huruf awal benda favorit",
    detail:
      "Pilih 3 benda. Ucapkan bunyi huruf pertama (b-b-bola), minta anak meniru. Ganti set tiap 3 hari.",
    evidence: [
      "Catat bunyi yang konsisten",
      "Tandai huruf yang masih sulit",
    ],
    ageMinMonths: PRESCHOOL.min,
    ageMaxMonths: SCHOOL.max,
    conditionTags: ["dyslexia", "speech_delay"],
    priority: 5,
  },
  {
    id: "aca.universal.pattern-match-5",
    area: "Akademik",
    title: "Cocokkan 5 pasang gambar",
    detail:
      "Siapkan 5 pasang kartu identik. Anak mencocokkan sambil disebutkan nama bendanya.",
    evidence: [
      "Waktu selesaikan semua pasang",
      "Catat kartu yang sering keliru",
    ],
    ageMinMonths: TODDLER.min,
    ageMaxMonths: EARLY_SCHOOL.max,
    conditionTags: ["autism", "down_syndrome", "undiagnosed"],
    priority: 4,
  },
  {
    id: "aca.adhd.short-focus-task",
    area: "Akademik",
    title: "Fokus 5 menit, istirahat 2 menit",
    detail:
      "Satu aktivitas belajar (mewarnai, puzzle) 5 menit. Lalu break 2 menit gerakan ringan. Ulangi 3 siklus.",
    evidence: [
      "Catat aktivitas yang fokus penuh",
      "Lihat apakah break memperpanjang fokus",
    ],
    ageMinMonths: PRESCHOOL.min,
    ageMaxMonths: SCHOOL.max,
    conditionTags: ["adhd"],
    priority: 5,
  },
  {
    id: "aca.universal.size-order",
    area: "Akademik",
    title: "Urutkan 3 benda dari kecil ke besar",
    detail:
      "Ambil 3 benda serupa ukuran berbeda. Minta anak menyusun dan menjelaskan urutannya.",
    evidence: [
      "Catat alasan anak saat mengurutkan",
      "Tandai benda yang sulit dibandingkan",
    ],
    ageMinMonths: PRESCHOOL.min,
    ageMaxMonths: EARLY_SCHOOL.max,
    conditionTags: [],
    priority: 3,
  },
  {
    id: "aca.universal.pretend-read-3pages",
    area: "Akademik",
    title: "Cerita bergambar 3 halaman",
    detail:
      "Buka 3 halaman buku bergambar tanpa teks. Anak menceritakan apa yang dia lihat.",
    evidence: [
      "Catat kata baru yang muncul",
      "Tandai halaman favorit",
    ],
    ageMinMonths: TODDLER.min,
    ageMaxMonths: EARLY_SCHOOL.max,
    conditionTags: [],
    priority: 2,
  },
];

type SelectInput = {
  focusAreas: FocusAreaLabel[];
  condition: string | null | undefined;
  birthDate: string | Date | null | undefined;
  routine: string | null | undefined;
  supportNeed: string | null | undefined;
};

export type SelectedCurriculumItem = {
  area: FocusAreaLabel;
  title: string;
  detail: string;
  evidence: string[];
  score: number;
  reason: string;
};

/**
 * Pilih kurikulum yang paling cocok untuk anak.
 *
 * Logika scoring:
 * +5  item persis match kondisi anak
 * +3  item universal (conditionTags kosong) — tetap dapat basis
 * +4  ageMonths anak di dalam range item
 * -3  anak di luar range usia (filter hard kalau selisih > 12 bln)
 * +2  area cocok dengan focusAreas anak (wajib setidaknya salah satu)
 * +routineBoost  substring rutinitas match `routineHints`
 * +supportBoost  substring kebutuhan match `supportNeedHints`
 * +priority base
 *
 * Lalu ambil 2 item teratas **per area** yang user pilih.
 */
export function selectCurriculumForChild(
  input: SelectInput,
): SelectedCurriculumItem[] {
  const conditionTag = mapConditionToTag(input.condition);
  const ageMonths = childAgeInMonths(input.birthDate);
  const routine = (input.routine ?? "").toLowerCase();
  const supportNeed = (input.supportNeed ?? "").toLowerCase();
  const focusAreas = input.focusAreas.length > 0 ? input.focusAreas : (["Komunikasi"] as FocusAreaLabel[]);

  const scored = curriculumLibrary
    .filter((item) => focusAreas.includes(item.area))
    .map<SelectedCurriculumItem & { rawId: string }>((item) => {
      let score = item.priority;
      const reasons: string[] = [];

      if (item.conditionTags.length === 0) {
        score += 3;
        reasons.push("universal");
      } else if (item.conditionTags.includes(conditionTag)) {
        score += 5;
        reasons.push(`cocok ${conditionTag.replace("_", " ")}`);
      } else {
        score -= 2; // item untuk kondisi lain, turunkan
      }

      if (ageMonths !== null) {
        if (ageMonths >= item.ageMinMonths && ageMonths <= item.ageMaxMonths) {
          score += 4;
          reasons.push(`rentang usia ${ageMonths} bln`);
        } else {
          const distance = Math.min(
            Math.abs(ageMonths - item.ageMinMonths),
            Math.abs(ageMonths - item.ageMaxMonths),
          );
          if (distance > 12) {
            score -= 6;
          } else {
            score -= 2;
          }
        }
      }

      if (item.routineHints && routine) {
        item.routineHints.forEach((hint) => {
          if (routine.includes(hint.toLowerCase())) {
            score += 2;
            reasons.push(`rutinitas "${hint}"`);
          }
        });
      }
      if (item.supportNeedHints && supportNeed) {
        item.supportNeedHints.forEach((hint) => {
          if (supportNeed.includes(hint.toLowerCase())) {
            score += 2;
            reasons.push(`kebutuhan "${hint}"`);
          }
        });
      }

      return {
        rawId: item.id,
        area: item.area,
        title: item.title,
        detail: item.detail,
        evidence: item.evidence,
        score,
        reason: reasons.join(" · ") || "basis universal",
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  // Ambil maksimal 2 item per area yang difokuskan, sesuai urutan focusAreas.
  const picked: SelectedCurriculumItem[] = [];
  const perAreaCount = new Map<FocusAreaLabel, number>();

  focusAreas.forEach((area) => perAreaCount.set(area, 0));

  for (const item of scored) {
    const current = perAreaCount.get(item.area) ?? 0;
    if (current >= 2) continue;
    perAreaCount.set(item.area, current + 1);
    const { rawId: _rawId, ...rest } = item;
    picked.push(rest);
    if (picked.length >= focusAreas.length * 2) break;
  }

  return picked;
}
