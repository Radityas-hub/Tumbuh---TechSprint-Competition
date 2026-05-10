# Mobile-First Dashboard — Research & Implementation Guide

> Riset + blueprint transformasi dashboard Tumbuh ke mobile-first **tanpa merusak versi desktop**. Pendekatan: CSS media query progressive enhancement (bukan refactor JSX). Semua sumber di akhir doc. Riset dilakukan via Exa MCP (May 2026).

## 0. TL;DR — Bagaimana dashboard harus berubah di mobile

| Aspek | Desktop (saat ini) | Mobile (target ≤ 640 px) | Teknik |
|---|---|---|---|
| Shell | `250px sidebar + workspace (padding-left: 250px)` | Top header 56 px + **bottom tab bar** 64 px; sidebar jadi drawer off-canvas | `@media (max-width: 900px)` |
| Metric grid | 4 kolom | 1 kolom stack (bukan 2 — hindari value kepotong) | `grid-template-columns: 1fr` |
| `.dash-bento` | 2 kolom | 1 kolom, urutan DOM tidak diubah | sudah ada |
| Hero `.dash-hero` | 32 px padding, image 180 px | 20 px padding, image 120 px / disembunyikan | sudah ada |
| `.dashboard-grid` 3-col | `repeat(3, 1fr)` | `1fr`, panel `grid-column: span 2` jadi auto | sudah ada |
| Chart 7 kolom | 240 px tinggi | 180 px, horizontal overflow scroll bila perlu | baru |
| Touch target | mixed | **≥ 44 px tinggi**, gap ≥ 8 px | baru |
| Typography | body 14 px, h1 30 px | body 14 px, h1 24 px, KPI ≤ 24 px | sudah ada |
| Safe area | — | `env(safe-area-inset-bottom)` di bottom nav | baru |

**Pesan utama:** mayoritas layout Tumbuh sudah responsive via existing breakpoint 1280/900/600. Yang benar-benar hilang: **bottom nav untuk thumb reach**, **touch target ≥ 44 px**, **safe area insets**, dan **hamburger toggle** untuk sidebar. Tidak ada refactor JSX wajib — cukup tambah 1 tombol toggle + CSS.

---

## 1. Current-state audit (dari codebase)

Baseline yang sudah ada di `app/globals.css` dan `AppShell.tsx`:

```css
.product-shell {
  padding-left: 250px;         /* Reserve sidebar rail on desktop */
}
.sidebar {
  position: fixed;
  left: 0; top: 0;
  width: 250px;
  height: 100vh;
  z-index: 10;
}
.workspace {
  padding: var(--space-8) var(--space-8) var(--space-12);
  border-top-left-radius: var(--radius-lg);  /* 36 px */
}
```

Breakpoint yang sudah ada:

- `max-width: 1280px` → `.dashboard-grid` 3→2 kolom
- `max-width: 1120px` → `.admin-page-shell` single column, dsb
- `max-width: 900px` → `.product-shell` padding-left: 0, `.sidebar` jadi `position: relative; width: 100%`, `.dash-bento` 1 kolom, `.workspace` padding mengecil
- `max-width: 760px` → `.dash-hero` padding 20 px
- `max-width: 600px` → `.qn-backdrop` sheet dari bawah (QuickNote)

**Gap utama yang teridentifikasi:**

1. Di `≤ 900 px`, sidebar dipaksa `position: relative; width: 100%` → artinya ia jadi **block di atas konten** (ambil 500+ px vertical). Jelek buat 375 px iPhone.
2. `.sidebar-link` `min-height: 48px` sudah lolos WCAG AAA 44 px — bagus. Tapi `.text-button` dan `.ghost-button` tidak punya min-height eksplisit (berisiko < 32 px).
3. Tidak ada `viewport-fit=cover` + `env(safe-area-inset-*)`. PWA iPhone akan dapat strip putih di bawah.
4. Tidak ada hamburger/toggle sehingga sidebar mobile = blok panjang statis di atas workspace.
5. `.workspace` tetap `border-top-left-radius: 36px` meski di mobile full-width — radius ini "pincang" karena tidak ada sidebar kanan sebagai pasangan.
6. `.dashboard-grid` → 1 kolom di 900 px, tapi `.wide-panel { grid-column: span 2 }` tidak di-reset di single-column (span 2 di grid 1-col secara visual aman, tapi tetap harus override untuk jelas).

