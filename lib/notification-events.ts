import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getRijlesTypeLabel } from "@/lib/lesson-types";
import {
  getStudentTrajectoryIntelligence,
  type StudentPackageTrajectoryInput,
} from "@/lib/student-progress";
import type { Database } from "@/lib/supabase/database.types";
import type {
  LesAanvraagType,
  RijlesType,
  StudentProgressAssessment,
  StudentProgressLessonNote,
} from "@/lib/types";

type ServerSupabase = SupabaseClient<Database>;
type NotificationTone = "info" | "succes" | "waarschuwing";

type ProfileContact = {
  id: string;
  volledige_naam: string;
  email: string | null;
};

function getAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderEmailTemplate({
  eyebrow,
  title,
  intro,
  details,
  ctaLabel,
  ctaHref,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  details: Array<{ label: string; value: string }>;
  ctaLabel: string;
  ctaHref: string;
}) {
  const escapedTitle = escapeHtml(title);
  const escapedIntro = escapeHtml(intro);
  const escapedCtaLabel = escapeHtml(ctaLabel);

  return `
    <div style="background:#f8fafc;padding:32px 16px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid rgba(148,163,184,0.22);border-radius:24px;overflow:hidden;box-shadow:0 24px 64px -40px rgba(15,23,42,0.35);">
        <div style="padding:28px 28px 12px;background:linear-gradient(135deg,#020617,#172554,#0284c7);color:#ffffff;">
          <div style="font-size:11px;letter-spacing:0.24em;text-transform:uppercase;opacity:0.78;font-weight:700;">${escapeHtml(
            eyebrow
          )}</div>
          <h1 style="margin:14px 0 0;font-size:28px;line-height:1.15;font-weight:700;">${escapedTitle}</h1>
        </div>
        <div style="padding:24px 28px 28px;">
          <p style="margin:0 0 18px;font-size:15px;line-height:1.8;color:#334155;">${escapedIntro}</p>
          <div style="display:grid;gap:10px;margin:0 0 24px;">
            ${details
              .map(
                (detail) => `
                  <div style="border:1px solid rgba(148,163,184,0.22);border-radius:16px;padding:14px 16px;background:#f8fafc;">
                    <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;font-weight:700;">${escapeHtml(
                      detail.label
                    )}</div>
                    <div style="margin-top:6px;font-size:15px;line-height:1.6;color:#0f172a;font-weight:600;">${escapeHtml(
                      detail.value
                    )}</div>
                  </div>
                `
              )
              .join("")}
          </div>
          <a href="${ctaHref}" style="display:inline-block;border-radius:999px;background:linear-gradient(135deg,#0f172a,#2563eb);color:#ffffff;text-decoration:none;padding:12px 18px;font-size:14px;font-weight:700;">
            ${escapedCtaLabel}
          </a>
        </div>
      </div>
    </div>
  `;
}

function renderPlainText({
  title,
  intro,
  details,
  ctaHref,
}: {
  title: string;
  intro: string;
  details: Array<{ label: string; value: string }>;
  ctaHref: string;
}) {
  return [
    title,
    "",
    intro,
    "",
    ...details.map((detail) => `${detail.label}: ${detail.value}`),
    "",
    `Open: ${ctaHref}`,
  ].join("\n");
}

async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  const replyTo = process.env.NOTIFICATION_REPLY_TO_EMAIL;
  const forcedTo = process.env.NOTIFICATION_TEST_TO_EMAIL?.trim();
  const recipient = forcedTo || to;

  if (!apiKey || !from || !recipient?.trim()) {
    return { sent: false, skipped: true as const };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "gochoir-notifications/1.0",
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        subject,
        html,
        text,
        reply_to: replyTo || undefined,
      }),
    });

    if (!response.ok) {
      console.error("Notification email failed", await response.text());
      return { sent: false, skipped: false as const };
    }

    return { sent: true, skipped: false as const };
  } catch (error) {
    console.error("Notification email failed", error);
    return { sent: false, skipped: false as const };
  }
}

async function createInAppNotification({
  actionHref,
  supabase,
  profileId,
  title,
  text,
  type = "info",
}: {
  actionHref?: string | null;
  supabase: ServerSupabase;
  profileId: string | null | undefined;
  title: string;
  text: string;
  type?: NotificationTone;
}) {
  if (!profileId) {
    return;
  }

  await supabase.from("notificaties").insert({
    ...(actionHref?.trim() ? { action_href: actionHref.trim() } : {}),
    profiel_id: profileId,
    titel: title,
    tekst: text,
    type,
    ongelezen: true,
  } as never);
}

async function createUniqueInAppNotification({
  actionHref,
  supabase,
  profileId,
  title,
  text,
  type = "info",
}: {
  actionHref?: string | null;
  supabase: ServerSupabase;
  profileId: string | null | undefined;
  title: string;
  text: string;
  type?: NotificationTone;
}) {
  if (!profileId) {
    return false;
  }

  const { data: existingNotification } = await supabase
    .from("notificaties")
    .select("id")
    .eq("profiel_id", profileId)
    .eq("titel", title)
    .eq("tekst", text)
    .limit(1)
    .maybeSingle();

  if (existingNotification) {
    return false;
  }

  await createInAppNotification({
    actionHref,
    supabase,
    profileId,
    title,
    text,
    type,
  });

  return true;
}

