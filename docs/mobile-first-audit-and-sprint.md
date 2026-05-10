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

### 🟢 Sprint 1 — Mobile-first foundation (CSS-only, zero JSX change)

**Goal:** Halaman onboarding + dashboard terasa jauh lebih baik di 360-640 px tanpa menyentuh komponen React. Desktop 1280+ **identik** dengan sebelum.

**Branch:** `feat/mobile-first-phase-1`

**Pre-flight**
- [ ] Verifikasi git state clean: `git status`
- [ ] `git checkout main && git pull && git checkout -b feat/mobile-first-phase-1`

**P1 — Viewport + safe area (global)**
- [ ] Tambah `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />` di `app/layout.tsx` head
- [ ] Test cold reload di iPhone (or DevTools emulator) — `env(safe-area-inset-bottom)` returns > 0 di PWA test
- [ ] Tambah CSS root helper (tidak wajib):

```css
:root {
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}
```

**P2 — Fix iOS input zoom (global form)**
- [ ] Tambah rule:

```css
@media (max-width: 900px) {
  input,
  select,
  textarea,
  .onboarding-fields input,
  .onboarding-fields select {
    font-size: 16px;
  }
}
```

- [ ] Test di iOS Safari real device / simulator: fokus input nama di onboarding step 1 → **tidak zoom auto**.

**P3 — Onboarding footer mobile-safe**
- [ ] Remove `backdrop-filter: blur(8px)` dari `.onboarding-footer`
- [ ] Set `background: var(--surface-solid)` + `border-top: 1px solid var(--line)`
- [ ] Tambah `padding-bottom: max(var(--space-4), env(safe-area-inset-bottom))`
- [ ] Di `@media (max-width: 900px)`: grid → `flex-direction: column-reverse` (primary "Lanjut" di atas "Kembali") atau adjust DOM order
- [ ] Test di iPhone viewport: "Lanjut" tidak ketutup home indicator

**P4 — Onboarding small-device tweaks**
- [ ] `@media (max-width: 420px)`:
  - [ ] `.onboarding-screen { padding: 0 12px 128px }`
  - [ ] `.onboarding-topbar { padding: 0 12px }`
- [ ] `@media (max-width: 900px)`:
  - [ ] `.onboarding-topbar button { min-height: 44px; min-width: 44px; padding: 0 12px }`
  - [ ] `.onboarding-mode { padding-top: env(safe-area-inset-top) }`
- [ ] Compact focus card: `@media (max-width: 900px) { .focus-option-card { min-height: 160px } }`
- [ ] Ensure `.review-card` collapse ke 1-col di ≤ 640 px

**P5 — Dashboard mobile refinement**
- [ ] Append block `@media (max-width: 640px)` dengan:

```css
.workspace {
  padding-left: max(var(--space-4), env(safe-area-inset-left));
  padding-right: max(var(--space-4), env(safe-area-inset-right));
}
.metric-grid {
  grid-template-columns: 1fr;
  gap: var(--space-3);
}
.workspace-header {
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-3);
}
.dash-hero-img { display: none; }
.dash-hero { padding: var(--space-5); }
.dash-hero h1 { font-size: 22px; line-height: 1.2; }
.dash-hero .primary-button { width: 100%; justify-content: center; }
.chart-modern { height: 180px; }
.dash-auth-reminder { flex-direction: column; align-items: stretch; }
.dash-action-item .ghost-button { min-height: 44px; }
.qn-sheet { padding-bottom: max(var(--space-4), env(safe-area-inset-bottom)); }
```

- [ ] Di `@media (max-width: 900px)`: `.workspace { border-radius: 0 }`

**P6 — Reduced motion guard (optional polish)**
- [ ] Wrap transitions di `.diagnosis-option`, `.focus-option-card` dalam:

```css
@media (prefers-reduced-motion: no-preference) {
  .diagnosis-option { transition: ...; }
}
```

**QA Sprint 1**
- [ ] Test viewport 360 px: onboarding step 1-4 tanpa horizontal scroll
- [ ] Test viewport 360 px: dashboard scroll vertical only, semua card muat
- [ ] Test iOS Safari real device atau Chrome DevTools iPhone 13 simulation:
  - [ ] Input focus tidak zoom
  - [ ] Onboarding "Lanjut" button tidak ketutup
  - [ ] PWA install → bottom tidak ada strip putih
- [ ] Test desktop 1280/1440/1920: semua visual **identik** dengan sebelum
- [ ] Run `npm run build` atau `npm run lint` — no error
- [ ] Screenshots: capture before/after di 360 / 640 / 1280 px untuk dokumentasi

