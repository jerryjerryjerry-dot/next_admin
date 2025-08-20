import { AuthGuard } from "~/components/AuthGuard";
import { AdminLayout } from "~/components/ui/layout";
import { AppManagementPage } from "~/components/app-management/AppManagementPage";

export default function AppManagement() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminLayout>
        <AppManagementPage />
      </AdminLayout>
    </AuthGuard>
  );
}