async function getProfileContactById(
  supabase: ServerSupabase,
  profileId: string | null | undefined
): Promise<ProfileContact | null> {
  if (!profileId) {
    return null;
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, volledige_naam, email")
    .eq("id", profileId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    volledige_naam: data.volledige_naam,
    email: data.email || null,
  };
}

async function getLearnerContactById(
  supabase: ServerSupabase,
  leerlingId: string | null | undefined
) {
  if (!leerlingId) {
    return null;
  }

  const { data: leerling } = await supabase
    .from("leerlingen")
    .select("profile_id")
    .eq("id", leerlingId)
    .maybeSingle();

  return getProfileContactById(supabase, leerling?.profile_id);
}

async function getInstructorContactById(
  supabase: ServerSupabase,
  instructeurId: string | null | undefined
) {
  if (!instructeurId) {
    return null;
  }

  const { data: instructeur } = await supabase
    .from("instructeurs")
    .select("profile_id, volledige_naam")
    .eq("id", instructeurId)
    .maybeSingle();

  const profileContact = await getProfileContactById(
    supabase,
    instructeur?.profile_id
  );

  if (!profileContact && !instructeur) {
    return null;
  }

  return {
    id: profileContact?.id ?? instructeur?.profile_id ?? "",
    volledige_naam:
      profileContact?.volledige_naam ||
      instructeur?.volledige_naam ||
      "Instructeur",
    email: profileContact?.email ?? null,
  };
}

function getRequestLabel({
  pakketNaam,
  aanvraagType,
  lesType,
}: {
  pakketNaam?: string | null;
  aanvraagType?: LesAanvraagType | string | null;
  lesType?: RijlesType | string | null;
}) {
  if (pakketNaam?.trim()) {
    return pakketNaam.trim();
  }

  const typeLabel = lesType ? getRijlesTypeLabel(lesType) : "Rijles";

  if (aanvraagType === "proefles") {
    return `${typeLabel} proefles`;
  }

  if (aanvraagType === "pakket") {
    return `${typeLabel} pakket`;
  }

  return `${typeLabel} aanvraag`;
}

async function deliverNotificationEmail({
  to,
  subject,
  eyebrow,
  intro,
  details,
  ctaPath,
  ctaLabel,
}: {
  to: string | null | undefined;
  subject: string;
  eyebrow: string;
  intro: string;
  details: Array<{ label: string; value: string }>;
  ctaPath: string;
  ctaLabel: string;
}) {
  if (!to?.trim()) {
    return;
  }

  const ctaHref = `${getAppBaseUrl()}${ctaPath}`;
  const html = renderEmailTemplate({
    eyebrow,
    title: subject,
    intro,
    details,
    ctaLabel,
    ctaHref,
  });
  const text = renderPlainText({
    title: subject,
    intro,
    details,
    ctaHref,
  });

  return sendEmail({
    to,
    subject,
    html,
    text,
  });
}

export async function notifyInstructorAboutNewRequest({
  supabase,
  instructeurId,
  leerlingNaam,
  voorkeursdatum,
  tijdvak,
  pakketNaam,
  aanvraagType,
  lesType,
  bericht,
}: {
  supabase: ServerSupabase;
  instructeurId: string;
  leerlingNaam: string;
  voorkeursdatum: string;
  tijdvak: string;
  pakketNaam?: string | null;
  aanvraagType?: LesAanvraagType | string | null;
  lesType?: RijlesType | string | null;
  bericht?: string | null;
}) {
  const instructor = await getInstructorContactById(supabase, instructeurId);
  const requestLabel = getRequestLabel({ pakketNaam, aanvraagType, lesType });
  const title = "Nieuwe aanvraag ontvangen";
  const text = `${leerlingNaam} heeft een ${requestLabel.toLowerCase()} aangevraagd voor ${voorkeursdatum} (${tijdvak}).`;

  await createInAppNotification({
    supabase,
    profileId: instructor?.id,
    title,
    text,
    type: "info",
  });

  await deliverNotificationEmail({
    to: instructor?.email,
    subject: `Nieuwe aanvraag van ${leerlingNaam}`,
    eyebrow: "Nieuwe lesaanvraag",
    intro: `${leerlingNaam} heeft een nieuwe ${requestLabel.toLowerCase()} naar je verstuurd.`,
    details: [
      { label: "Leerling", value: leerlingNaam },
      { label: "Type", value: requestLabel },
      { label: "Voorkeursdatum", value: voorkeursdatum },
      { label: "Tijdvak", value: tijdvak },
      ...(bericht?.trim()
        ? [{ label: "Toelichting", value: bericht.trim() }]
        : []),
    ],
    ctaPath: "/instructeur/aanvragen",
    ctaLabel: "Open lesaanvragen",
  });
}

export async function notifyInstructorAboutDirectBooking({
  supabase,
  instructeurId,
  leerlingNaam,
  voorkeursdatum,
  tijdvak,
  pakketNaam,
  aanvraagType,
  lesType,
  bericht,
}: {
  supabase: ServerSupabase;
  instructeurId: string;
  leerlingNaam: string;
  voorkeursdatum: string;
  tijdvak: string;
  pakketNaam?: string | null;
  aanvraagType?: LesAanvraagType | string | null;
  lesType?: RijlesType | string | null;
  bericht?: string | null;
}) {
  const instructor = await getInstructorContactById(supabase, instructeurId);
  const requestLabel = getRequestLabel({ pakketNaam, aanvraagType, lesType });
  const title = "Directe boeking ontvangen";
  const text = `${leerlingNaam} heeft ${requestLabel.toLowerCase()} direct ingepland op ${voorkeursdatum} (${tijdvak}).`;

  await createInAppNotification({
    supabase,
    profileId: instructor?.id,
    title,
    text,
    type: "succes",
  });

  await deliverNotificationEmail({
    to: instructor?.email,
    subject: `Nieuwe directe boeking van ${leerlingNaam}`,
    eyebrow: "Direct ingepland",
    intro: `${leerlingNaam} heeft ${requestLabel.toLowerCase()} direct vastgezet in je agenda.`,
    details: [
      { label: "Leerling", value: leerlingNaam },
      { label: "Type", value: requestLabel },
      { label: "Datum", value: voorkeursdatum },
      { label: "Tijdvak", value: tijdvak },
      ...(bericht?.trim()
        ? [{ label: "Toelichting", value: bericht.trim() }]
        : []),
    ],
    ctaPath: "/instructeur/lessen",
    ctaLabel: "Open je lessen",
  });
}

export async function notifyLearnerAboutRequestDecision({
  supabase,
  leerlingId,
  instructeurNaam,
  status,
  voorkeursdatum,
  tijdvak,
  pakketNaam,
  aanvraagType,
  lesType,
  reason,
}: {
  supabase: ServerSupabase;
  leerlingId: string | null;
  instructeurNaam: string;
  status: "geaccepteerd" | "geweigerd";
  voorkeursdatum?: string | null;
  tijdvak?: string | null;
  pakketNaam?: string | null;
  aanvraagType?: LesAanvraagType | string | null;
  lesType?: RijlesType | string | null;
  reason?: string | null;
}) {
  const learner = await getLearnerContactById(supabase, leerlingId);
  const requestLabel = getRequestLabel({ pakketNaam, aanvraagType, lesType });
  const isAccepted = status === "geaccepteerd";
  const title = isAccepted
    ? "Je aanvraag is geaccepteerd"
    : "Je aanvraag is geweigerd";
  const text = isAccepted
    ? `${instructeurNaam} heeft je ${requestLabel.toLowerCase()} geaccepteerd.`
    : reason?.trim()
      ? `${instructeurNaam} heeft je aanvraag geweigerd. Reden: ${reason.trim()}`
      : `${instructeurNaam} heeft je aanvraag geweigerd.`;

  await createInAppNotification({
    supabase,
    profileId: learner?.id,
    title,
    text,
    type: isAccepted ? "succes" : "waarschuwing",
  });

  await deliverNotificationEmail({
    to: learner?.email,
    subject: title,
    eyebrow: isAccepted ? "Aanvraag geaccepteerd" : "Aanvraag geweigerd",
    intro: isAccepted
      ? `${instructeurNaam} heeft je ${requestLabel.toLowerCase()} geaccepteerd.`
      : `${instructeurNaam} heeft je ${requestLabel.toLowerCase()} geweigerd.`,
    details: [
      { label: "Instructeur", value: instructeurNaam },
      { label: "Type", value: requestLabel },
      ...(voorkeursdatum ? [{ label: "Voorkeursdatum", value: voorkeursdatum }] : []),
      ...(tijdvak ? [{ label: "Tijdvak", value: tijdvak }] : []),
      ...(!isAccepted && reason?.trim()
        ? [{ label: "Reden", value: reason.trim() }]
        : []),
    ],
    ctaPath: "/leerling/boekingen",
    ctaLabel: "Open je boekingen",
  });
}

export async function notifyLearnerAboutLessonChange({
  supabase,
  leerlingId,
  instructeurNaam,
  datum,
  tijd,
  locatie,
  status,
  reason,
  suggestedTimes = [],
}: {
  supabase: ServerSupabase;
  leerlingId: string | null;
  instructeurNaam: string;
  datum: string;
  tijd: string;
  locatie: string;
  status: "geaccepteerd" | "ingepland" | "afgerond" | "geannuleerd";
  reason?: string | null;
  suggestedTimes?: string[];
}) {
  const learner = await getLearnerContactById(supabase, leerlingId);
  const cleanSuggestedTimes = suggestedTimes
    .map((item) => item.trim())
    .filter(Boolean);
  const suggestedTimesText = cleanSuggestedTimes.length
    ? ` Voorgestelde alternatieven: ${cleanSuggestedTimes.join(", ")}.`
    : "";

  const title =
    status === "geannuleerd"
      ? "Je les is geannuleerd"
      : status === "afgerond"
        ? "Je les is afgerond"
        : "Je les is bijgewerkt";

  const text =
    status === "geannuleerd"
      ? `${instructeurNaam} heeft je les geannuleerd.${reason?.trim() ? ` Reden: ${reason.trim()}` : ""}${suggestedTimesText}`
      : status === "afgerond"
        ? `${instructeurNaam} heeft je les als afgerond gemarkeerd.`
        : `${instructeurNaam} heeft je les bijgewerkt naar ${datum} om ${tijd}.`;

  await createInAppNotification({
    supabase,
    profileId: learner?.id,
    title,
    text,
    type: status === "geannuleerd" ? "waarschuwing" : status === "afgerond" ? "succes" : "info",
  });

  if (status === "afgerond") {
    return;
  }

  const details = [
    { label: "Instructeur", value: instructeurNaam },
    { label: "Datum", value: datum },
    { label: "Tijd", value: tijd },
    { label: "Locatie", value: locatie || "Locatie volgt nog" },
  ];

  if (status === "geannuleerd" && reason?.trim()) {
    details.push({ label: "Reden", value: reason.trim() });
  }

  if (status === "geannuleerd" && cleanSuggestedTimes.length) {
    details.push({
      label: "Nieuwe tijden",
      value: cleanSuggestedTimes.join(", "),
    });
  }

  await deliverNotificationEmail({
    to: learner?.email,
    subject: title,
    eyebrow: status === "geannuleerd" ? "Les geannuleerd" : "Les bijgewerkt",
    intro:
      status === "geannuleerd"
        ? cleanSuggestedTimes.length
          ? `${instructeurNaam} heeft je les geannuleerd en meteen nieuwe tijden voorgesteld.`
          : `${instructeurNaam} heeft je les geannuleerd.`
        : `${instructeurNaam} heeft je lesmoment bijgewerkt.`,
    details,
    ctaPath: "/leerling/boekingen",
    ctaLabel: "Open je lesoverzicht",
  });
}

export async function notifyInstructorAboutLearnerLessonCancellation({
  supabase,
  instructeurId,
  leerlingNaam,
  datum,
  tijd,
  lesTitel,
  reason,
}: {
  supabase: ServerSupabase;
  instructeurId: string | null;
  leerlingNaam: string;
  datum: string;
  tijd: string;
  lesTitel: string;
  reason?: string | null;
}) {
  const instructor = await getInstructorContactById(supabase, instructeurId);

  if (!instructor?.id) {
    return;
  }

  const title = "Leerling heeft les geannuleerd";
  const text = reason?.trim()
    ? `${leerlingNaam} heeft ${lesTitel.toLowerCase()} van ${datum} om ${tijd} geannuleerd. Reden: ${reason.trim()}`
    : `${leerlingNaam} heeft ${lesTitel.toLowerCase()} van ${datum} om ${tijd} geannuleerd.`;

  await createInAppNotification({
    supabase,
    profileId: instructor.id,
    title,
    text,
    type: "waarschuwing",
  });

  await deliverNotificationEmail({
    to: instructor.email,
    subject: title,
    eyebrow: "Les geannuleerd",
    intro: `${leerlingNaam} heeft een geplande les zelf geannuleerd binnen jouw ingestelde annuleerregels.`,
    details: [
      { label: "Leerling", value: leerlingNaam },
      { label: "Les", value: lesTitel },
      { label: "Datum", value: datum },
      { label: "Tijd", value: tijd },
      ...(reason?.trim() ? [{ label: "Reden", value: reason.trim() }] : []),
    ],
    ctaPath: "/instructeur/lessen",
    ctaLabel: "Open je agenda",
  });
}

export async function notifyLearnerAboutLessonAttendance({
  supabase,
  leerlingId,
  instructeurNaam,
  datum,
  tijd,
  reason,
}: {
  supabase: ServerSupabase;
  leerlingId: string | null;
  instructeurNaam: string;
  datum: string;
  tijd: string;
  reason?: string | null;
}) {
  const learner = await getLearnerContactById(supabase, leerlingId);

  const title = "Je les staat als afwezig geregistreerd";
  const text = reason?.trim()
    ? `${instructeurNaam} heeft je les van ${datum} om ${tijd} als afwezig gemarkeerd. Reden: ${reason.trim()}`
    : `${instructeurNaam} heeft je les van ${datum} om ${tijd} als afwezig gemarkeerd.`;

  await createInAppNotification({
    supabase,
    profileId: learner?.id,
    title,
    text,
    type: "waarschuwing",
  });

  await deliverNotificationEmail({
    to: learner?.email,
    subject: title,
    eyebrow: "Afwezig bevestigd",
    intro: `${instructeurNaam} heeft je lesmoment als afwezig afgesloten.`,
    details: [
      { label: "Instructeur", value: instructeurNaam },
      { label: "Datum", value: datum },
      { label: "Tijd", value: tijd },
      ...(reason?.trim() ? [{ label: "Reden", value: reason.trim() }] : []),
    ],
    ctaPath: "/leerling/boekingen",
    ctaLabel: "Open je lesoverzicht",
  });
}

export async function notifyLearnerAboutManualOnboarding({
  supabase,
  leerlingId,
  instructeurNaam,
  packageName,
  selfSchedulingAllowed,
  onboardingNote,
}: {
  supabase: ServerSupabase;
  leerlingId: string | null;
  instructeurNaam: string;
  packageName?: string | null;
  selfSchedulingAllowed?: boolean;
  onboardingNote?: string | null;
}) {
  const learner = await getLearnerContactById(supabase, leerlingId);

  if (!learner?.id) {
    return;
  }

  const title = "Je bent toegevoegd door een instructeur";
  const text = selfSchedulingAllowed
    ? `${instructeurNaam} heeft je toegevoegd en je mag direct zelf een moment kiezen in de agenda.`
    : `${instructeurNaam} heeft je toegevoegd aan het traject en zet de eerste les samen met je klaar.`;

  await createInAppNotification({
    supabase,
    profileId: learner.id,
    title,
    text,
    type: "succes",
  });

  await deliverNotificationEmail({
    to: learner.email,
    subject: title,
    eyebrow: "Nieuw traject gestart",
    intro: selfSchedulingAllowed
      ? `${instructeurNaam} heeft je toegevoegd en meteen toegang gegeven om zelf een boekbaar moment te kiezen.`
      : `${instructeurNaam} heeft je toegevoegd aan het traject en helpt je nu verder met de eerste lesplanning.`,
    details: [
      { label: "Instructeur", value: instructeurNaam },
      ...(packageName ? [{ label: "Startpakket", value: packageName }] : []),
      {
        label: "Agenda",
        value: selfSchedulingAllowed
          ? "Direct vrijgegeven voor zelf inplannen"
          : "Wordt later vrijgegeven of samen ingepland",
      },
      ...(onboardingNote?.trim()
        ? [{ label: "Startnotitie", value: onboardingNote.trim() }]
        : []),
    ],
    ctaPath: "/leerling/dashboard",
    ctaLabel: selfSchedulingAllowed ? "Open je dashboard" : "Bekijk je traject",
  });
}

export async function notifyLearnerToLeaveReview({
  supabase,
  leerlingId,
  instructeurNaam,
  datum,
  tijd,
  lesTitel,
}: {
  supabase: ServerSupabase;
  leerlingId: string | null;
  instructeurNaam: string;
  datum: string;
  tijd: string;
  lesTitel: string;
}) {
  const learner = await getLearnerContactById(supabase, leerlingId);

  if (!learner?.id) {
    return;
  }

  const title = "Laat een review achter";
  const text = `${instructeurNaam} heeft ${lesTitel.toLowerCase()} op ${datum} om ${tijd} afgerond. Deel kort hoe de les voelde en help andere leerlingen kiezen.`;

  const { data: existingNotification } = await supabase
    .from("notificaties")
    .select("id")
    .eq("profiel_id", learner.id)
    .eq("titel", title)
    .eq("tekst", text)
    .limit(1)
    .maybeSingle();

  if (existingNotification) {
    return;
  }

  await createInAppNotification({
    supabase,
    profileId: learner.id,
    title,
    text,
    type: "succes",
  });

  await deliverNotificationEmail({
    to: learner.email,
    subject: "Je les is afgerond - laat een review achter",
    eyebrow: "Review reminder",
    intro: `${instructeurNaam} heeft je les afgerond. Met een korte review help je andere leerlingen sneller vertrouwen opbouwen.`,
    details: [
      { label: "Instructeur", value: instructeurNaam },
      { label: "Les", value: lesTitel },
      { label: "Datum", value: datum },
      { label: "Tijd", value: tijd },
    ],
    ctaPath: "/leerling/reviews",
    ctaLabel: "Laat een review achter",
  });
}

function formatFeedbackDate(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  }).format(date);
}

