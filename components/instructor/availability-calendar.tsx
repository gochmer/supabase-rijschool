"use client";

import type { DateSelectArg, EventInput } from "@fullcalendar/core";
import nlLocale from "@fullcalendar/core/locales/nl";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";

type AvailabilityCalendarProps = {
  compact: boolean;
  selectedEntryStartAt?: string;
  events: EventInput[];
  onSelect: (selection: DateSelectArg) => void;
  onAvailabilityEventClick: (eventId: string) => void;
};

export function AvailabilityCalendar({
  compact,
  selectedEntryStartAt,
  events,
  onSelect,
  onAvailabilityEventClick,
}: AvailabilityCalendarProps) {
  return (
    <FullCalendar
      key={compact ? "compact" : "wide"}
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      locale={nlLocale}
      initialDate={selectedEntryStartAt}
      initialView={compact ? "dayGridMonth" : "timeGridWeek"}
      headerToolbar={
        compact
          ? {
              left: "prev,next",
              center: "title",
              right: "dayGridMonth,timeGridDay",
            }
          : {
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }
      }
      buttonText={{
        today: "Vandaag",
        month: "Maand",
        week: "Week",
        day: "Dag",
      }}
      firstDay={1}
      allDaySlot={false}
      nowIndicator
      selectable
      selectMirror
      height="auto"
      fixedWeekCount={false}
      dayMaxEventRows={compact ? 2 : 3}
      slotMinTime="07:00:00"
      slotMaxTime="22:00:00"
      eventTimeFormat={{
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }}
      slotLabelFormat={{
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }}
      eventOrder="start,-duration,title"
      events={events}
      select={onSelect}
      eventClick={(info) => {
        if (info.event.extendedProps.kind !== "availability") {
          return;
        }

        onAvailabilityEventClick(info.event.id);
      }}
    />
  );
}
