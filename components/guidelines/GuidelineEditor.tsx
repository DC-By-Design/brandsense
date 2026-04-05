"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Check, X, Plus, Trash,
  ClockCounterClockwise, UploadSimple, ImageSquare,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { PageFooter } from "@/components/ui/PageFooter";
import { GuidelineViewer } from "@/components/guidelines/GuidelineViewer";
import type { BrandData, BrandColour, BrandFont, BrandDataHistoryEntry } from "@/lib/analysis/brand-extract";

interface Guideline {
  id: string;
  label: string;
  description: string | null;
  isPlatform: boolean;
  brandData: BrandData | null;
}

export function GuidelineEditor({ guideline }: { guideline: Guideline }) {
  const router = useRouter();
  const initial = guideline.brandData ?? emptyBrandData(guideline.label);
  const [saved, setSaved] = useState<BrandData>(initial);
  const [draft, setDraft] = useState<BrandData>(initial);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [isEditing, setIsEditing] = useState(false);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const set = (patch: Partial<BrandData>) => { setDraft((p) => ({ ...p, ...patch })); setSaveState("idle"); };

  async function save() {
    setSaving(true);
    const entries = diffHistory(saved, draft);
    const res = await fetch(`/api/guidelines/${guideline.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandData: draft, historyEntries: entries }),
    });
    setSaving(false);
    if (!res.ok) { setSaveState("error"); return; }
    const result = await res.json() as { guideline: { brandData: BrandData } };
    setSaved(result.guideline.brandData);
    setDraft(result.guideline.brandData);
    setSaveState("saved");
    setIsEditing(false);
    setTimeout(() => setSaveState("idle"), 2500);
  }

  async function uploadAsset(file: File, assetKey: string): Promise<string | null> {
    const form = new FormData();
    form.append("file", file); form.append("assetKey", assetKey);
    const res = await fetch(`/api/guidelines/${guideline.id}/assets`, { method: "POST", body: form });
    if (!res.ok) return null;
    return ((await res.json()) as { url: string }).url;
  }

  const history = (saved._history ?? []) as BrandDataHistoryEntry[];
  const primaryHex = draft.colours.find((c) => /primary|main|brand/i.test(c.usage ?? ""))?.hex ?? draft.colours[0]?.hex ?? "#e8650a";
  const validHex = /^#[0-9a-fA-F]{3,8}$/.test(primaryHex) ? primaryHex : "#e8650a";

  return (
    <main className="min-h-dvh flex flex-col bg-[var(--color-bg)] scanlines">
      <div className="fixed top-0 inset-x-0 z-30 header-strip">
        <div className="max-w-2xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <button onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 font-mono text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            <ArrowLeft size={11} /> DASHBOARD
          </button>
          <span className="font-mono text-xs tracking-widest text-[var(--color-chrome)]">BRAND_GUIDELINES</span>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setDraft(saved); setIsEditing(false); setSaveState("idle"); }}
                className="font-mono text-[10px] px-3 py-1 border border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] rounded-md transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={save}
                disabled={saving || (!isDirty && saveState !== "error")}
                className={cn(
                  "flex items-center gap-1.5 font-mono text-[10px] px-3 py-1 rounded-md transition-all",
                  saveState === "saved"
                    ? "text-[var(--color-strong)] border border-[var(--color-strong)]/40"
                    : saveState === "error"
                      ? "bg-[var(--color-high-risk)] text-white"
                      : isDirty
                        ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-bright)]"
                        : "border border-[var(--color-border)] text-[var(--color-text-tertiary)] cursor-default"
                )}>
                <Check size={10} />
                {saving ? "SAVING..." : saveState === "saved" ? "SAVED" : saveState === "error" ? "RETRY" : isDirty ? "SAVE" : "UP TO DATE"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="font-mono text-[10px] px-3 py-1 border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] rounded-md transition-colors"
            >
              EDIT
            </button>
          )}
        </div>
      </div>

      {!isEditing ? (
        <GuidelineViewer data={saved} onEdit={() => setIsEditing(true)} />
      ) : (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 pt-16 pb-6 flex flex-col gap-10">

          {/* Identity */}
          <div className="flex flex-col gap-3">
            {/* Print / Digital version */}
            <Field label="VERSION">
              <div className="flex gap-1">
                {(["both", "print", "digital"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => set({ printDigital: draft.printDigital === v ? null : v })}
                    className={cn(
                      "font-mono text-[10px] px-3 py-1 rounded-full border transition-colors",
                      draft.printDigital === v
                        ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white"
                        : "border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                    )}
                  >
                    {v.toUpperCase()}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="BRAND_NAME">
              <input value={draft.brandName ?? ""} onChange={(e) => set({ brandName: e.target.value })}
                placeholder="Brand name"
                className="text-2xl font-semibold bg-transparent border-b border-transparent hover:border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none pb-0.5 transition-colors w-full"
                style={{ color: validHex }} />
            </Field>
            <Field label="SUMMARY">
              <textarea value={draft.summary ?? ""} onChange={(e) => set({ summary: e.target.value })}
                placeholder="Brand summary — what this brand stands for, its market, its personality..."
                rows={3}
                className="w-full bg-[var(--color-surface-raised)]/40 border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none px-3 py-2 rounded-xl font-mono text-xs text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-tertiary)] leading-relaxed resize-none transition-colors" />
            </Field>
          </div>

          {/* Colours */}
          <Section label="COLOURS">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {draft.colours.map((c, i) => (
                <ColourCard key={i} colour={c}
                  onChange={(u) => set({ colours: draft.colours.map((x, xi) => xi === i ? u : x) })}
                  onRemove={() => set({ colours: draft.colours.filter((_, xi) => xi !== i) })} />
              ))}
              <button
                onClick={() => set({ colours: [...draft.colours, { name: "", hex: "#888888", usage: "" }] })}
                className="border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] min-h-[120px] rounded-xl flex flex-col items-center justify-center gap-1.5 font-mono text-[10px] text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-all">
                <Plus size={14} weight="regular" />
                ADD COLOUR
              </button>
            </div>
          </Section>

          {/* Fonts */}
          <Section label="TYPOGRAPHY">
            <div className="flex flex-col gap-2">
              {draft.fonts.map((f, i) => (
                <FontRow key={i} font={f}
                  onChange={(u) => set({ fonts: draft.fonts.map((x, xi) => xi === i ? u : x) })}
                  onRemove={() => set({ fonts: draft.fonts.filter((_, xi) => xi !== i) })} />
              ))}
              <button
                onClick={() => set({ fonts: [...draft.fonts, { name: "", usage: "", weights: "" }] })}
                className="border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] py-3 rounded-xl flex items-center justify-center gap-1.5 font-mono text-[10px] text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-all">
                <Plus size={11} /> ADD FONT
              </button>
            </div>
          </Section>

          {/* Logo */}
          <LogoSection
            logo={draft.logo}
            guidelineId={guideline.id}
            onChange={(logo) => set({ logo })}
            uploadAsset={uploadAsset}
            onSaveImmediate={async (logoData) => {
              await fetch(`/api/guidelines/${guideline.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ brandData: { logo: logoData }, historyEntries: [] }),
              });
            }}
          />

          {/* Tone of voice */}
          <Section label="TONE OF VOICE">
            <div className="flex flex-col gap-3">
              <ToneBlock heading="WE ARE" accent="text-[var(--color-accent)]"
                items={draft.toneOfVoice.weAre}
                onChange={(weAre) => set({ toneOfVoice: { ...draft.toneOfVoice, weAre } })} />
              <ToneBlock heading="WE ARE NOT" accent="text-[var(--color-high-risk)]"
                items={draft.toneOfVoice.weAreNot} strikethrough
                onChange={(weAreNot) => set({ toneOfVoice: { ...draft.toneOfVoice, weAreNot } })} />
              <ToneBlock heading="EXAMPLES" accent="text-[var(--color-text-tertiary)]"
                items={draft.toneOfVoice.examples} italic
                onChange={(examples) => set({ toneOfVoice: { ...draft.toneOfVoice, examples } })} />
            </div>
          </Section>

          {/* Photography */}
          <Section label="PHOTOGRAPHY">
            <textarea value={draft.photography.style ?? ""} rows={2}
              onChange={(e) => set({ photography: { ...draft.photography, style: e.target.value } })}
              placeholder="Photography style — lighting, mood, subject matter, colour grade..."
              className="w-full bg-[var(--color-surface-raised)]/40 border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none px-3 py-2 rounded-xl font-mono text-xs text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-tertiary)] leading-relaxed resize-none transition-colors mb-2" />
            <BulletList items={draft.photography.rules}
              onChange={(rules) => set({ photography: { ...draft.photography, rules } })} />
            <PhotographyRefs
              refs={draft.photography.references ?? []}
              guidelineId={guideline.id}
              uploadAsset={uploadAsset}
              onChange={(references) => set({ photography: { ...draft.photography, references } })}
              onSaveImmediate={async (references) => {
                await fetch(`/api/guidelines/${guideline.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ brandData: { photography: { ...draft.photography, references } }, historyEntries: [] }),
                });
              }}
            />
          </Section>

          {/* Spacing */}
          <Section label="SPACING / GRID">
            <input value={draft.spacing.gridSystem ?? ""}
              onChange={(e) => set({ spacing: { ...draft.spacing, gridSystem: e.target.value } })}
              placeholder="Grid system description..."
              className="w-full bg-[var(--color-surface-raised)]/40 border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none px-3 py-2 rounded-xl font-mono text-xs text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-tertiary)] transition-colors mb-2" />
            <BulletList items={draft.spacing.rules}
              onChange={(rules) => set({ spacing: { ...draft.spacing, rules } })} />
          </Section>

          {/* Other */}
          <Section label="OTHER STANDARDS">
            <BulletList items={draft.other} onChange={(other) => set({ other })} />
          </Section>

          {/* History */}
          {history.length > 0 && (
            <Section label="EDIT HISTORY">
              <div className="flex flex-col gap-1.5">
                {[...history].reverse().slice(0, 20).map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 glass-subtle rounded-lg px-3 py-2">
                    <ClockCounterClockwise size={11} className="text-[var(--color-text-tertiary)] shrink-0 mt-0.5" />
                    <p className="font-mono text-[10px] text-[var(--color-text-secondary)] flex-1">{entry.field}</p>
                    <p className="font-mono text-[9px] text-[var(--color-text-tertiary)] shrink-0">
                      {new Date(entry.updatedAt).toLocaleDateString()} {new Date(entry.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
      )}
      <PageFooter />
    </main>
  );
}

// ─── Photography references section ───────────────────────────────────────────

function PhotographyRefs({ refs, guidelineId, uploadAsset, onChange, onSaveImmediate }: {
  refs: string[];
  guidelineId: string;
  uploadAsset: (file: File, key: string) => Promise<string | null>;
  onChange: (refs: string[]) => void;
  onSaveImmediate: (refs: string[]) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    const key = `photo-ref-${Date.now()}`;
    const url = await uploadAsset(file, key);
    setUploading(false);
    if (url) {
      const updated = [...refs, url];
      onChange(updated);
      await onSaveImmediate(updated);
    }
  }

  return (
    <div className="flex flex-col gap-2 mt-2">
      <p className="font-mono text-[9px] text-[var(--color-text-tertiary)] tracking-widest">REFERENCE IMAGES</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {refs.map((url, i) => (
          <div key={i} className="relative group rounded-xl overflow-hidden aspect-video bg-[var(--color-surface-raised)]/30">
            <img src={url} alt={`Reference ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => {
                const updated = refs.filter((_, xi) => xi !== i);
                onChange(updated);
                onSaveImmediate(updated);
              }}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-black/60 text-white rounded-full p-0.5 transition-opacity"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] rounded-xl aspect-video flex flex-col items-center justify-center gap-1 font-mono text-[9px] text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-all disabled:opacity-40"
        >
          {uploading ? (
            <span className="animate-pulse">UPLOADING...</span>
          ) : (
            <>
              <ImageSquare size={18} weight="thin" />
              ADD PHOTO
            </>
          )}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
        className="sr-only"
      />
    </div>
  );
}