---

## 2. Research findings — inti yang mempengaruhi keputusan

### 2.1 Mobile dashboard adalah pattern tersendiri, bukan desktop di-shrink
Nielsen Norman Group (NN/g) Mobile UX 2024 dan "Mobile Intranets and Enterprise Apps" menekankan bahwa mobile dashboard **harus didesain spesifik mobile**, bukan degradasi desktop. Arup case study: "we didn't take our desktop designs and restyle them for decreasing screen sizes" karena bandwidth dan density tidak cocok. (NN/g PDF, 2024.)

> Content rephrased untuk kesesuaian lisensi.

**Implication Tumbuh:** kita tidak refactor IA (struktur menu, urutan info) — kita hanya transform layout shell. Tapi waspada: vertical scrolling > horizontal panning untuk dashboard data (NN/g 2024).

### 2.2 Layout pattern: Mobile-First Card Stack (Pattern 12 datawirefra.me)
Untuk mobile ≤ 640 px: **single column full-width card**, vertical scroll, urutan ruthless by priority. 4-6 item prioritas maksimal di viewport pertama. Desktop Tumbuh sudah punya `.dash-bento` 2-col yang collapse ke 1-col di 900 px — sejalan dengan pattern ini.

### 2.3 Sidebar → bottom nav / drawer
Ada 3 pattern sah di 2024-2026:

1. **Off-canvas drawer** (hamburger) — shadcn `Sheet side="left"` (DesignRevision 2026, Vacademy GitHub pattern). Pattern `hidden md:block` untuk persistent sidebar + `Sheet` di mobile.
2. **Bottom tab bar** — 3-5 destinasi utama. Direkomendasikan Material + Apple HIG untuk thumb reach, shift industry (Smashing Thumb Zone 2016, Parachute 2025, Aaron Usiskin LinkedIn 2025).
3. **Hybrid** — bottom nav 4-5 item utama + hamburger "Lainnya" untuk extra.

**Rekomendasi Tumbuh:** **Hybrid (option 3).** 6 item nav (dashboard, roadmap, catatan, edukasi, konsultasi, pengaturan) > 5, dan edukasi/konsultasi frekuensi rendah. Solusi:

- Bottom tab di mobile: Dashboard, Roadmap, Catatan, Edukasi, **Lainnya** (membuka drawer berisi Konsultasi + Pengaturan).
- Desktop tetap sidebar 6 item penuh, zero regresi.

### 2.4 Touch target — aturan yang harus tidak dilanggar
Hierarki standar (Humanstandards.org, W3C, web.dev):

| Standar | Ukuran | Level | Unit |
|---|---|---|---|
| WCAG 2.5.8 | 24×24 | AA | CSS px |
| WCAG 2.5.5 | 44×44 | AAA | CSS px |
| Apple HIG | 44×44 | — | pt |
| Material Design 3 | 48×48 | — | dp |

**Target Tumbuh:** 44 px minimum untuk semua tombol interaktif di mobile (aim AAA). Spacing antar target ≥ 8 px. Technique: visual button boleh 24 px, tapi extend hit area via padding atau pseudo-element.

Khusus bottom nav: NN/g Touch Design Hoober research merekomendasikan **12 mm / 46 px di area bawah layar** (karena jempol stretch ke bawah lebih susah). Kita pakai 48 px min tab height.

### 2.5 Thumb zone (Steven Hoober / Smashing 2016)
- Green zone: bottom 40-50% layar — primary action di sini.
- Yellow zone: tengah-atas sides — secondary.
- Red zone: top corners — destructive / low-freq.

**Implication Tumbuh:**

- "Catat hari ini" (primary CTA dashboard) → sticky FAB di mobile, bottom-right 16 px dari edge + safe-area-inset-bottom.
- Alert spotlight & quick actions tetap di tengah (in-between zone, OK karena scroll).
- Hamburger / "Lainnya" → bottom-right dalam nav, bukan top-left (menyalahi pattern umum — *lihat catatan di §3.3*).

