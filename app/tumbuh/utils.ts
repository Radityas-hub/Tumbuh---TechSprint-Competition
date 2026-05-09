import type {
  ArticleApiModel,
  ChildApiModel,
  ChildProfile,
  MediaAssetApiModel,
  ProgressEntry,
  ProgressEntryApiModel,
  UiArticleSummary,
} from "./types";
import { appendDevelopmentAuthQuery } from "./api";

export function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function mapArticleToUi(article: ArticleApiModel): UiArticleSummary {
  return {
    title: article.title,
    category: article.category,
    readTime: `${article.readTime} menit`,
    body: article.summary,
    slug: article.slug,
  };
}

export function mapChildToProfile(child: ChildApiModel): ChildProfile {
  return {
    name: child.name,
    birthDate: child.birthDate.slice(0, 10),
    condition: child.condition,
    focusAreas: child.focusAreas,
  };
}

export function getChildRoutine(child: ChildApiModel | null) {
  return child?.routine || "Rutinitas visual pagi dan transisi sore";
}

export function getChildSupportNeed(child: ChildApiModel | null) {
  return child?.supportNeed || "Arahan aktivitas harian yang praktis";
}

export function formatObservedDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Singapore",
  }).format(new Date(value));
}

export function formatDateTimeCompact(value: string | null) {
  if (!value) {
    return "Belum ada";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Singapore",
  }).format(new Date(value));
}

export function buildProgressInsight(
  entry: ProgressEntryApiModel,
  firstMediaAsset?: MediaAssetApiModel,
) {
  if (entry.insight?.trim()) {
    return entry.insight.trim();
  }

  const processedSummary =
    firstMediaAsset?.processedOutput &&
    typeof firstMediaAsset.processedOutput.summary === "string"
      ? firstMediaAsset.processedOutput.summary.trim()
      : null;

  if (processedSummary) {
    return processedSummary;
  }

  if (firstMediaAsset?.status === "PROCESSING") {
    return `Media untuk area ${entry.area.toLowerCase()} sedang diproses backend agar bisa dipakai pada insight dan roadmap berikutnya.`;
  }

  if (
    firstMediaAsset?.status === "UPLOADED" ||
    firstMediaAsset?.status === "COMPLETED"
  ) {
    return `Observasi ${entry.area.toLowerCase()} ini sudah tersimpan dan siap dipakai untuk pembaruan insight anak.`;
  }

  return `Observasi ${entry.area.toLowerCase()} ini sudah masuk ke timeline dan akan dipertimbangkan pada pembaruan insight berikutnya.`;
}

export function mapProgressEntryToUi(entry: ProgressEntryApiModel): ProgressEntry {
  const firstMediaAsset = entry.mediaAssets[0];

  return {
    id: entry.id,
    type: entry.inputType,
    area: entry.area,
    title:
      entry.title ||
      (entry.inputType === "Teks"
        ? "Catatan perkembangan baru"
        : entry.inputType === "Foto"
          ? "Observasi dari aktivitas visual"
          : "Ringkasan voice note orang tua"),
    note: entry.note || "",
    date: formatObservedDate(entry.observedAt),
    insight: buildProgressInsight(entry, firstMediaAsset),
    mediaUrl: appendDevelopmentAuthQuery(firstMediaAsset?.url ?? null),
    mediaStatusLabel: firstMediaAsset?.statusLabel ?? null,
    mediaProcessingError: firstMediaAsset?.processingError ?? null,
  };
}

export function getChartBarHeight(value: number, maxValue: number) {
  if (maxValue <= 0) {
    return 18;
  }

  return Math.max(18, Math.round((value / maxValue) * 82));
}
