import { PageHeader } from "@/components/dashboard/page-header";
import { DataTableCard } from "@/components/dashboard/data-table-card";
import { getCurrentInstructorIncomeRows } from "@/lib/data/instructor-account";

export default async function InkomstenPage() {
  const incomeRows = await getCurrentInstructorIncomeRows();

  return (
    <>
      <PageHeader
        title="Inkomsten"
        description="Krijg inzicht in verwachte omzet op basis van geplande en afgeronde lessen."
      />
      <DataTableCard
        title="Inkomstenoverzicht"
        description="Live opgebouwd uit lessen die aan jouw instructeursprofiel gekoppeld zijn."
        headers={["Omschrijving", "Bedrag", "Datum", "Status"]}
        rows={incomeRows.map((row) => [
          row.omschrijving,
          row.bedrag,
          row.datum,
          row.status,
        ])}
        badgeColumns={[3]}
        emptyTitle="Nog geen inkomstenmomenten"
        emptyDescription="Zodra lessen worden ingepland of afgerond, verschijnen ze hier automatisch."
      />
    </>
  );
}
