# Website Context: Tumbuh

## Overview

Tumbuh adalah website pendamping untuk orang tua anak berkebutuhan khusus yang ingin mencatat perkembangan harian, melihat pola, menyusun roadmap perkembangan, dan datang ke sesi konsultasi dengan konteks yang lebih rapi. Produk ini tidak diposisikan sebagai alat diagnosis, melainkan sebagai lapisan pendamping yang membantu orang tua menerjemahkan momen kecil sehari-hari menjadi pemahaman yang lebih terstruktur.

Pengguna utama saat ini adalah `guardian` atau orang tua/pengasuh. Objek utama yang dikelola di dalam sistem adalah `child`, lengkap dengan profil dasar, area fokus perkembangan, catatan observasi, insight, roadmap, dan rekomendasi tindak lanjut. Dari sudut pandang produk, Tumbuh mencoba menjembatani tiga kebutuhan yang sering terpisah:

- mencatat kejadian sehari-hari tanpa format yang melelahkan,
- memahami pola perkembangan tanpa harus menafsirkan semuanya sendiri,
- dan membawa konteks yang lebih siap ke percakapan dengan terapis, psikolog, atau sekolah.

Nilai utama produk saat ini ada pada kombinasi antara rasa aman secara emosional, struktur yang cukup ringan untuk dipakai rutin, dan personalisasi berbasis data child yang sudah masuk ke sistem.

## Product Narrative

Narasi produk di landing page sangat jelas: Tumbuh hadir sebagai ruang aman, hangat, dan tidak menghakimi. Copy tidak menggunakan tone klinis atau terlalu teknis. Fokus komunikasi lebih dekat ke keseharian orang tua, kebingungan setelah terapi, catatan yang tercecer, dan keinginan untuk memahami progres anak tanpa tekanan untuk selalu sempurna.

Beberapa karakter narasi yang konsisten:

- parent-centered, bukan system-centered,
- lembut dan suportif, bukan alarmistik,
- human dan domestik, bukan terasa seperti software rumah sakit,
- menenangkan, bukan menjanjikan kepastian berlebihan,
- dan selalu menjaga framing bahwa AI insight adalah bahan diskusi, bukan diagnosis.

Landing page juga membentuk positioning produk dengan kuat:

- Tumbuh membantu orang tua mencatat,
- Tumbuh membantu merangkai pola,
- Tumbuh membantu menyiapkan percakapan dengan profesional,
- tetapi Tumbuh tidak menggantikan profesional.

Ini penting untuk semua keputusan desain dan konten berikutnya. Sistem visual, struktur informasi, dan microcopy sebaiknya terus mempertahankan rasa `mendampingi`, bukan `menilai`.

## Experience Map

### 1. Landing Page

Landing page memperkenalkan Tumbuh lewat narasi emosional dan problem framing yang dekat dengan realitas keluarga. Struktur saat ini bergerak dari headline empatik, cara kerja empat langkah, value propositions, safety framing, lalu CTA untuk mulai onboarding atau melihat backend spec.

Yang dibangun di tahap ini:

- kepercayaan,
- rasa relevansi,
- gambaran manfaat praktis,
- dan batas peran produk.

### 2. Onboarding

Onboarding adalah jembatan dari janji landing page ke pengalaman produk yang lebih personal. Flow terdiri dari empat langkah:

- identitas dasar child,
- kondisi/diagnosis,
- focus areas,
- dan rutinitas awal plus kebutuhan bantuan utama.

Dari perspektif user, onboarding berfungsi untuk:

- memberi konteks awal agar sistem tidak terasa generik,
- menetapkan fokus perkembangan,
- dan memicu seed roadmap pertama.

Di tahap ini sudah ada fondasi penting untuk personalisasi: nama child, birth date, condition, focus areas, routine, dan support need.

### 3. Dashboard

Dashboard adalah pusat orientasi utama setelah onboarding. Halaman ini merangkum:

- metrik mingguan,
- grafik progress,
- insight terbaru,
- rekomendasi aktivitas,
- dan preview roadmap.

