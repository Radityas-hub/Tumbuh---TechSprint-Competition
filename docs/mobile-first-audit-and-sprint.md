# Mobile-First Audit & Sprint Plan — Onboarding + Dashboard

> Sister-doc dari `mobile-first-dashboard-research.md`. Tujuan: sebelum implementasi, kita punya **peta kondisi aktual** halaman Onboarding dan Dashboard (dengan komentar teknis per-temuan), plus **sprint checklist** yang bisa dicentang satu-satu selama eksekusi. Semua acuan desain mengikuti research doc dan `.kiro/steering/dashboard-ui-guidelines.md`.

**Prinsip dasar eksekusi:**

1. Mobile-first via **progressive enhancement media queries** — desktop byte-for-byte tetap sama.
2. Tidak ada rework IA (Information Architecture). Step onboarding, komponen dashboard, semua kekal — yang berubah hanya layout shell + spacing + touch target + safe area.
3. Tiap perubahan harus bisa di-revert per-commit (strict branch + strict commit).
4. Verifikasi di 3 viewport: 360 px (xs), 640 px (sm breakpoint), 900 px (md threshold), 1280 px (desktop regression).

---

## 1. Audit Halaman `Onboarding` (`/onboarding`)

### 1.1 Struktur saat ini

Entry point: `app/TumbuhApp.tsx` → render `<Onboarding>` saat `screen === "onboarding"`.
File kunci: `app/tumbuh/Onboarding.tsx`, CSS di `app/globals.css` baris ~1597-2150 + media query ~3279-3320.

Komponen dari atas ke bawah:

```
.onboarding-mode (body wrapper)
└── .onboarding-screen
    ├── .onboarding-topbar          — brand + step counter
    └── form.onboarding-stage
        ├── .onboarding-heading     — h1 + body
        ├── step 1 → .onboarding-fields (name input + birth date + soft-info)
        ├── step 2 → .diagnosis-list (6 options + "other")
        ├── step 3 → .focus-option-grid (2-col card)
        ├── step 4 → .onboarding-fields .review-step
        └── .onboarding-footer (fixed bottom: back + lanjut)
```

### 1.2 Komentar teknis per-elemen

#### `onboarding-screen` (container)

```css
.onboarding-screen {
  padding: 0 24px 132px;   /* padding bawah 132 px untuk fixed footer */
}
@media (max-width: 900px) {
  padding: 0 16px 128px;
}
```

**Komentar:**
- ✅ Padding bottom 128 px cukup besar untuk menghindari konten ketutup footer fixed.
- ⚠️ Side padding 24 → 16 px di 900 px, **tapi tidak ada penyesuaian lebih di 640/360 px**. Pada 360 px, konten tetap 16 px margin = 328 px usable width. Masih OK, tapi input/card bisa terasa lebar pas-pasan.
- ⚠️ Tidak ada `env(safe-area-inset-left/right)` — di iOS landscape notch area bisa ketutup.
- **Actionable:** tambah `@media (max-width: 420px)` → `padding: 0 12px 128px` + `env(safe-area-inset-*)` handling.

#### `onboarding-topbar`

```css
.onboarding-topbar {
  height: 72px;
  padding: 0 8px;
}
@media (max-width: 900px) {
  height: 72px;
  padding: 0 20px;
}
```

**Komentar:**
- ⚠️ `padding: 0 20px` di mobile lebih besar dari screen-level `16px` → inkonsisten inset.
- ✅ Height 72 px lebih dari cukup untuk tap target.
- ❌ `button` brand dan `span` step-counter tidak punya `min-height: 44px` eksplisit. Tombol brand mungkin OK karena parent 72 px, tapi kalau user tap tepat di tengah (tanpa min-height), hit area bisa < 44.
- ❌ Tidak ada `env(safe-area-inset-top)` — di iPhone PWA standalone, brand akan tersembunyi di balik status bar.
- **Actionable:** normalize padding ke 16 px di mobile; tambah `min-height: 44px` di `.onboarding-topbar button`; tambah `padding-top: env(safe-area-inset-top)` di `.onboarding-mode`.

#### `onboarding-heading` (h1 + p)

```css
.onboarding-heading h1 {
  font-size: clamp(24px, 3.2vw, 30px);
  line-height: 1.15;
}
.onboarding-heading p {
  font-size: 14px;
  line-height: 1.55;
}
```

**Komentar:**
- ✅ `clamp()` sudah bagus — 24 px di 360 px viewport, naik ke 30 px di 1920 px.
- ✅ Body 14 px lolos research doc minimum.
- ✅ Line-height 1.15 untuk display + 1.55 untuk body = sesuai design system.
- **Status:** no change needed.

#### Step 1 — `.onboarding-fields` (input name + date)

```css
.onboarding-fields input {
  height: 48px;                        /* ≥ 44 WCAG AAA */
  border-radius: var(--radius-md);     /* 20 px */
}
```

**Komentar:**
- ✅ Height 48 px lolos touch target.
- ⚠️ `type="date"` di iOS Safari punya styling default yang ugly. Tidak dibenahi di design sekarang, tapi bukan mobile-first blocker — P2.
- ✅ `font-size: 14px` pada input mencegah iOS auto-zoom-in (iOS auto-zoom saat focus input `< 16 px`, **tapi kita di 14 px jadi akan zoom**). **Ini bug mobile yang harus diperbaiki.**
- **Actionable:** set `font-size: 16px` pada `input`, `select`, `textarea` di **mobile saja** (desktop boleh 14 px) untuk prevent iOS zoom on focus. Atau naik 16 px untuk semua input form — lebih konsisten.

#### Step 2 — `.diagnosis-option`