**Commit & push**
- [ ] Strict commit: `fix(mobile): add viewport-fit, safe-area insets, and iOS zoom fix for onboarding + dashboard`
- [ ] Commit body: list P1-P6 yang diubah
- [ ] Push ke `feat/mobile-first-phase-1`
- [ ] **Tunggu konfirmasi user "fix" sebelum merge ke main**

---

### 🟡 Sprint 2 — Mobile shell: hamburger drawer + bottom tab bar

**Goal:** Di ≤ 900 px, sidebar jadi drawer off-canvas, muncul hamburger top bar, muncul bottom tab bar 5 item. Desktop tetap sidebar 250 px persistent.

**Branch:** `feat/mobile-first-phase-2` (branched dari Sprint 1 setelah merge)

**Pre-flight**
- [ ] Merge Sprint 1 ke main, `git checkout main && git pull`
- [ ] Branch baru `feat/mobile-first-phase-2`

**P1 — Komponen baru**
- [ ] `app/tumbuh/MobileTopBar.tsx` — minimal:
  - [ ] Brand + hamburger button (`aria-label="Buka menu"`, `aria-expanded`, `aria-controls="mobile-sidebar"`)
  - [ ] Hidden via CSS `display: none` di desktop
  - [ ] Height 56 px + `env(safe-area-inset-top)`
- [ ] `app/tumbuh/MobileTabBar.tsx` — minimal:
  - [ ] 5 tab: Dashboard, Roadmap, Catatan, Edukasi, Lainnya
  - [ ] "Lainnya" opens drawer berisi Konsultasi + Pengaturan
  - [ ] `role="tablist"`, `role="tab"` di item, `aria-selected` sesuai `screen`
  - [ ] Height 64 px + `env(safe-area-inset-bottom)`

**P2 — AppShell refactor**
- [ ] Tambah state `mobileNavOpen` + handler di `AppShell.tsx`
- [ ] Render `<MobileTopBar />` + `<MobileTabBar />` di semua viewport (CSS-toggled)
- [ ] Wrap `.sidebar` dengan class conditional `is-open`
- [ ] Tambah backdrop element (`.sidebar-backdrop`) dengan toggle class
- [ ] Focus trap basic: saat drawer open, focus pertama-nya ke close button, escape untuk close

**P3 — CSS mobile shell**
- [ ] `@media (max-width: 900px)`:
  - [ ] `.sidebar { position: fixed; transform: translateX(-100%); transition: transform 240ms ease; z-index: 40; background: var(--surface-solid) }`
  - [ ] `.sidebar.is-open { transform: translateX(0) }`
  - [ ] `.sidebar-backdrop` + `.is-open`
  - [ ] `.product-shell { padding-bottom: calc(64px + env(safe-area-inset-bottom)) }`
  - [ ] `.workspace { border-radius: 0 }`
  - [ ] Hide existing sidebar auto-collapse (`grid-template-columns` hack yang ada sekarang di `.sidebar-section`)
- [ ] Tab bar CSS (lihat research doc § 3.3)

**P4 — Body scroll lock saat drawer open**
- [ ] Saat `mobileNavOpen`, set `body { overflow: hidden }` — cegah content scroll di background

**QA Sprint 2**
- [ ] Drawer buka dari hamburger, close dari backdrop tap + Escape key
- [ ] Tab bar active state sync dengan `screen`
- [ ] "Lainnya" tab membuka submenu (sheet)
- [ ] Desktop ≥ 901 px: tidak muncul topbar / tabbar / drawer
- [ ] Focus trap: Tab key di drawer tidak escape ke konten di belakang
- [ ] Reduced motion: transisi `transform` di-disable

**Commit & push**
- [ ] `feat(mobile): hamburger drawer + bottom tab bar for mobile shell`
- [ ] Tunggu konfirmasi user

---

### 🔵 Sprint 3 — Polish + PWA (opsional)

**Goal:** nice-to-have untuk production mobile.

- [ ] FAB "Catat hari ini" — muncul di dashboard mobile only (lihat research doc § 3.5)
- [ ] Swipe-to-close drawer (native gesture)
- [ ] PWA manifest (`public/manifest.webmanifest`)
- [ ] Apple touch icon, splash screens
- [ ] `display: standalone`, theme color match `--teal-dark`
- [ ] Service worker basic (offline shell — optional)
- [ ] Test install PWA di iOS Safari → home screen → standalone launch OK

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
