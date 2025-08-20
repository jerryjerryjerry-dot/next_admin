"use client";

import { AuthGuard } from "~/components/AuthGuard";
import { RequireAnyRole } from "~/components/RequireRole";
import { AdminLayout } from "~/components/ui/layout";
import { WatermarkPage } from "./watermark";

export default function Page() {
  return (
    <AuthGuard>
      <RequireAnyRole roles={["admin"]}>
        <AdminLayout>
          <WatermarkPage />
        </AdminLayout>
      </RequireAnyRole>
    </AuthGuard>
  );
}
