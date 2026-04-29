import type { Pakket } from "@/lib/types";

export type FirstLessonTemplate = {
  title: string;
  durationMinutes: number;
  summary: string;
  bullets: string[];
};

function includesOneOf(value: string, needles: string[]) {
  const normalized = value.toLowerCase();
  return needles.some((needle) => normalized.includes(needle));
}

export function getFirstLessonTemplateForPackage(
  pkg: Pakket | null | undefined
): FirstLessonTemplate {
  const packageName = pkg?.naam?.toLowerCase() ?? "";
  const lessonType = pkg?.les_type ?? "auto";

  if (includesOneOf(packageName, ["spoed", "versneld"])) {
    return {
      title: "Spoedstart en leerroute",
      durationMinutes: 90,
      summary: "Direct scherp krijgen wat al staat, waar het tempo omhoog kan en hoe de komende lessen worden opgebouwd.",
      bullets: [
        "Korte intake op niveau, ritme en examendruk",
        "Snelle nulmeting op basisbediening en verkeersbeeld",
        "Duidelijk 3-lessenplan voor versnelling",
      ],
    };
  }

  if (includesOneOf(packageName, ["examen", "examengericht"])) {
    return {
      title: "Examenfocus en routebeeld",
      durationMinutes: 90,
      summary: "De eerste les draait om examenniveau, kijkgedrag en waar de meeste winst richting praktijkexamen zit.",
      bullets: [
        "Startcheck op kijktechniek en verkeersinzicht",
        "Moeilijke situaties en examenspanning scherp maken",
        "Heldere route naar proefexamen of examengerichte lessen",
      ],
    };
  }

  if (includesOneOf(packageName, ["opfris", "herstart"])) {
    return {
      title: "Herstart met vertrouwen",
      durationMinutes: 75,
      summary: "Rustig opnieuw opbouwen, vooral op zekerheid, ritme en terugkrijgen van vertrouwen in de auto.",
      bullets: [
        "Comfortcheck en spanning in kaart brengen",
        "Basisbediening en verkeersritme opnieuw laten landen",
        "Praktische focus voor de volgende les vastzetten",
      ],
    };
  }

  if (includesOneOf(packageName, ["proefles", "intake", "starter", "start"])) {
    return {
      title: "Intake en rustige basisstart",
      durationMinutes: 75,
      summary: "De eerste les is bedoeld om de leerling goed te leren kennen en een rustige, duidelijke basis neer te zetten.",
      bullets: [
        "Korte intake op ervaring, tempo en leerstijl",
        "Basisbediening en kijkgedrag rustig neerzetten",
        "Duidelijke eerste succeservaring meegeven",
      ],
    };
  }

  if (lessonType === "motor") {
    return {
      title: "Motorbasis en voertuiggevoel",
      durationMinutes: 90,
      summary: "Starten met balans, voertuiggevoel en vertrouwen in bediening en wegpositie.",
      bullets: [
        "Voertuigcontrole en beschermde start",
        "Balans, koppeling en kijkritme neerzetten",
        "Eerste routefocus voor bochten en positie bepalen",
      ],
    };
  }

  if (lessonType === "vrachtwagen") {
    return {
      title: "Voertuigcontrole en groot verkeer",
      durationMinutes: 90,
      summary: "De eerste les zet zwaar in op voertuiggevoel, zichtlijnen en rustig verkeer lezen met groter materieel.",
      bullets: [
        "Instap, spiegels en voertuigcontrole goed zetten",
        "Ruimtegevoel en breedte leren inschatten",
        "Routefocus bepalen voor grotere verkeerssituaties",
      ],
    };
  }

  return {
    title: "Eerste les en basisopbouw",
    durationMinutes: 75,
    summary: "Een rustige eerste les waarin vertrouwen, basisbediening en heldere vervolgstappen centraal staan.",
    bullets: [
      "Korte intake op leerstijl en eerdere ervaring",
      "Basisbediening en verkeersbeeld samen opzetten",
      "Vervolgfocus direct concreet maken",
    ],
  };
}