function getLessonFeedbackPreview({
  focus,
  samenvatting,
  sterkPunt,
}: {
  focus?: string | null;
  samenvatting?: string | null;
  sterkPunt?: string | null;
}) {
  if (focus?.trim()) {
    return `Focus voor volgende keer: ${focus.trim()}`;
  }

  if (samenvatting?.trim()) {
    return samenvatting.trim();
  }

  if (sterkPunt?.trim()) {
    return `Sterk punt: ${sterkPunt.trim()}`;
  }

  return "Je instructeur heeft je lesverslag bijgewerkt.";
}

export async function notifyLearnerAboutProgressLessonFeedback({
  supabase,
  leerlingId,
  instructeurNaam,
  instructeurProfileId,
  lesdatum,
  lesTitel,
  samenvatting,
  sterkPunt,
  focusVolgendeLes,
}: {
  actionHref?: string | null;
  supabase: ServerSupabase;
  leerlingId: string | null;
  instructeurNaam: string;
  instructeurProfileId: string | null;
  lesdatum: string;
  lesTitel?: string | null;
  samenvatting?: string | null;
  sterkPunt?: string | null;
  focusVolgendeLes?: string | null;
}) {
  const learner = await getLearnerContactById(supabase, leerlingId);

  if (!learner?.id) {
    return;
  }

  const dateLabel = formatFeedbackDate(lesdatum);
  const lessonLabel = lesTitel?.trim() || "Rijles";
  const preview = getLessonFeedbackPreview({
    focus: focusVolgendeLes,
    samenvatting,
    sterkPunt,
  });
  const title = "Nieuw lesverslag beschikbaar";
  const text = `${instructeurNaam} heeft je lesverslag van ${dateLabel} bijgewerkt. ${preview}`;

  await createUniqueInAppNotification({
    actionHref: "/leerling/boekingen",
    supabase,
    profileId: learner.id,
    title,
    text,
    type: "succes",
  });

  if (!instructeurProfileId || instructeurProfileId === learner.id) {
    return;
  }

  const subject = `Je lesverslag van ${dateLabel}`;
  const messageBody = [
    `Hi, je lesverslag voor ${lessonLabel.toLowerCase()} staat klaar.`,
    "",
    samenvatting?.trim() ? `Samenvatting: ${samenvatting.trim()}` : null,
    sterkPunt?.trim() ? `Sterk punt: ${sterkPunt.trim()}` : null,
    focusVolgendeLes?.trim()
      ? `Focus voor volgende keer: ${focusVolgendeLes.trim()}`
      : null,
    "",
    "Je vindt dit ook terug bij je boekingen en voortgang.",
  ]
    .filter((line): line is string => line != null)
    .join("\n");

  const { data: existingMessage } = await supabase
    .from("berichten")
    .select("id")
    .eq("afzender_profiel_id", instructeurProfileId)
    .eq("ontvanger_profiel_id", learner.id)
    .eq("onderwerp", subject)
    .eq("inhoud", messageBody)
    .limit(1)
    .maybeSingle();

  if (existingMessage) {
    return;
  }

  const { error } = await supabase.from("berichten").insert({
    afzender_profiel_id: instructeurProfileId,
    ontvanger_profiel_id: learner.id,
    onderwerp: subject,
    inhoud: messageBody,
  });

  if (error) {
    console.error("Lesson feedback message insert failed", error);
  }
}

