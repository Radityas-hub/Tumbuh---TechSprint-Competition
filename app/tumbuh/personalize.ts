import type { Area, ChildApiModel, ChildProfile } from "./types";

/**
 * Copy helpers yang membaca data onboarding dan menghasilkan string
 * personalized untuk dipakai di header, empty state, dan body copy.
 *
 * Aturan:
 * - Tidak pernah menampilkan data onboarding dalam bentuk kartu/list telanjang.
 * - Copy generic hanya dipakai kalau data belum ada (guest / pre-onboarding).
 * - Output selalu bahasa natural, bukan template "Kondisi: X, Fokus: Y".
 */

type ChildContext = {
  name?: string | null;
  condition?: string | null;
  routine?: string | null;
  supportNeed?: string | null;
  focusAreas?: Area[];
};

export function toChildContext(
  profile: ChildProfile,
  activeChild: ChildApiModel | null,
): ChildContext {
  return {
    name: profile.name.trim() || activeChild?.name || null,
    condition: activeChild?.condition ?? profile.condition ?? null,
    routine: activeChild?.routine ?? null,
    supportNeed: activeChild?.supportNeed ?? null,
    focusAreas: profile.focusAreas.length > 0 ? profile.focusAreas : activeChild?.focusAreas ?? [],
  };
}

export function childReferenceName(ctx: ChildContext) {
  return ctx.name?.trim() || "anak Anda";
}

/** "Komunikasi dan Motorik" atau "Komunikasi, Motorik, dan Perilaku" */
export function focusAreaPhrase(ctx: ChildContext) {
  const areas = ctx.focusAreas ?? [];
  if (areas.length === 0) return "perkembangan anak";
  if (areas.length === 1) return areas[0].toLowerCase();
  if (areas.length === 2) return `${areas[0].toLowerCase()} dan ${areas[1].toLowerCase()}`;
  return `${areas
    .slice(0, -1)
    .map((a) => a.toLowerCase())
    .join(", ")}, dan ${areas[areas.length - 1].toLowerCase()}`;
}

/** Kondisi dalam bentuk natural lowercase. "autisme", "ADHD", "Down Syndrome". */
export function conditionPhrase(ctx: ChildContext) {
  const raw = ctx.condition?.trim();
  if (!raw) return null;
  if (raw.toLowerCase().includes("belum ada diagnosis")) return null;
  // Buang suffix "- sudah diagnosis" agar copy bisa natural.
  return raw.replace(/\s*-\s*sudah diagnosis\s*/i, "").trim();
}

/** Frase natural kondisi, siap ditempel: "dengan ADHD", "dengan autisme". */
export function conditionSuffix(ctx: ChildContext) {
  const phrase = conditionPhrase(ctx);
  if (!phrase) return "";
  return ` dengan ${phrase}`;
}

/** "Insight mingguan untuk Sutha dengan autisme, fokus komunikasi dan motorik." */
export function dashboardBody(ctx: ChildContext, hasData: boolean) {
  const name = childReferenceName(ctx);
  const focus = focusAreaPhrase(ctx);
  const cond = conditionPhrase(ctx);

  if (hasData) {
    if (cond) {
      return `Ringkasan minggu ini untuk ${name} dengan ${cond}, fokus ${focus}. Semua insight di bawah berasal dari catatan terbaru.`;
    }
    return `Ringkasan minggu ini untuk ${name}, fokus ${focus}. Semua insight di bawah berasal dari catatan terbaru.`;
  }

  if (cond) {
    return `Mulai catat 2-3 observasi ${focus} untuk ${name}. Setelah itu ringkasan mingguan yang sesuai profil ${name} dengan ${cond} akan muncul di sini.`;
  }
  return `Mulai catat 2-3 observasi ${focus} untuk ${name}. Setelah itu ringkasan mingguan akan muncul di sini.`;
}

/** Body di panel chart ("Progress mingguan"). */
export function chartPanelSubtitle(ctx: ChildContext, hasData: boolean) {
  const name = childReferenceName(ctx);
  const focus = focusAreaPhrase(ctx);
  if (hasData) {
    return `Grafik pola catatan ${name} minggu ini, dikelompokkan berdasarkan area ${focus}.`;
  }
  return `Grafik akan terbentuk setelah ada catatan ${focus} untuk ${name}.`;
}