// ─── Logo section ─────────────────────────────────────────────────────────────

function LogoSection({ logo, guidelineId, onChange, uploadAsset, onSaveImmediate }: {
  logo: BrandData["logo"];
  guidelineId: string;
  onChange: (logo: BrandData["logo"]) => void;
  uploadAsset: (file: File, key: string) => Promise<string | null>;
  onSaveImmediate: (logo: BrandData["logo"]) => Promise<void>;
}) {
  const [activeVariant, setActiveVariant] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const primaryRef = useRef<HTMLInputElement>(null);
  const variantRef = useRef<HTMLInputElement>(null);

  async function handlePrimaryUpload(file: File) {
    setUploading("primary");
    const url = await uploadAsset(file, "logo-primary");
    setUploading(null);
    if (url) {
      const updated = { ...logo, primaryUrl: url };
      onChange(updated);
      await onSaveImmediate(updated);
    }
  }

  async function handleVariantUpload(file: File, variantName: string) {
    const key = `logo-variant-${variantName.toLowerCase().replace(/\s+/g, "-")}`;
    setUploading(key);
    const url = await uploadAsset(file, key);
    setUploading(null);
    if (url) {
      const updated = { ...logo, variantAssets: { ...(logo.variantAssets ?? {}), [variantName]: url } };
      onChange(updated);
      await onSaveImmediate(updated);
    }
  }

  return (
    <Section label="LOGO">
      {/* Primary */}
      <div className="flex flex-col gap-1.5">
        <p className="font-mono text-[9px] text-[var(--color-text-tertiary)] tracking-widest">PRIMARY LOGO</p>
        <button
          type="button"
          onClick={() => primaryRef.current?.click()}
          className={cn(
            "w-full rounded-xl border-2 border-dashed flex items-center justify-center transition-all",
            logo.primaryUrl ? "border-[var(--color-border)] hover:border-[var(--color-accent)] p-6" : "border-[var(--color-border)] hover:border-[var(--color-accent)] py-12",
          )}
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          {uploading === "primary" ? (
            <p className="font-mono text-[10px] text-[var(--color-accent)] animate-pulse">UPLOADING...</p>
          ) : logo.primaryUrl ? (
            <div className="relative w-full flex items-center justify-center group">
              <img src={logo.primaryUrl} alt="Primary logo" className="max-h-28 max-w-full object-contain" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="font-mono text-[10px] bg-[var(--color-bg)]/80 px-2 py-1 rounded text-[var(--color-accent)]">
                  CLICK TO REPLACE
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-[var(--color-text-tertiary)]">
              <ImageSquare size={32} weight="thin" />
              <p className="font-mono text-[10px]">UPLOAD PRIMARY LOGO</p>
              <p className="font-mono text-[9px] opacity-60">SVG · PNG · JPG · WEBP · max 5MB</p>
            </div>
          )}
        </button>
        <input ref={primaryRef} type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePrimaryUpload(f); e.target.value = ""; }}
          className="sr-only" />
      </div>

      {/* Variants */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[9px] text-[var(--color-text-tertiary)] tracking-widest">LOGO VARIANTS</p>
          <button
            onClick={() => onChange({ ...logo, variants: [...logo.variants, "New variant"] })}
            className="flex items-center gap-1 font-mono text-[9px] text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors">
            <Plus size={9} /> ADD
          </button>
        </div>

        {logo.variants.length === 0 && (
          <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] italic">No variants yet — click ADD to create one.</p>
        )}

        <div className="flex flex-col gap-2">
          {logo.variants.map((v, i) => {
            const key = `logo-variant-${v.toLowerCase().replace(/\s+/g, "-")}`;
            const assetUrl = logo.variantAssets?.[v];
            const isActive = activeVariant === v;
            const isUp = uploading === key;

            return (
              <div key={i} className="glass-subtle rounded-xl overflow-hidden">
                {/* Variant header row */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--color-border)]">
                  <input
                    value={v}
                    onChange={(e) => {
                      const name = e.target.value;
                      const newVariants = logo.variants.map((x, xi) => xi === i ? name : x);
                      const oldAssets = logo.variantAssets ?? {};
                      const newAssets: Record<string, string> = {};
                      Object.entries(oldAssets).forEach(([k, val]) => {
                        newAssets[k === v ? name : k] = val;
                      });
                      onChange({ ...logo, variants: newVariants, variantAssets: newAssets });
                    }}
                    className="flex-1 font-mono text-[10px] bg-transparent outline-none text-[var(--color-text-primary)] border-b border-transparent focus:border-[var(--color-accent)] transition-colors"
                    placeholder="Variant name"
                  />
                  <button
                    onClick={() => setActiveVariant(isActive ? null : v)}
                    className={cn("font-mono text-[9px] transition-colors px-2 py-0.5 rounded",
                      assetUrl ? "text-[var(--color-accent)]" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)]")}>
                    {isActive ? "HIDE" : "PREVIEW"}
                  </button>
                  <button
                    disabled={isUp}
                    onClick={() => { variantRef.current?.setAttribute("data-v", v); variantRef.current?.click(); }}
                    className="flex items-center gap-1 font-mono text-[9px] text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors disabled:opacity-40">
                    {isUp ? "UPLOADING..." : <><UploadSimple size={10} /> {assetUrl ? "REPLACE" : "UPLOAD"}</>}
                  </button>
                  <button onClick={() => {
                    const newVariants = logo.variants.filter((_, xi) => xi !== i);
                    const newAssets = { ...(logo.variantAssets ?? {}) };
                    delete newAssets[v];
                    onChange({ ...logo, variants: newVariants, variantAssets: newAssets });
                  }} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-high-risk)] transition-colors ml-1">
                    <X size={11} />
                  </button>
                </div>

                {/* Preview panel */}
                {isActive && (
                  <div className="flex items-center justify-center min-h-20 p-4"
                    style={{ background: /reversed|white|light/i.test(v) ? "#111" : "rgba(255,255,255,0.04)" }}>
                    {assetUrl
                      ? <img src={assetUrl} alt={v} className="max-h-16 max-w-full object-contain" />
                      : <p className="font-mono text-[10px] text-[var(--color-text-tertiary)]">No asset uploaded yet</p>
                    }
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <input ref={variantRef} type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0];
            const v = variantRef.current?.getAttribute("data-v");
            if (f && v) handleVariantUpload(f, v);
            e.target.value = "";
          }}
          className="sr-only" />
      </div>

      {/* Logo rules */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-4">
          <div className="flex-1">
            <p className="font-mono text-[9px] text-[var(--color-text-tertiary)] tracking-widest mb-1">CLEAR SPACE</p>
            <input value={logo.clearSpace ?? ""} onChange={(e) => onChange({ ...logo, clearSpace: e.target.value })}
              placeholder="e.g. 1× the cap height on all sides"
              className="w-full bg-[var(--color-surface-raised)]/40 border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none px-2 py-1.5 rounded-lg font-mono text-[10px] text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-tertiary)] transition-colors" />
          </div>
          <div className="flex-1">
            <p className="font-mono text-[9px] text-[var(--color-text-tertiary)] tracking-widest mb-1">MINIMUM SIZE</p>
            <input value={logo.minimumSize ?? ""} onChange={(e) => onChange({ ...logo, minimumSize: e.target.value })}
              placeholder="e.g. 24px / 8mm"
              className="w-full bg-[var(--color-surface-raised)]/40 border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none px-2 py-1.5 rounded-lg font-mono text-[10px] text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-tertiary)] transition-colors" />
          </div>
        </div>
        <textarea value={logo.description ?? ""} rows={2}
          onChange={(e) => onChange({ ...logo, description: e.target.value })}
          placeholder="Logo description — construction, meaning, correct usage..."
          className="w-full bg-[var(--color-surface-raised)]/40 border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none px-3 py-2 rounded-xl font-mono text-xs text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-tertiary)] leading-relaxed resize-none transition-colors" />
        <BulletList items={logo.rules} onChange={(rules) => onChange({ ...logo, rules })} label="DO'S AND DON'TS" />
      </div>
    </Section>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] tracking-[0.18em] border-b border-[var(--color-border)] pb-2 uppercase">{label}</p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-mono text-[9px] text-[var(--color-text-tertiary)] tracking-widest uppercase">{label}</p>
      {children}
    </div>
  );
}

