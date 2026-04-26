"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function handleSignOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success("Je bent uitgelogd.");
      router.push("/inloggen");
      router.refresh();
    } catch {
      toast.error("Uitloggen is niet gelukt.");
    }
  }

  return (
    <Button className={className} onClick={handleSignOut}>
      Uitloggen
    </Button>
  );
}
