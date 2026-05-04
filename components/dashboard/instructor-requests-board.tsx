"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Archive,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Clock3,
  Eye,
  Filter,
  Inbox,
  MoreVertical,
  PlusCircle,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { getRequestStatusLabel } from "@/lib/lesson-request-flow";
import { getRijlesTypeLabel } from "@/lib/lesson-types";
import type { LesAanvraag, LesAanvraagType, LocationOption } from "@/lib/types";
import { cn } from "@/lib/utils";

const RequestStatusActions = dynamic(() =>
  import("@/components/dashboard/request-status-actions").then(
    (module) => module.RequestStatusActions,
  ),
);

type RequestTab = "all" | "pending" | "accepted" | "rejected";
type RequestKindFilter = "all" | LesAanvraagType;

const pageSizeOptions = [6, 10, 20] as const;

const avatarTones = [
  "bg-violet-500/28 text-violet-100",
  "bg-fuchsia-500/24 text-fuchsia-100",
  "bg-emerald-500/24 text-emerald-100",
  "bg-cyan-500/24 text-cyan-100",
  "bg-amber-500/24 text-amber-100",
  "bg-rose-500/24 text-rose-100",
];

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (!words.length) {
    return "AA";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function getRequestTypeLabel(request: LesAanvraag) {
  if (request.aanvraag_type === "proefles") {
    return "Proefles";
  }

  if (request.aanvraag_type === "pakket") {
    return "Pakket";
  }

  return "Losse les";
}

function getRequestLessonLabel(request: LesAanvraag) {
  if (request.pakket_naam?.trim()) {
    return request.pakket_naam;
  }

  const lessonTypeLabel = request.les_type
    ? getRijlesTypeLabel(request.les_type)
    : "Auto";

  if (request.aanvraag_type === "proefles") {
    return `${lessonTypeLabel}rijles`;
  }

  return request.aanvraag_type === "pakket"
    ? `${lessonTypeLabel} pakket`
    : `${lessonTypeLabel}rijles 60 minuten`;
}

function getTableDate(value: string) {
  return value
    .replace(" januari ", " jan. ")
    .replace(" februari ", " feb. ")
    .replace(" maart ", " mrt. ")
    .replace(" april ", " apr. ")
    .replace(" mei ", " mei ")
    .replace(" juni ", " jun. ")
    .replace(" juli ", " jul. ")
    .replace(" augustus ", " aug. ")
    .replace(" september ", " sep. ")
    .replace(" oktober ", " okt. ")
    .replace(" november ", " nov. ")
    .replace(" december ", " dec. ");
}

function getTableTime(request: LesAanvraag) {
  const match = request.tijdvak.match(/\d{1,2}:\d{2}/);
  return match?.[0] ?? request.tijdvak;
}

function matchesTab(request: LesAanvraag, tab: RequestTab) {
  if (tab === "pending") {
    return request.status === "aangevraagd";
  }

  if (tab === "accepted") {
    return ["geaccepteerd", "ingepland", "afgerond"].includes(request.status);
  }

  if (tab === "rejected") {
    return ["geweigerd", "geannuleerd"].includes(request.status);
  }

  return true;
}

function getInitialRequestTab({
  initialFocusId,
  initialTab,
  requests,
}: {
  initialFocusId?: string | null;
  initialTab: RequestTab;
  requests: LesAanvraag[];
}) {
  if (!initialFocusId) {
    return initialTab;
  }

  const focusedRequest = requests.find(
    (request) => request.id === initialFocusId,
  );

  if (!focusedRequest) {
    return initialTab;
  }

  if (focusedRequest.status === "aangevraagd") {
    return "pending";
  }

  if (["geweigerd", "geannuleerd"].includes(focusedRequest.status)) {
    return "rejected";
  }

  return "accepted";
}

function getStatusPill(request: LesAanvraag) {
  if (request.status === "aangevraagd") {
    return {
      className: "border-amber-400/35 bg-amber-400/12 text-amber-300",
      label: "In behandeling",
    };
  }

  if (["geaccepteerd", "ingepland", "afgerond"].includes(request.status)) {
    return {
      className: "border-emerald-400/25 bg-emerald-400/12 text-emerald-300",
      label: "Geaccepteerd",
    };
  }

  return {
    className: "border-rose-400/28 bg-rose-400/12 text-rose-300",
    label: "Geweigerd",
  };
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Inbox;
  label: string;
  value: number;
  hint: string;
  tone: "blue" | "amber" | "emerald" | "rose";
}) {
  const toneClass = {
    amber: "border-amber-400/28 bg-amber-400/10 text-amber-300",
    blue: "border-blue-400/28 bg-blue-400/12 text-blue-300",
    emerald: "border-emerald-400/28 bg-emerald-400/12 text-emerald-300",
    rose: "border-rose-400/28 bg-rose-400/12 text-rose-300",
  }[tone];

  return (
    <div className="rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(15,23,42,0.36))] p-5 shadow-[0_24px_70px_-52px_rgba(0,0,0,0.95)]">
      <div className="flex items-center gap-5">
        <div
          className={cn(
            "flex size-16 shrink-0 items-center justify-center rounded-xl border",
            toneClass,
          )}
        >
          <Icon className="size-8" />
        </div>
        <div>
          <p className="text-base text-slate-200">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {value}
          </p>
          <p className="mt-3 text-sm text-slate-400">{hint}</p>
        </div>
      </div>
    </div>
  );
}

function NewRequestDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-12 rounded-lg bg-blue-600 px-5 text-base text-white shadow-[0_18px_50px_-28px_rgba(37,99,235,0.9)] hover:bg-blue-500">
          <PlusCircle className="size-5" />
          Nieuwe aanvraag
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] dark:text-white">
        <DialogHeader>
          <DialogTitle>Nieuwe aanvraag</DialogTitle>
          <DialogDescription>
            Nieuwe aanvragen komen binnen via je publieke profiel. Deel je
            profiel of controleer je beschikbaarheid om nieuwe aanvragen goed te
            ontvangen.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button asChild className="rounded-lg">
            <Link href="/instructeur/profiel">Profiel openen</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-lg">
            <Link href="/instructeur/beschikbaarheid">
              Beschikbaarheid beheren
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RequestDetailsDialog({
  onOpenChange,
  request,
  locationOptions,
}: {
  onOpenChange: (open: boolean) => void;
  request: LesAanvraag;
  locationOptions: LocationOption[];
}) {
  const statusPill = getStatusPill(request);

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] dark:text-white">
        <DialogHeader>
          <DialogTitle>{request.leerling_naam}</DialogTitle>
          <DialogDescription>
            {getRequestTypeLabel(request)} voor {getRequestLessonLabel(request)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Datum", getTableDate(request.voorkeursdatum)],
            ["Tijd", request.tijdvak],
            ["Status", getRequestStatusLabel(request.status)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-white/10 bg-white/6 p-4"
            >
              <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                {label}
              </p>
              <p className="mt-2 font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/6 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">Bericht leerling</p>
            <span
              className={cn(
                "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                statusPill.className,
              )}
            >
              {statusPill.label}
            </span>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            {request.bericht?.trim() ||
              "Deze leerling heeft geen extra toelichting meegestuurd."}
          </p>
        </div>

        <DialogFooter className="items-center sm:justify-between">
          {request.status === "aangevraagd" ? (
            <RequestStatusActions
              requestId={request.id}
              status={request.status}
              locationOptions={locationOptions}
            />
          ) : (
            <Button asChild variant="outline" className="rounded-lg">
              <Link href="/instructeur/lessen">Lessen bekijken</Link>
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="outline" className="rounded-lg">
              Sluiten
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestMoreMenu({ request }: { request: LesAanvraag }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`Meer acties voor ${request.leerling_naam}`}
          title="Meer"
          size="icon-sm"
          variant="outline"
          className="size-9 rounded-lg border-white/10 bg-white/7 text-slate-200 hover:bg-white/12 hover:text-white"
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 border-white/10 bg-slate-950 text-slate-100"
      >
        <DropdownMenuLabel>Vervolgactie</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/instructeur/berichten">Berichten openen</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/instructeur/lessen">Lessen bekijken</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/instructeur/leerlingen">Leerlingen openen</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RequestRow({
  request,
  index,
  locationOptions,
  onSelectRequest,
}: {
  request: LesAanvraag;
  index: number;
  locationOptions: LocationOption[];
  onSelectRequest: (request: LesAanvraag) => void;
}) {
  const statusPill = getStatusPill(request);

  return (
    <div
      id={`aanvraag-${request.id}`}
      className="grid min-w-[940px] grid-cols-[260px_140px_220px_150px_110px_170px_150px] items-center border-b border-white/10 px-2 py-4 last:border-b-0"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
            avatarTones[index % avatarTones.length],
          )}
        >
          {getInitials(request.leerling_naam)}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-white">
            {request.leerling_naam}
          </p>
          <p className="truncate text-sm text-slate-400">
            {request.leerling_email || "Geen e-mail bekend"}
          </p>
        </div>
      </div>
      <p className="text-slate-100">{getRequestTypeLabel(request)}</p>
      <p className="truncate text-slate-100">
        {getRequestLessonLabel(request)}
      </p>
      <div className="flex items-center gap-2 text-slate-100">
        <CalendarDays className="size-4 text-slate-300" />
        {getTableDate(request.voorkeursdatum)}
      </div>
      <div className="flex items-center gap-2 text-slate-100">
        <Clock3 className="size-4 text-slate-300" />
        {getTableTime(request)}
      </div>
      <span
        className={cn(
          "w-fit rounded-full border px-3 py-1 text-sm font-medium",
          statusPill.className,
        )}
      >
        {statusPill.label}
      </span>
      <div className="flex items-center gap-2">
        <Button
          aria-label={`Bekijk aanvraag van ${request.leerling_naam}`}
          title="Bekijken"
          size="icon-sm"
          variant="outline"
          className="size-9 rounded-lg border-white/10 bg-white/7 text-slate-200 hover:bg-white/12 hover:text-white"
          onClick={() => onSelectRequest(request)}
        >
          <Eye className="size-4" />
        </Button>
        {request.status === "aangevraagd" ? (
          <RequestStatusActions
            requestId={request.id}
            status={request.status}
            locationOptions={locationOptions}
            display="icons"
          />
        ) : (
          <RequestMoreMenu request={request} />
        )}
      </div>
    </div>
  );
}

