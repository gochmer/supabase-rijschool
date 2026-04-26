import { Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  actionLabel,
}: {
  title: string;
  description: string;
  actionLabel?: string;
}) {
  return (
    <Card className="overflow-hidden border border-dashed border-slate-200 bg-white/78 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.24)] dark:border-white/10 dark:bg-white/5 dark:shadow-[0_24px_80px_-42px_rgba(15,23,42,0.52)]">
      <CardHeader>
        <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-white/8 dark:text-slate-200">
          <Inbox className="size-5" />
        </div>
        <CardTitle className="pt-4 dark:text-white">{title}</CardTitle>
        <CardDescription className="max-w-2xl leading-7 dark:text-slate-300">
          {description}
        </CardDescription>
      </CardHeader>
      {actionLabel ? (
        <CardContent>
          <Button variant="outline" className="rounded-full">
            {actionLabel}
          </Button>
        </CardContent>
      ) : null}
    </Card>
  );
}