```css
.diagnosis-option {
  min-height: 56px;
  padding: 0 var(--space-4);           /* 16 px */
}
```

**Komentar:**
- ✅ 56 px tinggi, jauh di atas 44 px WCAG AAA. Tap error risk rendah.
- ✅ Vertical gap `--space-3` (12 px) antar option cukup — satisfies 8 px minimum spacing.
- ⚠️ `transition: border-color 180ms ease, background 180ms ease` — saat viewport reduced motion, tidak di-disable. Minor a11y.
- **Actionable (small):** wrap transition dalam `@media (prefers-reduced-motion: no-preference)`.

#### Step 3 — `.focus-option-grid`

```css
.focus-option-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
@media (max-width: 900px) {
  grid-template-columns: 1fr;          /* stack di mobile */
}
.focus-option-card {
  min-height: 160px;
}
@media (max-width: 900px) {
  min-height: 210px;                   /* naik di mobile — lebih "breathing" */
}
```

**Komentar:**
- ✅ 2-col desktop, 1-col mobile — sudah mobile-first pattern.
- ⚠️ `min-height: 210px` di mobile artinya 4 kartu = 840 px vertical (+ gap 16 px × 3 = 48 px). Total 888 px, yang di 375 px viewport akan butuh scroll besar. OK tapi bisa dikompakkan.
- ⚠️ `text-align: left` — konten rata kiri di card, OK untuk scanning.
- **Actionable (small):** reduce `min-height` di mobile dari 210 → 160 px karena konten sedikit.

#### Step 4 — review + select dropdown

```css
.onboarding-fields select {
  height: 48px;
  font-size: 14px;     /* ← iOS zoom trigger */
}
```

**Komentar:**
- ⚠️ Sama seperti input di Step 1 — 14 px trigger iOS zoom on focus.
- ✅ `.review-card` cukup clean. `display: grid` dengan `grid-template-columns: 140px 1fr` di desktop, di mobile `1fr` — **tapi gue cek belum ada rule `.review-card` di mobile media query.** Secara default di mobile layout stuck di 140 px + 1fr yang bisa jadi sempit.
- **Actionable:** verify `.review-card` collapse di 640 px; kalau tidak, tambah `grid-template-columns: 1fr`.

#### `.onboarding-footer` (fixed bottom)

```css
.onboarding-footer {
  position: fixed;
  bottom: 0;
  grid-template-columns: minmax(0, 160px) minmax(260px, 520px);
  padding: var(--space-4) var(--space-6);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);          /* ⚠️ dilarang design system */
}
@media (max-width: 900px) {
  grid-template-columns: 1fr;          /* cuma "Lanjut" di atas "Kembali" */
}
```

**Komentar:**
- ❌ **`backdrop-filter: blur(8px)` melanggar `.kiro/steering/dashboard-ui-guidelines.md` §6**: *"Tidak pakai backdrop-filter: blur di dashboard — mahal render."* Walau ini halaman onboarding bukan dashboard, prinsip yang sama berlaku karena konsistensi visual + perf.
- ❌ Tidak ada `padding-bottom: env(safe-area-inset-bottom)`. Di iPhone PWA standalone, tombol "Lanjut" akan tertutup home indicator bar.
- ⚠️ Di mobile `grid-template-columns: 1fr` → "Kembali" (dirender via `step > 1 &&`) ditaruh di atas "Lanjut". Visual rapi? — butuh verifikasi di device, tapi umumnya UX enter-order "Kembali lalu Lanjut" terbalik (Lanjut primary seharusnya dominan). **Pertimbangkan urutan DOM "Lanjut → Kembali", atau pakai `flex-direction: column-reverse`.**
- ❌ Backdrop transparan (rgba 0.92) ➜ saat scroll konten di bawahnya kelihatan samar. Kalau blur di-off, visual jadi jelek. Solusi: solid surface + 1px top border (sesuai design system).
- **Actionable (wajib mobile-first):**
  1. Ganti `backdrop-filter` → solid `background: var(--surface-solid)`.
  2. Tambah `padding-bottom: max(var(--space-4), env(safe-area-inset-bottom))`.
  3. Di mobile: `grid-template-rows: auto auto` stack vertikal dengan primary dulu (pakai `column-reverse` atau reorder DOM).

#### Button sizing global di Onboarding

- `.primary-button` → `min-height: 48px`. ✅
- `.tertiary-button` → `min-height: 48px`. ✅
- `.onboarding-next` → `min-height: 48px`. ✅

**Status touch target overall:** aman secara angka, tapi footer safe-area belum di-handle.

### 1.3 Skor onboarding (vs research doc)

| Kriteria | Status | Catatan |
|---|---|---|
| Body text ≥ 14 px | ✅ | clamp + 14 px |
| Tap target ≥ 44 px | ✅ | 48/56 px on buttons, inputs |
| Tap target spacing ≥ 8 px | ✅ | `--space-3` (12 px) default |
| Stack layout di mobile | ✅ | focus-grid + footer ke 1-col |
| Input anti-zoom iOS (16 px) | ❌ | **14 px triggers zoom** |
| `env(safe-area-inset-*)` | ❌ | Tidak ada di topbar / footer |
| `backdrop-filter` dihindari | ❌ | Footer masih pakai blur 8 px |
| Reduced motion respected | ⚠️ | Transition tidak di-guard |
| viewport meta `viewport-fit=cover` | ❌ | `app/layout.tsx` tidak punya `<meta name="viewport">` sama sekali |

**Kesimpulan Onboarding:** fondasinya 80% mobile-ready, tapi 3 bug fatal untuk iOS:
1. Input 14 px → iOS zoom.
2. No safe area → footer tertutup home indicator.
3. `backdrop-filter` → perf hit + against design system.