export function InstructorRequestsBoard({
  requests,
  locationOptions,
  initialTab = "all",
  initialFocusId,
}: {
  requests: LesAanvraag[];
  locationOptions: LocationOption[];
  initialTab?: RequestTab;
  initialFocusId?: string | null;
}) {
  const [activeTab, setActiveTab] = useState<RequestTab>(() =>
    getInitialRequestTab({ initialFocusId, initialTab, requests }),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [kindFilter, setKindFilter] = useState<RequestKindFilter>("all");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<LesAanvraag | null>(
    () =>
      initialFocusId
        ? requests.find((request) => request.id === initialFocusId) ?? null
        : null,
  );

  const counts = useMemo(
    () => ({
      accepted: requests.filter((request) =>
        ["geaccepteerd", "ingepland", "afgerond"].includes(request.status),
      ).length,
      pending: requests.filter((request) => request.status === "aangevraagd")
        .length,
      rejected: requests.filter((request) =>
        ["geweigerd", "geannuleerd"].includes(request.status),
      ).length,
      total: requests.length,
    }),
    [requests],
  );

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          request.leerling_naam,
          request.leerling_email ?? "",
          getRequestTypeLabel(request),
          getRequestLessonLabel(request),
          request.voorkeursdatum,
          request.tijdvak,
          getRequestStatusLabel(request.status),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesKind =
        kindFilter === "all" || request.aanvraag_type === kindFilter;

      return matchesSearch && matchesKind && matchesTab(request, activeTab);
    });
  }, [activeTab, kindFilter, requests, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const firstItemIndex = filteredRequests.length
    ? (safePage - 1) * pageSize
    : 0;
  const visibleRequests = filteredRequests.slice(
    firstItemIndex,
    firstItemIndex + pageSize,
  );

  const tabs: Array<{ label: string; value: RequestTab }> = [
    { label: "Alle aanvragen", value: "all" },
    { label: "In behandeling", value: "pending" },
    { label: "Geaccepteerd", value: "accepted" },
    { label: "Geweigerd", value: "rejected" },
  ];

  const kindLabels: Record<RequestKindFilter, string> = {
    algemeen: "Losse lessen",
    all: "Alle types",
    pakket: "Pakketten",
    proefles: "Proeflessen",
  };

  return (
    <div className="space-y-4 text-white 2xl:space-y-7">
      {selectedRequest ? (
        <RequestDetailsDialog
          request={selectedRequest}
          locationOptions={locationOptions}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedRequest(null);
            }
          }}
        />
      ) : null}

      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between 2xl:gap-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl 2xl:text-4xl">
            Aanvragen
          </h1>
          <p className="mt-1.5 text-sm text-slate-400 2xl:mt-2 2xl:text-lg">
            Wat moet ik nog accepteren? Behandel nieuwe aanvragen en zet ze
            door naar je planning.
          </p>
        </div>
        <NewRequestDialog />
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Inbox}
          label="Totaal aanvragen"
          value={counts.total}
          hint="Deze maand"
          tone="blue"
        />
        <StatCard
          icon={Clock3}
          label="In behandeling"
          value={counts.pending}
          hint="Wacht op jouw reactie"
          tone="amber"
        />
        <StatCard
          icon={CheckCircle2}
          label="Geaccepteerd"
          value={counts.accepted}
          hint="Deze maand"
          tone="emerald"
        />
        <StatCard
          icon={CircleX}
          label="Geweigerd"
          value={counts.rejected}
          hint="Deze maand"
          tone="rose"
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(15,23,42,0.34))] p-4 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.95)]">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white">
            Aanvragenlijst
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Nieuwe aanvragen staan bovenaan je werkvoorraad; accepteer of wijs
            ze direct af.
          </p>
        </div>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-5">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setActiveTab(tab.value);
                  setCurrentPage(1);
                }}
                className={cn(
                  "border-b-2 px-2 pb-3 text-base transition",
                  activeTab === tab.value
                    ? "border-blue-400 text-white"
                    : "border-transparent text-slate-400 hover:text-white",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Zoek aanvragen..."
                aria-label="Zoek aanvragen"
                className="h-11 w-full rounded-lg border-white/10 bg-slate-950/34 pl-10 text-white placeholder:text-slate-500 sm:w-72"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 rounded-lg border-white/10 bg-white/7 px-4 text-white hover:bg-white/12"
                >
                  <Filter className="size-5" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 border-white/10 bg-slate-950 text-slate-100"
              >
                <DropdownMenuLabel>Type aanvraag</DropdownMenuLabel>
                {(["all", "proefles", "algemeen", "pakket"] as const).map(
                  (value) => (
                    <DropdownMenuItem
                      key={value}
                      onSelect={() => {
                        setKindFilter(value);
                        setCurrentPage(1);
                      }}
                    >
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          kindFilter === value ? "bg-blue-400" : "bg-white/20",
                        )}
                      />
                      {kindLabels[value]}
                    </DropdownMenuItem>
                  ),
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    setSearchTerm("");
                    setKindFilter("all");
                    setActiveTab("all");
                    setCurrentPage(1);
                  }}
                >
                  Filters wissen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[940px]">
            <div className="grid grid-cols-[260px_140px_220px_150px_110px_170px_150px] rounded-lg border border-white/10 bg-white/5 px-2 py-4 text-base text-slate-200">
              <span>Aanvrager</span>
              <span>Type</span>
              <span>Les / Pakket</span>
              <span>Datum</span>
              <span>Tijd</span>
              <span>Status</span>
              <span>Acties</span>
            </div>

            {visibleRequests.length ? (
              visibleRequests.map((request, index) => (
                <RequestRow
                  key={request.id}
                  request={request}
                  index={firstItemIndex + index}
                  locationOptions={locationOptions}
                  onSelectRequest={setSelectedRequest}
                />
              ))
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-white/12 text-center">
                <Archive className="size-10 text-slate-500" />
                <p className="mt-4 font-semibold text-white">
                  Geen aanvragen gevonden
                </p>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                  Pas je zoekterm of filter aan, of open je profiel om nieuwe
                  aanvragen te ontvangen.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4 border-t border-white/10 pt-4 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between">
          <p>
            {filteredRequests.length
              ? `${firstItemIndex + 1}-${Math.min(
                  firstItemIndex + pageSize,
                  filteredRequests.length,
                )} van ${filteredRequests.length} aanvragen`
              : "0 van 0 aanvragen"}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Button
                aria-label="Vorige pagina"
                size="icon-sm"
                variant="outline"
                disabled={safePage <= 1}
                className="size-9 rounded-lg border-white/10 bg-white/7 text-white disabled:opacity-40"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 4) }).map(
                (_, index) => {
                  const page = index + 1;
                  return (
                    <Button
                      key={page}
                      size="icon-sm"
                      variant={safePage === page ? "default" : "outline"}
                      className={cn(
                        "size-9 rounded-lg",
                        safePage === page
                          ? "bg-blue-600 text-white hover:bg-blue-500"
                          : "border-white/10 bg-white/7 text-slate-200",
                      )}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                },
              )}
              <Button
                aria-label="Volgende pagina"
                size="icon-sm"
                variant="outline"
                disabled={safePage >= totalPages}
                className="size-9 rounded-lg border-white/10 bg-white/7 text-white disabled:opacity-40"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <label className="flex items-center gap-3">
              Toon
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
                className="h-10 rounded-lg border border-white/10 bg-slate-950/34 px-3 text-white outline-none"
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}
