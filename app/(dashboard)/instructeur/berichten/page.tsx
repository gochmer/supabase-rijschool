import { PageHeader } from "@/components/dashboard/page-header";
import { MessageCenter } from "@/components/messages/message-center";
import {
  getCurrentMessageInbox,
  getMessageRecipientsForCurrentUser,
} from "@/lib/data/messages";

export default async function InstructeurBerichtenPage() {
  const [inbox, recipients] = await Promise.all([
    getCurrentMessageInbox(),
    getMessageRecipientsForCurrentUser(),
  ]);

  return (
    <>
      <PageHeader
        title="Berichten"
        description="Lees vragen van leerlingen en houd belangrijke communicatie centraal."
      />
      <MessageCenter
        inbox={inbox}
        recipients={recipients}
        recipientLabel="Leerling"
      />
    </>
  );
}