Plus `<meta viewport>` missing globally.

---

## 2. Audit Halaman `Dashboard` (`/dashboard`)

### 2.1 Struktur saat ini

Entry: `app/TumbuhApp.tsx` → `<AppShell>` → `<Dashboard>`.
File kunci: `app/tumbuh/AppShell.tsx`, `app/tumbuh/Dashboard.tsx`, CSS di `globals.css` `.product-shell`, `.sidebar`, `.workspace`, `.dash-*`.

Komponen dari atas ke bawah:

```
.product-shell (padding-left: 250px desktop)
├── .sidebar (fixed left, 250 px wide)
│   ├── .sidebar-brand
│   ├── .sidebar-section (6 nav items)
│   └── .privacy-note
└── .workspace
    └── .dash (container)
        ├── .dash-hero                  — greeting + illustration + CTA "Catat hari ini"
        ├── .dash-spotlight (conditional)
        ├── .dash-bento (2-col desktop)
        │   ├── .dash-col-left
        │   │   ├── .dash-actions (Yang bisa dilakukan hari ini)
        │   │   └── .dash-pulse (Ritme minggu ini: 7 dots + narasi)
        │   └── .dash-col-right
        │       ├── .dash-focus (Fokus saat ini: arc + target)
        │       └── InsightCard
        ├── .dash-auth-reminder (conditional)
        ├── QuickNote (modal)
        └── ProductTour
```

### 2.2 Komentar teknis per-elemen

#### Shell — `.product-shell` + `.sidebar` + `.workspace`

```css
.product-shell {
  padding-left: 250px;                  /* desktop: sidebar rail reserved */
}
.sidebar {
  position: fixed;
  width: 250px;
  z-index: 10;
}
.workspace {
  padding: var(--space-8) var(--space-8) var(--space-12);
  border-top-left-radius: var(--radius-lg); /* 36 px */
}
@media (max-width: 900px) {
  .product-shell { padding-left: 0; }
  .sidebar { position: relative; width: 100%; }          /* ← PROBLEM */
  .workspace { padding: var(--space-6) var(--space-4) var(--space-10); }
  .sidebar-section { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 600px) {
  .sidebar-section { grid-template-columns: 1fr 1fr; }
}
```

**Komentar:**
- ❌ **Fatal mobile:** saat viewport ≤ 900 px, sidebar jadi `position: relative; width: 100%` → ia muncul sebagai **block raksasa di atas konten** (6 tombol + privacy note ≈ 480-600 px vertical). Pada iPhone 13 Pro (390×844), user harus scroll 600 px sebelum melihat hero dashboard. Ini pelanggaran prinsip mobile-first "primary content first".
- ❌ Tidak ada drawer pattern (hamburger) di mobile.
- ❌ Tidak ada bottom navigation.
- ❌ `.workspace { border-top-left-radius: 36px }` tetap berlaku di mobile → sudut kiri-atas rounded padahal full-width, bikin visual "pincang" (tidak ada sudut kanan yang pasangan).
- **Actionable (wajib):**
  1. Di `max-width: 900px`: **hide** `.sidebar` default (pakai drawer pattern `transform: translateX(-100%)` + toggle `.is-open`).
  2. Render `MobileTopBar` (hamburger) dan `MobileTabBar` (bottom nav 5 item) lewat CSS `display: none` di desktop.
  3. Zero-out `border-radius` di mobile: `.workspace { border-radius: 0 }`.

#### `.dash-hero`

```css
.dash-hero {
  display: flex;
  align-items: flex-end;
  gap: var(--space-5);
  padding: var(--space-8);
  background: linear-gradient(...);
}
.dash-hero-img { width: 220px; height: 220px; }

@media (max-width: 900px) {
  .dash-hero { flex-direction: column; align-items: flex-start; }
  .dash-hero-img { width: 100px; height: 100px; }
}
@media (max-width: 760px) {
  .dash-hero { padding: 20px; border-radius: 20px; }
  .dash-hero h1 { font-size: 22px; }
}
```

**Komentar:**
- ✅ Sudah collapse dengan bagus. Illustrasi 220 → 100 px cukup pintar.
- ⚠️ Di 360 px viewport, illustrasi 100 px + padding 20 px × 2 + h1 22 px = berdesak. Hero dengan illustrasi di mobile **opsional — nilai UX-nya rendah**. Research doc merekomendasikan **hide image di mobile untuk prioritaskan teks**.
- ⚠️ `.dash-hero .primary-button { justify-self: start }` → di mobile jadi inline, tidak full-width. Untuk thumb zone reach, full-width lebih baik.
- **Actionable:**
  1. `@media (max-width: 640px)`: `.dash-hero-img { display: none }`.
  2. `@media (max-width: 640px)`: `.dash-hero .primary-button { width: 100%; justify-content: center }`.

#### `.dash-spotlight` (alert card)

**Komentar:**
- ✅ `.dash-spotlight { display: flex; gap: 14px }` naturally responsive.
- ⚠️ `.dash-spotlight-links` pakai `gap: 16px; flex-wrap: nowrap`. Kalau 2 teks panjang di 360 px, overflow-x.
- **Actionable (minor):** tambah `flex-wrap: wrap` atau scroll-x di mobile.

#### `.dash-bento`

```css
.dash-bento {
  grid-template-columns: 1.3fr 1fr;
}
@media (max-width: 900px) {
  grid-template-columns: 1fr;
}
```

**Komentar:** ✅ Clean. No action.

#### `.dash-actions` (daily actions card)

