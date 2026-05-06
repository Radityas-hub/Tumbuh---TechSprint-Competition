import type { Prisma } from "../generated/prisma/client";

import { prisma } from "./prisma";

const articleSelect = {
  id: true,
  slug: true,
  title: true,
  category: true,
  readTime: true,
  summary: true,
  content: true,
  published: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ArticleSelect;

type ArticleRecord = Prisma.ArticleGetPayload<{ select: typeof articleSelect }>;

export type SerializedArticle = {
  id: string;
  slug: string;
  title: string;
  category: string;
  readTime: number;
  summary: string;
  content: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const seededArticles = [
  {
    slug: "cara-membaca-milestone-tanpa-panik",
    title: "Cara membaca milestone tanpa panik",
    category: "Panduan orang tua",
    readTime: 6,
    summary: "Milestone adalah arah observasi, bukan label untuk menghakimi kemampuan anak.",
    content:
      "Milestone membantu orang tua melihat pola tumbuh kembang dari waktu ke waktu. Fokuskan pencatatan pada konteks kejadian, frekuensi, dan perubahan kecil yang konsisten.",
  },
  {
    slug: "menyiapkan-catatan-sebelum-konsultasi-terapi",
    title: "Menyiapkan catatan sebelum konsultasi terapi",
    category: "Konsultasi",
    readTime: 5,
    summary:
      "Catatan yang baik berisi konteks, frekuensi, pemicu, dan perubahan setelah intervensi.",
    content:
      "Sebelum konsultasi, siapkan ringkasan dua minggu terakhir: kejadian utama, situasi pemicu, respons anak, dan strategi yang sempat membantu.",
  },
  {
    slug: "rutinitas-visual-untuk-anak-autisme",
    title: "Rutinitas visual untuk anak autisme",
    category: "Aktivitas rumah",
    readTime: 7,
    summary: "Rutinitas visual membantu anak memahami transisi dan mengurangi kejutan mendadak.",
    content:
      "Rutinitas visual dapat berupa kartu aktivitas, timer, atau urutan gambar sederhana. Gunakan bahasa singkat dan konsisten agar anak lebih mudah memprediksi langkah berikutnya.",
  },
  {
    slug: "aktivitas-rumah-untuk-latihan-komunikasi",
    title: "Aktivitas rumah untuk latihan komunikasi",
    category: "Aktivitas rumah",
    readTime: 6,
    summary: "Latihan komunikasi paling efektif jika menempel pada rutinitas harian anak.",
    content:
      "Pilih momen yang sering berulang seperti makan, mandi, atau bermain. Tawarkan dua pilihan konkret dan beri jeda singkat agar anak sempat merespons.",
  },
] as const;

function serializeArticle(article: ArticleRecord): SerializedArticle {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    category: article.category,
    readTime: article.readTime,
    summary: article.summary,
    content: article.content,
    published: article.published,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  };
}

export async function ensureSeedArticles() {
  const count = await prisma.article.count();
  if (count > 0) {
    return;
  }

  await prisma.article.createMany({
    data: seededArticles.map((article) => ({
      ...article,
      published: true,
      publishedAt: new Date(),
    })),
  });
}

export async function listArticles(input: { query?: string; category?: string } = {}) {
  await ensureSeedArticles();

  const articles = await prisma.article.findMany({
    where: {
      published: true,
      ...(input.query
        ? {
            OR: [
              { title: { contains: input.query, mode: "insensitive" } },
              { summary: { contains: input.query, mode: "insensitive" } },
              { content: { contains: input.query, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(input.category
        ? {
            category: {
              equals: input.category,
              mode: "insensitive",
            },
          }
        : {}),
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: articleSelect,
  });

  return articles.map(serializeArticle);
}

export async function getArticleBySlug(slug: string) {
  await ensureSeedArticles();

  const article = await prisma.article.findUniqueOrThrow({
    where: {
      slug,
    },
    select: articleSelect,
  });

  return serializeArticle(article);
}
