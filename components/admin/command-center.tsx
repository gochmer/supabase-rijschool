import { Activity, BadgeEuro, ShieldCheck, Users } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const items = [
  {
    title: "Kwaliteitscontrole",
    text: "Houd goedkeuringen, reviews en support op hetzelfde dashboard in balans.",
    icon: ShieldCheck,
  },
  {
    title: "Operationeel zicht",
    text: "Zie in een oogopslag gebruikersgroei, lesdrukte en ticketbelasting.",
    icon: Activity,
  },
  {
    title: "Omzetbewaking",
    text: "Volg recente betalingen en signaleer openstaande statussen sneller.",
    icon: BadgeEuro,
  },
  {
    title: "Platformteams",
    text: "Werk samen rond instructeurs, leerlingen en supportprocessen.",
    icon: Users,
  },
];

export function CommandCenter() {
  return (
    <div className="grid gap-3 xl:grid-cols-4">
      {items.map((item) => (
        <Card
          key={item.title}
          className="border border-white/70 bg-white/90 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] transition-transform duration-300 hover:-translate-y-1 dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.62)]"
        >
          <CardHeader className="pb-3">
            <div className="flex size-9 items-center justify-center rounded-[1rem] bg-primary/10 text-primary">
              <item.icon className="size-4" />
            </div>
            <CardTitle className="pt-3 text-[15px]">{item.title}</CardTitle>
            <CardDescription className="text-[13px] leading-6">
              {item.text}
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