```css
.dash-actions { padding: 24px; }
.dash-action-item .ghost-button { min-height: 32px; }  /* ← PROBLEM */
```

**Komentar:**
- ❌ **`.ghost-button` di sini `min-height: 32px`** — **di bawah 44 px WCAG AAA**. Ini override global `.ghost-button` yang 44 px. Buat mobile harus di-fix.
- Meskipun visually button ini kecil ("Sudah" / "Catat"), target size tetap wajib.
- **Actionable (wajib):** mobile override `.dash-action-item .ghost-button { min-height: 44px }`. Atau extend hit area via padding.

#### `.dash-pulse` (Ritme minggu ini)

```css
.dash-pulse-dots {
  display: flex;
  gap: 0;
  justify-content: space-between;
}
.dash-dot-col {
  display: grid;
  gap: 3px;
  min-width: 0;
}
```

**Komentar:**
- ⚠️ 7 dots di `.dash-pulse-dots { gap: 0 }` + `justify-content: space-between` → di 360 px viewport dengan padding panel 20 px (total 320 px usable), tiap dot col = ~45 px. OK tapi sempit.
- ⚠️ Kalau label hari (e.g. "R", "K") pakai `font-size < 12 px`, sulit dibaca.
- **Actionable (opsional):** di 640 px, `.dash-pulse-dots { overflow-x: auto; scroll-snap-type: x mandatory }` → user swipe horizontal. Tapi ini mungkin over-engineer. Kalau test di real device OK, biarkan.

#### `.dash-focus` (target + arc)

```css
.dash-arc { width: 52px; height: 52px; }
```

**Komentar:**
- ✅ Arc + title + meta — scannable mobile OK.
- ✅ Compact layout.
- **Status:** no change needed.

#### `.dash-auth-reminder`

```css
.dash-auth-reminder { display: flex; align-items: center; }
.auth-reminder { /* similar structure, has mobile breakpoint */ }
```

**Komentar:**
- Dash-specific `.dash-auth-reminder` **tidak punya** media query collapse. Kalau nama/paragraph panjang di 360 px, bisa squeeze.
- **Actionable:** `@media (max-width: 640px)`: `.dash-auth-reminder { flex-direction: column; align-items: stretch }`.

#### `.sidebar` nav items

```css
.sidebar-link { min-height: 48px; }
```

**Komentar:** ✅ OK desktop. Mobile perlu drawer pattern (§ 2.2 shell).

### 2.3 Skor dashboard (vs research doc)

| Kriteria | Status | Catatan |
|---|---|---|
| Body text ≥ 14 px | ✅ | Konsisten |
| Tap target ≥ 44 px | ⚠️ | `.ghost-button` di `.dash-actions` 32 px |
| Primary content first | ❌ | Sidebar menutupi konten di ≤ 900 px |
| Bottom nav / drawer pattern | ❌ | Sidebar jadi block raksasa |
| Hero image hidden di small | ❌ | Masih render 100 px |
| `env(safe-area-inset-*)` | ❌ | Zero |
| Primary CTA full-width mobile | ❌ | `.primary-button` tetap inline |
| `backdrop-filter` dihindari | ✅ | Dashboard clean (kecuali `.home-*`) |
| Skeleton state mobile | ✅ | `DashboardSkeleton` exists |
| `.workspace` border-radius clean | ❌ | 36 px radius pincang di full-width |

**Kesimpulan Dashboard:** fondasi komponen 70% mobile-ready, tapi **shell (sidebar, navigation) 0% mobile-ready**. Ini blocker utama.

---

## 3. Prioritas Perubahan (ranked)

| # | Item | File | Risk | Impact | Phase |
|---|---|---|---|---|---|
| 1 | Tambah `<meta viewport-fit=cover>` | `app/layout.tsx` | Low | High | **1** |
| 2 | Naikkan input/select font-size ke 16 px di mobile (fix iOS zoom) | `globals.css` | Low | High | **1** |
| 3 | `env(safe-area-inset-*)` di `.onboarding-footer`, `.workspace`, `.qn-sheet` | `globals.css` | Low | Medium | **1** |
| 4 | Buang `backdrop-filter` dari `.onboarding-footer`, replace solid bg + top border | `globals.css` | Low | Medium | **1** |
| 5 | Mobile refinement @ 640 px: metric 1-col, hero img hidden, full-width CTA, chart 180 px | `globals.css` | Low | High | **1** |
| 6 | Fix `.dash-action-item .ghost-button` min-height → 44 px di mobile | `globals.css` | Low | Medium | **1** |
| 7 | `.workspace { border-radius: 0 }` di ≤ 900 px | `globals.css` | Low | Low | **1** |
| 8 | `.dash-auth-reminder` stack vertical di mobile | `globals.css` | Low | Low | **1** |
| 9 | Mobile shell — hide sidebar, hamburger topbar, bottom tab bar | `AppShell.tsx` + `globals.css` + 2 komponen baru | Medium | High | **2** |
| 10 | Sidebar drawer animation + backdrop + focus trap | `AppShell.tsx` | Medium | Medium | **2** |
| 11 | Optional FAB "Catat hari ini" mobile | `Dashboard.tsx` + CSS | Low | Low | **3** |
| 12 | PWA manifest + iOS standalone testing | `public/`, `app/layout.tsx` | Low | Low | **3** |

---

## 4. Sprint Checklist

### 🟢 Sprint 1 — Mobile-first foundation (CSS-only, zero JSX change) ✅ SELESAI 10 Mei 2026

**Status:** Merged ke main `fb47424` lewat branch `feat/mobile-first-phase-1` (2 commits: `7f4bd9d` docs + `b8a0427` implementasi). Zero JSX change, semua via media query progressive enhancement.

