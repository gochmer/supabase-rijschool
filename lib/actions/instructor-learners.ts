"use server";

import { revalidatePath } from "next/cache";

import { getLessonEndAt } from "@/lib/booking-availability";
import { resolveLocationSelection, type LocationSelectionInput } from "@/lib/actions/location-resolution";
import { findSchedulingConflict } from "@/lib/data/scheduling-conflicts";
import {
  ensureCurrentUserContext,
  getCurrentInstructeurRecord,
} from "@/lib/data/profiles";
import { hasInstructorStudentPlanningRelationship } from "@/lib/data/student-scheduling";
import {
  isManualLearnerIntakeKey,
  normalizeManualLearnerIntakeKeys,
  type ManualLearnerIntakeKey,
} from "@/lib/manual-learner-intake";
import {
  notifyLearnerAboutLessonChange,
  notifyLearnerAboutManualOnboarding,
} from "@/lib/notification-events";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

type ManualLearnerLinkRow = {
  id: string;
  onboarding_notitie: string | null;
  intake_checklist_keys: string[] | null;
};

type ManagedLearnerProfileRow = {
  id: string;
  rol: "leerling" | "instructeur" | "admin";
  volledige_naam: string;
  email: string;
  telefoon: string | null;
};

type ManagedLearnerRow = {
  id: string;
  profile_id: string;
  pakket_id: string | null;
};

type ManagedPackageRow = {
  id: string;
  naam: string;
};

type ManualLearnerLinkWriteBuilder = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: ManualLearnerLinkRow | null }>;
      };
    };
  };
  upsert: (
    values: {
      instructeur_id: string;
      leerling_id: string;
      bron: string;
      onboarding_notitie: string | null;
      intake_checklist_keys?: string[];
    },
    options: { onConflict: string }
  ) => Promise<{ error: { message: string } | null }>;
  update: (
    values: Partial<{
      onboarding_notitie: string | null;
      intake_checklist_keys: string[];
      updated_at: string;
    }>
  ) => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
    };
  };
  delete: () => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
    };
  };
};

