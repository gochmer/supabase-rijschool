"use client";

import { LessonCheckinPanel } from "@/components/dashboard/lesson-checkin-board";
import { InstructorCoachRadar } from "@/components/dashboard/instructor-coach-radar";
import { InstructorRetentionRadar } from "@/components/dashboard/instructor-retention-radar";
import { SharedLessonCompass } from "@/components/dashboard/shared-lesson-compass";
import type {
  LessonCheckinBoard,
  Les,
  LesAanvraag,
  Notificatie,
  SharedLessonCompassBoard,
} from "@/lib/types";

type DashboardRadarItem = {
  leerlingId: string;
  naam: string;
  label: string;
  detail: string;
  badge: "success" | "warning" | "danger" | "info";
  href: string;
};

type DashboardRadarInsights = {
  reactivation: DashboardRadarItem[];
  examReady: DashboardRadarItem[];
  noShowRisk: DashboardRadarItem[];
};

type InstructorDashboardLearnerTabProps = {
  lessonCompassBoards: SharedLessonCompassBoard[];
  lessonCheckinBoards: LessonCheckinBoard[];
  lessons: Les[];
  requests: LesAanvraag[];
  notifications: Notificatie[];
  radarInsights: DashboardRadarInsights;
};

export function InstructorDashboardLearnerTab({
  lessonCompassBoards,
  lessonCheckinBoards,
  lessons,
  requests,
  notifications,
  radarInsights,
}: InstructorDashboardLearnerTabProps) {
  return (
    <div className="space-y-5">
      <SharedLessonCompass
        boards={lessonCompassBoards.slice(0, 4)}
        role="instructeur"
      />

      <LessonCheckinPanel boards={lessonCheckinBoards} role="instructeur" />

      <InstructorCoachRadar
        lessons={lessons}
        requests={requests}
        notifications={notifications}
        checkins={lessonCheckinBoards}
      />

      <InstructorRetentionRadar insights={radarInsights} />
    </div>
  );
}