function ColourCard({ colour, onChange, onRemove }: {
  colour: BrandColour; onChange: (c: BrandColour) => void; onRemove: () => void;
}) {
  const valid = /^#[0-9a-fA-F]{3,8}$/.test(colour.hex);
  return (
    <div className="glass-subtle rounded-xl overflow-hidden relative group">
      <button onClick={onRemove}
        className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover:opacity-100 text-white/80 hover:text-white bg-black/40 rounded-full p-0.5 transition-all">
        <X size={10} />
      </button>
      {/* Colour swatch — click to pick */}
      <div className="relative h-14" style={{
        background: valid
          ? colour.hex
          : "repeating-linear-gradient(-45deg,#ccc 0,#ccc 2px,transparent 0,transparent 50%) 0 0/8px 8px",
      }}>
        <input type="color" value={valid ? colour.hex : "#888888"}
          onChange={(e) => onChange({ ...colour, hex: e.target.value })}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Click to pick colour" />
        <div className="absolute bottom-1.5 left-2 pointer-events-none">
          <span className="font-mono text-[9px] text-white/80 bg-black/30 px-1 py-0.5 rounded">{colour.hex || "pick"}</span>
        </div>
      </div>
      <div className="px-2 py-2 flex flex-col gap-1">
        <input value={colour.name} onChange={(e) => onChange({ ...colour, name: e.target.value })}
          placeholder="Colour name"
          className="w-full font-mono text-[10px] font-medium bg-transparent border-b border-transparent focus:border-[var(--color-accent)] outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] transition-colors" />
        <input value={colour.hex} onChange={(e) => onChange({ ...colour, hex: e.target.value })}
          placeholder="#000000"
          className="w-full font-mono text-[9px] bg-transparent border-b border-transparent focus:border-[var(--color-accent)] outline-none text-[var(--color-text-tertiary)] placeholder:text-[var(--color-text-tertiary)]/50 transition-colors" />
        <input value={colour.pantone ?? ""} onChange={(e) => onChange({ ...colour, pantone: e.target.value })}
          placeholder="Pantone (optional)"
          className="w-full font-mono text-[9px] bg-transparent border-b border-transparent focus:border-[var(--color-accent)] outline-none text-[var(--color-text-tertiary)] placeholder:text-[var(--color-text-tertiary)]/50 transition-colors" />
        <input value={colour.cmyk ?? ""} onChange={(e) => onChange({ ...colour, cmyk: e.target.value })}
          placeholder="CMYK (optional)"
          className="w-full font-mono text-[9px] bg-transparent border-b border-transparent focus:border-[var(--color-accent)] outline-none text-[var(--color-text-tertiary)] placeholder:text-[var(--color-text-tertiary)]/50 transition-colors" />
        <input value={colour.usage} onChange={(e) => onChange({ ...colour, usage: e.target.value })}
          placeholder="Usage description"
          className="w-full font-mono text-[9px] bg-transparent border-b border-transparent focus:border-[var(--color-accent)] outline-none text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-tertiary)]/50 transition-colors mt-0.5" />
      </div>
    </div>
  );
}

