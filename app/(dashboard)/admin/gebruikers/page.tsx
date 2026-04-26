import { UsersManagementBoard } from "@/components/admin/users-management-board";
import { PageHeader } from "@/components/dashboard/page-header";
import { getAdminUsers } from "@/lib/data/admin";

export default async function GebruikersPage() {
  const users = await getAdminUsers();

  return (
    <>
      <PageHeader
        title="Gebruikers beheren"
        description="Bekijk, filter en beheer alle accounts op het platform."
      />
      <UsersManagementBoard users={users} />
    </>
  );
}