Secara UX, dashboard memegang dua peran sekaligus:

- memberi rasa "saya tahu kondisi minggu ini",
- dan memberi arah tindakan berikutnya tanpa memaksa user membaca terlalu banyak.

Jika belum ada progress bermakna, dashboard beralih ke mode placeholder/instructional. Ini menunjukkan bahwa produk dirancang untuk tetap terasa berguna bahkan sebelum data lengkap tersedia.

### 4. Progress / Catatan

Progress adalah tempat user menambahkan observasi harian. Secara produk, ini adalah sumber data paling penting karena menjadi bahan untuk insight, dashboard metrics, roadmap personalization, dan rekomendasi konsultasi.

Secara konseptual, halaman ini adalah "input layer" utama. Nilai produk lain banyak bergantung pada seberapa mudah dan ringan flow ini dipakai secara rutin.

### 5. Roadmap

Roadmap menampilkan target perkembangan child dan statusnya, termasuk item yang sedang aktif, perlu perhatian, atau sudah tercapai. Halaman ini bukan sekadar checklist; ia mencoba menjadi terjemahan yang lebih operasional dari data progress dan insight.

Dari sudut pandang user, roadmap membantu menjawab:

- apa fokus perkembangan saat ini,
- target mana yang paling penting,
- mana yang sudah konsisten,
- dan kenapa prioritas itu berubah.

Roadmap juga menjadi tempat sistem menunjukkan personalisasi secara paling nyata.

### 6. Education

Area edukasi menggabungkan dua fungsi:

- artikel knowledge base yang bisa dicari,
- dan AI assistant untuk menjawab pertanyaan orang tua.

Artikel bisa diranking menurut relevansi terhadap condition dan focus areas child. Ini membuat pengalaman edukasi tidak murni katalog statis, tetapi mulai bergerak ke knowledge retrieval yang terasa kontekstual.

Assistant di area ini menempati posisi sebagai teman diskusi yang memberi jawaban berbasis konteks child dan knowledge chunks, tetap dengan pagar bahwa jawabannya bukan diagnosis.

### 7. Consultation

Area konsultasi menyusun rekomendasi profesional atau jenis layanan berdasarkan focus areas, roadmap needs attention, dan insight terbaru. Halaman ini membantu orang tua bergerak dari pemahaman internal ke tindak lanjut eksternal.

Secara produk, consultation berfungsi sebagai "action bridge":

- dari insight ke persiapan konsultasi,
- dari roadmap ke kebutuhan profesional,
- dari observasi mentah ke bahan diskusi yang lebih konkret.

### 8. Settings

Settings menegaskan positioning bahwa data child adalah data sensitif dan pengguna memegang kontrol. Fungsi utama saat ini:

- melihat info akun guardian,
- sign out,
- ekspor data child ke JSON,
- dan menghapus seluruh progres child.

Ini adalah area trust dan governance dari sisi user-facing product.

### 9. Login

Login mengaktifkan mode akun permanen melalui Supabase Auth. Tanpa auth, user masih bisa berada di mode tamu pada beberapa area, tetapi penyimpanan permanen dan pengalaman penuh bergantung pada konfigurasi auth.

### 10. Backend / Admin

Ada area backend/admin terpisah yang berfungsi untuk operasional internal. Halaman ini bukan untuk end-user, tetapi penting dalam konteks website secara keseluruhan karena menjadi fondasi kualitas produk. Area ini mencakup:

- overview operasional,
- review knowledge article dan chunk,
- AI quality,
- dan child snapshot / health context.

Keberadaan backend/admin menunjukkan bahwa Tumbuh bukan sekadar frontend demo, tetapi sedang diarahkan ke sistem yang punya governance untuk knowledge dan kualitas jawaban AI.

## System Capabilities

### Data Model Utama

Sistem berputar di sekitar entitas berikut:

