"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { toast } from "sonner";

import { resendInstructorLearnerInviteAction } from "@/lib/actions/instructor-learners";
import { Button } from "@/components/ui/button";

export function StudentInviteResendButton({
  leerlingId,
  disabled = false,
}: {
  leerlingId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      className="h-9 rounded-full text-[12px]"
      disabled={disabled || isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await resendInstructorLearnerInviteAction({
            leerlingId,
          });

          if (!result.success) {
            toast.error(result.message);
            return;
          }

          toast.success(result.message);
          router.refresh();
        });
      }}
    >
      <Mail className="size-3.5" />
      {isPending ? "Versturen..." : "Uitnodiging opnieuw sturen"}
    </Button>
  );
}
