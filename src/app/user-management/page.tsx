import { AuthGuard } from "~/components/AuthGuard";
import { AdminLayout } from "~/components/ui/layout";
import { UserManagementPage } from "~/components/user-management/UserManagementPage";

export default function UserManagement() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminLayout>
        <UserManagementPage />
      </AdminLayout>
    </AuthGuard>
  );
}

