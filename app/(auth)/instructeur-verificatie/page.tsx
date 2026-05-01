import { redirect } from "next/navigation";

import { InstructorRegistrationFlow } from "@/components/auth/instructor-registration-flow";
import { ensureCurrentUserContext, getCurrentInstructeurRecord } from "@/lib/data/profiles";

export default async function InstructeurVerificatiePage() {
  const context = await ensureCurrentUserContext();

  if (!context) {
    redirect("/inloggen?redirect=/instructeur-verificatie");
  }

  if (context.role !== "instructeur") {
    redirect("/");
  }

  const instructor = await getCurrentInstructeurRecord();

  if (instructor?.profiel_status === "goedgekeurd") {
    redirect("/instructeur/dashboard");
  }

  return (
    <main className="fixed inset-0 z-50 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_26%),#050814] text-white">
      <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
        <InstructorRegistrationFlow
          mode="verification"
          initialValues={{
            fullName:
              context.profile?.volledige_naam ??
              context.user.email?.split("@")[0] ??
              "",
            email: context.profile?.email ?? context.user.email ?? "",
            phone: context.profile?.telefoon ?? "",
            bio: instructor?.bio ?? "",
            specializations: instructor?.specialisaties ?? undefined,
            profileStatus: instructor?.profiel_status ?? "in_beoordeling",
          }}
        />
      </div>
    </main>
  );
}