- `guardian` sebagai pemilik akun,
- `child` sebagai subjek utama,
- `progressEntry` sebagai catatan observasi,
- `roadmapItem` sebagai target perkembangan,
- `insight` sebagai ringkasan/pola yang persisten,
- `provider` sebagai basis rekomendasi konsultasi,
- `knowledgeArticle` dan `knowledgeChunk` sebagai sumber edukasi,
- `assistantConversation`, `assistantResponseLog`, dan `assistantEvaluation` untuk lapisan AI assistant,
- `auditLog`, `consent`, `mediaAsset`, dan `processingJob` sebagai fondasi kontrol dan operasional data.

### Insight dan Dashboard Intelligence

Dashboard dibangun dari data child yang sudah tersimpan. Sistem menghitung:

- jumlah catatan minggu ini,
- perbandingan dengan minggu sebelumnya,
- jumlah target roadmap aktif/tercapai,
- alert dari insight,
- dan rekomendasi aktivitas yang diturunkan dari recommendations pada latest insight.

Jika belum ada progress bermakna, backend sengaja mengembalikan placeholder mode agar UI tidak menyajikan angka palsu.

### Roadmap Personalization

Roadmap awal masih bisa berasal dari seed template, tetapi repo ini sudah bergerak ke personalisasi yang lebih child-specific. Layer personalisasi roadmap saat ini mencakup:

- rule-based reprioritization,
- pembacaan dominant area dari progress,
- evidence dari observasi terbaru,
- pengaruh latest insight terhadap status dan prioritas item,
- dan dukungan perubahan yang dapat diaudit.

Ada juga fondasi untuk layer LLM suggestion yang divalidasi backend sebelum perubahan roadmap diterapkan. Artinya, keputusan akhir tetap dikendalikan sistem, bukan model mentah.

### Education dan Assistant

Artikel edukasi diambil dari endpoint artikel dan bisa difilter via query. Assistant menggunakan kombinasi:

- intent classification,
- child context,
- knowledge retrieval,
- policy retrieval,
- logging,
- dan evaluation.

Ini menunjukkan bahwa assistant bukan chatbot generik. Ia sudah diarahkan ke arsitektur RAG dengan guardrails dan penilaian kualitas.

### Consultation Recommendations

Rekomendasi konsultasi dibangun dari focus areas child, jumlah roadmap items yang butuh perhatian, dan keberadaan progress bermakna. Saat belum ada data, sistem memilih placeholder state. Saat data sudah cukup, sistem memberi:

- tipe profesional yang relevan,
- alasan rekomendasi,
- dan daftar hal yang perlu disiapkan sebelum konsultasi.

### Trust, Control, and Governance

Aspek trust di sistem tidak hanya muncul di copy, tetapi juga di kapabilitas:

- consent scope di schema,
- export data child,
- delete all progress,
- auth via Supabase,
- audit log,
- dan admin review surfaces.

Ini penting karena produk menyentuh data sensitif anak dan keluarga.

## Current Content Structure

### Konten Inti yang Sudah Kuat

Struktur konten website saat ini paling kuat pada tiga tema:

- empati terhadap pengalaman orang tua,
- penerjemahan cerita harian menjadi pola,
- dan persiapan yang lebih baik untuk interaksi dengan profesional.

Headline, body copy, dan CTA di landing page terus mengarah ke pola ini. Ada benang merah yang konsisten dari:

- "catat momen kecil",
- "lihat pola",
- "susun roadmap",
- "siapkan konsultasi".

### Pola Copy

Gaya copy saat ini cenderung:

- singkat,
- suportif,
- mudah dipahami,
- tidak terlalu jargon-heavy,
- dan sering menggunakan bahasa ajakan yang lembut.

Contoh pola yang dominan:

- reassurance: pengguna tidak harus sendirian,
- permission-giving: catatan boleh singkat dan tidak harus rapi,
- translation: sistem membantu merangkai makna,
- trust framing: AI untuk referensi, bukan diagnosis.

### CTA dan Intent Konten

CTA utama yang muncul saat ini:

- mulai onboarding atau membuat roadmap,
- menjelajahi dashboard,
- mencatat perkembangan,
- membuka roadmap,
- membaca artikel,
- bertanya ke assistant,
- menyiapkan catatan konsultasi,
- mengunduh data,
- dan membuka backend spec.