export async function notifyLearnerAboutLessonCompassUpdate({
  supabase,
  leerlingId,
  instructeurNaam,
  focus,
  mission,
}: {
  supabase: ServerSupabase;
  leerlingId: string | null;
  instructeurNaam: string;
  focus?: string | null;
  mission?: string | null;
}) {
  const learner = await getLearnerContactById(supabase, leerlingId);

  if (!learner?.id) {
    return;
  }

  const title = "Je leskompas is bijgewerkt";
  const text = focus?.trim()
    ? `${instructeurNaam} heeft jullie lesfocus aangescherpt: ${focus.trim()}`
    : mission?.trim()
      ? `${instructeurNaam} heeft een nieuwe mini-missie voor je klaargezet.`
      : `${instructeurNaam} heeft jullie gedeelde leskompas bijgewerkt.`;

  await createInAppNotification({
    actionHref: "/leerling/boekingen",
    supabase,
    profileId: learner.id,
    title,
    text,
    type: "info",
  });
}

export async function notifyInstructorAboutLessonCompassUpdate({
  supabase,
  instructeurId,
  leerlingNaam,
  confidence,
  helpRequest,
}: {
  supabase: ServerSupabase;
  instructeurId: string | null;
  leerlingNaam: string;
  confidence?: number | null;
  helpRequest?: string | null;
}) {
  const instructor = await getInstructorContactById(supabase, instructeurId);

  if (!instructor?.id) {
    return;
  }

  const title = "Nieuwe leerling check-in";
  const text = helpRequest?.trim()
    ? `${leerlingNaam} heeft op het leskompas gedeeld waar hulp nodig is: ${helpRequest.trim()}`
    : confidence != null
      ? `${leerlingNaam} heeft het leskompas bijgewerkt met zelfvertrouwen ${confidence}/5.`
      : `${leerlingNaam} heeft het gedeelde leskompas bijgewerkt.`;

  await createInAppNotification({
    supabase,
    profileId: instructor.id,
    title,
    text,
    type: "info",
  });
}

