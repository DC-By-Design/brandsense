"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GuidelineEditor } from "@/components/guidelines/GuidelineEditor";
import type { BrandData } from "@/lib/analysis/brand-extract";

interface Guideline {
  id: string;
  label: string;
  description: string | null;
  isPlatform: boolean;
  brandData: BrandData | null;
}

export default function GuidelineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [guideline, setGuideline] = useState<Guideline | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/guidelines/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d: { guideline: Guideline }) => {
        setGuideline(d.guideline);
        setLoading(false);
      })
      .catch(() => router.replace("/dashboard"));
  }, [id, router]);

  if (loading) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-[var(--color-bg)] scanlines">
        <p className="font-mono text-xs text-[var(--color-text-tertiary)] tracking-widest animate-pulse">
          LOADING_GUIDELINES...
        </p>
      </main>
    );
  }

  if (!guideline) return null;

  return <GuidelineEditor guideline={guideline} />;
}