### 2.6 Safe area iOS (PWA-ready)
WebKit (Horton 2017), MDN env(), StackOverflow PWA 2026:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

```css
.bottom-nav {
  padding-bottom: max(12px, env(safe-area-inset-bottom));
}
.workspace {
  padding-left: max(var(--space-4), env(safe-area-inset-left));
  padding-right: max(var(--space-4), env(safe-area-inset-right));
}
```

Catatan penting dari GitHub rcarmo/piclaw PWA guide: `env(safe-area-inset-bottom)` kadang reset 0px setelah SPA client-nav pada iOS standalone mode. Safeguard: pakai `max(12px, env(...))` sehingga fallback tetap aman.

### 2.7 Media queries vs container queries
(freeCodeCamp 2024, Mantlr 2026, design.dev 2025)

- **Media queries** untuk page-level layout: sidebar→bottom nav, grid 4→1, hide/show sidebar. **Gunakan ini untuk Tumbuh sekarang.**
- **Container queries** untuk komponen reusable yang dipakai di beberapa konteks (misal `MetricCard` dipakai di dashboard + di panel sempit). Bisa layer nanti (Phase 2).

**Keputusan:** Fase 1 pakai media queries saja. Container queries masuk Fase 2 kalau kita mulai reuse komponen di sidebar/main atau layout split.

### 2.8 Typography mobile
(NN/g, appdeck 2026, Humanstandards)

- Body ≥ 14 px (design system Tumbuh: 14 px ✓)
- KPI value ≥ 24 px, ≤ 28 px (design system Tumbuh: 26 px ✓)
- h1 mobile 24 px (Tumbuh punya `clamp(24px, 3vw, 30px)` ✓)
- Line-height body ≥ 1.5 (Tumbuh 1.55 ✓)

Typography sudah aman, nothing to change.

---

## 3. Transformasi per-komponen (spec)

### 3.1 Shell (AppShell)

**Desktop (≥ 901 px) — tidak berubah.**
**Mobile (≤ 900 px):**

```css
@media (max-width: 900px) {
  .product-shell {
    padding-left: 0;
    padding-bottom: calc(64px + max(12px, env(safe-area-inset-bottom)));
    min-height: 100vh;
    min-height: 100dvh;   /* modern viewport unit */
  }

  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    transform: translateX(-100%);
    transition: transform 240ms ease;
    width: min(280px, 85vw);
    z-index: 40;
    background: var(--surface-solid);
    padding: calc(var(--space-6) + env(safe-area-inset-top)) var(--space-4) var(--space-6);
  }

  .sidebar.is-open {
    transform: translateX(0);
  }

  .sidebar-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(16, 35, 31, 0.35);
    z-index: 30;
    opacity: 0;
    pointer-events: none;
    transition: opacity 200ms ease;
  }

  .sidebar-backdrop.is-open {
    opacity: 1;
    pointer-events: auto;
  }

  .workspace {
    border-radius: 0;
    padding: var(--space-6) var(--space-4) var(--space-8);
  }
}
```

- Mobile dapat **top app bar 56 px** berisi brand + hamburger (komponen baru `MobileTopBar`).
- **Bottom tab bar** 64 px fixed untuk 5 item nav utama.
- Sidebar desktop tetap persistent sesuai behavior sekarang.

### 3.2 Top app bar mobile

Komponen baru, hanya dirender via CSS visibility di mobile:

```tsx
<header className="mobile-topbar" role="banner">
  <button
    className="mobile-topbar-menu"
    aria-label="Buka menu navigasi"
    aria-expanded={open}
    aria-controls="mobile-sidebar"
    onClick={() => setOpen(true)}
  >
    <Menu size={22} />
  </button>
  <span className="mobile-topbar-brand">Tumbuh</span>
</header>
```