function FontRow({ font, onChange, onRemove }: {
  font: BrandFont; onChange: (f: BrandFont) => void; onRemove: () => void;
}) {
  return (
    <div className="glass-subtle rounded-xl px-4 py-3 relative group">
      <button onClick={onRemove}
        className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 text-[var(--color-text-tertiary)] hover:text-[var(--color-high-risk)] transition-all">
        <Trash size={13} />
      </button>
      <input value={font.name} onChange={(e) => onChange({ ...font, name: e.target.value })}
        placeholder="Font name (e.g. Helvetica Neue)"
        className="w-full text-base font-semibold bg-transparent border-b border-transparent focus:border-[var(--color-accent)] outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] transition-colors mb-1.5" />
      <div className="flex gap-3 flex-wrap">
        <input value={font.usage} onChange={(e) => onChange({ ...font, usage: e.target.value })}
          placeholder="Usage (e.g. Headlines)"
          className="flex-1 min-w-24 font-mono text-[10px] bg-transparent border-b border-transparent focus:border-[var(--color-accent)] outline-none text-[var(--color-accent)] placeholder:text-[var(--color-text-tertiary)]/60 transition-colors" />
        <input value={font.weights ?? ""} onChange={(e) => onChange({ ...font, weights: e.target.value })}
          placeholder="Weights (e.g. 300, 400, 700)"
          className="flex-1 min-w-28 font-mono text-[10px] bg-transparent border-b border-transparent focus:border-[var(--color-accent)] outline-none text-[var(--color-text-tertiary)] placeholder:text-[var(--color-text-tertiary)]/60 transition-colors" />
      </div>
      <input value={font.note ?? ""} onChange={(e) => onChange({ ...font, note: e.target.value })}
        placeholder="Notes (e.g. Use sentence case only)"
        className="w-full font-mono text-[10px] bg-transparent border-b border-transparent focus:border-[var(--color-accent)] outline-none text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-tertiary)]/60 transition-colors mt-1" />
    </div>
  );
}

