import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export const metadata = { title: "Brand Sense — Platform Guidelines" };

const COLOURS = [
  { name: "Primary", hex: "#e8650a", label: "Accent / CTA" },
  { name: "Surface", hex: "#f5f5f5", label: "Background surface" },
  { name: "Chrome", hex: "#3a3a3a", label: "Headers / chrome" },
  { name: "Text", hex: "#1a1a1a", label: "Body text" },
  { name: "Border", hex: "#d0d0d0", label: "Borders" },
  { name: "Strong", hex: "#2e7d46", label: "Positive / strength" },
  { name: "Risk", hex: "#b83030", label: "Errors / risk" },
];

export default function BrandPage() {
  return (
    <main className="min-h-dvh flex flex-col bg-[var(--color-bg)] scanlines">
      <header className="border-b border-[var(--color-border)] px-6 py-3 flex items-center justify-between bg-[var(--color-surface-raised)]">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft size={11} />
          BACK
        </Link>
        <span className="font-mono text-xs tracking-widest text-[var(--color-chrome)]">BRAND_SENSE</span>
        <span className="font-mono text-xs text-[var(--color-text-tertiary)]">BRAND_GUIDELINES</span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-10">

          <div className="flex flex-col gap-2">
            <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] tracking-widest">&gt; PLATFORM_GUIDELINES // v1.0</p>
            <h1 className="text-2xl font-semibold">
              <span className="chrome-text">Brand Sense</span>
            </h1>
            <p className="font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Reference standards for all Brand Sense platform assets and communications.
            </p>
          </div>

          {/* Colours */}
          <Section label="COLOUR_PALETTE">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {COLOURS.map((c) => (
                <div key={c.hex} className="border border-[var(--color-border)] overflow-hidden">
                  <div className="h-12" style={{ backgroundColor: c.hex }} />
                  <div className="px-2 py-2 bg-[var(--color-surface-raised)]">
                    <p className="font-mono text-[10px] text-[var(--color-text-primary)]">{c.name}</p>
                    <p className="font-mono text-[9px] text-[var(--color-text-tertiary)]">{c.hex}</p>
                    <p className="font-mono text-[9px] text-[var(--color-text-secondary)] mt-0.5">{c.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Typography */}
          <Section label="TYPOGRAPHY">
            <div className="flex flex-col gap-3">
              <TypeRow name="Geist Sans" usage="UI, body copy, headings" weight="300–700" note="Primary typeface. Variable font. Available via next/font/google." />
              <TypeRow name="Geist Mono" usage="Code, labels, metadata, all-caps UI" weight="400–700" note="Monospaced. All tracking-widest labels use this." />
              <div className="border border-[var(--color-border)] px-4 py-3 bg-[var(--color-surface-raised)]">
                <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] tracking-widest mb-2">SCALE // PLACEHOLDER</p>
                <div className="flex flex-col gap-1">
                  {[
                    { size: "text-2xl", label: "H1 — Page titles" },
                    { size: "text-xl", label: "H2 — Section titles" },
                    { size: "text-base", label: "Body — Primary copy" },
                    { size: "text-sm", label: "Body SM — Secondary copy" },
                    { size: "text-xs font-mono", label: "MONO XS — Labels, metadata" },
                    { size: "text-[10px] font-mono", label: "MONO 2XS — Tertiary labels" },
                  ].map((s) => (
                    <div key={s.label} className={`${s.size} text-[var(--color-text-primary)]`}>{s.label}</div>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Logo */}
          <Section label="LOGO_USAGE">
            <div className="border border-dashed border-[var(--color-border)] flex flex-col items-center gap-3 py-12 text-[var(--color-text-tertiary)]">
              <div className="font-mono text-sm tracking-widest text-[var(--color-chrome)]">BRAND_SENSE</div>
              <p className="font-mono text-[10px] text-center px-4 leading-relaxed">
                Logo placeholder. Upload SVG/PNG variants here.<br />
                Light bg, dark bg, monochrome, and reversed versions required.
              </p>
            </div>
            <div className="flex flex-col gap-2 mt-3">
              <Rule text="Minimum size: 120px wide in digital contexts." />
              <Rule text="Clear space: equal to the height of the 'B' character on all sides." />
              <Rule text="Never stretch, rotate, recolour, or apply effects to the logo." />
              <Rule text="On photography: use the reversed (white) version only." />
            </div>
          </Section>

          {/* Tone of voice */}
          <Section label="TONE_OF_VOICE">
            <div className="flex flex-col gap-3">
              <div className="border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3">
                <p className="font-mono text-[10px] text-[var(--color-accent)] tracking-widest mb-2">WE ARE //</p>
                <div className="flex flex-col gap-1">
                  {["Direct. Say what you mean.", "Specific. No vague generalities.", "Confident. Not arrogant.", "Honest. Including when something is wrong."].map((t) => (
                    <p key={t} className="font-mono text-xs text-[var(--color-text-primary)]">&gt; {t}</p>
                  ))}
                </div>
              </div>
              <div className="border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3">
                <p className="font-mono text-[10px] text-[var(--color-high-risk)] tracking-widest mb-2">WE ARE NOT //</p>
                <div className="flex flex-col gap-1">
                  {["Generic. ('Elevate your brand.')", "Fluffy. ('Amazing results!')", "Jargon-heavy without purpose.", "Passive or hedging."].map((t) => (
                    <p key={t} className="font-mono text-xs text-[var(--color-text-secondary)] line-through">{t}</p>
                  ))}
                </div>
              </div>
              <div className="border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3">
                <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] tracking-widest mb-2">EXAMPLE_COPY // PLACEHOLDER</p>
                <p className="font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed italic">
                  "Your CTA says 'Learn more.' That tells the visitor nothing. Replace it with what actually happens when they click."
                </p>
              </div>
            </div>
          </Section>

          {/* Photography */}
          <Section label="PHOTOGRAPHY">
            <div className="flex flex-col gap-2">
              <Rule text="Real people, real environments. No stock photo aesthetic." />
              <Rule text="Natural light preferred. Avoid heavy flash or studio-flat lighting." />
              <Rule text="Colour grade: desaturated slightly, warm midtones. No oversaturated filters." />
              <Rule text="Composition: leave breathing room. Avoid centre-cropped uniformity." />
              <Rule text="Subjects should feel candid, not posed." />
            </div>
            <div className="border border-dashed border-[var(--color-border)] flex items-center justify-center py-16 mt-3">
              <p className="font-mono text-[10px] text-[var(--color-text-tertiary)]">PHOTOGRAPHY_EXAMPLES // ADD_HERE</p>
            </div>
          </Section>

          <p className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
            BRAND_SENSE_GUIDELINES // v1.0 // LAST_UPDATED: 2026-04
          </p>

        </div>
      </div>
    </main>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] tracking-widest">{label} //</p>
      {children}
    </div>
  );
}

function TypeRow({ name, usage, weight, note }: { name: string; usage: string; weight: string; note: string }) {
  return (
    <div className="border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 flex flex-col gap-0.5">
      <p className="text-sm font-medium text-[var(--color-text-primary)]">{name}</p>
      <p className="font-mono text-[10px] text-[var(--color-text-secondary)]">{usage} // Weight {weight}</p>
      <p className="font-mono text-[10px] text-[var(--color-text-tertiary)]">{note}</p>
    </div>
  );
}

function Rule({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="font-mono text-[10px] text-[var(--color-accent)] shrink-0 mt-0.5">&gt;</span>
      <p className="font-mono text-[10px] text-[var(--color-text-secondary)] leading-relaxed">{text}</p>
    </div>
  );
}
