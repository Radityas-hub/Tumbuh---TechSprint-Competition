-- Knowledge base seed berbasis riset (bukan karangan internal).
-- Setiap artikel punya source_label + source_url + evidence_level yang jelas.
-- Dijalankan via Supabase MCP (execute_sql) atau psql.
--
-- Evidence level:
--   "research_review"    = systematic review / peer-reviewed paper
--   "clinical_guideline" = pedoman dari organisasi profesional (AAP, ASHA, dll)
--   "public_health"      = panduan dari lembaga publik (CDC, HealthyChildren)
--   "advocacy_resource"  = sumber organisasi advokasi yang kredibel (NDSS, IDA)

-- =============================================================
-- Artikel 1: CDC Act Early — Developmental Monitoring
-- =============================================================
INSERT INTO knowledge_articles (
  id, slug, title, summary, body, category, source_label, source_url, evidence_level,
  language, age_min_months, age_max_months, condition_tags, focus_area_tags, safety_tags,
  review_status, approved_by, reviewed_by, last_reviewed_at, published_at, created_at, updated_at
) VALUES (
  'kb_cdc_monitoring',
  'cdc-developmental-monitoring',
  'Pemantauan perkembangan anak: pendekatan CDC Learn the Signs',
  'CDC menyarankan pemantauan perkembangan lewat milestone checklist, bukan self-diagnosis. Peran orang tua adalah mencatat observasi dan mendiskusikan dengan dokter anak.',
  'Developmental monitoring adalah pengamatan berkelanjutan bagaimana anak tumbuh dan berubah dari waktu ke waktu, terutama pada area bermain, belajar, berbicara, bertindak, dan bergerak. CDC dan American Academy of Pediatrics merekomendasikan skrining perkembangan formal pada usia 9, 18, dan 30 bulan, serta skrining autisme spesifik pada usia 18 dan 24 bulan. Orang tua adalah pengamat paling rutin; observasi harian yang konsisten lebih berharga daripada tes tunggal. Jika anak tidak mencapai satu atau lebih milestone sesuai usianya, atau kehilangan kemampuan yang pernah dimiliki, CDC mendorong tindakan dini — mulai dari diskusi dengan dokter anak hingga rujukan ke early intervention services (birth to 3) atau special education (>=3 tahun). Tidak perlu menunggu diagnosis formal untuk meminta evaluasi gratis dari state early intervention system.',
  'education_general',
  'CDC Learn the Signs. Act Early.',
  'https://www.cdc.gov/act-early/families/concerned.html',
  'public_health',
  'id-ID',
  0, 72,
  '["autisme","adhd","down_syndrome","disleksia","speech_delay","undiagnosed","anak berkebutuhan khusus"]'::jsonb,
  '["Komunikasi","Motorik","Perilaku","Akademik"]'::jsonb,
  '["non_diagnostic","act_early"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  'evidence_curator_v1',
  NOW(),
  NOW(),
  NOW(),
  NOW()
);

INSERT INTO knowledge_chunks (
  id, article_id, chunk_index, heading, chunk_text, keywords,
  condition_tags, focus_area_tags, safety_tags, review_status,
  reviewed_by, last_reviewed_at, token_count, created_at, updated_at
) VALUES
(
  'kb_cdc_monitoring_c0',
  'kb_cdc_monitoring',
  0,
  'Kapan skrining perkembangan formal',
  'American Academy of Pediatrics merekomendasikan skrining perkembangan menggunakan tools yang sudah divalidasi pada usia 9, 18, dan 30 bulan. Skrining autisme spesifik dilakukan pada usia 18 dan 24 bulan, atau kapan pun orang tua/provider menemukan kekhawatiran. Milestone checklist dari CDC membantu memetakan kemampuan anak di area bermain, belajar, berbicara, bertindak, dan bergerak — namun checklist bukan pengganti tes standar yang dilakukan tenaga kesehatan.',
  '["skrining","milestone","AAP","CDC","autisme","developmental monitoring"]'::jsonb,
  '["autisme","undiagnosed","anak berkebutuhan khusus"]'::jsonb,
  '["Komunikasi","Motorik","Perilaku","Akademik"]'::jsonb,
  '["non_diagnostic"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  NOW(),
  92,
  NOW(),
  NOW()
),
(
  'kb_cdc_monitoring_c1',
  'kb_cdc_monitoring',
  1,
  'Peran orang tua dalam monitoring',
  'Orang tua adalah pengamat paling rutin sehingga observasi harian yang konsisten punya nilai klinis yang tinggi. CDC mendorong orang tua menggunakan milestone tracker dan berbagi hasilnya kepada dokter anak. Jangan menunggu sampai beberapa milestone terlewat — diskusi dini memungkinkan dokter melakukan developmental screening lebih lanjut. Kalau ada perbedaan antara asesmen dokter dan rasa kekhawatiran orang tua, second opinion dan rujukan spesialis (developmental pediatrician, child neurologist, child psychologist) tetap menjadi hak orang tua.',
  '["peran orang tua","observasi harian","milestone tracker","second opinion"]'::jsonb,
  '["autisme","undiagnosed","anak berkebutuhan khusus"]'::jsonb,
  '["Komunikasi","Motorik","Perilaku","Akademik"]'::jsonb,
  '["non_diagnostic"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  NOW(),
  108,
  NOW(),
  NOW()
),
(
  'kb_cdc_monitoring_c2',
  'kb_cdc_monitoring',
  2,
  'Act Early: tidak perlu diagnosis untuk minta evaluasi',
  'Jika anak di bawah 3 tahun, orang tua bisa langsung menghubungi state early intervention system untuk evaluasi gratis — tanpa perlu rujukan dokter atau diagnosis formal. Untuk anak 3 tahun ke atas, sekolah publik lokal wajib memfasilitasi evaluasi untuk layanan preschool special education. Intervensi dini terbukti menghasilkan perubahan signifikan pada anak dengan developmental delay. Pesan utama CDC: jangan menunggu "kemungkinan catch up sendiri" jika kekhawatiran muncul, karena jendela intervensi dini bersifat sensitif waktu.',
  '["early intervention","IDEA","evaluasi gratis","act early"]'::jsonb,
  '["autisme","adhd","down_syndrome","disleksia","speech_delay","anak berkebutuhan khusus"]'::jsonb,
  '["Komunikasi","Motorik","Perilaku","Akademik"]'::jsonb,
  '["act_early","non_diagnostic"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  NOW(),
  102,
  NOW(),
  NOW()
);


