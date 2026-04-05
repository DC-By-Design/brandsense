"use client";

import { useState } from "react";
import { PencilSimple, Check, X, Plus, Trash, ClockCounterClockwise } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import type { BrandData, BrandColour, BrandFont, BrandDataHistoryEntry } from "@/lib/analysis/brand-extract";

interface Props {
  data: BrandData;
  label: string;
  guidelineId?: string;
  onSaved?: (updated: BrandData) => void;
}

export function BrandDataView({ data, label, guidelineId, onSaved }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<BrandData>(data);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  function toggleEdit() {
    if (editMode) {
      setDraft(data); // discard
    }
    setEditMode((p) => !p);
    setSaveErr(null);
  }

  async function handleSave() {
    if (!guidelineId) return;
    setSaving(true);
    setSaveErr(null);

    const entries = buildHistory(data, draft);

    const res = await fetch(`/api/guidelines/${guidelineId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandData: draft, historyEntries: entries }),
    });
    setSaving(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({})) as { error?: string };
      setSaveErr(d.error ?? "Save failed");
      return;
    }

    const result = await res.json() as { guideline: { brandData: BrandData } };
    const saved = result.guideline.brandData;
    setDraft(saved);
    setEditMode(false);
    onSaved?.(saved);
  }

  const displayData = editMode ? draft : data;
  const history = (data._history ?? []) as BrandDataHistoryEntry[];

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] tracking-widest">&gt; BRAND_GUIDELINES // EXTRACTED</p>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            {displayData.brandName ?? label}
          </h2>
          {displayData.summary && (
            <p className="font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed mt-1">{displayData.summary}</p>
          )}
        </div>

        {guidelineId && (
          <div className="flex items-center gap-2 shrink-0">
            {editMode ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 font-mono text-[10px] px-3 py-1.5 bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-bright)] transition-colors disabled:opacity-50"
                >
                  <Check size={11} />
                  {saving ? "SAVING..." : "SAVE"}
                </button>
                <button
                  onClick={toggleEdit}
                  className="flex items-center gap-1.5 font-mono text-[10px] px-3 py-1.5 border border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  <X size={11} />
                  CANCEL
                </button>
              </>
            ) : (
              <button
                onClick={toggleEdit}
                className="flex items-center gap-1.5 font-mono text-[10px] px-3 py-1.5 border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors"
              >
                <PencilSimple size={11} />
                EDIT
              </button>
            )}
          </div>
        )}
      </div>

      {saveErr && (
        <p className="font-mono text-[10px] text-[var(--color-high-risk)]">{saveErr}</p>
      )}

      {/* Colours */}
      {displayData.colours.length > 0 && (
        <Section label="COLOUR_PALETTE">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {displayData.colours.map((c, i) => (
              <ColourSwatch
                key={i}
                colour={c}
                editMode={editMode}
                onChange={(hex) =>
                  setDraft((prev) => ({
                    ...prev,
                    colours: prev.colours.map((col, ci) => ci === i ? { ...col, hex } : col),
                  }))
                }
              />
            ))}
          </div>
        </Section>
      )}

      {/* Fonts */}
      {displayData.fonts.length > 0 && (
        <Section label="TYPOGRAPHY">
          <div className="flex flex-col gap-2">
            {displayData.fonts.map((f, i) => <FontRow key={i} font={f} />)}
          </div>
        </Section>
      )}

      {/* Logo */}
      <LogoSection logo={displayData.logo} brandName={displayData.brandName} colours={displayData.colours} />

      {/* Tone of voice */}
      <ToneSection
        tov={displayData.toneOfVoice}
        editMode={editMode}
        onChange={(tov) => setDraft((prev) => ({ ...prev, toneOfVoice: tov }))}
      />

      {/* Photography */}
      {(displayData.photography.rules.length > 0 || displayData.photography.style) && (
        <Section label="PHOTOGRAPHY">
          {displayData.photography.style && (
            <p className="font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed mb-3">{displayData.photography.style}</p>
          )}
          {displayData.photography.rules.map((r, i) => <Rule key={i} text={r} />)}
        </Section>
      )}

      {/* Spacing */}
      {(displayData.spacing.rules.length > 0 || displayData.spacing.gridSystem) && (
        <Section label="SPACING_GRID">
          {displayData.spacing.gridSystem && (
            <p className="font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed mb-3">{displayData.spacing.gridSystem}</p>
          )}
          {displayData.spacing.rules.map((r, i) => <Rule key={i} text={r} />)}
        </Section>
      )}

      {/* Other */}
      {displayData.other.length > 0 && (
        <Section label="OTHER_STANDARDS">
          {displayData.other.map((o, i) => <Rule key={i} text={o} />)}
        </Section>
      )}

      {/* History log */}
      {history.length > 0 && (
        <Section label="EDIT_HISTORY">
          <div className="flex flex-col gap-1.5">
            {[...history].reverse().map((entry, i) => (
              <div key={i} className="flex items-start gap-3 border border-[var(--color-border)] px-3 py-2 bg-[var(--color-surface)]">
                <ClockCounterClockwise size={11} className="text-[var(--color-text-tertiary)] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] text-[var(--color-text-primary)]">{entry.field}</p>
                  <p className="font-mono text-[9px] text-[var(--color-text-tertiary)] mt-0.5">
                    {entry.prev || "—"} → {entry.next || "—"}
                  </p>
                </div>
                <p className="font-mono text-[9px] text-[var(--color-text-tertiary)] shrink-0">
                  {new Date(entry.updatedAt).toLocaleDateString()} {new Date(entry.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-[10px] text-[var(--color-text-tertiary)] tracking-widest border-b border-[var(--color-border)] pb-2">{label} //</p>
      {children}
    </div>
  );
}

function ColourSwatch({ colour, editMode, onChange }: {
  colour: BrandColour;
  editMode: boolean;
  onChange: (hex: string) => void;
}) {
  const isValidHex = /^#[0-9a-fA-F]{3,8}$/.test(colour.hex);
  const swatchBg = isValidHex ? colour.hex : undefined;

  return (
    <div className="border border-[var(--color-border)] overflow-hidden">
      <div
        className="h-12 relative"
        style={{
          backgroundColor: swatchBg,
          background: swatchBg
            ? undefined
            : "repeating-linear-gradient(-45deg, #e0e0e0 0, #e0e0e0 2px, transparent 0, transparent 50%) 0 0 / 8px 8px",
        }}
      >
        {editMode && (
          <input
            type="color"
            value={isValidHex ? colour.hex : "#888888"}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            title="Pick colour"
          />
        )}
      </div>
      <div className="px-2 py-2 bg-[var(--color-surface-raised)]">
        <p className="font-mono text-[10px] text-[var(--color-text-primary)] font-medium">{colour.name}</p>
        {editMode ? (
          <input
            type="text"
            value={colour.hex}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            className="font-mono text-[9px] text-[var(--color-text-primary)] bg-[var(--color-surface)] border border-[var(--color-border)] px-1 py-0.5 w-full mt-0.5 focus:outline-none focus:border-[var(--color-accent)]"
          />
        ) : (
          <p className="font-mono text-[9px] text-[var(--color-text-tertiary)]">{colour.hex || "—"}</p>
        )}
        {colour.pantone && <p className="font-mono text-[9px] text-[var(--color-text-tertiary)]">PMS {colour.pantone}</p>}
        {colour.cmyk && <p className="font-mono text-[9px] text-[var(--color-text-tertiary)]">CMYK {colour.cmyk}</p>}
        <p className="font-mono text-[9px] text-[var(--color-text-secondary)] mt-0.5">{colour.usage}</p>
      </div>
    </div>
  );
}

function FontRow({ font }: { font: BrandFont }) {
  return (
    <div className="border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 flex flex-col gap-0.5">
      <p className="text-sm font-medium text-[var(--color-text-primary)]">{font.name}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-[10px] text-[var(--color-accent)]">{font.usage}</span>
        {font.weights && <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">// {font.weights}</span>}
      </div>
      {font.note && <p className="font-mono text-[10px] text-[var(--color-text-secondary)] mt-0.5">{font.note}</p>}
    </div>
  );
}

function LogoSection({ logo, brandName, colours }: {
  logo: BrandData["logo"];
  brandName: string | null;
  colours: BrandColour[];
}) {
  const hasContent = logo.rules.length > 0 || logo.description || logo.variants.length > 0;
  if (!hasContent) return null;

  const primaryHex = colours.find((c) => /primary|main|brand/i.test(c.usage ?? ""))?.hex
    ?? colours[0]?.hex;
  const isValidHex = primaryHex && /^#[0-9a-fA-F]{3,8}$/.test(primaryHex);

  return (
    <Section label="LOGO_USAGE">
      {/* Stylised logo placeholder */}
      <div className="border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-8 flex items-center justify-center mb-3">
        <p
          className="text-2xl font-bold tracking-tight"
          style={{ color: isValidHex ? primaryHex : "var(--color-text-primary)" }}
        >
          {brandName ?? "BRAND"}
        </p>
      </div>

      {logo.description && (
        <p className="font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed mb-3">{logo.description}</p>
      )}
      {logo.variants.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {logo.variants.map((v, i) => (
            <span key={i} className="font-mono text-[10px] px-2 py-0.5 border border-[var(--color-border)] text-[var(--color-text-secondary)] bg-[var(--color-surface)]">{v}</span>
          ))}
        </div>
      )}
      {logo.clearSpace && <Rule text={`Clear space: ${logo.clearSpace}`} />}
      {logo.minimumSize && <Rule text={`Minimum size: ${logo.minimumSize}`} />}
      {logo.rules.map((r, i) => <Rule key={i} text={r} />)}
    </Section>
  );
}

function ToneSection({ tov, editMode, onChange }: {
  tov: BrandData["toneOfVoice"];
  editMode: boolean;
  onChange: (tov: BrandData["toneOfVoice"]) => void;
}) {
  const hasContent = tov.weAre.length > 0 || tov.weAreNot.length > 0 || tov.examples.length > 0;
  if (!hasContent && !editMode) return null;

  function editList(key: "weAre" | "weAreNot" | "examples", index: number, value: string) {
    onChange({ ...tov, [key]: tov[key].map((v, i) => i === index ? value : v) });
  }
  function removeItem(key: "weAre" | "weAreNot" | "examples", index: number) {
    onChange({ ...tov, [key]: tov[key].filter((_, i) => i !== index) });
  }
  function addItem(key: "weAre" | "weAreNot" | "examples") {
    onChange({ ...tov, [key]: [...tov[key], ""] });
  }

  return (
    <Section label="TONE_OF_VOICE">
      <div className="flex flex-col gap-3">
        <ToneGroup
          heading="WE ARE //"
          headingClass="text-[var(--color-accent)]"
          items={tov.weAre}
          editMode={editMode}
          onEdit={(i, v) => editList("weAre", i, v)}
          onRemove={(i) => removeItem("weAre", i)}
          onAdd={() => addItem("weAre")}
        />
        <ToneGroup
          heading="WE ARE NOT //"
          headingClass="text-[var(--color-high-risk)]"
          items={tov.weAreNot}
          editMode={editMode}
          strikethrough
          onEdit={(i, v) => editList("weAreNot", i, v)}
          onRemove={(i) => removeItem("weAreNot", i)}
          onAdd={() => addItem("weAreNot")}
        />
        {(tov.examples.length > 0 || editMode) && (
          <ToneGroup
            heading="EXAMPLES //"
            headingClass="text-[var(--color-text-tertiary)]"
            items={tov.examples}
            editMode={editMode}
            onEdit={(i, v) => editList("examples", i, v)}
            onRemove={(i) => removeItem("examples", i)}
            onAdd={() => addItem("examples")}
          />
        )}
      </div>
    </Section>
  );
}

function ToneGroup({ heading, headingClass, items, editMode, strikethrough, onEdit, onRemove, onAdd }: {
  heading: string;
  headingClass: string;
  items: string[];
  editMode: boolean;
  strikethrough?: boolean;
  onEdit: (i: number, v: string) => void;
  onRemove: (i: number) => void;
  onAdd: () => void;
}) {
  if (items.length === 0 && !editMode) return null;
  return (
    <div className="border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3">
      <p className={cn("font-mono text-[10px] tracking-widest mb-2", headingClass)}>{heading}</p>
      <div className="flex flex-col gap-1">
        {items.map((t, i) =>
          editMode ? (
            <div key={i} className="flex items-center gap-1.5">
              <input
                value={t}
                onChange={(e) => onEdit(i, e.target.value)}
                className="flex-1 font-mono text-xs text-[var(--color-text-primary)] bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-1 focus:outline-none focus:border-[var(--color-accent)]"
              />
              <button type="button" onClick={() => onRemove(i)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-high-risk)] transition-colors">
                <Trash size={11} />
              </button>
            </div>
          ) : (
            <p key={i} className={cn("font-mono text-xs text-[var(--color-text-primary)]", strikethrough && "line-through text-[var(--color-text-secondary)]")}>
              {strikethrough ? t : `> ${t}`}
            </p>
          )
        )}
        {editMode && (
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1 font-mono text-[10px] text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors mt-1"
          >
            <Plus size={10} />
            ADD
          </button>
        )}
      </div>
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

// ─── Diff helper ─────────────────────────────────────────────────────────────

function buildHistory(
  original: BrandData,
  updated: BrandData,
): Array<{ field: string; prev: string; next: string }> {
  const entries: Array<{ field: string; prev: string; next: string }> = [];

  original.colours.forEach((c, i) => {
    const u = updated.colours[i];
    if (u && c.hex !== u.hex) {
      entries.push({ field: `colour.${c.name}.hex`, prev: c.hex, next: u.hex });
    }
  });

  const tovKeys = ["weAre", "weAreNot", "examples"] as const;
  tovKeys.forEach((key) => {
    const prev = JSON.stringify(original.toneOfVoice[key]);
    const next = JSON.stringify(updated.toneOfVoice[key]);
    if (prev !== next) {
      entries.push({ field: `toneOfVoice.${key}`, prev, next });
    }
  });

  return entries;
}
