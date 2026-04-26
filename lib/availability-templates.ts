export type AvailabilityTemplateBlock = {
  weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  startTijd: string;
  eindTijd: string;
  label: string;
};

export type AvailabilityTemplate = {
  id: string;
  title: string;
  description: string;
  badge: string;
  blocks: AvailabilityTemplateBlock[];
};

export const availabilityTemplates: AvailabilityTemplate[] = [
  {
    id: "maandagavond-focus",
    title: "Maandagavond Focus",
    description: "Een strakke avondopening voor leerlingen die na werk of studie willen lessen.",
    badge: "Populair",
    blocks: [
      {
        weekday: 1,
        startTijd: "18:30",
        eindTijd: "20:30",
        label: "Maandag 18:30 - 20:30",
      },
    ],
  },
  {
    id: "avond-combi",
    title: "Avond Combi",
    description: "Twee vaste avondblokken per week voor een stabiele instroom.",
    badge: "2 blokken",
    blocks: [
      {
        weekday: 2,
        startTijd: "19:00",
        eindTijd: "21:00",
        label: "Dinsdag 19:00 - 21:00",
      },
      {
        weekday: 4,
        startTijd: "19:00",
        eindTijd: "21:00",
        label: "Donderdag 19:00 - 21:00",
      },
    ],
  },
  {
    id: "woensdagmiddag-boost",
    title: "Woensdagmiddag Boost",
    description: "Slim voor scholieren en leerlingen die overdag sneller kunnen plannen.",
    badge: "Middag",
    blocks: [
      {
        weekday: 3,
        startTijd: "14:00",
        eindTijd: "16:00",
        label: "Woensdag 14:00 - 16:00",
      },
    ],
  },
  {
    id: "weekend-examenritme",
    title: "Weekend Examenritme",
    description: "Ruimer weekendblok voor examentraining, opfrissen en proefroutes.",
    badge: "Weekend",
    blocks: [
      {
        weekday: 6,
        startTijd: "09:00",
        eindTijd: "12:00",
        label: "Zaterdag 09:00 - 12:00",
      },
    ],
  },
  {
    id: "afterwork-ritme",
    title: "Afterwork Ritme",
    description: "Een premium mix van meerdere avondmomenten verdeeld over de week.",
    badge: "Premium",
    blocks: [
      {
        weekday: 1,
        startTijd: "18:00",
        eindTijd: "20:00",
        label: "Maandag 18:00 - 20:00",
      },
      {
        weekday: 3,
        startTijd: "18:30",
        eindTijd: "20:30",
        label: "Woensdag 18:30 - 20:30",
      },
      {
        weekday: 5,
        startTijd: "16:30",
        eindTijd: "18:30",
        label: "Vrijdag 16:30 - 18:30",
      },
    ],
  },
];

export function getAvailabilityTemplateById(templateId: string) {
  return availabilityTemplates.find((template) => template.id === templateId) ?? null;
}