export async function notifyInstructorAboutLessonCheckin({
  supabase,
  instructeurId,
  leerlingNaam,
  confidenceLevel,
  supportRequest,
  arrivalMode,
}: {
  supabase: ServerSupabase;
  instructeurId: string | null;
  leerlingNaam: string;
  confidenceLevel?: number | null;
  supportRequest?: string | null;
  arrivalMode?: "op_tijd" | "afstemmen" | null;
}) {
  const instructor = await getInstructorContactById(supabase, instructeurId);

  if (!instructor?.id) {
    return;
  }

  const title = "Nieuwe voor-les check-in";
  const text = supportRequest?.trim()
    ? `${leerlingNaam} heeft gedeeld waar vandaag hulp nodig is: ${supportRequest.trim()}`
    : arrivalMode === "afstemmen"
      ? `${leerlingNaam} wil voor de les nog even afstemmen.`
      : confidenceLevel != null
        ? `${leerlingNaam} heeft de voor-les check-in bijgewerkt met vertrouwen ${confidenceLevel}/5.`
        : `${leerlingNaam} heeft de voor-les check-in bijgewerkt.`;

  await createInAppNotification({
    supabase,
    profileId: instructor.id,
    title,
    text,
    type: "info",
  });
}

export async function notifyLearnerAboutLessonCheckinFocus({
  supabase,
  leerlingId,
  instructeurNaam,
  focus,
}: {
  supabase: ServerSupabase;
  leerlingId: string | null;
  instructeurNaam: string;
  focus: string;
}) {
  const learner = await getLearnerContactById(supabase, leerlingId);

  if (!learner?.id) {
    return;
  }

  await createInAppNotification({
    supabase,
    profileId: learner.id,
    title: "Je lesfocus is bijgewerkt",
    text: `${instructeurNaam} heeft alvast een focus voor je volgende les klaargezet: ${focus}`,
    type: "succes",
  });
}

