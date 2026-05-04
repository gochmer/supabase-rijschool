import Link from "next/link";
import {
  ArrowRight,
  CarFront,
  ClipboardCheck,
  Fuel,
  Gauge,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { DashboardPerformanceMark } from "@/components/dashboard/dashboard-performance-mark";
import { PageHeader } from "@/components/dashboard/page-header";
import { getVehicleTone } from "@/components/instructor/instructor-settings-model";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createInstructorVehicleAction,
  deleteInstructorVehicleAction,
  updateInstructorVehicleAction,
} from "@/lib/actions/instructor-operations";
import { getCurrentInstructorSettingsOverview } from "@/lib/data/instructor-account";
import {
  timedDashboardData,
  timedDashboardRoute,
} from "@/lib/performance/dashboard";
import { cn } from "@/lib/utils";

const ROUTE = "/instructeur/voertuigen";

async function createVehicleFormAction(formData: FormData) {
  "use server";

  await createInstructorVehicleAction(formData);
}

async function updateVehicleFormAction(formData: FormData) {
  "use server";

  await updateInstructorVehicleAction(formData);
}

async function deleteVehicleFormAction(formData: FormData) {
  "use server";

  await deleteInstructorVehicleAction(formData);
}

function getTransmissionLabel(value: string) {
  if (value === "automaat") {
    return "Automaat";
  }

  if (value === "handgeschakeld") {
    return "Schakel";
  }

  return value;
}

