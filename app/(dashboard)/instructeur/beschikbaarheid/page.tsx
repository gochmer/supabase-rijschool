import { CalendarClock, CalendarDays, EyeOff, Repeat, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { AvailabilityManager } from "@/components/instructor/availability-manager";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAvailabilityDurationMinutes,
  getAvailabilityDateValue,
  getStartOfWeekDateValue,
} from "@/lib/availability";
import { getCurrentInstructorAvailability } from "@/lib/data/instructor-account";
import { getInstructeurLessons } from "@/lib/data/lesson-requests";
import { getCurrentInstructeurRecord } from "@/lib/data/profiles";

function formatMinutesLabel(totalMinutes: number) {
  if (totalMinutes <= 0) {
    return "0 uur";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!minutes) {
    return `${hours} uur`;
  }

  return `${hours}u ${String(minutes).padStart(2, "0")}m`;
}

export default async function BeschikbaarheidPage() {
  const [slots, lessons, instructeur] = await Promise.all([
    getCurrentInstructorAvailability(),
    getInstructeurLessons(),
    getCurrentInstructeurRecord(),
  ]);

  const activeSlots = slots.filter((slot) => slot.beschikbaar).length;
  const hiddenSlots = slots.length - activeSlots;
  const recurringRuleCount = new Set(
    slots.map((slot) => slot.weekrooster_id).filter(Boolean)
  ).size;
  const today = new Date();
  const currentWeekStart = getStartOfWeekDateValue(today.toISOString());
  const nextWeekStart = getStartOfWeekDateValue(
    new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
  );
  const nextWeekEnd = getStartOfWeekDateValue(
    new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
  );
  const nextWeekOpenMinutes = slots.reduce((total, slot) => {
    if (!slot.beschikbaar || !slot.start_at || !slot.eind_at) {
      return total;
    }

    const dateValue = getAvailabilityDateValue(slot.start_at);

    if (dateValue < nextWeekStart || dateValue >= nextWeekEnd) {
      return total;
    }

    return total + getAvailabilityDurationMinutes(slot.start_at, slot.eind_at);
  }, 0);
  const upcomingLessons = lessons.filter(
    (lesson) =>
      lesson.start_at &&
      new Date(lesson.start_at).getTime() >= today.getTime() &&
      ["ingepland", "geaccepteerd", "afgerond"].includes(lesson.status)
  ).length;
  const actionSignals = [
    recurringRuleCount === 0 ? "Nog geen vaste weekplanning actief." : null,
    activeSlots === 0 ? "Er staan nu geen boekbare momenten open." : null,
    hiddenSlots > activeSlots && hiddenSlots > 0
      ? "Je hebt meer interne blokkades dan open boekbare slots."
      : null,
  ].filter(Boolean) as string[];

  const summaryCards = [
    {
      label: "Boekbaar open",
      value: `${activeSlots}`,
      description: activeSlots ? "Actieve slots voor leerlingen" : "Nog geen open slots",
      icon: Sparkles,
    },
    {
      label: "Vast weekrooster",
      value: `${recurringRuleCount}`,
      description: recurringRuleCount ? "Terugkerende regels actief" : "Nog geen vaste ritmes",
      icon: Repeat,
    },
    {
      label: "Volgende week open",
      value: formatMinutesLabel(nextWeekOpenMinutes),
      description: "Open tijd die al klaarstaat",
      icon: CalendarDays,
    },
    {
      label: "Ingeplande lessen",
      value: `${upcomingLessons}`,
      description: "Aankomende lesmomenten geblokkeerd",
      icon: CalendarClock,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Beschikbaarheid"
        description="Houd je rooster, lesblokken, buffers en uitzonderingen rustig bij vanuit één duidelijke planner."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <Card
            key={item.label}
            className="border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <item.icon className="size-4 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {item.label}
                </p>
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
                {item.value}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="planner" className="space-y-4">
        <TabsList className="h-auto w-full rounded-[1.4rem] bg-white/70 p-1 dark:bg-white/5">
          <TabsTrigger value="overzicht" className="min-h-10 rounded-[1rem] px-3 text-sm">
            Overzicht
          </TabsTrigger>
          <TabsTrigger value="planner" className="min-h-10 rounded-[1rem] px-3 text-sm">
            Planner
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overzicht" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
              <CardHeader className="pb-3">
                <CardTitle>Wat staat goed</CardTitle>
                <CardDescription>
                  De rustige basis van je planning voordat je verder de kalender in gaat.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {activeSlots
                      ? `${activeSlots} boekbare slot${activeSlots === 1 ? "" : "s"} open`
                      : "Nog geen boekbare slots open"}
                  </p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    Leerlingen kunnen alleen plannen op momenten die hier echt openstaan.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {recurringRuleCount
                      ? `${recurringRuleCount} vaste weekregel${recurringRuleCount === 1 ? "" : "s"} actief`
                      : "Nog geen vaste weekregels"}
                  </p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    Een vast ritme maakt je agenda voorspelbaarder voor leerlingen en voor jezelf.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
                    Week van {currentWeekStart}
                  </Badge>
                  <Badge className="border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
                    {upcomingLessons} aankomende les{upcomingLessons === 1 ? "" : "sen"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))]">
              <CardHeader className="pb-3">
                <CardTitle>Nu slim om te checken</CardTitle>
                <CardDescription>
                  Alleen de punten die nu echt verschil maken voor je boekbaarheid.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {actionSignals.length ? (
                  actionSignals.map((signal) => (
                    <div
                      key={signal}
                      className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 text-sm dark:border-white/10 dark:bg-white/5"
                    >
                      <p className="font-semibold text-slate-950 dark:text-white">
                        {signal}
                      </p>
                      <p className="mt-1 text-slate-600 dark:text-slate-300">
                        Werk dit bij in de planner zodat je agenda rustiger en duidelijker blijft.
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                    <p className="font-semibold text-slate-950 dark:text-white">
                      Je basis staat er rustig bij.
                    </p>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">
                      Je hebt open slots, een logisch ritme en geen directe planningswaarschuwing.
                    </p>
                  </div>
                )}
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {hiddenSlots
                      ? `${hiddenSlots} intern geblokkeerde moment${hiddenSlots === 1 ? "" : "en"}`
                      : "Geen interne blokkades"}
                  </p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    Gebruik afwezigheidsblokken bewust, zodat je publieke agenda niet onnodig dichtloopt.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-2">
                    <EyeOff className="size-4 text-primary" />
                    <p className="font-semibold text-slate-950 dark:text-white">
                      Volgende week staat nu op {formatMinutesLabel(nextWeekOpenMinutes)}
                    </p>
                  </div>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    Handig om direct te zien of je genoeg volume open hebt voor nieuwe boekingen.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="planner">
          <AvailabilityManager
            slots={slots}
            lessons={lessons}
            pricePerLesson={Number(instructeur?.prijs_per_les ?? 0)}
            showSummarySidebar={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
