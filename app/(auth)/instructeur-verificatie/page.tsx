import { redirect } from "next/navigation";

import { InstructorVerificationBoard } from "@/components/auth/instructor-verification-board";
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
    redirect("/instructeur/regie");
  }

  return (
    <main className="fixed inset-0 z-50 overflow-y-auto bg-[#050914] text-white">
      <div className="min-h-screen px-3 py-3 sm:px-4">
        <InstructorVerificationBoard
          initialValues={{
            fullName:
              context.profile?.volledige_naam ??
              context.user.email?.split("@")[0] ??
              "",
            email: context.profile?.email ?? context.user.email ?? "",
            phone: context.profile?.telefoon ?? "",
            bio: instructor?.bio ?? "",
            specializations: instructor?.specialisaties ?? undefined,
          }}
        />
      </div>
    </main>
  );
}