```css
.mobile-topbar { display: none; }

@media (max-width: 900px) {
  .mobile-topbar {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    position: sticky;
    top: 0;
    z-index: 20;
    height: calc(56px + env(safe-area-inset-top));
    padding: env(safe-area-inset-top) var(--space-4) 0;
    background: var(--surface-solid);
    border-bottom: 1px solid var(--line);
  }
  .mobile-topbar-menu {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin-left: -8px;   /* align 16px grid (icon center = 16px from edge) */
    border-radius: var(--radius-sm);
    background: transparent;
  }
  .mobile-topbar-menu:active { background: var(--bg-strong); }
  .mobile-topbar-brand { font-weight: 700; font-size: 16px; }
}
```

### 3.3 Bottom tab bar mobile

5 item: Dashboard, Roadmap, Catatan, Edukasi, Lainnya. "Lainnya" membuka drawer yang menampilkan Konsultasi + Pengaturan.

```css
.mobile-tabs { display: none; }

@media (max-width: 900px) {
  .mobile-tabs {
    position: fixed;
    inset: auto 0 0 0;
    z-index: 30;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0;
    height: calc(64px + env(safe-area-inset-bottom));
    padding-bottom: env(safe-area-inset-bottom);
    background: var(--surface-solid);
    border-top: 1px solid var(--line);
  }
  .mobile-tab {
    display: grid;
    place-items: center;
    gap: 2px;
    min-height: 48px;
    padding: 8px 4px;
    color: var(--muted);
    font-size: 11px;
    font-weight: 500;
    background: transparent;
    border: none;
  }
  .mobile-tab.is-active { color: var(--teal-dark); }
  .mobile-tab > svg { width: 22px; height: 22px; }
}
```

Aksesibilitas: `role="tablist"` di container, `role="tab"` + `aria-selected` di setiap tombol, keyboard navigation pakai arrow keys (bonus, optional).

### 3.4 Dashboard content

Sudah mostly collapse dengan bagus di `@media (max-width: 900px)`. Tambahan yang perlu:

```css
@media (max-width: 640px) {
  /* Metric grid: 2 cols terlalu sempit untuk angka 26 px + label */
  .metric-grid {
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }

  /* Workspace header: stack tombol + heading */
  .workspace-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
  }

  /* Hero hide illustration, prioritaskan teks */
  .dash-hero-img { display: none; }
  .dash-hero { padding: var(--space-5); }
  .dash-hero h1 { font-size: 22px; line-height: 1.2; }

  /* Pulse dots: scroll horizontal kalau 7 kolom terlalu sempit */
  .dash-pulse-dots {
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
  }
  .dash-pulse-dots::-webkit-scrollbar { display: none; }
  .dash-dot-col { scroll-snap-align: center; min-width: 44px; }

  /* Chart turunkan tinggi supaya tidak makan hero space */
  .chart-modern { height: 180px; }

  /* Primary CTA full width */
  .dash-hero .primary-button { width: 100%; justify-content: center; }
}
```

### 3.5 FAB "Catat hari ini" (optional — thumb zone boost)

Kalau kita mau primary action selalu dalam green zone:

```css
.dash-fab { display: none; }

@media (max-width: 640px) {
  .dash-fab {
    display: grid;
    place-items: center;
    position: fixed;
    right: var(--space-4);
    bottom: calc(64px + var(--space-4) + env(safe-area-inset-bottom));
    z-index: 20;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--teal-dark);
    color: #fff;
    border: none;
  }
}
```

Status: **opsional Fase 2**, karena bottom nav + tombol di hero sudah cukup. Kalau A/B test conversion "Catat hari ini" rendah di mobile, baru aktifkan.

### 3.6 QuickNote sheet
Sudah ada `@media (max-width: 600px) { .qn-backdrop { align-items: flex-end; } }` — bottom sheet. Tinggal pastikan:

```css
@media (max-width: 600px) {
  .qn-sheet {
    padding-bottom: max(var(--space-4), env(safe-area-inset-bottom));
  }
}
```

### 3.7 Roadmap & Progress
- `.roadmap-layout` sudah collapse `1fr` di 1120 px (via `grid-template-columns: 1fr` override).
- `.entry-card` collapse di 600 px.
- `.roadmap-strip 4-col` → `1fr` di 600 px sudah ada.

