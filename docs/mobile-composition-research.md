# Mobile Composition Research — CSS-Only Edition

> Sister doc dari `mobile-first-dashboard-research.md`. Fokus: **mengubah komposisi konten di mobile via CSS-only** — zero JSX change, zero komponen baru, zero JavaScript baru. Riset via Exa MCP, May 2026.
>
> **Konteks:** Setelah Sprint 1-3 diselesaikan (viewport, safe-area, shell mobile), user flag bahwa kita baru "shrink + stack". Doc pertama (v1) mengusulkan 7 komponen mobile-only yang berat. Setelah trade-off review + preferensi user untuk **CSS-only**, doc ini direvisi jadi **fondasi Sprint 4 CSS-only**.
>
> **Aturan main Sprint 4:**
> 1. Tidak menambahkan komponen React baru.
> 2. Tidak mengubah markup JSX yang sudah ada.
> 3. Tidak menambah JavaScript (no refs, no state, no useMediaQuery).
> 4. Semua perubahan dalam `@media` block → desktop 100% identik.
> 5. Tradeoff yang ada harus disebut explicit — tidak boleh "hope it works".

## 0. TL;DR — 5 pattern yang kepake

| Pattern | Teknik CSS kunci | Trade-off utama |
|---|---|---|
| Section reorder | `display: flex` + `order` pada container | Bikin tab order visual ≠ DOM. Harus hati di keyboard a11y. |
| Stat strip horizontal carousel | `overflow-x: auto` + `scroll-snap-type: x mandatory` | Discoverability: card ke-2+ tersembunyi sampai swipe. |
| Hero compact (hide + line-clamp) | `display: none` + `-webkit-line-clamp` | Content narrative hilang di mobile. |
| Truncate target list | `:nth-child(n+2) { display: none }` | Target #2+ benar-benar hilang (no expand option). |
| Insight teaser line-clamp | `-webkit-line-clamp: 2 + overflow: hidden` | Butuh fallback manual kalau browser kuno (< 96% support). |

**Keputusan paradigma:** sacrifice *optionality* (progressive disclosure, inline compose) demi *zero risk + zero maintenance*. Kalau kita nanti butuh expand / compose / disclosure, ini tetap bisa upgrade ke JSX tanpa breaking existing CSS.

---

## 1. Prinsip dasar: apa yang CSS bisa & apa yang tidak

CSS di 2026 sangat capable untuk mobile composition, tapi ada hard limit:

**Bisa dilakukan pure CSS:**
- Ubah urutan visual elemen (`order`, `flex-direction: column-reverse`, `grid-template-areas`)
- Sembunyikan elemen di viewport tertentu (`display: none`, `visibility: hidden`)
- Mengubah dimensi, spacing, warna, typography per-viewport
- Horizontal carousel (scroll-snap)
- Text truncation multi-line (`-webkit-line-clamp`)
- Select subset elemen via `:nth-child`, `:nth-of-type`, `:is`, `:not`
- Transisi + animation (transform, opacity)

**TIDAK bisa pure CSS:**
- Mengubah urutan DOM (untuk tab order + screen reader reading order) — butuh JSX restructure atau JS manipulation.
- State management (expand/collapse, form state) — butuh `<details>`/`<summary>` atau JS.
- Move element dari satu parent ke parent lain — CSS `order` hanya dalam 1 container, tidak bisa lintas.
- Interaktif event handling (klik chip → pre-select area form) — butuh JS.
- Dynamic content loading atau filtering — butuh JS.