export default async function InstructeurVoertuigenPage() {
  const overview = await timedDashboardRoute(ROUTE, () =>
    timedDashboardData(
      ROUTE,
      "settings-overview",
      getCurrentInstructorSettingsOverview,
    ),
  );
  const activeVehicles = overview.vehicles.filter(
    (vehicle) => vehicle.status === "actief",
  );
  const maintenanceVehicles = overview.vehicles.filter(
    (vehicle) => vehicle.status !== "actief",
  );
  const transmissionTypes = new Set(
    overview.vehicles.map((vehicle) => vehicle.transmissie),
  );

  return (
    <div className="space-y-4">
      <PageHeader
        tone="urban"
        title="Voertuigen"
        description="Een aparte werkplek voor lesauto's, kentekens, transmissie en onderhoudsstatus."
      />

      <section className="grid gap-4 lg:grid-cols-4">
        {[
          {
            label: "Totaal",
            value: `${overview.vehicles.length}`,
            text: "Voertuigen gekoppeld aan je instructeursprofiel.",
            icon: CarFront,
            tone: "sky",
          },
          {
            label: "Rijklaar",
            value: `${activeVehicles.length}`,
            text: "Actief inzetbaar in planning en profiel.",
            icon: ShieldCheck,
            tone: "emerald",
          },
          {
            label: "Onderhoud",
            value: `${maintenanceVehicles.length}`,
            text: "Vraagt controle voor operationele betrouwbaarheid.",
            icon: Wrench,
            tone: maintenanceVehicles.length ? "amber" : "emerald",
          },
          {
            label: "Transmissies",
            value: `${transmissionTypes.size}`,
            text: "Aantal transmissietypes in je aanbod.",
            icon: Gauge,
            tone: "violet",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <Card
              key={item.label}
              className={cn(
                "border-white/10 text-white",
                item.tone === "sky" && "bg-sky-400/10",
                item.tone === "emerald" && "bg-emerald-400/10",
                item.tone === "amber" && "bg-amber-400/10",
                item.tone === "violet" && "bg-violet-400/10",
              )}
            >
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <CardDescription className="text-white/65">
                    {item.label}
                  </CardDescription>
                  <Icon className="size-5 text-white/70" />
                </div>
                <CardTitle className="text-4xl">{item.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-white/70">{item.text}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="border-white/10 bg-white/[0.045] text-white">
          <CardHeader>
            <CardTitle>Voertuiglijst</CardTitle>
            <CardDescription className="text-slate-400">
              Live uit Supabase. Geen demo autos of fallbackvoertuigen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {overview.vehicles.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {overview.vehicles.map((vehicle) => {
                  const tone = getVehicleTone(vehicle.status);

                  return (
                    <div
                      key={vehicle.id}
                      className={cn("rounded-lg border p-4", tone.shell)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={cn(
                            "flex size-11 shrink-0 items-center justify-center rounded-lg",
                            tone.icon,
                          )}
                        >
                          <CarFront className="size-5" />
                        </span>
                        <Badge
                          variant={
                            vehicle.status === "actief" ? "success" : "warning"
                          }
                        >
                          {tone.label}
                        </Badge>
                      </div>
                      <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">
                        {vehicle.model}
                      </h2>
                      <dl className="mt-4 grid gap-3 text-sm text-slate-700 dark:text-slate-300">
                        <div className="flex items-center justify-between gap-3">
                          <dt>Kenteken</dt>
                          <dd className="font-semibold text-slate-950 dark:text-white">
                            {vehicle.kenteken}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt>Transmissie</dt>
                          <dd className="font-semibold text-slate-950 dark:text-white">
                            {getTransmissionLabel(vehicle.transmissie)}
                          </dd>
                        </div>
                      </dl>
                      <form
                        action={updateVehicleFormAction}
                        className="mt-4 grid gap-3 border-t border-slate-950/10 pt-4 dark:border-white/10"
                      >
                        <input
                          type="hidden"
                          name="vehicle_id"
                          value={vehicle.id}
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input
                            aria-label="Model"
                            name="model"
                            defaultValue={vehicle.model}
                            required
                            className="border-slate-300/80 bg-white/70 text-slate-950 dark:border-white/10 dark:bg-slate-950/40 dark:text-white"
                          />
                          <Input
                            aria-label="Kenteken"
                            name="kenteken"
                            defaultValue={vehicle.kenteken}
                            required
                            className="border-slate-300/80 bg-white/70 text-slate-950 dark:border-white/10 dark:bg-slate-950/40 dark:text-white"
                          />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <select
                            aria-label="Transmissie"
                            name="transmissie"
                            defaultValue={vehicle.transmissie}
                            className="h-10 rounded-lg border border-slate-300/80 bg-white/70 px-3 text-sm text-slate-950 outline-none dark:border-white/10 dark:bg-slate-950/40 dark:text-white"
                          >
                            <option value="handgeschakeld">Schakel</option>
                            <option value="automaat">Automaat</option>
                            <option value="beide">Beide</option>
                          </select>
                          <select
                            aria-label="Status"
                            name="status"
                            defaultValue={vehicle.status}
                            className="h-10 rounded-lg border border-slate-300/80 bg-white/70 px-3 text-sm text-slate-950 outline-none dark:border-white/10 dark:bg-slate-950/40 dark:text-white"
                          >
                            <option value="actief">Rijklaar</option>
                            <option value="onderhoud">Onderhoud</option>
                          </select>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <PendingSubmitButton
                            className="rounded-lg"
                            pendingLabel="Opslaan..."
                          >
                            Opslaan
                          </PendingSubmitButton>
                        </div>
                      </form>
                      <form
                        action={deleteVehicleFormAction}
                        className="mt-2"
                      >
                        <input
                          type="hidden"
                          name="vehicle_id"
                          value={vehicle.id}
                        />
                        <PendingSubmitButton
                          pendingLabel="Verwijderen..."
                          variant="outline"
                          className="rounded-lg border-rose-300/40 text-rose-700 hover:bg-rose-50 dark:text-rose-100 dark:hover:bg-rose-400/10"
                        >
                          Verwijderen
                        </PendingSubmitButton>
                      </form>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/12 bg-slate-950/22 p-8 text-center">
                <CarFront className="mx-auto size-10 text-slate-400" />
                <p className="mt-3 font-semibold text-white">
                  Nog geen voertuigen gevonden
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Voeg minimaal een lesauto toe zodat planning, profiel en
                  compliance straks een duidelijke voertuigbasis hebben.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-950/32 text-white">
          <CardHeader>
            <CardTitle>Voertuig toevoegen</CardTitle>
            <CardDescription className="text-slate-400">
              Registreer direct een lesauto met kenteken en transmissie.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form action={createVehicleFormAction} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="vehicle_model" className="text-slate-200">
                  Model
                </Label>
                <Input
                  id="vehicle_model"
                  name="model"
                  required
                  placeholder="Bijvoorbeeld Toyota Yaris"
                  className="border-white/10 bg-slate-950/60 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vehicle_kenteken" className="text-slate-200">
                  Kenteken
                </Label>
                <Input
                  id="vehicle_kenteken"
                  name="kenteken"
                  required
                  placeholder="XX-999-X"
                  className="border-white/10 bg-slate-950/60 text-white"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="vehicle_transmissie" className="text-slate-200">
                    Transmissie
                  </Label>
                  <select
                    id="vehicle_transmissie"
                    name="transmissie"
                    required
                    defaultValue="handgeschakeld"
                    className="h-10 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm text-white outline-none"
                  >
                    <option value="handgeschakeld">Schakel</option>
                    <option value="automaat">Automaat</option>
                    <option value="beide">Beide</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vehicle_status" className="text-slate-200">
                    Status
                  </Label>
                  <select
                    id="vehicle_status"
                    name="status"
                    defaultValue="actief"
                    className="h-10 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm text-white outline-none"
                  >
                    <option value="actief">Rijklaar</option>
                    <option value="onderhoud">Onderhoud</option>
                  </select>
                </div>
              </div>
              <PendingSubmitButton
                className="w-full rounded-lg"
                pendingLabel="Toevoegen..."
              >
                Voertuig toevoegen
                <ArrowRight className="size-4" />
              </PendingSubmitButton>
            </form>

            <div className="border-t border-white/10 pt-3">
              <p className="mb-3 text-sm font-semibold text-slate-200">
                Operationele controle
              </p>
            {[
              {
                label: "Kenteken compleet",
                done:
                  overview.vehicles.length > 0 &&
                  overview.vehicles.every((vehicle) =>
                    Boolean(vehicle.kenteken.trim()),
                  ),
                icon: ClipboardCheck,
              },
              {
                label: "Transmissie bekend",
                done:
                  overview.vehicles.length > 0 &&
                  overview.vehicles.every((vehicle) =>
                    Boolean(vehicle.transmissie),
                  ),
                icon: Fuel,
              },
              {
                label: "Minimaal een rijklare auto",
                done: activeVehicles.length > 0,
                icon: ShieldCheck,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/6 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="size-5 text-sky-200" />
                    <span className="text-sm font-medium text-slate-200">
                      {item.label}
                    </span>
                  </div>
                  <Badge variant={item.done ? "success" : "warning"}>
                    {item.done ? "Klaar" : "Actie"}
                  </Badge>
                </div>
              );
            })}
            </div>

            <Button asChild className="w-full rounded-lg">
              <Link href="/instructeur/instellingen">
                Voertuigen beheren
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <DashboardPerformanceMark route={ROUTE} label="InstructorVehicles" />
    </div>
  );
}
