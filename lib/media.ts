import { createHmac, randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import type { Prisma } from "../generated/prisma/client";
import { ConsentScope, InputType, JobStatus, MediaStatus } from "../generated/prisma/enums";

import { badRequest, forbidden, notFound } from "./api/errors";
import { prisma } from "./prisma";

const mediaAssetSelect = {
  id: true,
  childId: true,
  progressEntryId: true,
  type: true,
  storageBucket: true,
  storageKey: true,
  url: true,
  mimeType: true,
  sizeBytes: true,
  status: true,
  processingError: true,
  processedOutput: true,
  createdAt: true,
  updatedAt: true,
  processingJobs: {
    orderBy: {
      createdAt: "desc",
    },
    take: 1,
    select: {
      id: true,
      kind: true,
      status: true,
      attempts: true,
      error: true,
      createdAt: true,
      updatedAt: true,
      startedAt: true,
      completedAt: true,
    },
  },
} satisfies Prisma.MediaAssetSelect;

type MediaAssetRecord = Prisma.MediaAssetGetPayload<{ select: typeof mediaAssetSelect }>;

export type SerializedMediaAsset = {
  id: string;
  childId: string;
  progressEntryId: string | null;
  type: "Foto" | "Suara" | "Dokumen";
  storageBucket: string | null;
  storageKey: string;
  url: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  status:
    | "PENDING_UPLOAD"
    | "UPLOADED"
    | "PROCESSING"
    | "COMPLETED"
    | "FAILED";
  statusLabel: "Menunggu upload" | "Terunggah" | "Sedang diproses" | "Selesai" | "Gagal";
  processingError: string | null;
  processedOutput: Record<string, unknown> | null;
  latestJob: {
    id: string;
    kind: string;
    status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
    attempts: number;
    error: string | null;
    createdAt: string;
    updatedAt: string;
    startedAt: string | null;
    completedAt: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateUploadInput = {
  childId: string;
  type: "Foto" | "Suara" | "Dokumen";
  fileName: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
};

type MediaJobKind = "media_process" | "document_analyze";

const mediaTypeToEnumMap = {
  Foto: InputType.PHOTO,
  Suara: InputType.AUDIO,
  Dokumen: InputType.DOCUMENT,
} as const;

const enumToMediaTypeMap = {
  [InputType.PHOTO]: "Foto",
  [InputType.AUDIO]: "Suara",
  [InputType.DOCUMENT]: "Dokumen",
  [InputType.TEXT]: "Dokumen",
} as const;

const mediaStatusLabels = {
  [MediaStatus.PENDING_UPLOAD]: "Menunggu upload",
  [MediaStatus.UPLOADED]: "Terunggah",
  [MediaStatus.PROCESSING]: "Sedang diproses",
  [MediaStatus.COMPLETED]: "Selesai",
  [MediaStatus.FAILED]: "Gagal",
} as const;

function parseProcessedOutput(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getUploadSecret() {
  return process.env.MEDIA_UPLOAD_SECRET || "tumbuh-dev-upload-secret";
}

function getStorageRoot() {
  return path.join(process.cwd(), "storage", "uploads");
}

function buildPublicAssetUrl(assetId: string, type: "Foto" | "Suara" | "Dokumen") {
  if (type === "Dokumen") {
    return `/api/documents/${assetId}/file`;
  }

  return `/api/media/${assetId}/file`;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(-120);
}

function getFileExtension(fileName: string) {
  const extension = path.extname(fileName).trim();
  return extension || "";
}

function buildStorageKey(type: CreateUploadInput["type"], fileName: string) {
  const folder = type === "Dokumen" ? "documents" : "media";
  const safeName = sanitizeFileName(fileName || "upload.bin");
  return `${folder}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${safeName}`;
}

function signUploadPayload(mediaId: string, storageKey: string) {
  return createHmac("sha256", getUploadSecret())
    .update(`${mediaId}:${storageKey}`)
    .digest("hex");
}

function ensureMatchingSignature(mediaId: string, storageKey: string, signature: string | null) {
  if (!signature) {
    throw forbidden("Upload signature is required");
  }

  const expected = signUploadPayload(mediaId, storageKey);
  if (expected !== signature) {
    throw forbidden("Upload signature is invalid");
  }
}

function serializeMediaAsset(asset: MediaAssetRecord): SerializedMediaAsset {
  const latestJob = asset.processingJobs[0];

  return {
    id: asset.id,
    childId: asset.childId,
    progressEntryId: asset.progressEntryId,
    type: enumToMediaTypeMap[asset.type],
    storageBucket: asset.storageBucket,
    storageKey: asset.storageKey,
    url: asset.url,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    status: asset.status,
    statusLabel: mediaStatusLabels[asset.status],
    processingError: asset.processingError,
    processedOutput: parseProcessedOutput(asset.processedOutput),
    latestJob: latestJob
      ? {
          id: latestJob.id,
          kind: latestJob.kind,
          status: latestJob.status,
          attempts: latestJob.attempts,
          error: latestJob.error,
          createdAt: latestJob.createdAt.toISOString(),
          updatedAt: latestJob.updatedAt.toISOString(),
          startedAt: latestJob.startedAt?.toISOString() ?? null,
          completedAt: latestJob.completedAt?.toISOString() ?? null,
        }
      : null,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  };
}

export async function assertConsentGrantedForChild(
  childId: string,
  scope: "media_upload" | "document_analysis",
) {
  const consentScope =
    scope === "media_upload" ? ConsentScope.MEDIA_UPLOAD : ConsentScope.DOCUMENT_ANALYSIS;

  const consent = await prisma.consent.findFirst({
    where: {
      childId,
      scope: consentScope,
      granted: true,
    },
    select: {
      id: true,
    },
  });

  if (!consent) {
    throw forbidden(
      scope === "media_upload"
        ? "Media upload consent is required"
        : "Document analysis consent is required",
    );
  }
}

export async function createUploadRequestForChild(input: CreateUploadInput) {
  const storageKey = buildStorageKey(input.type, input.fileName);

  const asset = await prisma.mediaAsset.create({
    data: {
      childId: input.childId,
      type: mediaTypeToEnumMap[input.type],
      storageBucket: "local",
      storageKey,
      mimeType: input.mimeType ?? null,
      sizeBytes: input.sizeBytes ?? null,
      status: MediaStatus.PENDING_UPLOAD,
    },
    select: mediaAssetSelect,
  });

  const uploadSignature = signUploadPayload(asset.id, asset.storageKey);
  const uploadPath =
    input.type === "Dokumen"
      ? `/api/documents/${asset.id}/upload?signature=${uploadSignature}`
      : `/api/media/${asset.id}/upload?signature=${uploadSignature}`;

  return {
    asset: serializeMediaAsset(asset),
    upload: {
      uploadUrl: uploadPath,
      uploadMethod: "PUT" as const,
      uploadHeaders: {
        "Content-Type": input.mimeType || "application/octet-stream",
      },
    },
  };
}

export async function getOwnedMediaAssetForGuardian(guardianId: string, mediaId: string) {
  const asset = await prisma.mediaAsset.findFirst({
    where: {
      id: mediaId,
      child: {
        guardianId,
        deletedAt: null,
      },
    },
    select: mediaAssetSelect,
  });

  if (!asset) {
    throw notFound("Media asset not found");
  }

  return asset;
}

export async function uploadMediaBinary(mediaId: string, signature: string | null, body: ArrayBuffer) {
  const asset = await prisma.mediaAsset.findUnique({
    where: {
      id: mediaId,
    },
    select: mediaAssetSelect,
  });

  if (!asset) {
    throw notFound("Media asset not found");
  }

  ensureMatchingSignature(asset.id, asset.storageKey, signature);

  if (body.byteLength === 0) {
    throw badRequest("Upload body cannot be empty");
  }

  const outputPath = path.join(getStorageRoot(), asset.storageKey);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, Buffer.from(body));

  const updatedAsset = await prisma.mediaAsset.update({
    where: {
      id: mediaId,
    },
    data: {
      status: MediaStatus.UPLOADED,
      processingError: null,
      url: buildPublicAssetUrl(
        asset.id,
        asset.type === InputType.PHOTO
          ? "Foto"
          : asset.type === InputType.AUDIO
            ? "Suara"
            : "Dokumen",
      ),
      sizeBytes: body.byteLength,
    },
    select: mediaAssetSelect,
  });

  return serializeMediaAsset(updatedAsset);
}

function buildPlaceholderProcessedOutput(type: InputType, assetId: string) {
  if (type === InputType.PHOTO) {
    return {
      summary:
        "Foto berhasil tersimpan. Placeholder processor menandai bahwa gambar siap dianalisis lebih lanjut.",
      detectedMoments: ["interaksi visual", "aktivitas rumah"],
      assetId,
    };
  }

  if (type === InputType.AUDIO) {
    return {
      transcript:
        "Placeholder transcript: orang tua menjelaskan observasi singkat dari aktivitas harian anak.",
      summary:
        "Audio berhasil diproses secara placeholder dan siap dipakai untuk ringkasan berikutnya.",
      assetId,
    };
  }

  return {
    extractedTargets: [
      "Ringkas target terapi atau rekomendasi utama dari dokumen.",
      "Tandai poin yang bisa dimasukkan ke roadmap berikutnya.",
    ],
    summary:
      "Dokumen berhasil diproses secara placeholder. Hasil ini tetap perlu ditinjau manual oleh guardian atau profesional.",
    assetId,
  };
}

export async function processOwnedMediaAsset(
  guardianId: string,
  mediaId: string,
  kind: MediaJobKind,
) {
  const asset = await getOwnedMediaAssetForGuardian(guardianId, mediaId);

  if (asset.status === MediaStatus.PENDING_UPLOAD) {
    throw badRequest("Media file must be uploaded before processing");
  }

  if (kind === "document_analyze" && asset.type !== InputType.DOCUMENT) {
    throw badRequest("Document analyze can only be used for document uploads");
  }

  if (kind === "media_process" && asset.type === InputType.DOCUMENT) {
    throw badRequest("Document uploads must use the document analyze endpoint");
  }

  const job = await prisma.processingJob.create({
    data: {
      mediaAssetId: mediaId,
      kind,
      status: JobStatus.PENDING,
      attempts: 1,
      payload: {
        mediaId,
        type: asset.type,
      },
    },
    select: {
      id: true,
    },
  });

  await prisma.processingJob.update({
    where: {
      id: job.id,
    },
    data: {
      status: JobStatus.RUNNING,
      startedAt: new Date(),
    },
  });

  await prisma.mediaAsset.update({
    where: {
      id: mediaId,
    },
    data: {
      status: MediaStatus.PROCESSING,
      processingError: null,
    },
  });

  const processedOutput = buildPlaceholderProcessedOutput(asset.type, mediaId);

  await prisma.processingJob.update({
    where: {
      id: job.id,
    },
    data: {
      status: JobStatus.COMPLETED,
      completedAt: new Date(),
      result: processedOutput,
    },
  });

  const updatedAsset = await prisma.mediaAsset.update({
    where: {
      id: mediaId,
    },
    data: {
      status: MediaStatus.COMPLETED,
      processedOutput,
      processingError: null,
    },
    select: mediaAssetSelect,
  });

  return serializeMediaAsset(updatedAsset);
}

export async function linkMediaAssetToProgressEntry(
  childId: string,
  mediaId: string,
  progressEntryId: string,
) {
  const asset = await prisma.mediaAsset.findFirst({
    where: {
      id: mediaId,
      childId,
    },
    select: {
      id: true,
    },
  });

  if (!asset) {
    throw notFound("Media asset not found");
  }

  await prisma.mediaAsset.update({
    where: {
      id: mediaId,
    },
    data: {
      progressEntryId,
    },
  });
}

export function ensureMediaMatchesProgressType(
  mediaType: SerializedMediaAsset["type"],
  progressType: "Teks" | "Foto" | "Suara",
) {
  if (
    (progressType === "Foto" && mediaType !== "Foto") ||
    (progressType === "Suara" && mediaType !== "Suara")
  ) {
    throw badRequest("mediaId does not match the selected inputType");
  }

  if (progressType === "Teks") {
    throw badRequest("mediaId is not supported for text entries");
  }
}

export async function getSerializedOwnedMediaAssetForGuardian(guardianId: string, mediaId: string) {
  const asset = await getOwnedMediaAssetForGuardian(guardianId, mediaId);
  return serializeMediaAsset(asset);
}

export async function getMediaFileResponsePayload(mediaId: string) {
  const asset = await prisma.mediaAsset.findUnique({
    where: {
      id: mediaId,
    },
    select: {
      id: true,
      storageKey: true,
      mimeType: true,
      type: true,
    },
  });

  if (!asset) {
    throw notFound("Media asset not found");
  }

  const filePath = path.join(getStorageRoot(), asset.storageKey);
  const body = await readFile(filePath);

  return {
    body,
    mimeType:
      asset.mimeType ||
      (asset.type === InputType.PHOTO
        ? "image/jpeg"
        : asset.type === InputType.AUDIO
          ? "audio/mpeg"
          : "application/octet-stream"),
  };
}
