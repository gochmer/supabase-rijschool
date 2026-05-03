"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { Camera, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { updateProfileAvatarAction } from "@/lib/actions/profile";
import { getInitials } from "@/lib/format";
import { Button } from "@/components/ui/button";

export function AvatarUploadCard({
  avatarUrl,
  name,
  fallbackClassName,
}: {
  avatarUrl?: string | null;
  name: string;
  fallbackClassName: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl ?? null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Kies een geldig afbeeldingsbestand.");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      toast.error("De afbeelding mag maximaal 4 MB zijn.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleUpload() {
    if (!selectedFile) {
      inputRef.current?.click();
      return;
    }

    const formData = new FormData();
    formData.set("avatar", selectedFile);

    startTransition(async () => {
      const result = await updateProfileAvatarAction(formData);

      if (result.success) {
        toast.success(result.message);
        setSelectedFile(null);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <section className="rounded-[1.8rem] border border-white/70 bg-white/90 p-5 shadow-[0_26px_86px_-48px_rgba(15,23,42,0.38)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(30,41,59,0.86),rgba(15,23,42,0.94))]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-primary uppercase">Profielfoto</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">Maak je profiel menselijker</h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Een echte foto verhoogt vertrouwen en maakt je profiel veel persoonlijker.
          </p>
        </div>
        <Camera className="size-5 text-primary" />
      </div>

      <div className="mt-5 flex flex-col items-center gap-4 rounded-[1.45rem] border border-slate-200 bg-slate-50/90 p-5 dark:border-white/10 dark:bg-white/5">
        <div className="relative size-28 overflow-hidden rounded-[1.7rem] shadow-[0_20px_48px_-28px_rgba(15,23,42,0.42)] ring-4 ring-white/80 dark:ring-white/10">
          {previewUrl ? (
            <Image src={previewUrl} alt={`Profielfoto van ${name}`} fill sizes="112px" className="object-cover" />
          ) : (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${fallbackClassName} text-xl font-semibold text-white`}>
              {getInitials(name || "Instructeur")}
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
        />

        <div className="grid w-full gap-2 sm:grid-cols-2">
          <Button type="button" variant="outline" className="rounded-full" onClick={() => inputRef.current?.click()}>
            Kies foto
          </Button>
          <Button type="button" className="rounded-full" onClick={handleUpload} disabled={isPending || !selectedFile}>
            <UploadCloud className="size-4" />
            {isPending ? "Uploaden..." : "Uploaden"}
          </Button>
        </div>

        <p className="text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
          JPG, PNG of WebP. Maximaal 4 MB. Na upload verschijnt je foto ook op je openbare profiel.
        </p>
      </div>
    </section>
  );
}
