"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
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

function getInitials(value: string) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "L";
  }

  return parts.map((part) => part[0]?.toUpperCase()).join("");
}

export function ProfileForm({
  initialValues,
  role,
  tone = "default",
}: {
  initialValues: {
    volledigeNaam: string;
    email?: string;
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isUrban = tone === "urban";
  const isResident = tone === "resident";
  const [volledigeNaam, setVolledigeNaam] = useState(initialValues.volledigeNaam);
  const [email, setEmail] = useState(initialValues.email ?? "");
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
  const showEmailField = typeof initialValues.email === "string";

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateCurrentProfileAction({
        volledigeNaam: String(formData.get("volledige_naam") ?? ""),
        email: formData.has("email")
          ? String(formData.get("email") ?? "")
          : undefined,
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
        router.refresh();
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
  const learnerReadinessItems = [
    {
      label: volledigeNaam.trim() ? "Naam klaar" : "Naam mist",
      detail: volledigeNaam.trim() || "Vul je volledige naam in.",
      complete: Boolean(volledigeNaam.trim()),
      icon: User,
    },
    {
      label: email.trim() ? "E-mail klaar" : "E-mail mist",
      detail: email.trim() || "Nodig voor accountberichten.",
      complete: Boolean(email.trim()),
      icon: Mail,
    },
    {
      label: telefoon.trim() ? "Telefoon klaar" : "Telefoon optioneel",
      detail: telefoon.trim() || "Handig voor snelle afstemming.",
      complete: Boolean(telefoon.trim()),
      icon: Phone,
    },
  ].filter((item) => showEmailField || item.icon !== Mail);
  const learnerCompletion = Math.round(
    (learnerReadinessItems.filter((item) => item.complete).length /
      learnerReadinessItems.length) *
      100
  );

  if (role === "leerling" && isUrban) {
    return (
      <form
        action={handleSubmit}
        className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.78fr)] xl:items-start"
      >
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-[1.65rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(148,163,184,0.08),rgba(15,23,42,0.28))] p-4 shadow-[0_20px_54px_-40px_rgba(15,23,42,0.55)] sm:p-5">
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-sky-400/10 via-white/5 to-emerald-400/10" />
            <div className="relative">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="inline-flex items-center rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-slate-200 uppercase">
                    Profielstudio
                  </p>
                  <h3 className="mt-3 text-xl font-semibold text-white">
                    Maak je leerlingprofiel helder en betrouwbaar.
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                    Houd je naam en contactgegevens strak op orde, zodat boekingen,
                    berichten en planning soepel blijven lopen.
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-semibold text-slate-100">
                  {learnerCompletion}% klaar
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className={fieldWrapperClassName}>
                  <Label htmlFor="volledige_naam" className={labelClassName}>
                    Volledige naam
                  </Label>
                  <Input
                    id="volledige_naam"
                    name="volledige_naam"
                    value={volledigeNaam}
                    onChange={(event) => setVolledigeNaam(event.target.value)}
                    placeholder="Bijv. Samira Jansen"
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
                    placeholder="06 12345678"
                    className={controlClassName}
                  />
                </div>
                {showEmailField ? (
                  <div className={cn(fieldWrapperClassName, "md:col-span-2")}>
                    <Label htmlFor="email" className={labelClassName}>
                      E-mailadres
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="naam@voorbeeld.nl"
                      className={controlClassName}
                      required
                    />
                  </div>
                ) : null}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {learnerReadinessItems.map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      "rounded-[1.15rem] border p-3",
                      item.complete
                        ? "border-emerald-300/18 bg-emerald-500/10"
                        : "border-white/10 bg-white/6"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-xl",
                          item.complete
                            ? "bg-emerald-400/14 text-emerald-100"
                            : "bg-white/8 text-slate-200"
                        )}
                      >
                        <item.icon className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{item.label}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-300">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <input type="hidden" name="bio" value="" />
          {showEmailField ? <input type="hidden" name="email" value={email} /> : null}
          <input type="hidden" name="werkgebied" value="" />
          <input type="hidden" name="prijs_per_les" value="0" />
          <input type="hidden" name="ervaring_jaren" value="0" />
          <input type="hidden" name="transmissie" value="beide" />
          <input type="hidden" name="profielfoto_kleur" value="" />
          <input type="hidden" name="specialisaties" value="" />
        </div>

        <div className="space-y-4 xl:sticky xl:top-4">
          <div className="overflow-hidden rounded-[1.65rem] border border-white/10 bg-[linear-gradient(145deg,rgba(248,250,252,0.96),rgba(226,232,240,0.94),rgba(203,213,225,0.92))] text-slate-950 shadow-[0_26px_70px_-44px_rgba(15,23,42,0.62)]">
            <div className="border-b border-slate-900/6 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-950 text-lg font-semibold text-white">
                    {getInitials(volledigeNaam)}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                      Live profielkaart
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">
                      {volledigeNaam.trim() || "Jouw naam"}
                    </h3>
                  </div>
                </div>
                <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  {learnerCompletion}%
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#0f172a,#2563eb,#14b8a6)]"
                  style={{ width: `${Math.max(learnerCompletion, 8)}%` }}
                />
              </div>
            </div>

            <div className="p-5">
              <div className="grid gap-3">
                <div className="rounded-[1.1rem] border border-slate-200 bg-white/78 p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone className="size-4" />
                    <p className="text-[10px] font-semibold tracking-[0.16em] uppercase">
                      Contact
                    </p>
                  </div>
                  <p className="mt-2 text-sm font-semibold">
                    {telefoon.trim() || "Nog geen telefoonnummer"}
                  </p>
                </div>

                <div className="rounded-[1.1rem] border border-slate-200 bg-white/78 p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <ShieldCheck className="size-4" />
                    <p className="text-[10px] font-semibold tracking-[0.16em] uppercase">
                      Status
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {learnerReadinessItems.map((item) => (
                      <span
                        key={item.label}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                          item.complete
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        )}
                      >
                        {item.complete ? <Check className="size-3" /> : null}
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.1rem] border border-sky-200 bg-sky-50/90 p-3">
                  <div className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 size-4 text-sky-700" />
                    <p className="text-sm leading-6 text-sky-900">
                      Een compleet profiel maakt aanvragen, berichten en
                      lesplanning duidelijker voor jou en je instructeur.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                disabled={isPending}
                className="mt-4 h-12 w-full rounded-[1.25rem] border border-slate-950 bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#38bdf8)] text-white shadow-[0_22px_46px_-28px_rgba(37,99,235,0.58)] hover:brightness-105"
              >
                <CheckCircle2 className="size-4" />
                {isPending ? "Opslaan..." : "Profiel opslaan"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    );
  }

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
      {showEmailField ? (
        <div id="profiel-email" className={cn(fieldWrapperClassName, "scroll-mt-28 md:col-span-2")}>
          <Label htmlFor="email" className={labelClassName}>
            E-mailadres
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="naam@voorbeeld.nl"
            autoComplete="email"
            className={controlClassName}
            required
          />
          <p className="text-xs leading-5 text-slate-400">
            Bij een nieuw adres sturen we een bevestigingsmail voordat de wijziging actief wordt.
          </p>
        </div>
      ) : null}
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