-- =============================================================
-- Artikel 2: Visual Activity Schedules (Evidence-Based Practice untuk autisme)
-- Sumber: Knight et al. 2014, J Autism Dev Disord + Cihak 2011
-- =============================================================
INSERT INTO knowledge_articles (
  id, slug, title, summary, body, category, source_label, source_url, evidence_level,
  language, age_min_months, age_max_months, condition_tags, focus_area_tags, safety_tags,
  review_status, approved_by, reviewed_by, last_reviewed_at, published_at, created_at, updated_at
) VALUES (
  'kb_vas_autism',
  'visual-activity-schedule-autism',
  'Visual Activity Schedule: strategi evidence-based untuk anak autisme',
  'Systematic review 2014 (J Autism Dev Disord) menetapkan Visual Activity Schedule (VAS) sebagai Evidence-Based Practice untuk anak dengan ASD, terutama saat transisi aktivitas dan membangun kemandirian.',
  'Review sistematis Knight et al. (2014) dalam Journal of Autism and Developmental Disorders mengevaluasi 31 studi tentang Visual Activity Schedule (VAS) pada anak dengan Autism Spectrum Disorder. 16 studi lolos kriteria kualitas dan menunjukkan VAS sebagai Evidence-Based Practice (EBP) untuk meningkatkan kemandirian, transisi, dan generalisasi keterampilan dari preschool hingga dewasa, di berbagai setting (rumah, sekolah, komunitas). Cihak (2011) membandingkan static pictorial schedule vs video modeling: kedua format efektif, picture schedule lebih cepat memberi hasil untuk dua dari tiga partisipan. Implementasi rumah yang paling sederhana: 3-5 kartu gambar berurutan yang menunjukkan apa yang akan terjadi (mis. main → bereskan → camilan), dengan orang tua memindahkan kartu ke kolom "selesai" tiap langkah atau anak sendiri melakukannya. Efek utama: transisi lebih dapat diprediksi, penurunan protes saat perubahan aktivitas, peningkatan inisiasi mandiri.',
  'transition_support',
  'Journal of Autism and Developmental Disorders (2014) — Knight, Sartini, Spriggs',
  'https://link.springer.com/article/10.1007/s10803-014-2201-z',
  'research_review',
  'id-ID',
  24, 144,
  '["autisme","adhd","anak berkebutuhan khusus"]'::jsonb,
  '["Perilaku","Komunikasi","Akademik"]'::jsonb,
  '["evidence_based"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  'evidence_curator_v1',
  NOW(),
  NOW(),
  NOW(),
  NOW()
);

INSERT INTO knowledge_chunks (
  id, article_id, chunk_index, heading, chunk_text, keywords,
  condition_tags, focus_area_tags, safety_tags, review_status,
  reviewed_by, last_reviewed_at, token_count, created_at, updated_at
) VALUES
(
  'kb_vas_autism_c0',
  'kb_vas_autism',
  0,
  'Apa itu Visual Activity Schedule',
  'Visual Activity Schedule (VAS) adalah urutan kartu gambar, foto, atau video yang menunjukkan aktivitas yang akan dilakukan. Bisa dipakai untuk urutan harian, rutinitas pagi, atau satu sesi bermain. VAS mengurangi kebutuhan prompt verbal karena anak bisa "membaca" urutan sendiri secara visual. Systematic review Knight et al. (2014) mengkategorikan VAS sebagai Evidence-Based Practice untuk individu dengan ASD berdasarkan 16 studi berkualitas tinggi.',
  '["visual schedule","EBP","autisme","Knight 2014"]'::jsonb,
  '["autisme","adhd","anak berkebutuhan khusus"]'::jsonb,
  '["Perilaku","Komunikasi","Akademik"]'::jsonb,
  '["evidence_based"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  NOW(),
  98,
  NOW(),
  NOW()
),
(
  'kb_vas_autism_c1',
  'kb_vas_autism',
  1,
  'Cara membuat VAS di rumah',
  'Mulai dengan 3 kartu gambar yang merepresentasikan 3 aktivitas berurutan yang rutin dilakukan anak. Gambar bisa foto nyata objek/aktivitas atau ikon sederhana. Tempel di tempat yang selalu terlihat. Tunjukkan kartu saat aktivitas dimulai, dan pindahkan ke kolom "selesai" atau balik kartu saat aktivitas beres. Tambahkan peringatan 1-2 menit sebelum transisi dengan menunjuk kartu berikutnya. Konsistensi 7-10 hari lebih penting dari kompleksitas visual. Kalau anak responsif, naikkan bertahap ke 5 kartu.',
  '["kartu gambar","transisi","home implementation","konsistensi"]'::jsonb,
  '["autisme","adhd","anak berkebutuhan khusus"]'::jsonb,
  '["Perilaku","Komunikasi"]'::jsonb,
  '["evidence_based","practice"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  NOW(),
  112,
  NOW(),
  NOW()
),
(
  'kb_vas_autism_c2',
  'kb_vas_autism',
  2,
  'Yang perlu diamati',
  'Catat frekuensi transisi yang berhasil tanpa prompt verbal, bandingkan dengan minggu sebelumnya. Perhatikan apakah intensitas protes menurun. Amati transisi spesifik yang masih sulit (misal dari aktivitas favorit ke tidur) — mungkin butuh timer visual tambahan atau preferred-to-less-preferred reinforcement. Jangan menyimpulkan "VAS tidak cocok" dari 2-3 hari percobaan; evidence menunjukkan efek muncul konsisten setelah implementasi berulang. Hindari memaksa eye contact saat menunjuk kartu — fokus pada engagement, bukan kepatuhan.',
  '["observasi","tracking","transisi sulit","timer"]'::jsonb,
  '["autisme","adhd","anak berkebutuhan khusus"]'::jsonb,
  '["Perilaku","Komunikasi"]'::jsonb,
  '["non_diagnostic","observational_language"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  NOW(),
  105,
  NOW(),
  NOW()
);