/** Subtitle AI insight. */
export function insightFallbackText(ctx: ChildContext) {
  const name = childReferenceName(ctx);
  const focus = focusAreaPhrase(ctx);
  const cond = conditionPhrase(ctx);
  const routineHint = ctx.routine ? ` Rutinitas "${ctx.routine.toLowerCase()}" yang Anda pilih akan jadi konteks awal.` : "";
  if (cond) {
    return `Insight untuk ${name} dengan ${cond} akan disusun setelah ada catatan ${focus}.${routineHint}`;
  }
  return `Insight untuk ${name} akan disusun setelah ada catatan ${focus}.${routineHint}`;
}

/** Recommendation untuk activities hari ini, diurutkan per area fokus. */
export function personalizedActivityPlaceholders(ctx: ChildContext) {
  const areas = ctx.focusAreas ?? [];
  const name = childReferenceName(ctx);
  const routine = ctx.routine?.toLowerCase();

  if (areas.length === 0) {
    return [
      {
        title: `Mulai dari satu observasi ${name}`,
        body: "Tambahkan catatan perkembangan pertama agar sistem bisa mempelajari pola yang relevan.",
        area: "Komunikasi" as Area,
      },
    ];
  }

  return areas.slice(0, 3).map((area, index) => {
    const isPrimary = index === 0;
    const areaCopy: Record<Area, { title: string; body: string }> = {
      Komunikasi: {
        title: `Dengarkan ${name} hari ini`,
        body: `Catat satu kata atau gestur baru yang muncul${routine ? `, terutama di momen ${routine}` : ""}.`,
      },
      Motorik: {
        title: `Amati gerakan ${name}`,
        body: `Perhatikan aktivitas fisik 5-10 menit${routine ? ` dalam ${routine}` : ""} — catat yang paling lancar.`,
      },
      Perilaku: {
        title: `Perhatikan pemicu & respons`,
        body: `Saat transisi aktivitas, catat reaksi ${name} dan strategi apa yang sempat membantu.`,
      },
      Akademik: {
        title: `Satu aktivitas belajar singkat`,
        body: `Pilih satu tantangan kecil (cocok-cocokan, urutkan) yang bisa diulang ${routine ? `di ${routine}` : "setiap hari"}.`,
      },
    };

    return {
      ...areaCopy[area],
      title: isPrimary ? areaCopy[area].title : areaCopy[area].title,
      area,
    };
  });
}

/** Roadmap empty state body. */
export function roadmapEmptyBody(ctx: ChildContext, isSeedOnly: boolean) {
  const name = childReferenceName(ctx);
  const focus = focusAreaPhrase(ctx);
  const cond = conditionPhrase(ctx);
  const profile = cond ? `${name} (${cond})` : name;

  if (isSeedOnly) {
    return `Baseline untuk ${profile} sudah disiapkan. Tambahkan 2-3 catatan area ${focus} supaya roadmap mulai menyesuaikan dengan ritme ${name}.`;
  }
  return `Selesaikan onboarding lalu tambahkan catatan area ${focus} untuk ${profile}. Roadmap akan menyusun target berdasarkan pola yang terdeteksi.`;
}

/** Progress empty timeline. */
export function progressEmptyState(ctx: ChildContext) {
  const name = childReferenceName(ctx);
  const focus = focusAreaPhrase(ctx);
  return {
    badge: "Belum ada catatan",
    title: `Catatan pertama ${name}`,
    body: `Mulai dari satu observasi area ${focus}. Tidak perlu panjang — satu kalimat yang spesifik sudah cukup untuk melatih sistem.`,
  };
}

/** Progress screen header body. */
export function progressHeaderBody(ctx: ChildContext) {
  const name = childReferenceName(ctx);
  const routine = ctx.routine;
  if (routine) {
    return `Catat perkembangan ${name} hari ini. Momen dari rutinitas "${routine.toLowerCase()}" seringkali paling kaya konteks.`;
  }
  return `Catat perkembangan ${name} hari ini — pilih jenis input, area, tulis observasi, lalu simpan ke timeline.`;
}

/** Education header body. */
export function educationHeaderBody(ctx: ChildContext) {
  const name = childReferenceName(ctx);
  const cond = conditionPhrase(ctx);
  const focus = focusAreaPhrase(ctx);
  if (cond) {
    return `Artikel dan assistant diutamakan untuk ${name} dengan ${cond} di area ${focus}. AI assistant tetap panduan awal, bukan pengganti dokter.`;
  }
  return `Artikel dan assistant diprioritaskan untuk area ${focus} anak Anda. AI assistant tetap panduan awal, bukan pengganti dokter.`;
}

