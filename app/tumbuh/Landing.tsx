import Image from "next/image";
import Link from "next/link";
import { ArrowRight, HeartHandshake, ShieldCheck } from "lucide-react";

import type { Screen } from "./types";

export function Landing({
  go: _go,
  startHref,
}: {
  go: (screen: Screen) => void;
  startHref: string;
}) {
  return (
    <section className="landing" id="home">
      <div className="home-hero-top">
        <div className="home-title-group">
          <h1>Pahami dari langkah kecil.</h1>
          <div className="care-team">
            <span>Orang tua</span>
            <span>Terapis</span>
            <span>Sekolah</span>
          </div>
        </div>
        <div className="home-intro-card">
          <p>
            Tumbuh adalah ruang aman bagi Anda. Catat momen kecilnya setiap hari
            tanpa beban, dan biarkan kami merangkainya jadi panduan yang lebih
            jelas.
          </p>
          <Link className="primary-button" href={startHref}>
            Mulai buat roadmap
          </Link>
        </div>
      </div>
      <div className="home-photo-wrap">
        <Image
          src="/images/hero_bonding_moment.png"
          alt="Ibu dan anak berinteraksi hangat di rumah yang tenang"
          className="home-hero-image"
          width={1280}
          height={853}
          priority
        />
        <div className="hero-caption-card">
          <HeartHandshake size={22} />
          <div>
            <strong>Catatan dari rutinitas nyata</strong>
            <p>
              Perkembangan terbesar justru sering berawal di rumah, dari hal-hal
              kecil yang hanya disadari oleh orang tua.
            </p>
          </div>
        </div>
      </div>

      <section className="home-section narrative-problem" id="problem">
        <p className="overline">Tantangan Sehari-hari</p>
        <h2>Anda tidak harus mencari arah sendirian.</h2>
        <div className="narrative-text">
          <p>
            Pernah merasa bingung harus melakukan apa setelah pulang dari sesi
            konsultasi terapi? Banyak momen kemajuan terjadi di rumah, namun
            sulit diingat detailnya saat bertemu dokter. Buku penghubung
            sekolah, resep dokter, dan observasi harian sering tercecer,
            membuat Anda makin kewalahan.
          </p>
        </div>
      </section>

      <section className="home-section side-by-side-workflow" id="workflow">
        <div className="workflow-text-content">
          <p className="overline">Cara Kerja</p>
          <h2>Dari cerita ke langkah nyata</h2>
          <p className="workflow-subtitle">
            Tumbuh dirancang untuk hari-hari yang tidak selalu rapi. Mulai dari
            satu catatan kecil, lalu biarkan sistem membantu merangkai maknanya
            perlahan.
          </p>

          <div className="workflow-list">
            {[
              [
                "01",
                "Mulai dengan perkenalan",
                "Isi rentang usia, kondisi, dan area yang paling ingin Anda pahami saat ini.",
              ],
              [
                "02",
                "Ceritakan hari ini",
                "Bisa lewat teks singkat, rekaman suara saat lelah mengetik, atau foto aktivitas.",
              ],
              [
                "03",
                "Temukan pola perkembangannya",
                "Sistem merangkum cerita Anda, menunjukkan pola, dan memberi ide aktivitas sederhana.",
              ],
              [
                "04",
                "Lebih siap saat konsultasi",
                "Anda punya ringkasan yang lebih tertata untuk didiskusikan dengan profesional.",
              ],
            ].map(([number, title, body]) => (
              <div key={title} className="workflow-list-item">
                <span className="workflow-number">{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="workflow-image-collage">
          <div className="collage-img-wrap main-img">
            <Image
              src="/images/parent_writing.png"
              fill
              style={{ objectFit: "cover" }}
              alt="Orang tua mencatat dengan tenang"
            />
          </div>
          <div className="collage-img-wrap secondary-img">
            <Image
              src="/images/child_playing.png"
              fill
              style={{ objectFit: "cover" }}
              alt="Anak sedang bermain"
            />
          </div>
        </div>
      </section>

      <section className="home-section image-cards-section" id="features">
        <div className="section-heading centered-heading">
          <h2>Fokus pada hal yang terpenting</h2>
          <p>
            Tumbuh hadir agar Anda bisa bernapas sedikit lebih lega tanpa
            melupakan progres anak.
          </p>
        </div>
        <div className="image-cards-grid">
          <div className="image-card">
            <Image
              src="/images/abstract_growth.png"
              fill
              style={{ objectFit: "cover" }}
              alt="Mencatat"
            />
            <div className="card-glass-content">
              <h3>Mencatat tanpa tuntutan sempurna</h3>
              <p>
                Tulis sesingkat mungkin, rekam keluhan, atau kirim foto tanpa
                ada format rumit yang harus diisi.
              </p>
            </div>
          </div>
          <div className="image-card">
            <Image
              src="/images/doctor_consulting.png"
              fill
              style={{ objectFit: "cover" }}
              alt="Konsultasi"
            />
            <div className="card-glass-content">
              <h3>Lebih tenang saat bertemu terapis</h3>
              <p>
                Bawa ringkasan bulanan yang rapi untuk bahan diskusi yang jauh
                lebih produktif.
              </p>
            </div>
          </div>
          <div className="image-card">
            <Image
              src="/images/parent_child_hands.png"
              fill
              style={{ objectFit: "cover" }}
              alt="Arah esok hari"
            />
            <div className="card-glass-content">
              <h3>Menemukan arah untuk esok hari</h3>
              <p>
                Roadmap disusun dengan kecepatan yang sesuai kondisi anak,
                tanpa perlu membandingkan.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section split-value-section" id="demo">
        <div className="split-image-container">
          <Image
            src="/images/parent_child_hands.png"
            fill
            style={{ objectFit: "cover" }}
            alt="Parent and child hands"
          />
        </div>
        <div className="split-content">
          <h2>Langkah praktis yang mudah dicoba</h2>
          <p className="split-subtitle">
            Anda tidak perlu menjadi ahli. Tumbuh menerjemahkan observasi
            keseharian menjadi pilihan tindakan yang lebih tenang dan praktis.
          </p>

          <div className="value-list">
            {[
              [
                "Ruang catatan manusiawi",
                "Boleh berantakan, boleh singkat. Yang terpenting, kejadian penting tidak terlewat.",
              ],
              [
                "Roadmap yang menemani",
                "Target perkembangan beradaptasi dengan ritme anak Anda yang unik.",
              ],
              [
                "Pengingat non-judgemental",
                "Dibuat sebagai ajakan lembut untuk melihat pola, bukan alarm yang membuat panik.",
              ],
            ].map(([title, body]) => (
              <div key={title} className="value-list-item">
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
          <Link
            className="secondary-button"
            href="/dashboard"
            style={{ marginTop: "32px" }}
          >
            Jelajahi dashboard demo
          </Link>
        </div>
      </section>

      <section className="home-section ethics-banner" id="safety">
        <div className="ethics-content">
          <ShieldCheck size={48} className="ethics-icon" />
          <h2>Mendampingi, bukan mendiagnosis.</h2>
          <p>
            Tumbuh hadir sebagai pendamping, bukan pengganti profesional medis.
            Semua insight hadir sebagai referensi diskusi Anda bersama
            profesional. Kendali penuh atas data sensitif, foto, dan dokumen
            anak tetap berada di tangan Anda dengan enkripsi.
          </p>
        </div>
      </section>

      <section className="home-section home-final-cta">
        <h2>Mulai kapan pun Anda siap.</h2>
        <p>
          Mulailah dari satu kejadian kecil yang Anda ingat hari ini. Dari
          sana, kita akan menyusun langkah berikutnya bersama-sama.
        </p>
        <div>
          <Link className="primary-button" href={startHref}>
            Mulai kenalkan anak Anda
            <ArrowRight size={18} />
          </Link>
          <Link className="secondary-button" href="/backend">
            Spesifikasi Backend
          </Link>
        </div>
      </section>

      <footer className="site-footer">
        <strong>Tumbuh</strong>
        <span>
          Tempat orang tua menyusun cerita, melihat pola, dan menemukan harapan
          di setiap langkah kecil.
        </span>
        <nav>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/roadmap">Roadmap</Link>
          <Link href="/progress">Catatan</Link>
          <Link href="/consultation">Konsultasi</Link>
        </nav>
      </footer>
    </section>
  );
}