**Goal:** Halaman onboarding + dashboard terasa jauh lebih baik di 360-640 px tanpa menyentuh komponen React. Desktop 1280+ **identik** dengan sebelum.

**Branch:** `feat/mobile-first-phase-1`

**Pre-flight**
- [x] Verifikasi git state clean: `git status`
- [x] `git checkout main && git pull && git checkout -b feat/mobile-first-phase-1`

**P1 — Viewport + safe area (global)**
- [x] Tambah Next.js `Viewport` export di `app/layout.tsx`:

```ts
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#06443e",
};
```

- [x] Tambah `padding-top: env(safe-area-inset-top)` di `.onboarding-mode`

**P2 — Fix iOS input zoom (global form)**
- [x] Rule aktif di `@media (max-width: 900px)`:

```css
input, select, textarea { font-size: 16px; }
.onboarding-fields label { font-size: 13px; }
```

- [x] Label diturunkan ke 13 px supaya body label di mobile tetap kecil meskipun input naik ke 16 px

**P3 — Onboarding footer mobile-safe**
- [x] Remove `backdrop-filter: blur(8px)` dari `.onboarding-footer`
- [x] Ganti `background: rgba(255,255,255,0.92)` → `var(--surface-solid)`
- [x] Tambah `padding-bottom: max(var(--space-4), env(safe-area-inset-bottom))`
- [x] `border-top: 1px solid var(--line)` tetap (dipertahankan dari state sebelumnya)

**P4 — Onboarding small-device tweaks**
- [x] `@media (max-width: 420px)`:
  - [x] `.onboarding-screen { padding: 0 12px 128px }`
  - [x] `.onboarding-topbar { padding: 0 12px }`
- [x] `@media (max-width: 900px)`:
  - [x] `.onboarding-topbar { padding: 0 16px }` (normalisasi dari 20 → 16 px sejalan screen)
  - [x] `.onboarding-topbar button { min-height: 44px; padding: 0 8px; margin-left: -8px; border-radius: var(--radius-sm) }` (tap target brand)
  - [x] `.focus-option-card { min-height: 160px }` (turun dari 210 px — lebih kompak)
  - [x] `.review-card div { grid-template-columns: 1fr; gap: 2px; padding: 6px 0 }` (kolom 140/1fr collapse)

**P5 — Dashboard mobile refinement @ 640px**
- [x] Append block `@media (max-width: 640px)`:

```css
.workspace { padding-left: max(var(--space-4), env(safe-area-inset-left)); padding-right: max(var(--space-4), env(safe-area-inset-right)); }
.metric-grid { grid-template-columns: 1fr; gap: var(--space-3); }
.workspace-header { flex-direction: column; align-items: stretch; gap: var(--space-3); }
.dash-hero-img { display: none; }
.dash-hero { padding: var(--space-5); }
.dash-hero h1 { font-size: 22px; line-height: 1.2; }
.dash-hero .primary-button { align-self: stretch; width: 100%; justify-content: center; }
.chart-modern { height: 180px; }
.dash-auth-reminder { flex-direction: column; align-items: stretch; }
.dash-auth-reminder .secondary-button { width: 100%; }
.dash-action-item .ghost-button { min-height: 44px; }
.dash-spotlight-links { flex-wrap: wrap; }
.qn-sheet { padding-bottom: max(var(--space-4), env(safe-area-inset-bottom)); }
```

- [x] Di `@media (max-width: 900px)`: `.workspace { border-radius: 0 }` (hilangkan sudut pincang)

**P6 — Reduced motion guard**
- [x] Wrap transitions dalam `@media (prefers-reduced-motion: reduce)`:

```css
.diagnosis-option, .focus-option-card, .other-condition,
.sidebar-link, .nav-link, .primary-button, .secondary-button, .ghost-button
{ transition: none; }
```

**QA Sprint 1**
- [x] TSC clean (`tsc --noEmit` no errors)
- [x] `getDiagnostics` clean (hanya preexisting `line-clamp` warning unrelated)
- [x] User acc: **10 Mei 2026 — user approve setelah test manual**

**Commit & push**
- [x] Commit 1: `docs(mobile): add mobile-first research and sprint audit plan` (`7f4bd9d`)
- [x] Commit 2: `feat(mobile): sprint 1 — viewport-fit, iOS safe area, anti-zoom, mobile refinements` (`b8a0427`)
- [x] Push ke `origin/feat/mobile-first-phase-1`
- [x] Merge `--no-ff` ke main (`fb47424`)
- [x] Push `origin/main`

**Diff summary:**
- `app/layout.tsx` +6/−1 (Viewport export)
- `app/globals.css` +143/−3 (isolated mobile-first block + footer fix)
- `docs/mobile-first-audit-and-sprint.md` +651 (dokumen ini)
- `docs/mobile-first-dashboard-research.md` +602 (research doc)

**Known follow-ups untuk Sprint 2:**
- Sidebar di ≤ 900 px masih block raksasa (belum di-drawer-kan) — ini memang lingkup Sprint 2
- Tidak ada bottom tab bar di mobile — Sprint 2
- `.onboarding-footer` grid-template di mobile masih `1fr` (primary button solo di bawah, "Kembali" di atas) — bisa reorder DOM di future polish atau Sprint 3

---

### 🟡 Sprint 2 — Mobile shell: hamburger drawer + bottom tab bar ✅ SELESAI 10 Mei 2026

**Status:** Merged ke main `80dff7e` lewat branch `feat/mobile-first-phase-2` (commit `9d71354`). User acc via test manual.

