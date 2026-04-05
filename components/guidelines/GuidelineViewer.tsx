"use client";

import { cn } from "@/lib/utils/cn";
import type { BrandData } from "@/lib/analysis/brand-extract";

interface Props {
  data: BrandData;
  onEdit: () => void;
}

export function GuidelineViewer({ data, onEdit }: Props) {
  const primaryHex = data.colours.find((c) => /primary|main|brand/i.test(c.usage ?? ""))?.hex ?? data.colours[0]?.hex ?? "#e8650a";
  const validHex = /^#[0-9a-fA-F]{3,8}$/.test(primaryHex) ? primaryHex : "#e8650a";

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 pt-16 pb-6 flex flex-col gap-10">

        {/* Identity */}
        <div className="flex flex-col gap-2">
          {data.printDigital && (
            <span className="font-mono text-[9px] tracking-widest text-[var(--color-text-tertiary)] border border-[var(--color-border)] px-2 py-0.5 rounded-full w-fit">
              {data.printDigital.toUpperCase()}
            </span>
          )}
          <h1 className="text-3xl font-semibold" style={{ color: validHex }}>
            {data.brandName || "—"}
          </h1>
          {data.summary && (
            <p className="font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-prose">{data.summary}</p>
          )}
        </div>

        {/* Colours */}
        {data.colours.length > 0 && (
          <ViewSection label="COLOURS">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {data.colours.map((c, i) => {
                const valid = /^#[0-9a-fA-F]{3,8}$/.test(c.hex);
                return (
                  <div key={i} className="glass-subtle rounded-xl overflow-hidden">
                    <div className="h-12" style={{
                      background: valid ? c.hex : "repeating-linear-gradient(-45deg,#ccc 0,#ccc 2px,transparent 0,transparent 50%) 0 0/8px 8px",
                    }} />
                    <div className="px-2 py-1.5">
                      <p className="font-mono text-[10px] font-medium text-[var(--color-text-primary)] truncate">{c.name || "—"}</p>
                      <p className="font-mono text-[9px] text-[var(--color-text-tertiary)]">{c.hex}</p>
                      {c.usage && <p className="font-mono text-[9px] text-[var(--color-text-secondary)] mt-0.5 truncate">{c.usage}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </ViewSection>
        )}

        {/* Typography */}
        {data.fonts.length > 0 && (
          <ViewSection label="TYPOGRAPHY">
            <div className="flex flex-col gap-2">
              {data.fonts.map((f, i) => (
                <div key={i} className="glass-subtle rounded-xl px-4 py-3">
                  <p className="text-base font-semibold text-[var(--color-text-primary)]">{f.name || "—"}</p>
                  <div className="flex gap-4 mt-1 flex-wrap">
                    {f.usage && <p className="font-mono text-[10px] text-[var(--color-accent)]">{f.usage}</p>}
                    {f.weights && <p className="font-mono text-[10px] text-[var(--color-text-tertiary)]">{f.weights}</p>}
                  </div>
                  {f.note && <p className="font-mono text-[10px] text-[var(--color-text-secondary)] mt-1">{f.note}</p>}
                </div>
              ))}
            </div>
          </ViewSection>
        )}

        {/* Logo */}
        {(data.logo.primaryUrl || data.logo.variants.length > 0 || data.logo.description) && (
          <ViewSection label="LOGO">
            {data.logo.primaryUrl && (
              <div className="rounded-xl border border-[var(--color-border)] p-6 flex items-center justify-center bg-[var(--color-surface-raised)]/30">
                <img src={data.logo.primaryUrl} alt="Primary logo" className="max-h-24 max-w-full object-contain" />
              </div>
            )}
            {data.logo.description && (
              <p className="font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed">{data.logo.description}</p>
            )}
            {data.logo.variants.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.logo.variants.map((v, i) => {
                  const assetUrl = data.logo.variantAssets?.[v];
                  return (
                    <div key={i} className="glass-subtle rounded-lg px-3 py-1.5 flex items-center gap-2">
                      {assetUrl && <img src={assetUrl} alt={v} className="h-5 object-contain" />}
                      <span className="font-mono text-[10px] text-[var(--color-text-secondary)]">{v}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {data.logo.rules.length > 0 && <BulletView items={data.logo.rules} />}
          </ViewSection>
        )}

        {/* Tone of Voice */}
        {(data.toneOfVoice.weAre.length > 0 || data.toneOfVoice.weAreNot.length > 0) && (
          <ViewSection label="TONE OF VOICE">
            <div className="grid grid-cols-2 gap-3">
              {data.toneOfVoice.weAre.length > 0 && (
                <div className="glass-subtle rounded-xl px-4 py-3">
                  <p className="font-mono text-[10px] text-[var(--color-accent)] tracking-widest mb-2">WE ARE</p>
                  <ul className="flex flex-col gap-1">
                    {data.toneOfVoice.weAre.map((t, i) => (
                      <li key={i} className="font-mono text-xs text-[var(--color-text-primary)]">{t}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.toneOfVoice.weAreNot.length > 0 && (
                <div className="glass-subtle rounded-xl px-4 py-3">
                  <p className="font-mono text-[10px] text-[var(--color-high-risk)] tracking-widest mb-2">WE ARE NOT</p>
                  <ul className="flex flex-col gap-1">
                    {data.toneOfVoice.weAreNot.map((t, i) => (
                      <li key={i} className="font-mono text-xs text-[var(--color-text-secondary)] line-through">{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {data.toneOfVoice.examples.length > 0 && (
              <div className="glass-subtle rounded-xl px-4 py-3">
                <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] tracking-widest mb-2">EXAMPLES</p>
                <ul className="flex flex-col gap-1.5">
                  {data.toneOfVoice.examples.map((t, i) => (
                    <li key={i} className="font-mono text-xs text-[var(--color-text-secondary)] italic">&ldquo;{t}&rdquo;</li>
                  ))}
                </ul>
              </div>
            )}
          </ViewSection>
        )}

        {/* Photography */}
        {(data.photography.style || data.photography.rules.length > 0 || (data.photography.references?.length ?? 0) > 0) && (
          <ViewSection label="PHOTOGRAPHY">
            {data.photography.style && (
              <p className="font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed">{data.photography.style}</p>
            )}
            {data.photography.rules.length > 0 && <BulletView items={data.photography.rules} />}
            {(data.photography.references?.length ?? 0) > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {data.photography.references!.map((url, i) => (
                  <div key={i} className="rounded-xl overflow-hidden bg-[var(--color-surface-raised)]/30 aspect-video">
                    <img src={url} alt={`Photography reference ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </ViewSection>
        )}

        {/* Spacing */}
        {(data.spacing.gridSystem || data.spacing.rules.length > 0) && (
          <ViewSection label="SPACING / GRID">
            {data.spacing.gridSystem && (
              <p className="font-mono text-xs text-[var(--color-text-secondary)]">{data.spacing.gridSystem}</p>
            )}
            {data.spacing.rules.length > 0 && <BulletView items={data.spacing.rules} />}
          </ViewSection>
        )}

        {/* Other */}
        {data.other.length > 0 && (
          <ViewSection label="OTHER STANDARDS">
            <BulletView items={data.other} />
          </ViewSection>
        )}

        <button
          onClick={onEdit}
          className="self-start font-mono text-xs px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors rounded-lg"
        >
          EDIT_GUIDELINES
        </button>
      </div>
    </div>
  );
}

function ViewSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] tracking-[0.18em] border-b border-[var(--color-border)] pb-2 uppercase">{label}</p>
      {children}
    </div>
  );
}

function BulletView({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.filter(Boolean).map((item, i) => (
        <li key={i} className={cn("flex items-start gap-2 font-mono text-[10px] text-[var(--color-text-secondary)]")}>
          <span className="text-[var(--color-accent)] shrink-0 mt-0.5">&gt;</span>
          {item}
        </li>
      ))}
    </ul>
  );
}