-- =============================================================
-- Artikel 3: Parent Training in Behavior Management (AAP ADHD Clinical Practice Guideline)
-- =============================================================
INSERT INTO knowledge_articles (
  id, slug, title, summary, body, category, source_label, source_url, evidence_level,
  language, age_min_months, age_max_months, condition_tags, focus_area_tags, safety_tags,
  review_status, approved_by, reviewed_by, last_reviewed_at, published_at, created_at, updated_at
) VALUES (
  'kb_aap_adhd_ptbm',
  'aap-adhd-parent-training',
  'Parent Training in Behavior Management (PTBM): intervensi utama ADHD preschool',
  'Pedoman klinis AAP 2019 menetapkan PTBM sebagai intervensi primer untuk anak preschool dengan ADHD atau perilaku mirip ADHD, bahkan sebelum diagnosis formal. Evidence grade A.',
  'Pedoman klinis American Academy of Pediatrics 2019 (Wolraich et al., Pediatrics) menetapkan Parent Training in Behavior Management (PTBM) sebagai intervensi primer yang direkomendasikan untuk anak preschool (4-5 tahun) dengan ADHD, dan juga untuk anak dengan perilaku mirip ADHD yang diagnosisnya belum dipastikan. Grade A — strong recommendation untuk menerapkan PTBM sebelum memulai medikasi. PTBM mengajarkan orang tua: ekspektasi perkembangan sesuai usia, perilaku yang memperkuat hubungan parent-child, dan strategi manajemen perilaku spesifik untuk masalah yang muncul. Untuk anak usia sekolah (6 tahun ke atas), PTBM dikombinasikan dengan medikasi yang disetujui FDA dan intervensi kelas. Hasil meta-analisis: efek perilaku bertahan lebih lama dibandingkan efek stimulan (yang hilang saat obat dihentikan). Prinsip utama PTBM yang bisa diterapkan orang tua tanpa menunggu terapis: instruksi spesifik satu per satu, konfirmasi pemahaman, konsekuensi konsisten, reinforcement positif untuk perilaku yang diharapkan.',
  'parent_guidance',
  'American Academy of Pediatrics Clinical Practice Guideline (2019)',
  'https://publications.aap.org/pediatrics/article/144/4/e20192528/81590',
  'clinical_guideline',
  'id-ID',
  36, 144,
  '["adhd","undiagnosed","anak berkebutuhan khusus"]'::jsonb,
  '["Perilaku","Akademik"]'::jsonb,
  '["evidence_based","grade_a"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  'evidence_curator_v1',
  NOW(),
  NOW(),
  NOW(),
  NOW()
);

INSERT INTO knowledge_chunks (
  id, article_id, chunk_index, heading, chunk_text, keywords,
  condition_tags, focus_area_tags, safety_tags, review_status,
  reviewed_by, last_reviewed_at, token_count, created_at, updated_at
) VALUES
(
  'kb_aap_adhd_ptbm_c0',
  'kb_aap_adhd_ptbm',
  0,
  'PTBM sebagai lini pertama untuk preschool',
  'AAP 2019 menetapkan Parent Training in Behavior Management sebagai intervensi primer untuk anak 4-5 tahun dengan ADHD atau perilaku mirip ADHD. Rekomendasi ini punya grade A — bukti penelitian kuat. PTBM direkomendasikan sebelum medikasi karena efektif menangani berbagai masalah perilaku tanpa efek samping biologis, dan hasilnya memberi informasi diagnostik tambahan saat klinisi mengevaluasi. Orang tua tidak perlu menunggu diagnosis formal untuk mulai menerapkan prinsip PTBM.',
  '["PTBM","AAP 2019","grade A","preschool ADHD"]'::jsonb,
  '["adhd","undiagnosed"]'::jsonb,
  '["Perilaku","Akademik"]'::jsonb,
  '["evidence_based","grade_a"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  NOW(),
  99,
  NOW(),
  NOW()
),
(
  'kb_aap_adhd_ptbm_c1',
  'kb_aap_adhd_ptbm',
  1,
  'Prinsip PTBM yang bisa dimulai di rumah',
  'Inti PTBM: (1) beri instruksi satu per satu, pastikan anak menoleh sebelum bicara, (2) minta anak mengulang instruksi dengan kata sendiri untuk mengunci pemahaman, (3) konsekuensi konsisten — kalau aturan tidak boleh, tidak boleh hari ini dan besok, (4) reinforcement positif langsung saat perilaku diharapkan muncul (pujian spesifik: "Kamu langsung duduk saat dipanggil, keren"), (5) abaikan strategis untuk perilaku attention-seeking minor (bukan untuk perilaku berbahaya). Hindari hukuman fisik atau ancaman yang tidak akan dijalankan.',
  '["PTBM","behavior management","reinforcement","konsistensi"]'::jsonb,
  '["adhd","undiagnosed","anak berkebutuhan khusus"]'::jsonb,
  '["Perilaku","Akademik"]'::jsonb,
  '["evidence_based","practice"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  NOW(),
  125,
  NOW(),
  NOW()
),
(
  'kb_aap_adhd_ptbm_c2',
  'kb_aap_adhd_ptbm',
  2,
  'Sekolah dan medikasi untuk usia 6+',
  'Untuk anak usia 6 tahun ke atas dengan ADHD, AAP merekomendasikan kombinasi medikasi FDA-approved (stimulan) DAN PTBM/behavioral classroom intervention. Efek medikasi lebih cepat pada gejala inti, tetapi efek behavior therapy bertahan lebih lama dan menangani fungsi di luar gejala. Kerjasama dengan sekolah (IEP atau 504 plan) direkomendasikan. Orang tua perlu paham: keputusan medikasi adalah keputusan klinis yang harus dibuat bersama dokter, bukan dari mesin/aplikasi. Aplikasi ini tidak memberi saran obat atau dosis.',
  '["medikasi","IEP","504","behavioral classroom"]'::jsonb,
  '["adhd"]'::jsonb,
  '["Perilaku","Akademik"]'::jsonb,
  '["clinical_boundary","no_medication"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  NOW(),
  120,
  NOW(),
  NOW()
);