**Goal:** Di ≤ 900 px, sidebar jadi drawer off-canvas, muncul hamburger top bar, muncul bottom tab bar 5 item. Desktop tetap sidebar 250 px persistent.

**Branch:** `feat/mobile-first-phase-2` (branched dari main setelah Sprint 1)

**Pre-flight**
- [x] Merge Sprint 1 ke main, `git checkout main && git pull`
- [x] Branch baru `feat/mobile-first-phase-2`

**P1 — Komponen baru**
- [x] `app/tumbuh/MobileTopBar.tsx`:
  - [x] Brand + hamburger button (`aria-label="Buka menu navigasi"`, `aria-expanded`, `aria-controls="mobile-nav-drawer"`)
  - [x] Hidden via CSS `display: none` di desktop
  - [x] Height 56 px + `env(safe-area-inset-top)`
- [x] `app/tumbuh/MobileTabBar.tsx`:
  - [x] 5 tab: Dashboard, Roadmap, Catatan, Edukasi, Lainnya
  - [x] "Lainnya" opens sheet berisi Konsultasi + Pengaturan
  - [x] `role="tablist"`, `role="tab"` di item, `aria-selected` sesuai `screen`
  - [x] Active state juga highlight saat user di consultation/settings (isOnMoreScreen)
  - [x] Height 64 px + `env(safe-area-inset-bottom)`

**P2 — AppShell refactor**
- [x] Tambah state `navOpen` + `moreOpen` di `AppShell.tsx`
- [x] Render `<MobileTopBar />` + `<MobileTabBar />` di semua viewport (CSS-toggled)
- [x] Wrap `.sidebar` dengan `.sidebar-inner` + class conditional `is-open`
- [x] Tombol close X di `.sidebar-header` (mobile only via CSS)
- [x] Tambah backdrop element `.sidebar-backdrop` dengan toggle class
- [x] ESC key listener saat drawer/sheet open
- [x] `handleNavigate` auto-close drawer + sheet ketika user pilih nav item

**P3 — CSS mobile shell**
- [x] Default: semua chrome mobile hidden (`.mobile-topbar, .mobile-tabs, .sidebar-backdrop, .sidebar-close, .mobile-sheet-backdrop, .mobile-more-sheet { display: none }`)
- [x] `@media (max-width: 900px)`:
  - [x] `.mobile-topbar { display: flex; sticky; safe-area-inset-top; 56 + safe px }`
  - [x] `.sidebar { position: fixed; transform: translateX(-100%); transition: transform 240ms ease; z-index: 40; width: min(280px, 85vw); 100dvh }`
  - [x] `.sidebar.is-open { transform: translateX(0) }`
  - [x] `.sidebar-backdrop { inset: 0; bg rgba(16,35,31,0.45); opacity 0 → 1; z-index: 35 }`
  - [x] `.product-shell { padding-left: 0; padding-bottom: calc(64px + env(safe-area-inset-bottom)); min-height 100dvh }`
  - [x] `.workspace { border-radius: 0 }` (sudah dari Sprint 1)
  - [x] `.mobile-tabs { position: fixed bottom; grid 5-col; 64 + safe-area-inset-bottom; z-index: 30; safe-area-inset-left/right }`
  - [x] `.mobile-tab { min-height: 48px; gap 2px; font-size 11px }`
  - [x] `.mobile-tab.is-active { color: var(--teal-dark) }`
  - [x] `.mobile-more-sheet { slide-up animation 220ms; safe-area-inset-bottom; border-radius top only }`
  - [x] Override `.sidebar-section` 3-col/2-col hack lama dari breakpoint 900/600 jadi 1-col (tidak relevan setelah drawer)

**P4 — Body scroll lock saat drawer open**
- [x] Saat `navOpen || moreOpen`, `document.body.style.overflow = "hidden"` via `useEffect`; restore previous on cleanup

**QA Sprint 2**
- [x] Drawer buka dari hamburger, close dari backdrop tap + Escape key + close button X + nav item click
- [x] Tab bar active state sync dengan `screen`
- [x] "Lainnya" tab highlight saat user di consultation/settings screen
- [x] "Lainnya" sheet slide-up, close via backdrop + X + ESC + item click
- [x] Desktop ≥ 901 px: tidak muncul topbar / tabbar / drawer / backdrop / sheet
- [x] Reduced motion: transisi `transform` drawer + sheet animation di-disable
- [x] TSC clean, diagnostics clean
- [x] User acc: **10 Mei 2026 — user approve setelah test manual**

**Commit & push**
- [x] Commit: `feat(mobile): sprint 2 — hamburger drawer + bottom tab bar shell` (`9d71354`)
- [x] Push ke `origin/feat/mobile-first-phase-2`
- [x] Merge `--no-ff` ke main (`80dff7e`)
- [x] Push `origin/main`

**Diff summary:**
- `app/tumbuh/MobileTopBar.tsx` +32 (new)
- `app/tumbuh/MobileTabBar.tsx` +78 (new)
- `app/tumbuh/AppShell.tsx` +157/−29 (state + ESC + scroll lock + sheet rendering)
- `app/globals.css` +303 (Sprint 2 block: default-hide chrome + @media 900px shell overrides + sheet animation)

**Known follow-ups untuk Sprint 3 (opsional):**
- FAB "Catat hari ini" sticky di dashboard mobile (thumb zone boost)
- Focus trap proper di drawer (Tab key tidak escape ke background konten)
- Swipe-to-close drawer (native gesture)
- PWA manifest + Apple touch icons + splash screens
- Auto-hide top bar on scroll down (nice-to-have)

---

### 🔵 Sprint 3 — Polish + PWA ✅ SELESAI 10 Mei 2026