type StudentPlanningRightsDeleteBuilder = {
  upsert: (
    values: {
      leerling_id: string;
      instructeur_id: string;
      zelf_inplannen_toegestaan: boolean;
      vrijgegeven_at: string | null;
      updated_at: string;
    },
    options: { onConflict: string }
  ) => Promise<{ error: { message: string } | null }>;
  delete: () => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
    };
  };
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeText(value: string) {
  return value.trim();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function toLocalDateTime(dateString: string, timeString: string) {
  const [hours, minutes] = timeString.split(":");

  if (!hours || !minutes) {
    return null;
  }

  return `${dateString}T${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;
}

function buildLocationSummary(label: string | null | undefined) {
  return label?.trim() || "Locatie volgt nog";
}

function revalidateInstructorLearnerSurfaces() {
  [
    "/instructeur/dashboard",
    "/instructeur/leerlingen",
    "/instructeur/lessen",
    "/leerling/dashboard",
    "/leerling/boekingen",
  ].forEach((path) => revalidatePath(path));
}

function buildInitialIntakeChecklistKeys(input: {
  packageId?: string | null;
  onboardingNote?: string;
}) {
  const keys: ManualLearnerIntakeKey[] = [
    "contact_gecheckt",
    "agenda_afspraak_duidelijk",
  ];

  if (input.packageId?.trim()) {
    keys.push("pakket_gekozen");
  }

  if (normalizeText(input.onboardingNote ?? "")) {
    keys.push("startfocus_vastgelegd");
  }

  return normalizeManualLearnerIntakeKeys(keys);
}

async function getManualLearnerLink(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  instructeurId: string,
  leerlingId: string
) {
  const manualLinksTable = supabase.from(
    "instructeur_leerling_koppelingen" as never
  ) as unknown as ManualLearnerLinkWriteBuilder;

  return (
    (
      await manualLinksTable
        .select("id, onboarding_notitie, intake_checklist_keys")
        .eq("instructeur_id", instructeurId)
        .eq("leerling_id", leerlingId)
        .maybeSingle()
    ).data ?? null
  );
}

async function updateManualLearnerChecklistKeys(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  instructeurId: string,
  leerlingId: string,
  nextKeys: readonly string[]
) {
  const manualLinksTable = supabase.from(
    "instructeur_leerling_koppelingen" as never
  ) as unknown as ManualLearnerLinkWriteBuilder;

  return await manualLinksTable
    .update({
      intake_checklist_keys: normalizeManualLearnerIntakeKeys(nextKeys),
      updated_at: new Date().toISOString(),
    })
    .eq("instructeur_id", instructeurId)
    .eq("leerling_id", leerlingId);
}

async function ensureLearnerProfile(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  profileId: string,
  name: string,
  email: string,
  phone: string
) {
  const profilesTable = admin.from("profiles" as never) as unknown as {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: ManagedLearnerProfileRow | null }>;
      };
    };
    insert: (values: {
      id: string;
      volledige_naam: string;
      email: string;
      telefoon: string;
      rol: "leerling";
    }) => {
      select: (columns: string) => {
        maybeSingle: () => Promise<{ data: ManagedLearnerProfileRow | null }>;
      };
    };
    update: (values: Partial<ManagedLearnerProfileRow>) => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
    };
  };

  let profile =
    (
      await profilesTable
        .select("id, rol, volledige_naam, email, telefoon")
        .eq("id", profileId)
        .maybeSingle()
    ).data ?? null;

  if (!profile) {
    profile =
      (
        await profilesTable
          .insert({
            id: profileId,
            volledige_naam: name,
            email,
            telefoon: phone,
            rol: "leerling",
          })
          .select("id, rol, volledige_naam, email, telefoon")
          .maybeSingle()
      ).data ?? null;
  }

  if (!profile) {
    return null;
  }

  if (profile.rol !== "leerling") {
    return {
      error:
        "Dit e-mailadres hoort al bij een instructeur- of adminaccount en kan niet als leerling worden gekoppeld.",
      profile: null,
    };
  }

  const updatePayload: Partial<ManagedLearnerProfileRow> = {};

  if (!normalizeText(profile.volledige_naam) && name) {
    updatePayload.volledige_naam = name;
  }

  if (!normalizeText(profile.telefoon ?? "") && phone) {
    updatePayload.telefoon = phone;
  }

  if (Object.keys(updatePayload).length) {
    const { error } = await profilesTable.update(updatePayload).eq("id", profile.id);

    if (error) {
      return {
        error: "Het leerlingprofiel kon niet volledig worden bijgewerkt.",
        profile: null,
      };
    }

    profile = {
      ...profile,
      ...updatePayload,
    };
  }

  return {
    error: null,
    profile,
  };
}

async function ensureLearnerRecord(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  profileId: string
) {
  const learnersTable = admin.from("leerlingen" as never) as unknown as {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: ManagedLearnerRow | null }>;
      };
    };
    insert: (values: { profile_id: string }) => {
      select: (columns: string) => {
        maybeSingle: () => Promise<{ data: ManagedLearnerRow | null }>;
      };
    };
  };

  const existing =
    (
      await learnersTable
        .select("id, profile_id, pakket_id")
        .eq("profile_id", profileId)
        .maybeSingle()
    ).data ?? null;

  if (existing) {
    return existing;
  }

  return (
    await learnersTable
      .insert({ profile_id: profileId })
      .select("id, profile_id, pakket_id")
      .maybeSingle()
  ).data;
}

export async function createInstructorLearnerAction(input: {
  fullName: string;
  email: string;
  phone?: string;
  packageId?: string | null;
  allowSelfScheduling?: boolean;
  onboardingNote?: string;
}) {
  const context = await ensureCurrentUserContext();
  const instructeur = await getCurrentInstructeurRecord();

  if (!context || !instructeur) {
    return {
      success: false,
      message: "Alleen een ingelogde instructeur kan handmatig een leerling toevoegen.",
    };
  }

  const fullName = normalizeText(input.fullName);
  const email = normalizeEmail(input.email);
  const phone = normalizeText(input.phone ?? "");
  const onboardingNote = normalizeText(input.onboardingNote ?? "");
  const allowSelfScheduling = Boolean(input.allowSelfScheduling);

  if (fullName.length < 2) {
    return {
      success: false,
      message: "Vul een duidelijke naam van de leerling in.",
    };
  }

  if (!isValidEmail(email)) {
    return {
      success: false,
      message: "Vul een geldig e-mailadres in.",
    };
  }

  const admin = await createAdminClient();
  const supabase = await createServerClient();
  const profilesTable = admin.from("profiles" as never) as unknown as {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: ManagedLearnerProfileRow | null }>;
      };
    };
  };
  const manualLinksTable = admin.from(
    "instructeur_leerling_koppelingen" as never
  ) as unknown as ManualLearnerLinkWriteBuilder;
  const planningRightsTable = admin.from(
    "leerling_planningsrechten" as never
  ) as unknown as StudentPlanningRightsDeleteBuilder;

  let existingProfile =
    (
      await profilesTable
        .select("id, rol, volledige_naam, email, telefoon")
        .eq("email", email)
        .maybeSingle()
    ).data ?? null;

  let invited = false;

  if (!existingProfile) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        rol: "leerling",
        volledige_naam: fullName,
        telefoon: phone || undefined,
      },
    });

    if (error || !data.user?.id) {
      return {
        success: false,
        message:
          error?.message ||
          "De leerling kon niet worden uitgenodigd. Controleer het e-mailadres en probeer opnieuw.",
      };
    }

    invited = true;
    existingProfile = {
      id: data.user.id,
      rol: "leerling",
      volledige_naam: fullName,
      email,
      telefoon: phone || null,
    };
  }

  const ensuredProfileResult = await ensureLearnerProfile(
    admin,
    existingProfile.id,
    fullName,
    email,
    phone
  );

  if (!ensuredProfileResult || ensuredProfileResult.error || !ensuredProfileResult.profile) {
    return {
      success: false,
      message:
        ensuredProfileResult?.error ||
        "Het leerlingprofiel kon niet worden klaargezet.",
    };
  }

  const learner = await ensureLearnerRecord(admin, ensuredProfileResult.profile.id);

  if (!learner?.id) {
    return {
      success: false,
      message: "Het leerlingrecord kon niet worden aangemaakt.",
    };
  }

  let selectedPackage: ManagedPackageRow | null = null;

  if (input.packageId?.trim()) {
    const { data: packageRow } = (await supabase
      .from("pakketten")
      .select("id, naam")
      .eq("id", input.packageId.trim())
      .eq("instructeur_id", instructeur.id)
      .maybeSingle()) as unknown as {
      data: ManagedPackageRow | null;
    };

    if (!packageRow) {
      return {
        success: false,
        message: "Het gekozen pakket hoort niet bij jouw aanbod.",
      };
    }

    selectedPackage = packageRow;
  }

  if (allowSelfScheduling && !selectedPackage) {
    return {
      success: false,
      message: "Kies eerst een pakket voordat je zelf inplannen direct vrijgeeft.",
    };
  }

  const existingLink =
    (
      await manualLinksTable
        .select("id, onboarding_notitie, intake_checklist_keys")
        .eq("instructeur_id", instructeur.id)
        .eq("leerling_id", learner.id)
        .maybeSingle()
    ).data ?? null;
  const shouldNotifyManualOnboarding = invited || !existingLink;
  const mergedChecklistKeys = normalizeManualLearnerIntakeKeys([
    ...(existingLink?.intake_checklist_keys ?? []),
    ...buildInitialIntakeChecklistKeys({
      packageId: selectedPackage?.id ?? input.packageId ?? null,
      onboardingNote,
    }),
  ]);

  const { error: linkError } = await manualLinksTable.upsert(
    {
      instructeur_id: instructeur.id,
      leerling_id: learner.id,
      bron: "handmatig",
      onboarding_notitie:
        onboardingNote || existingLink?.onboarding_notitie || null,
      intake_checklist_keys: mergedChecklistKeys,
    },
    {
      onConflict: "instructeur_id,leerling_id",
    }
  );

  if (linkError) {
    return {
      success: false,
      message: "De leerling kon niet aan jouw werkplek worden gekoppeld.",
    };
  }

  if (selectedPackage) {
    const { error } = await admin
      .from("leerlingen" as never)
      .update({
        pakket_id: selectedPackage.id,
      } as never)
      .eq("id", learner.id);

    if (error) {
      return {
        success: false,
        message: "De leerling is gekoppeld, maar het pakket kon niet worden ingesteld.",
      };
    }
  }

  if (selectedPackage) {
    const { error } = await planningRightsTable.upsert(
      {
        leerling_id: learner.id,
        instructeur_id: instructeur.id,
        zelf_inplannen_toegestaan: true,
        vrijgegeven_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "leerling_id,instructeur_id",
      }
    );

    if (error) {
      return {
        success: false,
        message:
          "De leerling is toegevoegd, maar het vrijgeven van de planning is niet gelukt.",
      };
    }
  }

  if (shouldNotifyManualOnboarding) {
    await notifyLearnerAboutManualOnboarding({
      supabase,
      leerlingId: learner.id,
      instructeurNaam: context.profile?.volledige_naam || "Je instructeur",
      packageName: selectedPackage?.naam ?? null,
      selfSchedulingAllowed: Boolean(selectedPackage),
      onboardingNote: onboardingNote || null,
    });
  }

  revalidateInstructorLearnerSurfaces();

  return {
    success: true,
    message: invited
      ? "De leerling is aangemaakt, uitgenodigd per e-mail en staat nu in jouw werkplek."
      : existingLink
        ? "Deze leerling stond al in jouw werkplek."
        : "Bestaande leerling gekoppeld aan jouw werkplek.",
  };
}

export async function updateInstructorLearnerPackageAction(input: {
  leerlingId: string;
  packageId: string | null;
}) {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      success: false,
      message: "Alleen een ingelogde instructeur kan een leerlingpakket aanpassen.",
    };
  }

  const hasRelationship = await hasInstructorStudentPlanningRelationship(
    instructeur.id,
    input.leerlingId
  );

  if (!hasRelationship) {
    return {
      success: false,
      message: "Deze leerling hoort niet bij jouw werkplek.",
    };
  }

  const supabase = await createServerClient();
  let selectedPackage: ManagedPackageRow | null = null;

  if (input.packageId?.trim()) {
    const { data } = (await supabase
      .from("pakketten")
      .select("id, naam")
      .eq("id", input.packageId.trim())
      .eq("instructeur_id", instructeur.id)
      .maybeSingle()) as unknown as {
      data: ManagedPackageRow | null;
    };

    if (!data) {
      return {
        success: false,
        message: "Dit pakket hoort niet bij jouw aanbod.",
      };
    }

    selectedPackage = data;
  }

  const admin = await createAdminClient();
  const { error } = await admin
    .from("leerlingen" as never)
    .update({
      pakket_id: selectedPackage?.id ?? null,
    } as never)
    .eq("id", input.leerlingId);

  if (error) {
    return {
      success: false,
      message: "Het pakket kon niet worden bijgewerkt.",
    };
  }

  const now = new Date().toISOString();
  const planningRightsTable = admin.from(
    "leerling_planningsrechten" as never
  ) as unknown as StudentPlanningRightsDeleteBuilder;
  const { error: planningError } = await planningRightsTable.upsert(
    {
      leerling_id: input.leerlingId,
      instructeur_id: instructeur.id,
      zelf_inplannen_toegestaan: Boolean(selectedPackage),
      vrijgegeven_at: selectedPackage ? now : null,
      updated_at: now,
    },
    {
      onConflict: "leerling_id,instructeur_id",
    }
  );

  if (planningError) {
    return {
      success: false,
      message: selectedPackage
        ? "Het pakket is gekoppeld, maar de planning kon niet worden vrijgegeven."
        : "Het pakket is verwijderd, maar de planningstoegang kon niet worden bijgewerkt.",
    };
  }

  const manualLink = await getManualLearnerLink(
    supabase,
    instructeur.id,
    input.leerlingId
  );

  if (manualLink) {
    const nextChecklistKeys = selectedPackage
      ? normalizeManualLearnerIntakeKeys([
          ...(manualLink.intake_checklist_keys ?? []),
          "pakket_gekozen",
        ])
      : normalizeManualLearnerIntakeKeys(
          (manualLink.intake_checklist_keys ?? []).filter(
            (key) => key !== "pakket_gekozen"
          )
        );

    await updateManualLearnerChecklistKeys(
      supabase,
      instructeur.id,
      input.leerlingId,
      nextChecklistKeys
    );
  }

  revalidateInstructorLearnerSurfaces();

  return {
    success: true,
    message: selectedPackage
      ? `Pakket gekoppeld: ${selectedPackage.naam}.`
      : "Pakketkoppeling verwijderd.",
  };
}

export async function createInstructorLessonForLearnerAction(input: LocationSelectionInput & {
  leerlingId: string;
  title: string;
  datum: string;
  tijd: string;
  duurMinuten: number;
  extraLessons?: Array<{
    datum?: string | null;
    tijd?: string | null;
  }>;
}) {
  const context = await ensureCurrentUserContext();
  const instructeur = await getCurrentInstructeurRecord();

  if (!context || !instructeur) {
    return {
      success: false,
      message: "Alleen een ingelogde instructeur kan handmatig lessen inplannen.",
    };
  }

  const title = normalizeText(input.title) || "Rijles";
  const duration = Number(input.duurMinuten);
  const extraLessons = Array.isArray(input.extraLessons)
    ? input.extraLessons
        .map((lesson) => ({
          datum: lesson.datum?.trim() ?? "",
          tijd: lesson.tijd?.trim() ?? "",
        }))
        .filter((lesson) => lesson.datum && lesson.tijd)
    : [];

  if (extraLessons.length > 6) {
    return {
      success: false,
      message: "Je kunt maximaal 6 extra lessen tegelijk inplannen.",
    };
  }

  const lessonPlans = [
    {
      datum: input.datum,
      tijd: input.tijd,
    },
    ...extraLessons,
  ].map((lesson, index) => {
    const startAt = toLocalDateTime(lesson.datum, lesson.tijd);
    const endAt = startAt ? getLessonEndAt(startAt, duration) : null;

    return {
      ...lesson,
      endAt,
      index,
      startAt,
    };
  });

  if (lessonPlans.some((lesson) => !lesson.startAt)) {
    return {
      success: false,
      message: "Kies een geldige datum en starttijd.",
    };
  }

  if (!Number.isFinite(duration) || duration < 30 || duration > 240) {
    return {
      success: false,
      message: "Kies een lesduur tussen 30 en 240 minuten.",
    };
  }

  if (lessonPlans.some((lesson) => !lesson.endAt)) {
    return {
      success: false,
      message: "De eindtijd van een les kon niet worden bepaald.",
    };
  }

  const hasRelationship = await hasInstructorStudentPlanningRelationship(
    instructeur.id,
    input.leerlingId
  );

  if (!hasRelationship) {
    return {
      success: false,
      message: "Koppel deze leerling eerst aan jouw werkplek voordat je een les plant.",
    };
  }

  const supabase = await createServerClient();

  for (let leftIndex = 0; leftIndex < lessonPlans.length; leftIndex += 1) {
    const left = lessonPlans[leftIndex];

    for (let rightIndex = leftIndex + 1; rightIndex < lessonPlans.length; rightIndex += 1) {
      const right = lessonPlans[rightIndex];

      if (
        left.startAt &&
        left.endAt &&
        right.startAt &&
        right.endAt &&
        left.startAt < right.endAt &&
        left.endAt > right.startAt
      ) {
        return {
          success: false,
          message: `Les ${rightIndex + 1} overlapt met een andere les in deze planning.`,
        };
      }
    }
  }

  for (const lessonPlan of lessonPlans) {
    const schedulingConflict = await findSchedulingConflict({
      instructorId: instructeur.id,
      learnerId: input.leerlingId,
      startAt: lessonPlan.startAt!,
      endAt: lessonPlan.endAt!,
      includeRequestHolds: false,
      supabase,
    });

    if (schedulingConflict.hasConflict) {
      return {
        success: false,
        message:
          lessonPlan.index === 0
            ? schedulingConflict.message
            : `Extra les ${lessonPlan.index} botst met een andere planning.`,
      };
    }
  }

  const learnerResult = (await supabase
    .from("leerlingen")
    .select("id, profile_id, pakket_id")
    .eq("id", input.leerlingId)
    .maybeSingle()) as unknown as {
    data: ManagedLearnerRow | null;
  };

  if (!learnerResult.data?.profile_id) {
    return {
      success: false,
      message: "De gekozen leerling kon niet worden gevonden.",
    };
  }

  const isTrialLesson = title.toLowerCase().includes("proefles");

  if (!learnerResult.data.pakket_id && !isTrialLesson) {
    return {
      success: false,
      message: "Koppel eerst een pakket voordat je vervolglessen inplant voor deze leerling.",
    };
  }

  const locationId = await resolveLocationSelection(input);
  const locationOptionsResult = locationId
    ? ((await supabase
        .from("locaties")
        .select("id, naam, stad")
        .eq("id", locationId)
        .maybeSingle()) as unknown as {
        data: { id: string; naam: string; stad: string } | null;
      })
    : { data: null };

  const { error } = await supabase.from("lessen").insert(
    lessonPlans.map((lessonPlan) => ({
      leerling_id: input.leerlingId,
      instructeur_id: instructeur.id,
      titel: title,
      start_at: lessonPlan.startAt,
      duur_minuten: duration,
      status: "ingepland",
      locatie_id: locationId,
      pakket_id: learnerResult.data?.pakket_id ?? null,
    })) as never
  );

  if (error) {
    return {
      success: false,
      message:
        lessonPlans.length === 1
          ? "De les kon niet worden ingepland."
          : "De lessen konden niet worden ingepland.",
    };
  }

  const manualLink = await getManualLearnerLink(
    supabase,
    instructeur.id,
    input.leerlingId
  );

  if (manualLink) {
    await updateManualLearnerChecklistKeys(
      supabase,
      instructeur.id,
      input.leerlingId,
      [
        ...(manualLink.intake_checklist_keys ?? []),
        "eerste_les_gepland",
      ]
    );
  }

  await notifyLearnerAboutLessonChange({
    supabase,
    leerlingId: input.leerlingId,
    instructeurNaam: context.profile?.volledige_naam || "Je instructeur",
    datum: input.datum,
    tijd: input.tijd,
    locatie: buildLocationSummary(
      locationOptionsResult.data
        ? `${locationOptionsResult.data.naam}, ${locationOptionsResult.data.stad}`
        : null
    ),
    status: "ingepland",
  });

  revalidateInstructorLearnerSurfaces();

  return {
    success: true,
    message:
      lessonPlans.length === 1
        ? "De les is direct ingepland voor deze leerling."
        : `${lessonPlans.length} lessen zijn direct ingepland voor deze leerling.`,
  };
}

export async function toggleInstructorLearnerChecklistAction(input: {
  leerlingId: string;
  itemKey: string;
  completed: boolean;
}) {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      success: false,
      message: "Alleen een ingelogde instructeur kan de intake-checklist aanpassen.",
    };
  }

  if (!isManualLearnerIntakeKey(input.itemKey)) {
    return {
      success: false,
      message: "Dit checklist-onderdeel is niet geldig.",
    };
  }

  const supabase = await createServerClient();
  const manualLink = await getManualLearnerLink(
    supabase,
    instructeur.id,
    input.leerlingId
  );

  if (!manualLink) {
    return {
      success: false,
      message: "Deze leerling is niet handmatig aan jouw werkplek gekoppeld.",
    };
  }

  const nextChecklistKeys = input.completed
    ? normalizeManualLearnerIntakeKeys([
        ...(manualLink.intake_checklist_keys ?? []),
        input.itemKey,
      ])
    : normalizeManualLearnerIntakeKeys(
        (manualLink.intake_checklist_keys ?? []).filter(
          (key) => key !== input.itemKey
        )
      );

  const { error } = await updateManualLearnerChecklistKeys(
    supabase,
    instructeur.id,
    input.leerlingId,
    nextChecklistKeys
  );

  if (error) {
    return {
      success: false,
      message: "De intake-checklist kon niet worden bijgewerkt.",
    };
  }

  revalidateInstructorLearnerSurfaces();

  return {
    success: true,
    message: input.completed
      ? "Checklist-onderdeel gemarkeerd."
      : "Checklist-onderdeel weer opengezet.",
  };
}

export async function detachInstructorLearnerAction(input: {
  leerlingId: string;
}) {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      success: false,
      message: "Alleen een ingelogde instructeur kan een leerling ontkoppelen.",
    };
  }

  const supabase = await createServerClient();
  const manualLink = await getManualLearnerLink(
    supabase,
    instructeur.id,
    input.leerlingId
  );

  if (!manualLink) {
    return {
      success: false,
      message: "Deze leerling is niet handmatig aan jouw werkplek gekoppeld.",
    };
  }

  const [{ data: existingLesson }, { data: existingRequest }] = (await Promise.all([
    supabase
      .from("lessen")
      .select("id")
      .eq("instructeur_id", instructeur.id)
      .eq("leerling_id", input.leerlingId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("lesaanvragen")
      .select("id")
      .eq("instructeur_id", instructeur.id)
      .eq("leerling_id", input.leerlingId)
      .limit(1)
      .maybeSingle(),
  ])) as unknown as [
    { data: { id: string } | null },
    { data: { id: string } | null },
  ];

  if (existingLesson || existingRequest) {
    return {
      success: false,
      message:
        "Deze leerling heeft al lessen of aanvragen in dit traject. Ontkoppelen kan alleen zolang de werkplek nog los staat van echte planning.",
    };
  }

  const planningRightsTable = supabase.from(
    "leerling_planningsrechten" as never
  ) as unknown as StudentPlanningRightsDeleteBuilder;

  const { error: planningDeleteError } = await planningRightsTable
    .delete()
    .eq("instructeur_id", instructeur.id)
    .eq("leerling_id", input.leerlingId);

  if (planningDeleteError) {
    return {
      success: false,
      message: "De planningstoegang kon niet eerst worden opgeschoond.",
    };
  }

  const manualLinksTable = supabase.from(
    "instructeur_leerling_koppelingen" as never
  ) as unknown as ManualLearnerLinkWriteBuilder;

  const { error } = await manualLinksTable
    .delete()
    .eq("instructeur_id", instructeur.id)
    .eq("leerling_id", input.leerlingId);

  if (error) {
    return {
      success: false,
      message: "De leerling kon niet uit jouw werkplek worden ontkoppeld.",
    };
  }

  revalidateInstructorLearnerSurfaces();

  return {
    success: true,
    message: "De leerling is uit jouw handmatige werkplek verwijderd.",
  };
}

export async function resendInstructorLearnerInviteAction(input: {
  leerlingId: string;
}) {
  const instructeur = await getCurrentInstructeurRecord();

  if (!instructeur) {
    return {
      success: false,
      message: "Alleen een ingelogde instructeur kan een uitnodiging opnieuw sturen.",
    };
  }

  const supabase = await createServerClient();
  const manualLink = await getManualLearnerLink(
    supabase,
    instructeur.id,
    input.leerlingId
  );

  if (!manualLink) {
    return {
      success: false,
      message: "Deze leerling is niet handmatig aan jouw werkplek gekoppeld.",
    };
  }

  const learnerResult = (await supabase
    .from("leerlingen")
    .select("id, profile_id")
    .eq("id", input.leerlingId)
    .maybeSingle()) as unknown as {
    data: ManagedLearnerRow | null;
  };

  if (!learnerResult.data?.profile_id) {
    return {
      success: false,
      message: "De gekoppelde leerling kon niet worden teruggevonden.",
    };
  }

  const profileResult = (await supabase
    .from("profiles")
    .select("id, volledige_naam, email, telefoon")
    .eq("id", learnerResult.data.profile_id)
    .maybeSingle()) as unknown as {
    data: ManagedLearnerProfileRow | null;
  };

  const profile = profileResult.data;

  if (!profile?.email) {
    return {
      success: false,
      message: "Voor deze leerling ontbreekt een e-mailadres.",
    };
  }

  const admin = await createAdminClient();
  const { data: authResult } = await admin.auth.admin.getUserById(profile.id);
  const user = authResult.user;

  if (user?.last_sign_in_at || user?.email_confirmed_at) {
    return {
      success: false,
      message: "Deze leerling heeft het account al geactiveerd. Een nieuwe uitnodiging is niet meer nodig.",
    };
  }

  const { error } = await admin.auth.admin.inviteUserByEmail(profile.email, {
    data: {
      rol: "leerling",
      volledige_naam: profile.volledige_naam,
      telefoon: profile.telefoon || undefined,
    },
  });

  if (error) {
    return {
      success: false,
      message:
        error.message ||
        "De uitnodiging kon niet opnieuw worden verstuurd.",
    };
  }

  revalidateInstructorLearnerSurfaces();

  return {
    success: true,
    message: "De uitnodiging is opnieuw naar de leerling verstuurd.",
  };
}