Secara intent, ini menunjukkan bahwa website punya tiga lapisan konten:

- acquisition dan trust-building di landing page,
- workflow guidance di workspace utama,
- dan operational knowledge di backend/admin.

### Terminologi Domain

Istilah yang paling penting dan sudah konsisten di sistem:

- child,
- guardian,
- progress,
- roadmap,
- insight,
- knowledge,
- consultation.

Namun secara user-facing copy, istilah Indonesia yang dipakai sering lebih natural, misalnya:

- catatan,
- target,
- perkembangan,
- konsultasi,
- area fokus,
- aktivitas,
- dan roadmap.

Ini berarti dokumen desain dan konten ke depan perlu sadar bahwa ada dua lapisan istilah:

- istilah domain internal untuk engineering/data,
- istilah user-facing yang lebih human untuk antarmuka.

### Area Konten yang Masih Campur

Beberapa area masih menyatukan terlalu banyak intent dalam satu permukaan:

- Education menggabungkan library artikel dan AI assistant.
- Consultation mencampur rekomendasi profesional dengan motivasi untuk kembali ke progress logging.
- Backend memakai istilah operasional yang kuat, tetapi relasinya ke nilai produk utama belum selalu eksplisit untuk pembaca baru.
- Header landing masih memakai CTA `Get Started` berbahasa Inggris, sementara mayoritas copy lain berbahasa Indonesia.

Ini bukan bug besar, tetapi penting untuk perapihan struktur konten berikutnya.

## Design System Implications

### Arah Sistem Visual yang Sudah Terbentuk

Current state menunjukkan arah visual yang relatif konsisten:

- panel/card sebagai primitive utama,
- workspace header sebagai pola pembuka halaman internal,
- metric cards untuk summary cepat,
- roadmap strip dan timeline untuk pola progress,
- tone warna yang lembut dan aman,
- dan penggunaan ikon untuk membantu orientasi, bukan dekorasi berlebihan.

Brand direction yang tertulis di repo juga menguatkan tema:

- calm,
- hopeful,
- gentle,
- grounded in daily family life,
- dengan dominasi hijau lembut, mint, off-white, dan rounded surfaces.

### Komponen dan Pattern yang Layak Jadi Fondasi

Beberapa pattern tampak siap dijadikan fondasi design system:

- `Panel` untuk semua blok konten utama,
- `WorkspaceHeader` untuk title + body + action,
- button hierarchy seperti primary, secondary, tertiary, text, danger,
- cards untuk feature, metric, article, consult, dan timeline item,
- state patterns untuk loading skeleton, empty, placeholder, success, dan error.

Ini memberi sinyal bahwa design system ke depan sebaiknya mulai dari primitive yang sudah nyata dipakai lintas halaman, bukan mulai dari visual kit yang sepenuhnya abstrak.

### Gap Konsistensi yang Perlu Diperhatikan

Ada beberapa gap yang layak dicatat sebelum design system diperluas:

- bahasa CTA belum sepenuhnya konsisten,
- beberapa area masih terasa seperti kumpulan panel, belum selalu membentuk hierarchy yang sangat tegas,
- pola empty state dan instructional state sudah ada, tetapi belum tampak sebagai sistem yang terdokumentasi,
- badge, hint, metadata, dan support text belum terasa punya grammar visual yang seragam,
- dan perbedaan antara state user tamu, user login, data kosong, dan data siap perlu sistem status yang lebih eksplisit.

### Implikasi untuk Pengembangan Design System

Untuk ideasi design system ke depan, sistem sebaiknya dipikirkan dalam lima lapisan:

- tokens: warna, spacing, radius, typography, elevation, motion,
- layout primitives: shell, sidebar, section, grid, panel,
- feedback states: loading, empty, placeholder, success, warning, error,
- domain components: roadmap item, progress card, insight card, consultation card, article card,
- content components: callout, privacy note, evidence list, summary block, assistant response bubble.

Karena produk ini sensitif secara emosional, design system juga perlu punya prinsip perilaku:

- tidak terasa menghukum,
- tidak terasa terlalu “medical dashboard”,
- tetap jelas saat menampilkan alert atau needs attention,
- dan memberi ruang napas visual pada informasi yang padat.

## Content Structure Opportunities

### 1. Pisahkan Narasi Marketing dan Narasi Product Utility

Landing page sudah kuat secara emosional, tetapi ke depan struktur konten bisa dibedakan lebih tegas antara:

- narasi empatik untuk acquisition,
- dan narasi utilitas untuk menjelaskan bagaimana produk bekerja setelah user masuk.

Ini akan membantu saat website berkembang dan kebutuhan explainability makin besar.

### 2. Rapikan Arsitektur "Belajar" vs "Bertindak"

Saat ini education, assistant, consultation, dashboard, dan roadmap sama-sama memberi arahan berikutnya, tetapi dengan bahasa yang sedikit berbeda. Ke depan, akan lebih kuat jika struktur konten membedakan:

- tempat untuk memahami,
- tempat untuk memutuskan fokus,
- dan tempat untuk bertindak.

Contoh pengelompokan yang mungkin:

- `Belajar`: artikel, glossary, penjelasan pola,
- `Pahami kondisi anak`: dashboard, insight, snapshot,
- `Lakukan langkah berikutnya`: roadmap, consultation, aktivitas harian.

### 3. Definisikan Grammar Konten untuk Insight

Insight muncul di beberapa konteks dan berpotensi menjadi pusat pengalaman. Karena itu perlu grammar konten yang lebih jelas:

- apa bedanya insight summary, alert, recommendation, evidence,
- kapan insight menjadi headline,
- kapan insight menjadi supporting context,
- dan bagaimana insight selalu dihubungkan kembali ke tindakan atau target.

Tanpa grammar ini, konten bisa terasa repetitif atau terlalu abstrak saat fitur bertambah.

### 4. Perjelas Hubungan Antara Data Sensitif dan Rasa Aman

Trust sudah hadir di berbagai tempat, tetapi masih tersebar. Ke depan, struktur konten bisa lebih eksplisit memisahkan:

- janji emosional,
- penjelasan privasi,
- kontrol data,
- dan batas peran AI.

Dengan begitu, user tidak harus “menemukan sendiri” bagian-bagian trust ini di beberapa halaman.

### 5. Siapkan Layer Konten untuk Multi-Audience

Saat ini mayoritas voice diarahkan ke orang tua, yang tepat untuk core product. Namun website sudah mulai punya audience tambahan:

- admin/internal operator,
- tim knowledge reviewer,
- kemungkinan partner profesional di masa depan.

Karena itu arsitektur konten ke depan perlu memikirkan mana yang:

- khusus parent-facing,
- khusus internal ops,
- dan mana yang bisa menjadi jembatan antar keduanya tanpa membingungkan.

## Open Questions and Assumptions

Beberapa hal berikut belum sepenuhnya tersurat dari repo, tetapi penting dicatat sebagai asumsi kerja:

- Produk tampak sedang berada di fase transisi dari prototype pengalaman ke sistem yang lebih production-oriented.
- Beberapa capability backend sudah cukup dalam, sementara sebagian permukaan frontend masih berperan sebagai representasi awal dari workflow ideal.
- Consultation recommendations dan provider data masih tampak semi-seeded, sehingga area ini kemungkinan akan berkembang signifikan di iterasi berikutnya.
- Information architecture saat ini masih mengutamakan kejelasan workflow utama daripada pemisahan domain konten yang sangat rapi.

## Summary for Future Work

Jika dokumen ini dipakai untuk ideasi lanjutan, ada tiga kesimpulan utama:

- Tumbuh sudah punya narasi produk yang kuat dan berbeda; ini perlu dijaga saat sistem visual berkembang.
- Fondasi fitur utamanya sudah jelas: progress, insight, roadmap, education, consultation, dan data governance.
- Kebutuhan terbesar berikutnya bukan sekadar menambah layar, tetapi menyatukan sistem visual, grammar konten, dan arsitektur informasi agar semua permukaan terasa berasal dari satu produk yang matang.
