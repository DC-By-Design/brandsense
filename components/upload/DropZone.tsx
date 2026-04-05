"use client";

import { useState, useRef, useCallback } from "react";
import { UploadSimple, File, Link, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { formatFileSize } from "@/lib/utils/format";
import {
  ACCEPTED_TYPES,
  MAX_FILE_SIZE_BYTES,
  detectAssetType,
} from "@/lib/schemas/upload";

interface DropZoneProps {
  onFile: (file: File, brandGuideline?: File) => void;
  onUrl: (url: string, brandGuideline?: File) => void;
  disabled?: boolean;
}

type InputMode = "drop" | "url";

export function DropZone({ onFile, onUrl, disabled = false }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  const [mode, setMode] = useState<InputMode>("drop");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [brandGuideline, setBrandGuideline] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const brandInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File too large — max 50 MB (this is ${formatFileSize(file.size)})`;
    }
    if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
      return `Unsupported type — accepted: JPG, PNG, WEBP, PDF, MP4, MOV, WEBM`;
    }
    return null;
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
        setDragError(null);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (!file) return;

      const error = validateFile(file);
      if (error) {
        setDragError(error);
        return;
      }

      setStagedFile(file);
    },
    [disabled, validateFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const error = validateFile(file);
      if (error) {
        setDragError(error);
        return;
      }

      setDragError(null);
      setStagedFile(file);
    },
    [validateFile]
  );

  const handleBrandSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.type !== "application/pdf") return;
      setBrandGuideline(file);
    },
    []
  );

  const handleSubmitFile = useCallback(() => {
    if (!stagedFile) return;
    onFile(stagedFile, brandGuideline ?? undefined);
  }, [stagedFile, brandGuideline, onFile]);

  const handleSubmitUrl = useCallback(() => {
    try {
      new URL(url);
    } catch {
      setUrlError("Enter a valid URL including https://");
      return;
    }
    setUrlError(null);
    onUrl(url, brandGuideline ?? undefined);
  }, [url, brandGuideline, onUrl]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handleSubmitUrl();
    },
    [handleSubmitUrl]
  );

  const clearStagedFile = useCallback(() => {
    setStagedFile(null);
    setDragError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const assetType = stagedFile ? detectAssetType(stagedFile.type) : null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] w-fit mx-auto">
        <button
          onClick={() => setMode("drop")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            mode === "drop"
              ? "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          )}
        >
          <UploadSimple size={15} weight="bold" />
          Upload file
        </button>
        <button
          onClick={() => setMode("url")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            mode === "url"
              ? "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          )}
        >
          <Link size={15} weight="bold" />
          Paste URL
        </button>
      </div>

      {/* Drop zone */}
      {mode === "drop" && (
        <div className="flex flex-col gap-3">
          {!stagedFile ? (
            <button
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className={cn(
                "relative flex flex-col items-center justify-center gap-4",
                "w-full min-h-64 rounded-2xl border-2 border-dashed",
                "text-[var(--color-text-secondary)] transition-all duration-200",
                "cursor-pointer select-none",
                isDragging
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-muted)] text-[var(--color-text-primary)]"
                  : "border-[var(--color-border)] hover:border-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]",
                dragError && "border-[var(--color-high-risk)]",
                disabled && "opacity-40 cursor-not-allowed"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl",
                  "bg-[var(--color-surface)] border border-[var(--color-border)]",
                  "transition-transform duration-200",
                  isDragging && "scale-110"
                )}
              >
                <UploadSimple
                  size={22}
                  weight="bold"
                  className={cn(isDragging && "text-[var(--color-text-primary)]")}
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  {isDragging ? "Drop it" : "Drop your asset here"}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                  JPG, PNG, WEBP, PDF, MP4, MOV, WEBM · max 50 MB
                </p>
              </div>

              {dragError && (
                <p className="text-xs text-[var(--color-high-risk)] absolute bottom-4">
                  {dragError}
                </p>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--color-surface-raised)] shrink-0">
                <File size={20} weight="bold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{stagedFile.name}</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  {assetType && (
                    <span className="capitalize">{assetType} · </span>
                  )}
                  {formatFileSize(stagedFile.size)}
                </p>
              </div>
              <button
                onClick={clearStagedFile}
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                aria-label="Remove file"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={handleFileSelect}
            className="sr-only"
            aria-label="Upload asset"
          />
        </div>
      )}

      {/* URL input */}
      {mode === "url" && (
        <div className="flex flex-col gap-2">
          <div
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl",
              "border border-[var(--color-border)] bg-[var(--color-surface)]",
              "focus-within:border-[var(--color-text-tertiary)] transition-colors",
              urlError && "border-[var(--color-high-risk)]"
            )}
          >
            <Link
              size={16}
              weight="bold"
              className="text-[var(--color-text-tertiary)] shrink-0"
            />
            <input
              ref={urlInputRef}
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="https://yoursite.com/landing-page"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-tertiary)]"
              autoFocus
            />
          </div>
          {urlError && (
            <p className="text-xs text-[var(--color-high-risk)] px-1">
              {urlError}
            </p>
          )}
        </div>
      )}

      {/* Brand guideline upload */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--color-border)]" />
          <span className="text-xs text-[var(--color-text-tertiary)]">
            optional
          </span>
          <div className="h-px flex-1 bg-[var(--color-border)]" />
        </div>

        {!brandGuideline ? (
          <button
            onClick={() => brandInputRef.current?.click()}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl w-full",
              "border border-dashed border-[var(--color-border)]",
              "text-[var(--color-text-secondary)] text-sm",
              "hover:border-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]",
              "transition-colors"
            )}
          >
            <File size={16} weight="regular" />
            Add brand guidelines PDF
          </button>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <File
              size={16}
              weight="bold"
              className="text-[var(--color-text-secondary)] shrink-0"
            />
            <span className="text-sm flex-1 truncate">{brandGuideline.name}</span>
            <button
              onClick={() => {
                setBrandGuideline(null);
                if (brandInputRef.current) brandInputRef.current.value = "";
              }}
              className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
              aria-label="Remove brand guideline"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        )}

        <input
          ref={brandInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleBrandSelect}
          className="sr-only"
          aria-label="Upload brand guidelines"
        />
      </div>

      {/* CTA */}
      <button
        onClick={mode === "drop" ? handleSubmitFile : handleSubmitUrl}
        disabled={
          disabled ||
          (mode === "drop" && !stagedFile) ||
          (mode === "url" && !url.trim())
        }
        className={cn(
          "w-full py-3.5 px-6 rounded-xl font-medium text-sm",
          "bg-[var(--color-text-primary)] text-[var(--color-background)]",
          "transition-all duration-150",
          "hover:opacity-90 active:scale-[0.99]",
          "disabled:opacity-25 disabled:cursor-not-allowed disabled:active:scale-100"
        )}
      >
        Run preflight
      </button>
    </div>
  );
}
