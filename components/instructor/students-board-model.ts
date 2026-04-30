import {
  formatMinutesAsHoursLabel,
  formatWeeklyLimitLabel,
} from "@/lib/self-scheduling-limits";
import type {
  InstructorStudentProgressRow,
  StudentProgressLessonNote,
} from "@/lib/types";

export function filterInstructorStudents({
  filter,
  query,
  students,
}: {
  filter: string;
  query: string;
  students: InstructorStudentProgressRow[];
}) {
  const normalizedQuery = query.toLowerCase();

  return students.filter((student) => {
    const matchesQuery = `${student.naam} ${student.pakket} ${student.email ?? ""}`
      .toLowerCase()
      .includes(normalizedQuery);

    const matchesFilter =
      filter === "alles" ||
      (filter === "hoog" && student.voortgang >= 70) ||
      (filter === "midden" && student.voortgang >= 40 && student.voortgang < 70) ||
      (filter === "laag" && student.voortgang < 40) ||
      (filter === "actie" &&
        student.laatsteBeoordeling !== "Nog geen beoordeling" &&
        student.voortgang < 70);

    return matchesQuery && matchesFilter;
  });
}

export function getAverageStudentProgress(
  students: InstructorStudentProgressRow[]
) {
  if (!students.length) {
    return 0;
  }

  return Math.round(
    students.reduce((total, student) => total + student.voortgang, 0) /
      students.length
  );
}

export function getStudentAttentionCount(
  students: InstructorStudentProgressRow[]
) {
  return students.filter((student) => student.voortgang < 40).length;
}

export function getSelectedLessonNote({
  notes,
  selectedDate,
  selectedStudent,
}: {
  notes: StudentProgressLessonNote[];
  selectedDate: string;
  selectedStudent: InstructorStudentProgressRow | null;
}) {
  if (!selectedStudent) {
    return null;
  }

  return (
    notes.find(
      (note) =>
        note.leerling_id === selectedStudent.id && note.lesdatum === selectedDate
    ) ?? null
  );
}

export function getRecentStudentNotes(notes: StudentProgressLessonNote[]) {
  return [...notes]
    .sort((left, right) => right.lesdatum.localeCompare(left.lesdatum))
    .slice(0, 4);
}

export function getStudentWeeklyPlanningSummary(
  student: InstructorStudentProgressRow | null
) {
  const limitSource = !student
    ? "none"
    : student.zelfInplannenHandmatigeOverrideActief
      ? "manual"
      : student.zelfInplannenPakketLimietMinutenPerWeek != null
        ? "package"
        : "none";
  const limitSourceLabel =
    limitSource === "manual"
      ? "Handmatige override"
      : limitSource === "package"
        ? "Pakketstandaard"
        : "Geen limiet";

  return {
    limitLabel: student
      ? formatWeeklyLimitLabel(student.zelfInplannenLimietMinutenPerWeek ?? null)
      : "Onbeperkt",
    limitSource,
    limitSourceLabel,
    packageLimitLabel: student
      ? formatWeeklyLimitLabel(
          student.zelfInplannenPakketLimietMinutenPerWeek ?? null
        )
      : "Onbeperkt",
    manualLimitLabel: student
      ? student.zelfInplannenHandmatigeOverrideActief
        ? formatWeeklyLimitLabel(
            student.zelfInplannenHandmatigeLimietMinutenPerWeek ?? null
          )
        : "Niet actief"
      : "Niet actief",
    usedLabel: student
      ? formatMinutesAsHoursLabel(
          student.zelfInplannenGebruiktMinutenDezeWeek ?? 0
        )
      : "0 min",
    remainingLabel:
      student?.zelfInplannenResterendMinutenDezeWeek == null
        ? "Onbeperkt"
        : formatMinutesAsHoursLabel(
            student.zelfInplannenResterendMinutenDezeWeek
          ),
  };
}

export function getWeeklyBookingLimitInput({
  draft,
  selectedStudent,
}: {
  draft: {
    studentId: string;
    value: string;
  };
  selectedStudent: InstructorStudentProgressRow | null;
}) {
  if (selectedStudent && draft.studentId === selectedStudent.id) {
    return draft.value;
  }

  if (!selectedStudent?.zelfInplannenHandmatigeOverrideActief) {
    return "";
  }

  return selectedStudent.zelfInplannenHandmatigeLimietMinutenPerWeek != null
    ? String(selectedStudent.zelfInplannenHandmatigeLimietMinutenPerWeek)
    : "";
}

export function canDetachStudent(student: InstructorStudentProgressRow | null) {
  return Boolean(
    student?.isHandmatigGekoppeld &&
      student.gekoppeldeLessen === 0 &&
      student.aanvraagStatus === "Handmatig gekoppeld"
  );
}