-- =============================================================
-- Artikel 4: NDSS Early Intervention — Down Syndrome
-- =============================================================
INSERT INTO knowledge_articles (
  id, slug, title, summary, body, category, source_label, source_url, evidence_level,
  language, age_min_months, age_max_months, condition_tags, focus_area_tags, safety_tags,
  review_status, approved_by, reviewed_by, last_reviewed_at, published_at, created_at, updated_at
) VALUES (
  'kb_ndss_early_intervention',
  'ndss-down-syndrome-early-intervention',
  'Early intervention untuk anak Down syndrome: fondasi 3 tahun pertama',
  'NDSS menekankan 3 tahun pertama sebagai jendela kritis. Physical therapy, speech-language therapy, dan occupational therapy adalah layanan paling umum. Orang tua adalah pengantar konsistensi di rumah.',
  'National Down Syndrome Society menekankan bahwa tiga tahun pertama kehidupan adalah periode paling kritis untuk perkembangan. Anak dengan Down syndrome biasanya mengalami delay di area gross motor, speech-language, dan beberapa cognitive/adaptive skills — tetapi delay ini bukan batas akhir; early intervention terbukti mengakselerasi perkembangan. Di US, layanan ini dimandatkan oleh Individuals with Disabilities Education Act (IDEA) dan disediakan gratis untuk anak yang qualified. Tiga layanan paling umum: physical therapy (mengatasi hipotonia dan gross motor), speech-language therapy (komunikasi dan early word), occupational therapy (keterampilan motorik halus dan aktivitas harian). Penelitian Hanson (1976) pada program parent-implemented intervention menunjukkan bahwa training prosedur yang dilakukan orang tua di rumah menghasilkan gains perkembangan yang signifikan. Responsive Teaching (Mahoney et al.) menemukan bahwa interaksi responsif selama rutinitas harian (makan, mandi, berpakaian) mempromosikan "pivotal behaviors" seperti joint attention, inisiasi, dan persistensi.',
  'parent_guidance',
  'National Down Syndrome Society + Responsive Teaching (Mahoney et al. 2006)',
  'https://ndss.org/resources/early-intervention',
  'advocacy_resource',
  'id-ID',
  0, 72,
  '["down_syndrome","anak berkebutuhan khusus"]'::jsonb,
  '["Komunikasi","Motorik","Perilaku"]'::jsonb,
  '["evidence_based"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  'evidence_curator_v1',
  NOW(),
  NOW(),
  NOW(),
  NOW()
);