Tambahan untuk Progress di ≤ 640:
- Area filter chip horizontal-scroll (supaya tidak wrap jelek):

```css
@media (max-width: 640px) {
  .progress-areas-bar {
    overflow-x: auto;
    scrollbar-width: none;
    padding-bottom: 4px;
  }
  .progress-areas-bar::-webkit-scrollbar { display: none; }
  .progress-areas-bar > * { flex: 0 0 auto; }
}
```

### 3.8 Education & Consultation
`.education-layout` dan `.consult-grid` sudah collapse di 1120/900. Tambahan: kalau chatbot "Tanya Tumbuh AI" sedang aktif, pastikan input sticky bottom dengan safe-area padding.

---

## 4. Breakpoint strategy final

| Breakpoint | Nama | Target device | Layout switch |
|---|---|---|---|
| ≤ 360 px | xs | iPhone SE 1st gen | 1-col, padding mengecil ke 12 px |
| ≤ 640 px | sm | smartphone default | Metric 1-col, hero image hidden, chart 180 px |
| ≤ 900 px | md | tablet portrait, phablet | Sidebar → drawer, bottom nav muncul, `.dashboard-grid` 1-col |
| ≤ 1120 px | lg | tablet landscape / small laptop | `.admin-page-shell`, `.roadmap-layout`, `.education-layout` collapse |
| ≤ 1280 px | xl | laptop | `.dashboard-grid` 3→2 col |
| ≥ 1281 px | 2xl | desktop | Full experience (4 col metric, 3 col grid, 250 px sidebar) |

Perubahan dari existing: yang sudah ada tinggal dilengkapi (≤ 640 xs tier baru). **Tidak menghapus atau mengubah breakpoint ≥ 900 px** → desktop 100% aman.

---

## 5. Implementation phases (minim-risk, progressive)

### Phase 1 — CSS only (no JSX change, 1-2 jam kerja)
- Tambah `@media (max-width: 640px)` block baru khusus mobile refinement: metric 1-col, chart 180 px, hero image hidden, primary button full-width, chip bar horizontal scroll.
- Tambah `viewport-fit=cover` di `app/layout.tsx` `<meta name="viewport">`.
- Tambah `env(safe-area-inset-*)` di `.workspace`, `.qn-sheet`.
- **Desktop 100% tidak tersentuh.** Zero risk.

### Phase 2 — Shell mobile (JSX + CSS, 3-5 jam)
- Tambah `MobileTopBar` + `MobileTabBar` komponen baru.
- Refactor `AppShell.tsx`: sidebar wrapped dengan state `open`, backdrop, `is-open` class.
- Hamburger + bottom tab hanya render di ≤ 900 px via CSS (komponen di-mount di semua viewport, hidden via `display: none` di desktop — ringan, no `useMediaQuery` needed).
- Tambahkan `aria-expanded`, `aria-controls`, focus trap saat drawer open.

### Phase 3 — Polish & PWA (opsional)
- FAB `Catat hari ini` di dashboard mobile.
- Swipe gesture untuk close drawer (optional — library kecil atau custom 15-line).
- Install PWA manifest + standalone mode testing.
- Container queries untuk `MetricCard`, `.panel` reusable supaya bisa dipakai di sidebar-small layout future.

---

## 6. Desktop non-regression checklist

Sebelum merge, verifikasi tampilan **tidak berubah** di:

- [ ] 1920 × 1080 (desktop 2xl)
- [ ] 1440 × 900 (MacBook)
- [ ] 1280 × 800 (laptop breakpoint threshold)
- [ ] 1024 × 768 (iPad landscape — masih tampil sidebar 250 px? cek `.product-shell`)
- [ ] 901 × 800 (tepat di atas breakpoint md; jangan ada flicker)

Cara kerja aman: semua CSS baru berada di dalam `@media (max-width: XXX)` block. Kalau viewport > 900 px, tidak ada rule baru yang match. Workspace, sidebar, metric grid, bento — semua tetap identik byte-for-byte dengan state sekarang.

---

## 7. Pre-ship checklist (mobile)