**Status:** Merged ke main `c36695c` lewat branch `feat/mobile-first-phase-3` (commit `86a45a3`). User acc via test manual.

**Goal:** Tingkatkan mobile dashboard ke level production-quality dengan 3 item high-impact: FAB thumb-zone, focus trap a11y, dan PWA manifest installable.

**Scope final (scoped down dari proposal awal):**
- FAB "Catat hari ini" — ✅
- Focus trap drawer + sheet — ✅
- PWA manifest basic — ✅
- Swipe-to-close drawer — ❌ ditolak untuk hindari over-engineer MVP (backdrop tap + ESC cukup)
- Auto-hide top bar on scroll — ❌ ditolak (nice-to-have only)
- Dedicated 192/512 PWA icons — ⏳ masuk backlog (sementara pakai `/images/dashboard.png`)

**Implementation checklist:**

**P1 — FAB**
- [x] `app/tumbuh/MobileFab.tsx` komponen baru
- [x] Bulat 56 px, teal-dark, ikon Plus 22 px, bottom-right sticky
- [x] Default `display: none`; `@media (max-width: 640px)` enable
- [x] Position: `right: max(var(--space-4), env(safe-area-inset-right))`, `bottom: calc(64px + var(--space-4) + env(safe-area-inset-bottom))` (di atas tab bar)
- [x] Z-index 25 (di bawah drawer 40 & sheet 50, di atas content)
- [x] Hover/focus `transform: translateY(-2px); background: var(--teal)` dengan reduced-motion guard
- [x] `aria-label="Catat hari ini"`
- [x] Render di `Dashboard.tsx` cuma di state `hasDashboardData` (bukan empty state — udah ada CTA besar di sana)

**P2 — Focus trap**
- [x] `useRef<HTMLElement | null>` untuk sidebar + sheet + lastFocused
- [x] `useEffect` expanded dari Sprint 2:
  - [x] Cache `document.activeElement` sebagai lastFocusedRef saat open
  - [x] Query semua focusable dalam container (button, href, input, select, textarea, tabindex ≥ 0)
  - [x] Auto-focus pertama dengan `setTimeout(40)` supaya transition start dulu
  - [x] Tab/Shift+Tab trap loop di dalam container (preventDefault saat hit edges)
  - [x] Restore focus ke lastFocused saat close (`returnTo.focus()`)
- [x] Remove `aria-hidden={!navOpen}` dari sidebar (salah di desktop yang selalu visible)
- [x] ESC + body scroll lock tetap aktif dari Sprint 2

**P3 — PWA manifest**
- [x] `app/manifest.ts` pakai Next.js `MetadataRoute.Manifest` pattern (bukan static JSON)
- [x] Field lengkap:
  - [x] `name: "Tumbuh - Pendamping Digital ABK"`, `short_name: "Tumbuh"`, `lang: "id"`
  - [x] `start_url: "/"`, `display: "standalone"`, `orientation: "portrait"`
  - [x] `background_color: "#f5f8f6"` (var --bg), `theme_color: "#06443e"` (var --teal-dark, match viewport theme)
  - [x] Icons 192 × 192 + 512 × 512 pakai `/images/dashboard.png` sementara (bagian backlog: icon dedicated PWA)

**QA Sprint 3**
- [x] TSC clean, diagnostics clean (preexisting line-clamp warning unrelated)
- [x] FAB muncul di 640 px, hidden di desktop
- [x] FAB tap buka QuickNote (sama seperti button di hero)
- [x] FAB hidden di empty state dashboard
- [x] Drawer open → fokus auto ke X button (first focusable)
- [x] Tab key trap loop di drawer; Shift+Tab reverse
- [x] Drawer close → fokus balik ke hamburger trigger
- [x] Sheet open/close → fokus flow sama
- [x] User acc: **10 Mei 2026**

**Commit & push**
- [x] Commit: `feat(mobile): sprint 3 — FAB, focus trap, PWA manifest` (`86a45a3`)
- [x] Push ke `origin/feat/mobile-first-phase-3`
- [x] Merge `--no-ff` ke main (`c36695c`)
- [x] Push `origin/main`

**Diff summary:**
- `app/manifest.ts` +30 (new)
- `app/tumbuh/MobileFab.tsx` +26 (new)
- `app/tumbuh/AppShell.tsx` +48/−2 (focus trap expansion)
- `app/tumbuh/Dashboard.tsx` +4 (FAB import + render)
- `app/globals.css` +49 (FAB block)

**Backlog item setelah Sprint 3:**
- Icon PWA dedicated (maskable 192 + 512, SVG source)
- Apple touch icons + splash screens
- Screenshot manifest untuk install prompt iOS/Android richness
- Lighthouse PWA audit (target 100)
- Service worker offline shell (kalau backend-less dashboard dianggap worth effort)

---

### 🟢 Sprint 4 — CSS-only mobile composition ✅ SELESAI 10 Mei 2026

**Status:** Merged ke main `a2b02ff` lewat branch `feat/mobile-composition-css-only` (2 commits: `6cf507a` docs v2 + `99586f6` implementasi). User acc via test manual.

**Goal:** Mengubah komposisi konten di mobile (≤ 640 px) via CSS-only — zero JSX change, zero komponen baru, zero JS baru. Addresses user feedback "lo cuma nurunin konten, gak ada properti buat konten baru di mobile".

**Research reference:** `docs/mobile-composition-research.md` v2 (revisi dari v1 yang proposal 7 komponen React berat).