export async function notifyLearnerAboutPackageSuggestion({
  supabase,
  leerlingId,
  instructeurNaam,
  packageName,
  currentPackageName,
}: {
  supabase: ServerSupabase;
  leerlingId: string | null;
  instructeurNaam: string;
  packageName: string;
  currentPackageName?: string | null;
}) {
  const learner = await getLearnerContactById(supabase, leerlingId);

  if (!learner?.id) {
    return;
  }

  const isUpgrade = Boolean(currentPackageName?.trim());
  const title = isUpgrade
    ? "Nieuw upgradevoorstel van je instructeur"
    : "Nieuw pakketvoorstel van je instructeur";
  const text = isUpgrade
    ? `${instructeurNaam} denkt dat ${packageName} nu een logische volgende stap is na ${currentPackageName?.trim()}.`
    : `${instructeurNaam} heeft ${packageName} als slim pakketvoorstel voor je klaargezet.`;

  await createInAppNotification({
    supabase,
    profileId: learner.id,
    title,
    text,
    type: "info",
  });

  await deliverNotificationEmail({
    to: learner.email,
    subject: title,
    eyebrow: isUpgrade ? "Pakket upgrade" : "Pakketvoorstel",
    intro: isUpgrade
      ? `${instructeurNaam} denkt dat ${packageName} nu goed past als volgende stap in je traject.`
      : `${instructeurNaam} heeft ${packageName} als passend pakket voor je geselecteerd.`,
    details: [
      { label: "Instructeur", value: instructeurNaam },
      ...(currentPackageName?.trim()
        ? [{ label: "Huidig pakket", value: currentPackageName.trim() }]
        : []),
      { label: "Voorstel", value: packageName },
    ],
    ctaPath: "/leerling/dashboard",
    ctaLabel: "Open je dashboard",
  });
}