Styling:
- [ ] 360 px tidak ada horizontal scroll selain elemen yang sengaja scroll (chip bar, pulse dots)
- [ ] Semua tombol ≥ 44 px tinggi
- [ ] Semua gap antar tombol ≥ 8 px
- [ ] Tidak ada teks body < 14 px
- [ ] Bottom nav tidak menutupi konten (ada padding-bottom di `.product-shell`)
- [ ] Safe area bottom filled saat PWA iOS (background bottom nav extends ke home indicator)
- [ ] Skeleton loading tetap bekerja di mobile (sudah ada `@media (prefers-reduced-motion: reduce)`)

Interaksi:
- [ ] Drawer open dari hamburger, close dari backdrop + escape
- [ ] Bottom tab active state sesuai `screen` dari `useTumbuhSession`
- [ ] "Lainnya" membuka drawer panel sheet dari bawah
- [ ] FAB (jika diaktifkan) tidak overlap bottom nav — z-index benar

Performance:
- [ ] No shadow, no backdrop-filter di mobile (sudah dilarang di design system)
- [ ] Transisi hanya `transform` + `opacity` (sudah)
- [ ] Font already loaded dari Google Fonts, gunakan `font-display: swap`

Accessibility (WCAG 2.2 AA, targeting AAA untuk touch):
- [ ] Kontras teks body ≥ 4.5:1 (design tokens sudah lolos)
- [ ] `role="banner"` di MobileTopBar, `role="tablist"` di MobileTabBar
- [ ] `aria-label` di hamburger dan FAB
- [ ] Focus visible: `outline: 2px solid var(--teal); outline-offset: 2px;`
- [ ] Reduced motion respected (hamburger animasi `transition: none`)

---

## 8. Sumber riset (Exa MCP, May 2026)

