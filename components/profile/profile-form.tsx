"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateCurrentProfileAction } from "@/lib/actions/profile";
import {
  instructorColorOptions,
  instructorTransmissionOptions,
} from "@/lib/instructor-profile";
import type { TransmissieType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ProfileForm({
  initialValues,
  role,
  tone = "default",
}: {
  initialValues: {
    volledigeNaam: string;
    telefoon: string;
    bio?: string;
    ervaringJaren?: number;
    werkgebied?: string;
    prijsPerLes?: number;
    transmissie?: TransmissieType;
    specialisaties?: string;
    profielfotoKleur?: string;
  };
  role: "leerling" | "instructeur";
  tone?: "default" | "resident" | "urban";
}) {
  const [isPending, startTransition] = useTransition();
  const isUrban = tone === "urban";
  const isResident = tone === "resident";
  const [volledigeNaam, setVolledigeNaam] = useState(initialValues.volledigeNaam);
  const [telefoon, setTelefoon] = useState(initialValues.telefoon);
  const [bio, setBio] = useState(initialValues.bio ?? "");
  const [ervaringJaren, setErvaringJaren] = useState(
    String(initialValues.ervaringJaren ?? 0)
  );
  const [werkgebied, setWerkgebied] = useState(initialValues.werkgebied ?? "");
  const [prijsPerLes, setPrijsPerLes] = useState(
    String(initialValues.prijsPerLes ?? 0)
  );
  const [transmissie, setTransmissie] = useState<TransmissieType>(
    initialValues.transmissie ?? "beide"
  );
  const [specialisaties, setSpecialisaties] = useState(
    initialValues.specialisaties ?? ""
  );
  const [profielfotoKleur, setProfielfotoKleur] = useState(
    initialValues.profielfotoKleur ?? instructorColorOptions[0].value
  );

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateCurrentProfileAction({
        volledigeNaam: String(formData.get("volledige_naam") ?? ""),
        telefoon: String(formData.get("telefoon") ?? ""),
        bio: String(formData.get("bio") ?? ""),
        ervaringJaren: String(formData.get("ervaring_jaren") ?? ""),
        werkgebied: String(formData.get("werkgebied") ?? ""),
        prijsPerLes: String(formData.get("prijs_per_les") ?? ""),
        transmissie: String(formData.get("transmissie") ?? ""),
        specialisaties: String(formData.get("specialisaties") ?? ""),
        profielfotoKleur: String(formData.get("profielfoto_kleur") ?? ""),
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  const fieldWrapperClassName = cn("space-y-2", isResident && "space-y-2.5");
  const labelClassName = cn(
    isUrban &&
      "text-[11px] font-semibold tracking-[0.18em] text-slate-300 uppercase",
    isResident &&
      "text-[11px] font-semibold tracking-[0.18em] text-red-100/76 uppercase"
  );
  const controlClassName = cn(
    isUrban &&
      "h-12 rounded-[1.15rem] border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(148,163,184,0.08),rgba(15,23,42,0.28))] px-4 text-white placeholder:text-slate-400 focus-visible:border-slate-300/32 focus-visible:ring-slate-300/18",
    isResident &&
      "h-12 rounded-[1.15rem] border-red-300/14 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(120,22,22,0.12))] px-4 text-white placeholder:text-stone-500 focus-visible:border-red-300/32 focus-visible:ring-red-400/16"
  );
  const textAreaClassName = cn(
    isUrban &&
      "min-h-32 rounded-[1.35rem] border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(148,163,184,0.08),rgba(15,23,42,0.28))] px-4 py-3 text-white placeholder:text-slate-400 focus-visible:border-slate-300/32 focus-visible:ring-slate-300/18",
    isResident &&
      "min-h-32 rounded-[1.35rem] border-red-300/14 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(120,22,22,0.12))] px-4 py-3 text-white placeholder:text-stone-500 focus-visible:border-red-300/32 focus-visible:ring-red-400/16"
  );
  const selectClassName = cn(
    "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
    isUrban &&
      "h-12 rounded-[1.15rem] border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(148,163,184,0.08),rgba(15,23,42,0.28))] px-4 text-white focus-visible:border-slate-300/32 focus-visible:ring-slate-300/18",
    isResident &&
      "h-12 rounded-[1.15rem] border-red-300/14 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(120,22,22,0.12))] px-4 text-white focus-visible:border-red-300/32 focus-visible:ring-red-400/16"
  );

  return (
    <form action={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <div className={fieldWrapperClassName}>
        <Label htmlFor="volledige_naam" className={labelClassName}>
          Volledige naam
        </Label>
        <Input
          id="volledige_naam"
          name="volledige_naam"
          value={volledigeNaam}
          onChange={(event) => setVolledigeNaam(event.target.value)}
          className={controlClassName}
          required
        />
      </div>
      <div className={fieldWrapperClassName}>
        <Label htmlFor="telefoon" className={labelClassName}>
          Telefoon
        </Label>
        <Input
          id="telefoon"
          name="telefoon"
          value={telefoon}
          onChange={(event) => setTelefoon(event.target.value)}
          className={controlClassName}
        />
      </div>
      {role === "instructeur" ? (
        <>
          <div className={cn(fieldWrapperClassName, "md:col-span-2")}>
            <Label htmlFor="bio" className={labelClassName}>
              Bio / introductietekst
            </Label>
            <Textarea
              id="bio"
              name="bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              className={textAreaClassName}
            />
          </div>
          <div className={cn(fieldWrapperClassName, "md:col-span-2")}>
            <Label htmlFor="werkgebied" className={labelClassName}>
              Werkgebied
            </Label>
            <Input
              id="werkgebied"
              name="werkgebied"
              value={werkgebied}
              onChange={(event) => setWerkgebied(event.target.value)}
              placeholder="Amsterdam, Amstelveen, Diemen"
              className={controlClassName}
            />
          </div>
          <div className={fieldWrapperClassName}>
            <Label htmlFor="prijs_per_les" className={labelClassName}>
              Prijs per les (EUR)
            </Label>
            <Input
              id="prijs_per_les"
              name="prijs_per_les"
              type="number"
              min="0"
              step="0.01"
              value={prijsPerLes}
              onChange={(event) => setPrijsPerLes(event.target.value)}
              className={controlClassName}
            />
          </div>
          <div className={fieldWrapperClassName}>
            <Label htmlFor="ervaring_jaren" className={labelClassName}>
              Ervaring in jaren
            </Label>
            <Input
              id="ervaring_jaren"
              name="ervaring_jaren"
              type="number"
              min="0"
              step="1"
              value={ervaringJaren}
              onChange={(event) => setErvaringJaren(event.target.value)}
              className={controlClassName}
            />
          </div>
          <div className={fieldWrapperClassName}>
            <Label htmlFor="transmissie" className={labelClassName}>
              Transmissie
            </Label>
            <select
              id="transmissie"
              name="transmissie"
              value={transmissie}
              onChange={(event) =>
                setTransmissie(event.target.value as TransmissieType)
              }
              className={selectClassName}
            >
              {instructorTransmissionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className={fieldWrapperClassName}>
            <Label htmlFor="profielfoto_kleur" className={labelClassName}>
              Profielkleur
            </Label>
            <select
              id="profielfoto_kleur"
              name="profielfoto_kleur"
              value={profielfotoKleur}
              onChange={(event) => setProfielfotoKleur(event.target.value)}
              className={selectClassName}
            >
              {instructorColorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className={cn(fieldWrapperClassName, "md:col-span-2")}>
            <Label htmlFor="specialisaties" className={labelClassName}>
              Specialisaties
            </Label>
            <Input
              id="specialisaties"
              name="specialisaties"
              value={specialisaties}
              onChange={(event) => setSpecialisaties(event.target.value)}
              placeholder="Faalangst, Examentraining, Automaat"
              className={controlClassName}
            />
          </div>
        </>
      ) : (
        <>
          <input type="hidden" name="bio" value="" />
          <input type="hidden" name="werkgebied" value="" />
          <input type="hidden" name="prijs_per_les" value="0" />
          <input type="hidden" name="ervaring_jaren" value="0" />
          <input type="hidden" name="transmissie" value="beide" />
          <input type="hidden" name="profielfoto_kleur" value="" />
          <input type="hidden" name="specialisaties" value="" />
        </>
      )}
      <div className="md:col-span-2">
        <Button
          disabled={isPending}
          className={cn(
            isUrban &&
              "h-12 w-full rounded-[1.25rem] border border-white/12 bg-[linear-gradient(135deg,#f8fafc,#cbd5e1)] text-slate-950 shadow-[0_20px_44px_-26px_rgba(148,163,184,0.44)] hover:brightness-[1.03]",
            isResident &&
              "h-12 w-full rounded-[1.25rem] border border-red-300/16 bg-[linear-gradient(135deg,#7f1d1d,#b91c1c,#ea580c)] text-white shadow-[0_20px_44px_-26px_rgba(185,28,28,0.48)] hover:brightness-105"
          )}
        >
          {isPending ? "Opslaan..." : "Opslaan"}
        </Button>
      </div>
    </form>
  );
}