INSERT INTO knowledge_chunks (
  id, article_id, chunk_index, heading, chunk_text, keywords,
  condition_tags, focus_area_tags, safety_tags, review_status,
  reviewed_by, last_reviewed_at, token_count, created_at, updated_at
) VALUES
(
  'kb_ndss_early_intervention_c0',
  'kb_ndss_early_intervention',
  0,
  'Tiga layanan paling umum',
  'Untuk bayi dengan Down syndrome, tiga layanan early intervention paling umum: (1) Physical therapy — mengatasi hipotonia dan mendukung pencapaian milestone gross motor seperti duduk, merangkak, berjalan, (2) Speech-language therapy — membangun komunikasi pre-verbal dan kata-kata awal, sering mencakup strategi oral-motor karena beberapa anak mengalami apraxia, (3) Occupational therapy — keterampilan motorik halus, aktivitas hidup sehari-hari, self-help skills. Di US, layanan ini gratis di bawah IDEA untuk anak yang qualified.',
  '["PT","SLP","OT","hipotonia","apraxia","IDEA"]'::jsonb,
  '["down_syndrome"]'::jsonb,
  '["Komunikasi","Motorik"]'::jsonb,
  '["evidence_based"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  NOW(),
  115,
  NOW(),
  NOW()
),
(
  'kb_ndss_early_intervention_c1',
  'kb_ndss_early_intervention',
  1,
  'Responsive Teaching di rumah',
  'Program Responsive Teaching (Mahoney et al.) menunjukkan bahwa interaksi responsif yang menempel pada rutinitas harian — bukan sesi terpisah — paling efektif mendukung perkembangan anak dengan Down syndrome. Prinsipnya: orang tua mengikuti arahan anak, menunggu inisiasi, merespons kontingen, memperluas komunikasi anak, dan mempertahankan engagement. Strategi ini diterapkan selama 2 jam per hari rata-rata tetapi dalam konteks aktivitas normal (makan, mandi, berpakaian, bermain) — bukan sebagai tugas tambahan. Penelitian menunjukkan parent stress justru menurun setelah intervensi.',
  '["responsive teaching","pivotal behavior","routine","engagement"]'::jsonb,
  '["down_syndrome","undiagnosed"]'::jsonb,
  '["Komunikasi","Perilaku"]'::jsonb,
  '["evidence_based","practice"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  NOW(),
  118,
  NOW(),
  NOW()
),
(
  'kb_ndss_early_intervention_c2',
  'kb_ndss_early_intervention',
  2,
  'Gross motor: bekerja dari bawah ke atas',
  'Anak dengan Down syndrome sering butuh lebih banyak waktu dan pengulangan untuk gross motor karena hipotonia (tonus otot rendah) dan joint laxity. Pendekatan terstruktur yang direkomendasikan physical therapist: latihan di tengkurap untuk memperkuat neck control, transisi tengkurap-ke-duduk, lalu duduk independen sebelum merangkak. Orang tua bisa mendukung di rumah dengan tummy time 15-30 menit dibagi beberapa sesi, support ringan saat anak belajar posisi baru, dan menghindari penggunaan baby walker (dikhawatirkan memperkuat pola abnormal). Konsultasikan progres ke physical therapist secara rutin.',
  '["gross motor","hipotonia","tummy time","physical therapy"]'::jsonb,
  '["down_syndrome"]'::jsonb,
  '["Motorik"]'::jsonb,
  '["evidence_based"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  NOW(),
  128,
  NOW(),
  NOW()
);


-- =============================================================
-- Artikel 5: ASHA — Speech & Language activities (speech delay)
-- =============================================================
INSERT INTO knowledge_articles (
  id, slug, title, summary, body, category, source_label, source_url, evidence_level,
  language, age_min_months, age_max_months, condition_tags, focus_area_tags, safety_tags,
  review_status, approved_by, reviewed_by, last_reviewed_at, published_at, created_at, updated_at
) VALUES (
  'kb_asha_speech_activities',
  'asha-speech-language-activities',
  'Aktivitas mendorong bicara dan bahasa (panduan ASHA per usia)',
  'American Speech-Language-Hearing Association memberikan panduan aktivitas bicara dan bahasa berbasis usia 0-2, 2-4, dan 4-6 tahun. Kunci: sering, singkat, menempel pada rutinitas.',
  'American Speech-Language-Hearing Association (ASHA) mengeluarkan panduan aktivitas stimulasi bicara dan bahasa untuk anak usia 0-6 tahun. Prinsip utama: lebih baik sering dan singkat daripada sesi panjang, aktivitas menempel pada rutinitas harian (makan, mandi, berpakaian), beri jeda setelah bicara agar anak sempat merespons, tiru bunyi dan respons anak untuk membangun percakapan dua arah, gunakan gesture dan pointing untuk memperkaya konteks. Untuk 2-4 tahun: ekspansi "mau susu" jadi "mau susu apel? Ini susu apel", model bicara yang jelas, tanya pertanyaan yes-no ringan. Untuk 4-6 tahun: perintah 2-3 langkah, deskripsi sensoris (dingin, manis, lembut), sequencing dengan kata "pertama, lalu, terakhir", memainkan peran. HealthyChildren.org (AAP) menegaskan bahwa delay yang sederhana bisa membaik dengan stimulasi rutin, tetapi jika kekhawatiran menetap, rujukan ke speech-language pathologist dan tes pendengaran disarankan — orang tua tidak perlu menunggu "catch up sendiri".',
  'communication_support',
  'American Speech-Language-Hearing Association + AAP HealthyChildren',
  'https://www.asha.org/public/speech/development/Activities-to-Encourage-Speech-and-Language-Development',
  'clinical_guideline',
  'id-ID',
  0, 72,
  '["speech_delay","autisme","down_syndrome","undiagnosed","anak berkebutuhan khusus"]'::jsonb,
  '["Komunikasi"]'::jsonb,
  '["evidence_based"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  'evidence_curator_v1',
  NOW(),
  NOW(),
  NOW(),
  NOW()
);

