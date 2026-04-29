import { PageHeader } from "@/components/dashboard/page-header";
import { MessageCenter } from "@/components/messages/message-center";
import {
  getCurrentMessageInbox,
  getCurrentOutgoingMessageLog,
  getInstructorMessageSmartTemplates,
  getMessageRecipientsForCurrentUser,
} from "@/lib/data/messages";

export default async function InstructeurBerichtenPage() {
  const [inbox, recipients, smartTemplates, outgoingLog] = await Promise.all([
    getCurrentMessageInbox(),
    getMessageRecipientsForCurrentUser(),
    getInstructorMessageSmartTemplates(),
    getCurrentOutgoingMessageLog(),
  ]);

  return (
    <>
      <PageHeader
        title="Berichten"
        description="Lees vragen van leerlingen en stuur sneller slimme opvolging vanuit kant-en-klare concepten."
      />
      <MessageCenter
        inbox={inbox}
        outgoingLog={outgoingLog}
        recipients={recipients}
        recipientLabel="Leerling"
        smartTemplates={smartTemplates}
      />
    </>
  );
}