/** Assistant initial prompt line. */
export function assistantInitialPrompt(ctx: ChildContext) {
  const name = childReferenceName(ctx);
  const cond = conditionPhrase(ctx);
  const focus = focusAreaPhrase(ctx);
  if (cond) {
    return `Tanya seputar ${name} dengan ${cond}, misalnya tentang ${focus}, transisi, atau persiapan konsultasi. Jawaban akan muncul di sini.`;
  }
  return `Tanya seputar ${name}, misalnya tentang ${focus}, rutinitas, atau persiapan konsultasi. Jawaban akan muncul di sini.`;
}

/** Consultation header body. */
export function consultationHeaderBody(ctx: ChildContext, shouldUsePlaceholder: boolean) {
  const name = childReferenceName(ctx);
  const cond = conditionPhrase(ctx);
  const focus = focusAreaPhrase(ctx);

  if (shouldUsePlaceholder) {
    if (cond) {
      return `Tambahkan catatan untuk ${name} dengan ${cond} agar rekomendasi konsultasi menyesuaikan area ${focus}.`;
    }
    return `Tambahkan catatan untuk ${name} agar rekomendasi konsultasi menyesuaikan area ${focus}.`;
  }

  if (cond) {
    return `Alasan konsultasi dan data yang perlu dibawa untuk ${name} dengan ${cond}, dirangkum dari catatan ${focus} terbaru.`;
  }
  return `Alasan konsultasi dan data yang perlu dibawa untuk ${name}, dirangkum dari catatan ${focus} terbaru.`;
}

/** Landing greeting. */
export function dashboardGreeting(hour: number, guardianName: string) {
  if (hour < 11) return `Selamat pagi, ${guardianName}`;
  if (hour < 15) return `Selamat siang, ${guardianName}`;
  if (hour < 19) return `Selamat sore, ${guardianName}`;
  return `Selamat malam, ${guardianName}`;
}

/** Narrative summary for the hero zone — replaces metric grid. */
export function dashboardNarrative(
  ctx: ChildContext,
  opts: {
    notesThisWeek: number;
    delta: number;
    alertCount: number;
    achievedTargets: number;
    closestTarget: string | null;
  },
) {
  const name = childReferenceName(ctx);
  const { notesThisWeek, delta, alertCount, closestTarget } = opts;

  // Build parts
  const parts: string[] = [];

  // Activity summary
  if (notesThisWeek === 0) {
    parts.push(`Belum ada catatan untuk ${name} minggu ini.`);
  } else if (notesThisWeek === 1) {
    parts.push(`${name} punya 1 catatan baru minggu ini.`);
  } else {
    const trendPhrase = delta > 0 ? ", lebih banyak dari minggu lalu" : "";
    parts.push(`${name} punya ${notesThisWeek} catatan baru minggu ini${trendPhrase}.`);
  }

  // Target progress
  if (closestTarget) {
    parts.push(`Target "${closestTarget}" mendekati tercapai.`);
  }

  // Alert or calm
  if (alertCount > 0) {
    parts.push("Ada satu hal yang mungkin perlu perhatian.");
  } else if (notesThisWeek > 0) {
    parts.push("Tidak ada yang perlu dikhawatirkan minggu ini.");
  }

  return parts.join(" ");
}

/** Narrative for empty/first-time dashboard. */
export function dashboardEmptyNarrative(ctx: ChildContext) {
  const name = childReferenceName(ctx);
  return `Dashboard ini akan jadi tempat Anda melihat perkembangan ${name} secara ringkas. Mulai dengan satu langkah kecil.`;
}

/** Weekly pulse narrative below the dots. */
export function weeklyPulseNarrative(
  ctx: ChildContext,
  opts: { notesThisWeek: number; delta: number; todayIndex: number },
) {
  const { notesThisWeek, delta, todayIndex } = opts;
  const daysElapsed = todayIndex + 1;

  if (notesThisWeek === 0) {
    return "Belum ada catatan minggu ini. Satu kalimat singkat sudah cukup untuk memulai.";
  }

  const comparison =
    delta > 0
      ? " Lebih aktif dari minggu lalu."
      : delta < 0
        ? " Sedikit lebih tenang dari minggu lalu."
        : " Ritme yang sama dengan minggu lalu.";

  return `${notesThisWeek} catatan dari ${daysElapsed} hari.${comparison}`;
}