INSERT INTO knowledge_chunks (
  id, article_id, chunk_index, heading, chunk_text, keywords,
  condition_tags, focus_area_tags, safety_tags, review_status,
  reviewed_by, last_reviewed_at, token_count, created_at, updated_at
) VALUES
(
  'kb_asha_speech_activities_c0',
  'kb_asha_speech_activities',
  0,
  'Usia 0-2: fondasi komunikasi pra-verbal',
  'ASHA menyarankan: tirukan bunyi anak ("ma", "da", "ba") dan dorong anak menirukan balik, tatap mata saat anak bersuara untuk membangun percakapan, bicara saat rutinitas mandi/berpakaian dengan kalimat pendek dan jelas, gunakan gesture dan pointing (jauh lebih penting dari "koreksi pelafalan"), baca buku bergambar sambil menunjuk objek dan bertanya "apa ini?". Fokus bukan pada kuantitas kata anak, tapi pada turn-taking dan joint attention.',
  '["pra-verbal","turn-taking","joint attention","imitasi"]'::jsonb,
  '["speech_delay","down_syndrome","autisme","undiagnosed"]'::jsonb,
  '["Komunikasi"]'::jsonb,
  '["evidence_based"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  NOW(),
  108,
  NOW(),
  NOW()
),
(
  'kb_asha_speech_activities_c1',
  'kb_asha_speech_activities',
  1,
  'Usia 2-4: ekspansi dan modeling',
  'ASHA menekankan ekspansi: saat anak bilang "Mama", respon "Ini Mama. Mama sayang kamu". Ulangi yang anak ucapkan untuk menunjukkan pemahaman, lalu tambahkan 1-2 kata. Gunakan pilihan biner ("mau jus apel atau jus jeruk?") — ini lebih mengundang respons daripada "mau minum apa?". Namai bagian tubuh dan fungsinya. Baca buku dan minta anak menunjuk objek. Beri jeda 3-5 detik setelah pertanyaan — banyak anak butuh waktu processing lebih panjang.',
  '["ekspansi","modeling","dua pilihan","jeda"]'::jsonb,
  '["speech_delay","down_syndrome","undiagnosed"]'::jsonb,
  '["Komunikasi"]'::jsonb,
  '["evidence_based"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  NOW(),
  118,
  NOW(),
  NOW()
),
(
  'kb_asha_speech_activities_c2',
  'kb_asha_speech_activities',
  2,
  'Usia 4-6: kompleksitas dan naratif',
  'Pada 4-6 tahun, ASHA merekomendasikan: perintah 2-3 langkah ("ambil buku, tutup pintu, duduk di sofa"), deskripsi sensoris (dingin, manis, kasar), sequencing cerita (apa yang terjadi pertama, kemudian, terakhir), games seperti Simon Says untuk mendengarkan dan bergerak, scavenger hunt dengan clue verbal, bermain peran. Perhatikan anak dan biarkan mereka yang mulai bercerita — jangan selalu mengoreksi. Kalau artikulasi sulit dipahami oleh orang di luar keluarga, konsultasi speech-language pathologist disarankan.',
  '["perintah bertingkat","sequencing","deskripsi sensoris","narrative"]'::jsonb,
  '["speech_delay","undiagnosed","disleksia"]'::jsonb,
  '["Komunikasi","Akademik"]'::jsonb,
  '["evidence_based"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  NOW(),
  118,
  NOW(),
  NOW()
),
(
  'kb_asha_speech_activities_c3',
  'kb_asha_speech_activities',
  3,
  'Kapan cari bantuan profesional',
  'HealthyChildren.org (AAP) memberi sinyal konsultasi speech-language pathologist: anak 2 tahun belum mengucapkan kata tunggal, anak 3 tahun sulit merangkai 2-kata, regresi bahasa yang pernah dikuasai, atau orang di luar keluarga sulit memahami anak 3 tahun ke atas. Minta tes pendengaran dulu — banyak delay bahasa disebabkan oleh kehilangan pendengaran ringan akibat infeksi telinga berulang. Second opinion tetap hak orang tua kalau dokter bilang "anak akan catch up sendiri" tetapi intuisi bilang lain.',
  '["red flag","konsultasi","tes pendengaran","SLP"]'::jsonb,
  '["speech_delay","autisme","down_syndrome"]'::jsonb,
  '["Komunikasi"]'::jsonb,
  '["act_early","clinical_boundary"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  NOW(),
  110,
  NOW(),
  NOW()
);


-- =============================================================
-- Artikel 6: International Dyslexia Association — Early signs reading difficulty
-- =============================================================
INSERT INTO knowledge_articles (
  id, slug, title, summary, body, category, source_label, source_url, evidence_level,
  language, age_min_months, age_max_months, condition_tags, focus_area_tags, safety_tags,
  review_status, approved_by, reviewed_by, last_reviewed_at, published_at, created_at, updated_at
) VALUES (
  'kb_ida_dyslexia_early_signs',
  'ida-dyslexia-early-signs',
  'Tanda awal kesulitan membaca (disleksia): apa yang perlu diamati orang tua',
  'International Dyslexia Association menjelaskan tanda-tanda disleksia yang bisa diamati sejak preschool. Deteksi dini memungkinkan intervensi berbasis phonics yang efektif.',
  'International Dyslexia Association (IDA) memberi panduan untuk orang tua tentang tanda awal kesulitan membaca yang bisa dilihat sejak preschool hingga grade 1. Disleksia adalah learning disability berbasis bahasa yang paling umum menyebabkan kesulitan membaca, mengeja, dan menulis — bukan disebabkan intelegensi rendah atau kurang usaha. Sekitar 13-14% populasi sekolah punya learning disability; 85% di antaranya primer di reading/language processing. Disleksia genetik — orang tua dengan disleksia berpeluang besar punya anak dengan profil serupa. Tanda preschool: terlambat bicara, sulit melafalkan kata, lambat menambah kosa kata, sulit mengingat nama objek, sulit rhyming, sulit belajar alfabet/angka/warna, sulit multi-step directions. Tanda kindergarten-grade 1: sulit membaca satu kata, bingung kata kecil (at/to, said/and), kesalahan eja konsisten, grip pensil yang canggung, menghindari membaca. Intervensi paling efektif: multisensory structured language approach (Orton-Gillingham dan turunannya) — eksplisit, sistematik, melibatkan pendengaran-penglihatan-sentuhan bersamaan. Semakin dini intervensi, semakin baik hasilnya.',
  'early_warning_guidance',
  'International Dyslexia Association + LDOnline',
  'https://dyslexiaida.org/dyslexia-basics/',
  'advocacy_resource',
  'id-ID',
  36, 144,
  '["disleksia","speech_delay","undiagnosed","anak berkebutuhan khusus"]'::jsonb,
  '["Komunikasi","Akademik"]'::jsonb,
  '["evidence_based","act_early"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  'evidence_curator_v1',
  NOW(),
  NOW(),
  NOW(),
  NOW()
);