**Aturan main Sprint 4:**
1. ✅ Tidak menambah komponen React baru
2. ✅ Tidak mengubah markup JSX yang sudah ada
3. ✅ Tidak menambah JavaScript baru
4. ✅ Semua perubahan dalam `@media` block → desktop 100% identik
5. ✅ Trade-off disebut explicit di research doc

**Pattern yang di-implementasi (6 pattern dalam 1 block CSS):**

- [x] **P1 — Section reorder** via flex + `order`:
  - `.dash { display: flex; flex-direction: column }` di mobile
  - `.dash-spotlight { order: -1 }` — alert naik ke atas kalau render
  - `.dash-hero { order: 0 }`, `.dash-bento { order: 1 }`, `.dash-auth-reminder { order: 2 }`
  - A11y note: tab order tetap DOM order (per W3C spec) — aman karena spotlight conditional & urutan logis masih masuk akal
- [x] **P2 — Stat carousel horizontal scroll-snap**:
  - `.metric-grid` dari `grid 4-col` → `flex` scroll container
  - `scroll-snap-type: x mandatory`, `scroll-snap-align: start` di tiap card
  - Card `flex: 0 0 72vw; min-width: 220px; max-width: 260px` — preview affordance ~28% viewport
  - Bleed ke edge viewport via `padding-inline: 16px + margin-inline: -16px`
  - Scrollbar hidden via `scrollbar-width: none` + `::-webkit-scrollbar { display: none }`
- [x] **P3 — Hero compact**:
  - h1 dari 22 px → 20 px
  - `.dash-hero p` line-clamp 2 + overflow hidden
  - Padding 16 px
  - Include `line-clamp` standard property untuk compat
- [x] **P4 — Focus target primary-only**:
  - `.dash-focus-list > :nth-child(n+2) { display: none }`
  - Hanya target #1 visible; tombol "Lihat semua target" existing tetap jadi escape hatch
  - Trade-off: user mobile kehilangan preview target #2/#3 — sudah documented di research doc § 5
- [x] **P5 — Insight teaser**:
  - `.insight-text` line-clamp 3
  - Existing expand button di InsightCard tetap berfungsi
- [x] **P6 — Daily actions primary-only**:
  - `.dash-actions > .dash-action-item + .dash-action-item { display: none }`
  - Adjacent sibling selector skip `<h2>`, hide action ke-2
- [x] **Reduced motion guard**: `.metric-grid { scroll-behavior: auto }` di prefers-reduced-motion

**QA**
- [x] TSC clean, diagnostics clean (only preexisting `line-clamp` warning unrelated di line 4290)
- [x] Mobile 360-640 px: semua 6 pattern aktif
- [x] Desktop 900-1920 px: byte-for-byte identik dengan pre-Sprint 4
- [x] User acc: **10 Mei 2026**

**Commit & push**
- [x] Commit 1: `docs(mobile): revised mobile composition research for CSS-only approach` (`6cf507a`)
- [x] Commit 2: `feat(mobile): sprint 4 CSS-only composition patterns` (`99586f6`)
- [x] Push ke `origin/feat/mobile-composition-css-only`
- [x] Merge `--no-ff` ke main (`a2b02ff`)
- [x] Push `origin/main`

**Diff summary:**
- `app/globals.css` +110 (1 block `@media (max-width: 640px)` + reduced-motion guard)
- `docs/mobile-composition-research.md` +437 (research v2 CSS-only)

**Known follow-ups (opsional Sprint 5):**
- Dot indicators untuk stat carousel (butuh IntersectionObserver atau `::scroll-marker` Chrome-only — skip untuk MVP)
- Real progressive disclosure di focus list (butuh `<details>` atau state React) — upgrade kalau user feedback bilang miss target #2/#3
- Roadmap / Education / Consultation mobile composition (kalau dashboard pattern valid, replikasi)
- Inline compose chip (butuh JSX + event handler, tidak bisa CSS-only)

---

## 5. Verification Matrix (setiap sprint selesai)

| Viewport | Device hint | Checklist |
|---|---|---|
| 360 × 640 | iPhone SE 1st gen | No horizontal scroll; hamburger accessible; tap targets ≥ 44 px |
| 375 × 812 | iPhone 13 mini | Input focus no zoom; footer safe-area OK |
| 414 × 896 | iPhone 11 Pro Max | Same as above |
| 768 × 1024 | iPad portrait | Sidebar drawer still active (≤ 900 breakpoint); reads well |
| 901 × 600 | Tablet landscape threshold | Sidebar persistent muncul |
| 1280 × 800 | Small laptop | Desktop identical to main |
| 1440 × 900 | MacBook Pro | Desktop identical |
| 1920 × 1080 | External monitor | Desktop identical |

---

## 6. Risk & Rollback

- **Risk tinggi:** Sprint 2 shell refactor. Kalau sidebar drawer + tab bar bug, **revert** hanya Sprint 2 commit — Sprint 1 tetap berjalan baik.
- **Rollback plan:** tiap sprint merge dengan `--no-ff` supaya commit history jelas; tiap sprint strict branch name. Rollback via `git revert <merge-commit>`.
- **CSS regression:** semua perubahan dalam `@media` query block. Worst case, hapus block tersebut → kembali ke state sebelum sprint.

---

## 7. Sumber acuan

- `docs/mobile-first-dashboard-research.md` (research data dari Exa MCP)
- `.kiro/steering/dashboard-ui-guidelines.md` (design system rules)
- `docs/dashboard-design-system.md` (type scale + tokens)
- `docs/PROJECT-CONTEXT.md` (codebase overview)

_Ditulis 10 Mei 2026 setelah full audit `Onboarding.tsx` + `Dashboard.tsx` + `AppShell.tsx` + `globals.css`. Siap dieksekusi per sprint._