export async function notifyStudentTrajectorySignals({
  supabase,
  leerlingId,
  instructeurId,
  instructeurNaam,
  packageUsage,
  assessments,
  notes,
}: {
  supabase: ServerSupabase;
  leerlingId: string | null;
  instructeurId: string | null;
  instructeurNaam?: string | null;
  packageUsage: StudentPackageTrajectoryInput;
  assessments: StudentProgressAssessment[];
  notes?: StudentProgressLessonNote[];
}) {
  const [learner, instructor] = await Promise.all([
    getLearnerContactById(supabase, leerlingId),
    getInstructorContactById(supabase, instructeurId),
  ]);

  if (!learner?.id && !instructor?.id) {
    return;
  }

  const intelligence = getStudentTrajectoryIntelligence({
    assessments,
    notes,
    packageUsage,
  });
  const learnerName = learner?.volledige_naam || "Deze leerling";
  const resolvedInstructorName =
    instructeurNaam?.trim() || instructor?.volledige_naam || "Je instructeur";

  if (intelligence.packageSignal.shouldSuggestAdditionalPackage) {
    const packageTitle =
      intelligence.packageSignal.remainingLessons == null &&
      !packageUsage.packageName?.trim()
        ? "Pakket koppelen nodig"
        : "Pakket loopt bijna af";
    const learnerText = `${resolvedInstructorName} ziet dat je traject aandacht vraagt: ${intelligence.packageSignal.detail} ${intelligence.packageSignal.nextAction}`;
    const instructorText = `${learnerName}: ${intelligence.packageSignal.detail} ${intelligence.packageSignal.nextAction}`;

    await Promise.all([
      createUniqueInAppNotification({
        supabase,
        profileId: learner?.id,
        title: packageTitle,
        text: learnerText,
        type:
          intelligence.packageSignal.badge === "danger" ||
          intelligence.packageSignal.badge === "warning"
            ? "waarschuwing"
            : "info",
      }),
      createUniqueInAppNotification({
        supabase,
        profileId: instructor?.id,
        title: `${learnerName}: pakket opvolgen`,
        text: instructorText,
        type:
          intelligence.packageSignal.badge === "danger" ||
          intelligence.packageSignal.badge === "warning"
            ? "waarschuwing"
            : "info",
      }),
    ]);
  }

  if (intelligence.examReadiness.score >= 82) {
    const learnerText = `${resolvedInstructorName} ziet dat je voortgang richting proefexamen sterk staat: ${intelligence.examReadiness.nextMilestone}`;
    const instructorText = `${learnerName} staat op ${intelligence.examReadiness.score}% examengereedheid. ${intelligence.examReadiness.nextMilestone}`;

    await Promise.all([
      createUniqueInAppNotification({
        supabase,
        profileId: learner?.id,
        title: "Je bent klaar voor een proefexamenstap",
        text: learnerText,
        type: "succes",
      }),
      createUniqueInAppNotification({
        supabase,
        profileId: instructor?.id,
        title: `${learnerName}: proefexamenmoment plannen`,
        text: instructorText,
        type: "succes",
      }),
    ]);
  }
}