INSERT INTO knowledge_chunks (
  id, article_id, chunk_index, heading, chunk_text, keywords,
  condition_tags, focus_area_tags, safety_tags, review_status,
  reviewed_by, last_reviewed_at, token_count, created_at, updated_at
) VALUES
(
  'kb_ida_dyslexia_early_signs_c0',
  'kb_ida_dyslexia_early_signs',
  0,
  'Tanda preschool (3-5 tahun)',
  'Menurut IDA, pola yang perlu diamati pada preschool: anak terlambat bicara dibanding teman sebaya, sulit melafalkan kata, lambat menambah kosa kata baru, sulit mengingat nama objek sehari-hari, kesulitan rhyming ("mobil-merah-...apa yang rhyme?"), sulit belajar alfabet/angka/warna/hari, sulit menulis nama sendiri, kesulitan memecah bunyi kata atau mencampur bunyi untuk membentuk kata. Tidak semua tanda muncul sekaligus; anak disleksia biasanya menunjukkan beberapa tanda tetapi tidak semua. Riwayat keluarga disleksia meningkatkan risiko signifikan.',
  '["preschool","rhyming","alfabet","riwayat keluarga"]'::jsonb,
  '["disleksia","speech_delay","undiagnosed"]'::jsonb,
  '["Komunikasi","Akademik"]'::jsonb,
  '["evidence_based","act_early"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  NOW(),
  122,
  NOW(),
  NOW()
),
(
  'kb_ida_dyslexia_early_signs_c1',
  'kb_ida_dyslexia_early_signs',
  1,
  'Tanda kindergarten dan grade 1',
  'Pada kindergarten-grade 1, tanda yang perlu diamati: kesulitan membaca kata tunggal, lambat belajar hubungan huruf-bunyi, membingungkan kata kecil yang mirip (at/to, said/and, does/goes), kesalahan eja yang konsisten, sulit mengingat fakta, sangat mengandalkan hafalan tanpa pemahaman, impulsif dan mudah celaka, kesulitan planning, grip pensil canggung. Indikator tambahan: anak resist membaca keras, skip kata saat membaca, tidak mengoreksi kesalahan, selalu tebak kata alih-alih sounding out. Jangan panik — banyak anak butuh waktu berbeda belajar membaca. Tetapi kalau pola menetap hingga akhir grade 1, evaluasi formal direkomendasikan.',
  '["kindergarten","grade 1","eja","reading errors"]'::jsonb,
  '["disleksia","undiagnosed"]'::jsonb,
  '["Akademik"]'::jsonb,
  '["evidence_based","act_early"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  NOW(),
  135,
  NOW(),
  NOW()
),
(
  'kb_ida_dyslexia_early_signs_c2',
  'kb_ida_dyslexia_early_signs',
  2,
  'Phonological awareness: latihan rumah',
  'Disleksia berakar pada kesulitan phonological awareness — kemampuan memanipulasi bunyi dalam kata. Latihan rumah berbasis riset: (1) rhyming games — "kata apa yang rhyme dengan bola?", (2) segmentation — "berapa bunyi di kata m-a-m-a?" (pelan-pelan pisahkan), (3) blending — "b-u-k-u, apa katanya?", (4) initial sound recognition — "apa bunyi awal kata apel?". Lakukan 5-10 menit per hari konsisten, bukan sesi panjang sekali-kali. Ini membangun fondasi yang dibutuhkan anak saat belajar phonics formal di sekolah.',
  '["phonological awareness","rhyming","blending","segmentation"]'::jsonb,
  '["disleksia","speech_delay","undiagnosed"]'::jsonb,
  '["Komunikasi","Akademik"]'::jsonb,
  '["evidence_based","practice"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  NOW(),
  120,
  NOW(),
  NOW()
),
(
  'kb_ida_dyslexia_early_signs_c3',
  'kb_ida_dyslexia_early_signs',
  3,
  'Multisensory structured language approach',
  'Intervensi paling didukung riset untuk disleksia adalah multisensory structured language approach (Orton-Gillingham dan turunannya seperti Wilson, Barton). Karakteristik: eksplisit (aturan diajarkan langsung, bukan diharapkan muncul dari eksposur), sistematik (urutan kompleksitas meningkat bertahap), multisensori (pendengaran-penglihatan-sentuhan-motorik bersamaan — misal anak menulis huruf di pasir sambil mengucapkan bunyinya). Intervensi ini butuh tutor/teacher yang terlatih; orang tua sebaiknya tidak mengimprovisasi metode phonics tanpa training karena metodologi yang salah (mis. whole language tanpa phonics eksplisit) bisa memperburuk.',
  '["Orton-Gillingham","multisensory","phonics","intervensi"]'::jsonb,
  '["disleksia"]'::jsonb,
  '["Akademik"]'::jsonb,
  '["evidence_based","clinical_boundary"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  NOW(),
  125,
  NOW(),
  NOW()
);


