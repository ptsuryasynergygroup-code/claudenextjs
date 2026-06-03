import {
  getVendors,
  getPurchaseRequests,
  getPurchaseOrders,
  getEvaluations,
} from "@/lib/services/procurement/service"
import { hasPermission } from "@/lib/rbac"
import { requireSession } from "@/lib/auth"
import { listEnabledFeatures } from "@/lib/entitlement"
import type { VendorEvaluationDto } from "@/lib/entities/procurement/schema"
import { ProcurementView } from "./procurement-view"

export default async function ProcurementPage() {
  const session = await requireSession()
  const features = await listEnabledFeatures(session.orgId)
  const hasReceiving = features.includes("procurement.receiving")
  const hasEvaluation = features.includes("procurement.evaluation")

  const [vendors, purchaseRequests, purchaseOrders] = await Promise.all([
    getVendors(),
    getPurchaseRequests(),
    getPurchaseOrders(),
  ])

  let evaluations: VendorEvaluationDto[] = []
  if (hasEvaluation) evaluations = await getEvaluations().catch(() => [])

  const [canCreate, canEdit, canApprove] = await Promise.all([
    hasPermission(session.userId, "procurement.create"),
    hasPermission(session.userId, "procurement.edit"),
    hasPermission(session.userId, "procurement.approve"),
  ])

  return (
    <ProcurementView
      vendors={vendors}
      purchaseRequests={purchaseRequests}
      purchaseOrders={purchaseOrders}
      evaluations={evaluations}
      features={{ receiving: hasReceiving, evaluation: hasEvaluation }}
      perms={{ canCreate, canEdit, canApprove }}
    />
  )
}