export async function notifyLearnerAboutOpenSlotNudge({
  supabase,
  leerlingId,
  instructeurNaam,
  slotStartAt,
  slotEndAt,
}: {
  supabase: ServerSupabase;
  leerlingId: string | null;
  instructeurNaam: string;
  slotStartAt: string;
  slotEndAt: string;
}) {
  const learner = await getLearnerContactById(supabase, leerlingId);

  if (!learner?.id) {
    return;
  }

  const dateLabel = new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(slotStartAt));
  const startLabel = new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(slotStartAt));
  const endLabel = new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(slotEndAt));
  const slotLabel = `${dateLabel} tussen ${startLabel} en ${endLabel}`;
  const title = "Nieuw open lesmoment voor je klaar";
  const text = `${instructeurNaam} heeft een mooi vrij lesmoment voor je in beeld op ${slotLabel}.`;

  await createInAppNotification({
    supabase,
    profileId: learner.id,
    title,
    text,
    type: "succes",
  });

  await deliverNotificationEmail({
    to: learner.email,
    subject: title,
    eyebrow: "Slimme planning nudge",
    intro: `${instructeurNaam} heeft een open lesmoment voor je geselecteerd dat goed in je ritme kan passen.`,
    details: [
      { label: "Instructeur", value: instructeurNaam },
      { label: "Moment", value: slotLabel },
    ],
    ctaPath: "/leerling/instructeurs",
    ctaLabel: "Bekijk je instructeurs",
  });
}

export async function sendLearnerLessonReminderEmail({
  to,
  instructeurNaam,
  datum,
  tijd,
  locatie,
  lesTitel,
}: {
  to: string | null | undefined;
  instructeurNaam: string;
  datum: string;
  tijd: string;
  locatie: string;
  lesTitel: string;
}) {
  return deliverNotificationEmail({
    to,
    subject: "Herinnering: je les is morgen",
    eyebrow: "Lesherinnering",
    intro: `${lesTitel} staat over ongeveer 24 uur gepland. Zo stap je morgen rustig en goed voorbereid in.`,
    details: [
      { label: "Instructeur", value: instructeurNaam },
      { label: "Datum", value: datum },
      { label: "Tijd", value: tijd },
      { label: "Locatie", value: locatie || "Locatie volgt nog" },
    ],
    ctaPath: "/leerling/boekingen",
    ctaLabel: "Open je lesoverzicht",
  });
}

export async function sendInstructorLessonReminderEmail({
  to,
  leerlingNaam,
  datum,
  tijd,
  locatie,
  lesTitel,
}: {
  to: string | null | undefined;
  leerlingNaam: string;
  datum: string;
  tijd: string;
  locatie: string;
  lesTitel: string;
}) {
  return deliverNotificationEmail({
    to,
    subject: `Herinnering: ${lesTitel.toLowerCase()} is morgen`,
    eyebrow: "Lesherinnering",
    intro: `${lesTitel} met ${leerlingNaam} staat over ongeveer 24 uur gepland.`,
    details: [
      { label: "Leerling", value: leerlingNaam },
      { label: "Datum", value: datum },
      { label: "Tijd", value: tijd },
      { label: "Locatie", value: locatie || "Locatie volgt nog" },
    ],
    ctaPath: "/instructeur/lessen",
    ctaLabel: "Open je lessen",
  });
}