-- =============================================================
-- Artikel 7: Consultation preparation — dokumentasi yang berguna untuk dokter/terapis
-- =============================================================
INSERT INTO knowledge_articles (
  id, slug, title, summary, body, category, source_label, source_url, evidence_level,
  language, age_min_months, age_max_months, condition_tags, focus_area_tags, safety_tags,
  review_status, approved_by, reviewed_by, last_reviewed_at, published_at, created_at, updated_at
) VALUES (
  'kb_consult_prep',
  'consultation-preparation-documentation',
  'Menyiapkan konsultasi: dokumentasi yang membuat dokter bisa bantu',
  'Ringkasan 2-4 minggu observasi yang berisi konteks, frekuensi, pemicu, dan strategi yang membantu menghasilkan konsultasi yang lebih produktif daripada deskripsi anekdotal.',
  'Panduan preparation konsultasi anak berkebutuhan khusus (dirangkum dari AAP HealthyChildren, ASHA, dan praktik umum developmental pediatrician): sebelum bertemu dokter atau terapis, siapkan ringkasan observasi 2-4 minggu terakhir dengan struktur ABC: Antecedent (apa yang terjadi sebelum kejadian, konteks), Behavior (apa yang dilakukan anak, deskripsi spesifik tanpa interpretasi), Consequence (respons lingkungan, strategi yang dicoba, apa yang membantu/tidak). Frekuensi (berapa kali per hari/minggu) dan durasi (berapa menit rata-rata) lebih berguna dari kata "sering" atau "lama". Sertakan video pendek kalau ada kejadian yang sulit dijelaskan dengan kata. Catat perubahan kecil yang konsisten — regression, peningkatan, stagnation. Siapkan 2-3 pertanyaan spesifik di atas kertas; waktu konsultasi terbatas. Bawa riwayat medis relevan, hasil screening/asesmen sebelumnya, dan daftar obat/suplemen kalau ada.',
  'consultation_preparation',
  'AAP HealthyChildren + ASHA practice guidance',
  'https://www.healthychildren.org/english/ages-stages/toddler/pages/language-delay.aspx',
  'clinical_guideline',
  'id-ID',
  12, 144,
  '["autisme","adhd","down_syndrome","disleksia","speech_delay","undiagnosed","anak berkebutuhan khusus"]'::jsonb,
  '["Komunikasi","Motorik","Perilaku","Akademik"]'::jsonb,
  '["evidence_based"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  'evidence_curator_v1',
  NOW(),
  NOW(),
  NOW(),
  NOW()
);

INSERT INTO knowledge_chunks (
  id, article_id, chunk_index, heading, chunk_text, keywords,
  condition_tags, focus_area_tags, safety_tags, review_status,
  reviewed_by, last_reviewed_at, token_count, created_at, updated_at
) VALUES
(
  'kb_consult_prep_c0',
  'kb_consult_prep',
  0,
  'Struktur ABC untuk observasi',
  'Gunakan struktur Antecedent-Behavior-Consequence saat mencatat: Antecedent = apa yang terjadi sebelum kejadian (setting, aktivitas sebelumnya, siapa yang hadir), Behavior = deskripsi spesifik perilaku anak tanpa interpretasi (bukan "tantrum", tetapi "menangis keras 8 menit, berguling di lantai, menolak disentuh"), Consequence = apa yang orang tua/lingkungan lakukan dan apakah membantu. Pola yang terlihat dari ABC jauh lebih berguna untuk dokter/terapis daripada deskripsi naratif panjang. Konsistensi pencatatan selama 2-4 minggu mengungkap pola yang tidak terlihat dari satu kejadian.',
  '["ABC","antecedent","behavior","consequence","observasi"]'::jsonb,
  '["autisme","adhd","anak berkebutuhan khusus"]'::jsonb,
  '["Perilaku","Komunikasi"]'::jsonb,
  '["evidence_based","practice"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  NOW(),
  128,
  NOW(),
  NOW()
),
(
  'kb_consult_prep_c1',
  'kb_consult_prep',
  1,
  'Frekuensi, durasi, intensitas',
  'Ganti kata-kata subjektif ("sering", "lama", "parah") dengan data: frekuensi ("3-5 kali per hari", "2 kali seminggu"), durasi ("15-20 menit per kejadian", "sejak jam 10 sampai 11"), intensitas (skala 1-10 atau perbandingan dengan kejadian lain). Catat dengan tanggal dan waktu yang konkret. Ini memungkinkan dokter mengukur progress antar kunjungan dan memfilter penyebab yang mungkin (mis. kalau masalah selalu muncul jam 14-16 di hari sekolah, bisa jadi ada trigger lingkungan yang spesifik). Tools pencatatan bisa sesederhana notebook atau app.',
  '["frekuensi","durasi","intensitas","data pencatatan"]'::jsonb,
  '["autisme","adhd","anak berkebutuhan khusus"]'::jsonb,
  '["Perilaku","Komunikasi","Motorik","Akademik"]'::jsonb,
  '["evidence_based","practice"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  NOW(),
  125,
  NOW(),
  NOW()
),
(
  'kb_consult_prep_c2',
  'kb_consult_prep',
  2,
  'Pertanyaan prioritas yang produktif',
  'Waktu konsultasi sering 15-30 menit. Siapkan 2-3 pertanyaan prioritas tertulis, bukan 10 pertanyaan yang dibahas separuh-separuh. Format yang berguna: (1) "Saya observasi X selama 3 minggu. Bagaimana interpretasi ini?", (2) "Strategi A sudah saya coba, hasilnya B. Apa langkah berikutnya?", (3) "Kapan saya perlu kembali atau ke spesialis lain?". Hindari pertanyaan yang meminta diagnosis via chat atau app — diagnosis butuh asesmen langsung. Hindari mencari validasi keputusan obat dari non-dokter. Bawa hasil screening/laporan sebelumnya dalam format digital atau fotokopi.',
  '["pertanyaan","prioritas","konsultasi produktif"]'::jsonb,
  '["autisme","adhd","down_syndrome","disleksia","speech_delay","anak berkebutuhan khusus"]'::jsonb,
  '["Komunikasi","Perilaku","Motorik","Akademik"]'::jsonb,
  '["evidence_based","clinical_boundary"]'::jsonb,
  'approved',
  'evidence_curator_v1',
  NOW(),
  118,
  NOW(),
  NOW()
);