function BulletList({ items, onChange, label }: {
  items: string[]; onChange: (v: string[]) => void; label?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <p className="font-mono text-[9px] text-[var(--color-text-tertiary)] tracking-widest">{label}</p>}
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[var(--color-accent)] shrink-0">&gt;</span>
          <input value={item} onChange={(e) => onChange(items.map((x, xi) => xi === i ? e.target.value : x))}
            placeholder="Add rule or note..."
            className="flex-1 font-mono text-[10px] bg-[var(--color-surface-raised)]/40 border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none px-2 py-1.5 rounded-lg text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-tertiary)]/60 transition-colors" />
          <button onClick={() => onChange(items.filter((_, xi) => xi !== i))}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-high-risk)] transition-colors shrink-0">
            <Trash size={11} />
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...items, ""])}
        className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors mt-0.5 w-fit">
        <Plus size={10} /> ADD
      </button>
    </div>
  );
}

function ToneBlock({ heading, accent, items, onChange, strikethrough, italic }: {
  heading: string; accent: string; items: string[]; onChange: (v: string[]) => void;
  strikethrough?: boolean; italic?: boolean;
}) {
  return (
    <div className="glass-subtle rounded-xl px-4 py-3">
      <p className={cn("font-mono text-[10px] tracking-widest mb-2", accent)}>{heading}</p>
      <div className="flex flex-col gap-1.5">
        {items.map((t, i) => (
          <div key={i} className="flex items-center gap-2">
            <input value={t} onChange={(e) => onChange(items.map((x, xi) => xi === i ? e.target.value : x))}
              className={cn(
                "flex-1 font-mono text-xs bg-transparent border-b border-transparent focus:border-[var(--color-accent)] outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]/60 transition-colors py-0.5",
                strikethrough && "line-through text-[var(--color-text-secondary)]",
                italic && "italic text-[var(--color-text-secondary)]",
              )} />
            <button onClick={() => onChange(items.filter((_, xi) => xi !== i))}
              className="text-[var(--color-text-tertiary)] hover:text-[var(--color-high-risk)] transition-colors shrink-0">
              <Trash size={11} />
            </button>
          </div>
        ))}
        <button onClick={() => onChange([...items, ""])}
          className="flex items-center gap-1 font-mono text-[10px] text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors mt-1 w-fit">
          <Plus size={10} /> ADD
        </button>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyBrandData(label: string): BrandData {
  return {
    brandName: label, summary: null, colours: [], fonts: [],
    logo: { description: null, variants: [], clearSpace: null, minimumSize: null, rules: [] },
    toneOfVoice: { weAre: [], weAreNot: [], examples: [] },
    photography: { style: null, rules: [], references: [] },
    spacing: { gridSystem: null, rules: [] },
    other: [],
    printDigital: null,
  };
}

function diffHistory(original: BrandData, updated: BrandData) {
  const entries: Array<{ field: string; prev: string; next: string }> = [];
  const chk = (f: string, a: unknown, b: unknown) => {
    if (JSON.stringify(a) !== JSON.stringify(b)) entries.push({ field: f, prev: String(a ?? ""), next: String(b ?? "") });
  };
  chk("brandName", original.brandName, updated.brandName);
  chk("summary", original.summary, updated.summary);
  chk("printDigital", original.printDigital, updated.printDigital);
  original.colours.forEach((c, i) => {
    if (updated.colours[i]?.hex !== c.hex) entries.push({ field: `colour.${c.name}`, prev: c.hex, next: updated.colours[i]?.hex ?? "" });
  });
  if (original.colours.length !== updated.colours.length) chk("colours.count", original.colours.length, updated.colours.length);
  chk("fonts", original.fonts, updated.fonts);
  chk("logo.rules", original.logo.rules, updated.logo.rules);
  chk("logo.description", original.logo.description, updated.logo.description);
  chk("toneOfVoice", original.toneOfVoice, updated.toneOfVoice);
  chk("photography", original.photography, updated.photography);
  chk("spacing", original.spacing, updated.spacing);
  chk("other", original.other, updated.other);
  return entries;
}
