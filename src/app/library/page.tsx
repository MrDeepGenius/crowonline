import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EnrollmentCard } from "@/components/library/enrollment-card";
import {
  CertificatesCard,
  PendingOrdersCard,
  PurchaseHistoryCard,
} from "@/components/library/library-panels";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { listCertificates, listLibrary } from "@/server/services/learning";
import { listBuyerOrders } from "@/server/services/orders";

export const metadata = { title: "Mi biblioteca" };

export default async function LibraryPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [enrollments, orders, certificates] = await Promise.all([
    listLibrary(user.id),
    listBuyerOrders(user.id),
    listCertificates(user.id),
  ]);

  return (
    <DashboardShell
      title="Mi biblioteca"
      description="Todo lo que has comprado en CROW: cursos con progreso guardado, descargas y certificados."
      activePath="/library"
      action={<ButtonLink href="/marketplace" variant="secondary">Explorar marketplace</ButtonLink>}
    >
      <PendingOrdersCard orders={orders.filter((order) => order.status === "PENDING")} />

      {enrollments.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {enrollments.map((enrollment) => (
            <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Tu biblioteca está vacía"
          description="Compra tu primer producto en el marketplace: cursos con módulos, ejercicios y certificado al completar."
          action={<ButtonLink href="/marketplace">Ir al marketplace</ButtonLink>}
        />
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <CertificatesCard
          certificates={certificates.map((certificate) => ({
            id: certificate.id,
            serial: certificate.serial,
            courseTitle: certificate.courseTitle,
            issuedAt: certificate.issuedAt,
          }))}
        />
        <PurchaseHistoryCard orders={orders} />
      </div>
    </DashboardShell>
  );
}