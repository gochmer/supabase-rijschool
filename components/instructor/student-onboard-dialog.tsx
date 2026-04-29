"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createInstructorLearnerAction } from "@/lib/actions/instructor-learners";
import type { Pakket } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const NO_PACKAGE_VALUE = "__no_package__";

function getInitialState() {
  return {
    fullName: "",
    email: "",
    phone: "",
    packageId: NO_PACKAGE_VALUE,
    allowSelfScheduling: false,
    onboardingNote: "",
  };
}

export function StudentOnboardDialog({
  packages = [],
}: {
  packages?: Pakket[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(getInitialState());
  const [isPending, startTransition] = useTransition();

  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const noteId = useId();

  function reset() {
    setForm(getInitialState());
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await createInstructorLearnerAction({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        packageId: form.packageId !== NO_PACKAGE_VALUE ? form.packageId : null,
        allowSelfScheduling: form.allowSelfScheduling,
        onboardingNote: form.onboardingNote,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="h-9 rounded-full text-[13px]">
          Leerling aanmelden
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(15,23,42,0.98))] dark:text-white">
        <DialogHeader>
          <DialogTitle>Leerling handmatig toevoegen</DialogTitle>
          <DialogDescription>
            Voeg een leerling direct toe aan je werkplek. Bestaat het e-mailadres al,
            dan koppelen we die leerling meteen. Bestaat het nog niet, dan sturen we
            automatisch een uitnodiging.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor={nameId}>Naam leerling</Label>
            <Input
              id={nameId}
              value={form.fullName}
              onChange={(event) =>
                setForm((current) => ({ ...current, fullName: event.target.value }))
              }
              placeholder="Bijvoorbeeld Mila Jansen"
              className="dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={emailId}>E-mailadres</Label>
            <Input
              id={emailId}
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="leerling@example.com"
              className="dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={phoneId}>Telefoonnummer</Label>
            <Input
              id={phoneId}
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({ ...current, phone: event.target.value }))
              }
              placeholder="06 12 34 56 78"
              className="dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <Label>Startpakket</Label>
            <Select
              value={form.packageId}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, packageId: value }))
              }
            >
              <SelectTrigger className="dark:border-white/10 dark:bg-white/5 dark:text-white">
                <SelectValue placeholder="Kies een pakket" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PACKAGE_VALUE}>Nog geen pakket koppelen</SelectItem>
                {packages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.naam}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-start gap-3 rounded-[1rem] border border-slate-200/80 bg-slate-50/90 px-3 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            <input
              type="checkbox"
              checked={form.allowSelfScheduling}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  allowSelfScheduling: event.target.checked,
                }))
              }
              className="mt-1 size-4 rounded border-slate-300"
            />
            <span>
              Agenda direct vrijgeven
              <span className="mt-1 block text-[12px] leading-5 text-slate-500 dark:text-slate-400">
                Handig als je wilt dat deze leerling meteen zelf boekbare momenten uit jouw agenda kan kiezen.
              </span>
            </span>
          </label>

          <div className="space-y-2">
            <Label htmlFor={noteId}>Startnotitie</Label>
            <Textarea
              id={noteId}
              value={form.onboardingNote}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  onboardingNote: event.target.value,
                }))
              }
              placeholder="Bijvoorbeeld: start met rustige intake, focus op automaat en spanning bij druk verkeer."
              className="min-h-24 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Annuleren
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !form.fullName.trim() || !form.email.trim()}
          >
            {isPending ? "Toevoegen..." : "Leerling toevoegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
