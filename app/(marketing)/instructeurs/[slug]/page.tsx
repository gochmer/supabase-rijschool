import { notFound } from "next/navigation";

import { InstructorDetailContent } from "@/components/instructors/instructor-detail-content";
import {
  getInstructorAvailability,
  getInstructorReviews,
  getPublicInstructorBySlug,
} from "@/lib/data/instructors";
import { getPublicInstructorPackages } from "@/lib/data/packages";
import { ensureCurrentUserContext } from "@/lib/data/profiles";
import { getCurrentLearnerSchedulingAccessForInstructorSlug } from "@/lib/data/student-scheduling";

export default async function InstructeurDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const instructor = await getPublicInstructorBySlug(slug);

  if (!instructor) {
    notFound();
  }

  const [reviews, packages, planningAccess, currentUserContext] = await Promise.all([
    getInstructorReviews(slug),
    getPublicInstructorPackages(slug),
    getCurrentLearnerSchedulingAccessForInstructorSlug(slug),
    ensureCurrentUserContext(),
  ]);

  const slots = planningAccess.canViewAgenda
    ? await getInstructorAvailability(slug)
    : [];

  return (
    <InstructorDetailContent
      instructor={instructor}
      reviews={reviews}
      packages={packages}
      planningAccess={planningAccess}
      currentUserContext={currentUserContext}
      slots={slots}
    />
  );
}