Sumber prinsip ini: [MDN — Ordering flex items (2025)](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Flexible_box_layout/Ordering_items), [Smashing Magazine — Content Choreography (Bradley, 2013)](https://smashingmagazine.com/2013/04/maintain-hierarchy-content-choreography).

Implikasi: segala item di doc v1 yang butuh "expand button", "inline compose chip", atau "pre-select area" **tidak cocok CSS-only**. Kita skip atau downgrade.

---

## 2. Pattern 1: Section reordering via `order`

### Sumber
- [MDN — Ordering flex items (2025)](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Flexible_box_layout/Ordering_items)
- [StackOverflow — Change order elements with CSS in responsive mode](https://stackoverflow.com/questions/26255240/change-order-elements-with-css-in-responsive-mode)

### Teknik

Parent di-set `display: flex; flex-direction: column` di mobile. Tiap anak tinggal diberi `order` berdasarkan prioritas baru.

```css
@media (max-width: 640px) {
  .dash {
    display: flex;
    flex-direction: column;
  }
  .dash-spotlight { order: -1; }    /* paling atas kalau ada */
  .dash-hero { order: 0; }
  .dash-bento { order: 1; }
  .dash-auth-reminder { order: 2; }
}
```

Elemen dengan `order` default = 0. Spotlight di set `order: -1` = muncul duluan. Kalau spotlight tidak di-render (conditional JSX), `order` nggak bikin reserved space — safe.

### Aturan aksesibilitas (kritis)

MDN secara eksplisit mengutip spec W3C:

> "Authors must not use order or the *-reverse values of flex-flow/flex-direction as a substitute for correct source ordering, as that can ruin the accessibility of the document."

— Parafrase untuk compliance.

Artinya:
- **Tab order tidak berubah** — keyboard user akan lompat ke spotlight setelah hero walaupun visual spotlight di atas.
- **Screen reader reading order** mengikuti DOM, bukan `order`.
- Untuk kasus small tweaks (seperti Tumbuh dashboard: spotlight muncul duluan karena urgency), ini umumnya acceptable karena urutan logis masih masuk akal. Kalau user tab pertama masuk ke hero CTA ("Catat hari ini") lebih dulu, itu masih OK sebenarnya — primary action memang di hero.
- **Rule of thumb MDN:** "Keep the logical order the same as the reading and tab order of the document. Then use `order` for purely visual design tweaks. Don't reorder items that receive keyboard focus."

### Keputusan Tumbuh

- ✅ Spotlight `order: -1` di mobile: aman karena spotlight hanya render kalau ada alert urgent. Jumping dari tab spotlight→hero→bento masih logis.
- ⚠️ Hindari pakai `order` untuk reorder interactive items (buttons, form fields).

---

## 3. Pattern 2: Horizontal scroll-snap stat carousel

### Sumber
- [CSS-Tricks — CSS-Only Carousel (Hamilton, 2020)](https://css-tricks.com/css-only-carousel/)
- [CSS-Tricks — CSS Carousels (Apr 2025)](https://css-tricks.com/css-carousel/)
- [modern-css.com — CSS scroll snap, no carousel JS](https://modern-css.com/scroll-snapping-without-a-carousel-library/)
- [nieknijland.nl — Make a responsive carousel with just CSS (Jan 2024)](https://www.nieknijland.nl/blog/make-a-responsive-carousel-with-just-css)
- [CodingChefs — Scroll Snap Carousel](https://codingchefs.com/articles/create-a-smooth-scroll-snap-carousel-with-html-css-without-javascript)

### Teknik

Ubah `.metric-grid` dari 4-col grid menjadi flex scroll container di mobile. Card existing tinggal diberi width 72vw + scroll-snap-align. Zero markup change.

```css
@media (max-width: 640px) {
  .metric-grid {
    display: flex;
    grid-template-columns: none;
    gap: var(--space-3);
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding-inline: var(--space-4);
    margin-inline: calc(var(--space-4) * -1);
    scroll-padding-left: var(--space-4);
    scroll-behavior: smooth;
  }
  .metric-grid::-webkit-scrollbar { display: none; }

  .metric-card {
    flex: 0 0 72vw;
    max-width: 260px;
    min-width: 220px;
    scroll-snap-align: start;
  }
}
```

### Design decisions

1. **72vw width** — berdasarkan Niek Nijland 2024: "flex: 0 0 80%" atau sekitar 72-80% viewport. Kita pakai 72vw supaya **ada preview card berikutnya ~28% viewport**, memberi affordance visual bahwa ada lebih.
2. **`max-width: 260px`** — mencegah card terlalu lebar di tablet landscape 900 px (yang masih masuk breakpoint 640 via media query).
3. **`min-width: 220px`** — mencegah card terlalu sempit di iPhone SE (320 × 568 × 2 = 640).
4. **`scroll-snap-align: start`** — card snap ke kiri viewport. Alternatif `center` juga OK tapi `start` lebih konvensional untuk dashboard KPI (user baca kiri ke kanan).
5. **`scrollbar-width: none` + webkit-scrollbar display: none** — hide scrollbar biar clean. Hati: di desktop ≥ 641 px, ini tidak berlaku karena di luar `@media`.
6. **`padding-inline + margin-inline` negative** — pattern "bleed ke edge viewport" — card overflow ke tepi layar, bukan dibatasi padding workspace. Tanpa ini, card terlihat cramped di center.
7. **`scroll-behavior: smooth`** — JS-free momentum scroll. Tapi perlu respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .metric-grid { scroll-behavior: auto; }
}
```

### Trade-off

1. **Discoverability**: user baru mungkin tidak tahu ada card lain. Mitigasi via preview pattern (72vw, bukan 100%).
2. **No dot indicator** — CSS-only dot indicator butuh anchor trick + IntersectionObserver atau `:target`. Over-engineer untuk scope ini. Kalau butuh, pakai scroll marker CSS Overflow Level 5 (`::scroll-marker`, Chrome 135+, tapi belum cross-browser).
3. **Keyboard** — arrow key native scrollable tapi kurang discoverable. Tambahkan `tabindex="0"` + `role="region" aria-label="Ringkasan metrik"` pada container via JSX (bisa Sprint 5 kalau dibutuhkan).
4. **Screen reader** — semua card ada di DOM, jadi SR user dapat baca semua. Tidak ada loss info.

### Browser support

Scroll-snap GA di Chrome 69+, Safari 11+, Firefox 68+, iOS Safari 11+. **Support > 96%** (caniuse 2026). Zero fallback needed untuk Tumbuh user base (browser modern).

---

## 4. Pattern 3: Hero compact via hide + line-clamp

### Sumber
- [MDN — line-clamp (2026)](https://developer.mozilla.org/en-US/docs/Web/CSS/line-clamp)
- [LogRocket — How to truncate text in CSS (Okere, Jun 2025)](https://blog.logrocket.com/truncate-text-css)
- [Brian Treese — CSS Text Truncation guide (2023)](https://briantree.se/css-only-single-and-multiline-text-truncation/)

### Teknik

Dash hero existing punya:
- `h1` greeting
- `p` narrative (~2-3 baris)
- `primary-button` "Catat hari ini"
- `img` ilustrasi 180 px (sudah hidden di Sprint 1)

Di mobile, narrative paragraph (2-3 baris) bisa:
- **Option A:** Hidden semua (`display: none`) → paling hemat vertical space tapi kehilangan konteks
- **Option B:** Line-clamp ke 1-2 baris → pertahankan sedikit konteks

Pilih **Option B**:

```css
@media (max-width: 640px) {
  .dash-hero {
    padding: var(--space-4);
    gap: var(--space-3);
  }

  .dash-hero h1 {
    font-size: 20px;
    line-height: 1.2;
  }

  .dash-hero p {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: 13px;
    margin: 0;
  }
}
```

### Browser support (critical)

MDN: `line-clamp` is part of CSS Overflow Module Level 3, **not fully standardized**, tapi `-webkit-` prefix supported di Chrome, Safari, Firefox 68+, Edge Chromium. **Support ~96%**. Untuk Tumbuh target audience (mobile parent), aman.

> "The vendor-prefixed -webkit-line-clamp property only works in combination with the display property set to -webkit-box or -webkit-inline-box and the -webkit-box-orient property set to vertical. Despite these prefixed properties being deprecated, the co-dependency of these three properties is a fully specified behavior and will continue to be supported." — MDN.

— Parafrase untuk compliance.

### Trade-off

- Narrative contains dynamic personalized content (function `dashboardNarrative(ctx, ...)`) — kalau terlalu panjang, user mobile hanya lihat 2 baris pertama. Kontent itu informatif tapi bukan critical.
- Kalau backend generate narrative yang butuh fit 3-4 baris, kita perlu pangkas di backend atau naikkan `line-clamp: 3`. Keputusan: 2 baris hemat space, 3 baris kasih konteks lebih. **Rekomendasi: 2**.

---

## 5. Pattern 4: Truncate target list via `:nth-child`

### Sumber
- [MDN — :nth-child (Apr 2026)](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:nth-child)
- [StackOverflow — nth-child untuk hide after certain index](https://stackoverflow.com/questions/25005703/how-to-use-nth-child-in-css-to-select-all-elements-after-a-certain-one)
- [StackOverflow — Switch nth-child with media queries](https://stackoverflow.com/questions/37353376/switch-nth-child-with-media-queries)

### Teknik

Dash focus list render N target. Di mobile, kita **hanya tampilkan target pertama**:

```css
@media (max-width: 640px) {
  .dash-focus-list > :nth-child(n+2) {
    display: none;
  }
}
```

Selector `:nth-child(n+2)` match anak ke-2 dan seterusnya.

### Trade-off (paling serius dari semua pattern)

Ini trade-off paling berat di doc ini. Harus diperhatikan:

1. **Pure CSS = no expand button.** Target ke-2 dan ke-3 benar-benar hilang di mobile.
2. **Implikasi bagi user:** parent mobile hanya lihat target #1. Kalau #1 tidak relevan dengan fokus mereka hari ini, user tidak bisa akses #2, #3 tanpa ke halaman Roadmap.
3. **Mitigasi yang mungkin:**
   - **(A)** Pastikan backend ranking target #1 paling relevan. Sekarang sorting pakai `sortOrder` dari `lib/roadmap-personalization.ts`. Kalau algoritma oke, #1 memang priority.
   - **(B)** Tambahkan link "Lihat semua target" ke bawah section (sudah ada di existing `.dash-focus` component!) — user selalu punya escape hatch.
   - **(C)** Kalau kita mau upgrade ke real disclosure nanti, cukup refactor `.dash-focus-list` jadi `<details>`/`<summary>` atau state React, tanpa bikin komponen baru.

4. **Accessibility impact:** screen reader user masih **dapat** baca target #2, #3 karena elemen ada di DOM (hanya `display: none` visual). Tunggu sebentar — kalau `display: none` di CSS, **juga ter-hide dari AT**. Lebih aman pakai `visibility: hidden; height: 0;` tapi itu pakai space. Atau biarkan `display: none` dan terima SR juga kehilangan info — konsisten dengan visual experience. **Keputusan:** `display: none` (konsisten).

### Alternatif yang lebih friendly (future sprint)

Kalau ternyata pattern ini merugikan UX setelah testing, upgrade ke `<details>`:

```jsx
<details className="dash-focus-accordion" open>
  <summary>Target #1 (always visible)</summary>
  Target #2, #3 (collapse)
</details>
```

Ini built-in a11y, tapi butuh markup change → bukan CSS-only lagi. Save untuk Sprint 5 kalau perlu.

---

## 6. Pattern 5: Insight line-clamp teaser

### Sumber
Sama seperti Pattern 3.

### Teknik

`.insight-text` sudah ada dengan class. Tinggal:

```css
@media (max-width: 640px) {
  .insight-text {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
```

3 baris lebih pas untuk insight (konten lebih kompleks dari narrative hero) dengan memberikan enough preview. Button "expand" yang ada di `InsightCard` component sudah bisa dipakai user untuk lihat full.

### Trade-off

Minimal. Pattern ini hanya menambahkan truncation — existing expandable behaviour tidak ter-affected.

---

## 7. Pattern 6 (bonus): Progressive hide di daily actions

### Teknik

Daily actions section sekarang render 2 activity items:

```jsx
activities.slice(0, 2).map((activity) => <div className="dash-action-item">...</div>)
```

Di mobile, kita pertahankan 1 saja:

```css
@media (max-width: 640px) {
  .dash-actions > .dash-action-item:nth-child(n+2) {
    display: none;
  }
}
```

Wait — selector `.dash-action-item:nth-child(n+2)` di `.dash-actions` mungkin match `<h2>` juga. Check markup: `.dash-actions > h2` + `.dash-action-item` (loop). `:nth-child` counts all children, jadi `:nth-child(n+2)` = h2 (1st child), activity 1 (2nd), activity 2 (3rd). Kita mau skip h2 dan activity 1, hide activity 2:

```css
@media (max-width: 640px) {
  .dash-actions > .dash-action-item + .dash-action-item {
    display: none;
  }
}
```

Selector `.dash-action-item + .dash-action-item` = action kedua yang muncul setelah action pertama (adjacent sibling). Hide ini = hanya 1 action visible di mobile.

### Trade-off

User mobile lihat 1 primary action saja. Sejalan dengan prinsip "one primary action per screen" dari research doc v1 § 2. Parent yang mau lebih banyak action tetap bisa akses via Roadmap screen.

---

## 8. Ringkasan: Sprint 4 CSS-only Plan

| # | Pattern | Effort | Risk | Impact |
|---|---|---|---|---|
| 1 | Section reorder spotlight ke atas (mobile flex + order) | 10 min | Low | High |
| 2 | Stat carousel horizontal (metric-grid → flex scroll) | 15 min | Low | High |
| 3 | Hero compact (h1 20px + p line-clamp 2 + padding 16px) | 10 min | Low | Medium |
| 4 | Focus target only show #1 (:nth-child(n+2) hide) | 5 min | Medium (user miss #2/#3) | Medium |
| 5 | Insight text line-clamp 3 | 5 min | Low | Low |
| 6 | Daily action only show 1 (adjacent sibling hide) | 5 min | Low | Medium |

**Total effort estimate:** 1 jam kerja CSS saja. Zero JSX, zero komponen baru, zero JS.

**Desktop impact:** ZERO. Semua dalam `@media (max-width: 640px)`.

### Struktur commit

Bisa single commit di branch `feat/mobile-composition-css-only`:

- `app/globals.css` — append Sprint 4 block di akhir file (pattern sama seperti Sprint 1-3)
- Zero file lain

### QA checklist

- [ ] Viewport 360-640 px:
  - [ ] Spotlight (kalau ada) muncul paling atas
  - [ ] Metric cards horizontal scroll swipe, snap ke kiri card
  - [ ] Hero h1 20 px, narrative max 2 baris
  - [ ] Focus: hanya target #1 visible
  - [ ] Insight: 3 baris max
  - [ ] Daily actions: 1 activity visible
- [ ] Viewport 900-1920 px (desktop):
  - [ ] Spotlight di posisi semula (bukan paling atas)
  - [ ] Metric grid 4-col
  - [ ] Hero h1 26 px, narrative full
  - [ ] Focus: semua target visible
  - [ ] Insight: tidak ada truncation
  - [ ] Daily actions: 2 activities visible
- [ ] TSC clean, diagnostics clean
- [ ] Reduced-motion: scroll-snap tetap snap tapi tanpa smooth scroll

---

## 9. Sumber riset (Exa MCP, May 2026)

Section reordering:
- [MDN — Ordering flex items (2025)](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Flexible_box_layout/Ordering_items)
- [Smashing Magazine — Content Choreography (2013)](https://smashingmagazine.com/2013/04/maintain-hierarchy-content-choreography)
- [StackOverflow — Change order elements responsive (2014)](https://stackoverflow.com/questions/26255240/change-order-elements-with-css-in-responsive-mode)
- [StackOverflow — Reorder divs flex box (2017)](https://stackoverflow.com/questions/45883549/how-to-reorder-divs-using-flex-box)
- [StackOverflow — Change order mobile (2022)](https://stackoverflow.com/questions/72349995/how-to-change-order-of-elements-when-device-is-mobile)
- [StackOverflow — Change ordering stacked columns mobile (2020)](https://stackoverflow.com/questions/65264460/how-to-change-ordering-of-stacked-columns-in-mobile-using-css)

Scroll-snap carousel:
- [CSS-Tricks — CSS-Only Carousel (Hamilton, 2020)](https://css-tricks.com/css-only-carousel/)
- [CSS-Tricks — CSS Carousels (Apr 2025)](https://css-tricks.com/css-carousel/)
- [modern-css.com — Scroll snap without carousel JS](https://modern-css.com/scroll-snapping-without-a-carousel-library/)
- [Niek Nijland — Responsive carousel with just CSS (Jan 2024)](https://www.nieknijland.nl/blog/make-a-responsive-carousel-with-just-css)
- [CodingChefs — Scroll Snap Carousel](https://codingchefs.com/articles/create-a-smooth-scroll-snap-carousel-with-html-css-without-javascript)

Line-clamp / text truncation:
- [MDN — line-clamp (2026)](https://developer.mozilla.org/en-US/docs/Web/CSS/line-clamp)
- [MDN — text-overflow](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-overflow)
- [LogRocket — How to truncate text in CSS (Okere, Jun 2025)](https://blog.logrocket.com/truncate-text-css)
- [Brian Treese — Single & Multi-line truncation (Oct 2023)](https://briantree.se/css-only-single-and-multiline-text-truncation/)
- [Digital Thrive — CSS Text Truncation guide](https://digitalthriveai.com/en-ie/resources/web-development/truncate-text-css/)

:nth-child / hide-on-mobile:
- [MDN — :nth-child (Apr 2026)](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:nth-child)
- [StackOverflow — nth-child after certain element (2014)](https://stackoverflow.com/questions/25005703/how-to-use-nth-child-in-css-to-select-all-elements-after-a-certain-one)
- [StackOverflow — Switch nth-child media query (2016)](https://stackoverflow.com/questions/37353376/switch-nth-child-with-media-queries)
- [StackOverflow — Hide items in ul on mobile (2015)](https://stackoverflow.com/questions/33548621/hide-2-lis-in-a-ul-on-mobile)
- [StackOverflow — nth child recipes (2018)](https://stackoverflow.com/questions/50434744/nth-child-recipes)

Semua kutipan diparafrasekan untuk compliance. Spesifikasi CSS dan pernyataan aksesibilitas dikutip langsung dari MDN + spec W3C (tercantum di § 2).

---

## 10. Yang SENGAJA di-skip dari doc v1

Untuk dokumentasi decision:

| Item doc v1 | Alasan di-skip di CSS-only version |
|---|---|
| `MobileQuickComposeChip` inline compose | Butuh JSX + event handler untuk pre-select area. Pure CSS hanya bisa fake look (::before pseudo), tidak functional. **FAB existing sudah cukup 1-tap entry.** |
| Progressive disclosure focus + button expand | Butuh state React atau `<details>`. Pure CSS `:target` ada tapi ghetto + poor a11y. **Gunakan `:nth-child(n+2) { display: none }` sebagai CSS-only alternative.** |
| `DashboardInsightMobile` teaser + sheet | Sheet butuh modal + focus trap. Insight sudah punya expandable built-in. **Cukup line-clamp.** |
| `DashboardHeroMobile` struktur beda | Alternative: hide/line-clamp elemen dengan CSS. **Yield 80% hasil dengan 20% effort.** |
| Voice logging / Siri shortcut | iOS native API, tidak CSS-relevant. **Out of scope.** |
| Dot indicators stat carousel | Butuh IntersectionObserver atau `::scroll-marker` (Chrome-only). **Skip untuk MVP.** |
| Dashboard-wide card sheet pattern (Roadmap, Education) | Scope Sprint 4 fokus dashboard. **Sprint 5 kalau diperlukan.** |

---

_Direvisi 10 Mei 2026 untuk pendekatan CSS-only. Riset tambahan via Exa MCP. Sister-docs: `mobile-first-dashboard-research.md` (foundation Sprint 1-3), `mobile-first-audit-and-sprint.md` (execution log)._