UX patterns:
- [Growth-onomics — How to Design Mobile KPI Dashboards (Feb 2025)](https://growth-onomics.com/blog/how-to-design-mobile-kpi-dashboards/)
- [datawirefra.me — 12 Dashboard Layout Patterns (Mar 2026)](https://datawirefra.me/blog/dashboard-layout-patterns)
- [AppDeck — Executive Dashboard Design Best Practices (Mar 2026)](https://appdeck.com/blog/executive-dashboard-design-best-practices)
- [UX Patterns for Developers — Dashboard Layout](https://uxpatterns.dev/patterns/data-display/dashboard)
- [UX Patterns for Developers — Card Grid](https://uxpatterns.dev/patterns/data-display/card-grid)
- [UI Potion — Sidebar Navigation (Mar 2026)](https://uipotion.com/potions/components/sidebar-navigation)
- [Vibe Coder — Dashboard Layout Patterns (Apr 2026)](https://blog.vibecoder.me/dashboard-layout-patterns-sidebar-topbar-cards)

Nielsen Norman Group:
- [Mobile Intranets and Enterprise Apps (PDF)](https://media.nngroup.com/media/reports/free/Mobile_Intranets_and_Enterprise_Apps.pdf)

Implementasi CSS:
- [Reintech — Creating a Responsive Dashboard with CSS (Oct 2023)](https://reintech.io/blog/creating-responsive-dashboard-with-css)
- [Medium — Professional Dashboard: From CSS Grid to Complete PWA (Jul 2025)](https://medium.com/uxdworld/building-a-professional-dashboard-from-css-grid-to-complete-pwa-45b0d455d28c)
- [DesignRevision — Build a Dashboard with shadcn/ui (Feb 2026)](https://designrevision.com/blog/shadcn-dashboard-tutorial)
- [GitHub Vacademy-io — Responsive Implementation](https://github.com/Vacademy-io/frontend-admin-dashboard/blob/main/RESPONSIVE_IMPLEMENTATION.md)

Touch targets & accessibility:
- [W3C WCAG 2.1 SC 2.5.5 — Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size)
- [W3C Mobile A11y — M002 Touch Target Size](https://w3c.github.io/Mobile-A11y-TF-Note/Techniques/M002)
- [web.dev — Accessible Tap Targets](https://web.dev/articles/accessible-tap-targets)
- [Google — Android Touch Target](https://support.google.com/accessibility/android/answer/7101858?hl=en)
- [Human Standards — Targets & Spacing](https://www.humanstandards.org/ergonomics/targets-spacing/)
- [Human Standards — Touch Targets Design Tokens](https://www.humanstandards.org/code-design-tokens/touch-targets-spacing/)

Thumb zone:
- [Smashing Magazine — The Thumb Zone (Ingram, 2016)](https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/)
- [Parachute Design — Mastering the Thumb Zone](https://parachutedesign.ca/blog/thumb-zone-ux/)
- [LinkedIn Aaron Usiskin — Designing for the Thumb (Mar 2025)](https://www.linkedin.com/pulse/designing-thumb-why-more-ux-designers-should-zone-aaron-usiskin-gtrte)

Safe area iOS / PWA:
- [WebKit — Designing Websites for iPhone X (Horton, 2017)](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
- [MDN — env() CSS function](https://developer.mozilla.org/en-US/docs/web/css/env)
- [Jip Frijlink — Supporting iOS Safe Areas](https://jipfr.nl/blog/supporting-ios-web/)
- [Marketur — Fixed Bottom Navigation in WordPress PWA (Mar 2026)](https://marketur.net/fixed-bottom-navigation-wordpress-pwa/)
- [GitHub rcarmo/piclaw — PWA docs](https://github.com/rcarmo/piclaw/blob/main/docs/PWA.md)
- [StackOverflow — iOS PWA White gap bottom nav (Mar 2026)](https://stackoverflow.com/questions/79902310/ios-pwa-add-to-home-screen-white-gap-below-bottom-navigation-bar-100dvh-does)

Container queries:
- [freeCodeCamp — Media Queries vs Container Queries (Jun 2024)](https://freecodecamp.org/news/media-queries-vs-container-queries)
- [Mantlr — CSS Container Queries Practical Guide (Apr 2026)](https://mantlr.com/blog/css-container-queries-practical-guide-examples)
- [design.dev — CSS Container Queries Guide (Dec 2025)](https://design.dev/guides/css-container-queries/)
- [DevToolbox — CSS Container Queries 2026](https://devtoolbox.dedyn.io/blog/css-container-queries-guide)

Tambahan case study parenting / caregiver:
- [Idea Usher — Build Special Needs Support App (Mar 2026)](https://ideausher.com/blog/build-special-needs-support-app-tracto/)
- [ParentPod app](https://parentpodapp.com/)

Semua kutipan telah diparafrase untuk kepatuhan lisensi. Angka dan rekomendasi standar (44 px, 48 px, breakpoint numerik) dikutip langsung dari spesifikasi W3C, Apple HIG, dan Material Design.

---

## 9. Appendix — diff preview CSS (Phase 1 only)

Ini yang akan masuk di `app/globals.css` kalau kita langsung eksekusi Fase 1. Zero perubahan desktop.

```css
/* Tambahan di akhir file globals.css */

/* iOS safe areas — aktif di semua viewport, no-op saat env() = 0 */
.workspace {
  padding-left: max(var(--space-8), env(safe-area-inset-left));
  padding-right: max(var(--space-8), env(safe-area-inset-right));
}

/* Mobile refinement — belum ada sebelumnya */
@media (max-width: 640px) {
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

  .dash-pulse-dots {
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
  }
  .dash-pulse-dots::-webkit-scrollbar { display: none; }
  .dash-dot-col { scroll-snap-align: center; min-width: 44px; }

  .chart-modern { height: 180px; }

  .qn-sheet {
    padding-bottom: max(var(--space-4), env(safe-area-inset-bottom));
  }
}
```

Tambahan di `<head>` (`app/layout.tsx`):

```tsx
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, viewport-fit=cover"
/>
```

Setelah merge Fase 1 dan diverifikasi di desktop (1280/1440/1920), Fase 2 bisa dikerjakan di branch terpisah `feat/mobile-shell`.

---

_Compiled on 10 May 2026 via Exa MCP research. Riset diringkas dan diparafrasekan untuk kepatuhan lisensi. Semua sumber dan angka standar bersumber langsung dari spesifikasi otoritatif (W3C, Apple, Material, WebKit, MDN) atau artikel teknis publik._
