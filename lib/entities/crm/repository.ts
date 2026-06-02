import type { Prisma, PrismaClient } from "@prisma/client"
import { prisma as defaultPrisma } from "@/lib/prisma"
import {
  type CustomerDto,
  type LeadDto,
  type OpportunityDto,
  type LeadStatus,
  type OpportunityStage,
  type CreateCustomerInput,
  type UpdateCustomerInput,
  type CreateLeadInput,
  type UpdateLeadInput,
  type CreateOpportunityInput,
  type UpdateOpportunityInput,
} from "./schema"
import type { Status } from "@/lib/entities/organization/schema"

type Ctx = { orgId: string; tx?: Prisma.TransactionClient | PrismaClient }

function db(ctx: Ctx) {
  return ctx.tx ?? defaultPrisma
}

const entOut: Record<string, Status> = { ACTIVE: "active", INACTIVE: "inactive" }
const entIn: Record<Status, "ACTIVE" | "INACTIVE"> = { active: "ACTIVE", inactive: "INACTIVE" }
const leadOut: Record<string, LeadStatus> = {
  NEW: "new",
  CONTACTED: "contacted",
  QUALIFIED: "qualified",
  LOST: "lost",
}
const leadIn: Record<LeadStatus, "NEW" | "CONTACTED" | "QUALIFIED" | "LOST"> = {
  new: "NEW",
  contacted: "CONTACTED",
  qualified: "QUALIFIED",
  lost: "LOST",
}
const stageOut: Record<string, OpportunityStage> = {
  PROSPECTING: "prospecting",
  PROPOSAL: "proposal",
  NEGOTIATION: "negotiation",
  WON: "won",
  LOST: "lost",
}
const stageIn: Record<OpportunityStage, "PROSPECTING" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST"> = {
  prospecting: "PROSPECTING",
  proposal: "PROPOSAL",
  negotiation: "NEGOTIATION",
  won: "WON",
  lost: "LOST",
}

type CustomerRow = Prisma.CustomerGetPayload<object>
type LeadRow = Prisma.LeadGetPayload<object>
type OppRow = Prisma.OpportunityGetPayload<object>

function toCustomer(c: CustomerRow): CustomerDto {
  return {
    id: c.id,
    organizationId: c.organizationId,
    name: c.name,
    phone: c.phone,
    email: c.email,
    status: entOut[c.status] ?? "inactive",
    createdAt: c.createdAt,
  }
}
function toLead(l: LeadRow): LeadDto {
  return {
    id: l.id,
    organizationId: l.organizationId,
    name: l.name,
    source: l.source,
    status: leadOut[l.status] ?? "new",
    ownerId: l.ownerId,
    createdAt: l.createdAt,
  }
}
function toOpp(o: OppRow): OpportunityDto {
  return {
    id: o.id,
    organizationId: o.organizationId,
    name: o.name,
    customerId: o.customerId,
    leadId: o.leadId,
    stage: stageOut[o.stage] ?? "prospecting",
    amount: o.amount,
    ownerId: o.ownerId,
    createdAt: o.createdAt,
  }
}

export async function listCustomers(ctx: Ctx): Promise<CustomerDto[]> {
  const rows = await db(ctx).customer.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  })
  return rows.map(toCustomer)
}

export async function findCustomer(ctx: Ctx, id: string): Promise<CustomerDto | null> {
  const row = await db(ctx).customer.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
  })
  return row ? toCustomer(row) : null
}

export async function createCustomer(ctx: Ctx, data: CreateCustomerInput): Promise<CustomerDto> {
  const row = await db(ctx).customer.create({
    data: {
      organizationId: ctx.orgId,
      name: data.name,
      phone: data.phone ?? null,
      email: data.email ?? null,
      status: entIn[data.status],
    },
  })
  return toCustomer(row)
}

export async function updateCustomer(
  ctx: Ctx,
  id: string,
  data: UpdateCustomerInput,
): Promise<CustomerDto> {
  const row = await db(ctx).customer.update({
    where: { id, organizationId: ctx.orgId },
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      status: data.status ? entIn[data.status] : undefined,
    },
  })
  return toCustomer(row)
}

export async function softDeleteCustomer(ctx: Ctx, id: string): Promise<void> {
  const existing = await db(ctx).customer.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!existing) throw new Error("Customer not found")
  await db(ctx).customer.update({
    where: { id, organizationId: ctx.orgId },
    data: { deletedAt: new Date() },
  })
}

export async function listLeads(ctx: Ctx): Promise<LeadDto[]> {
  const rows = await db(ctx).lead.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  })
  return rows.map(toLead)
}

export async function findLead(ctx: Ctx, id: string): Promise<LeadDto | null> {
  const row = await db(ctx).lead.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
  })
  return row ? toLead(row) : null
}

export async function createLead(ctx: Ctx, data: CreateLeadInput): Promise<LeadDto> {
  const row = await db(ctx).lead.create({
    data: {
      organizationId: ctx.orgId,
      name: data.name,
      source: data.source ?? null,
      status: leadIn[data.status],
      ownerId: data.ownerId ?? null,
    },
  })
  return toLead(row)
}

export async function updateLead(ctx: Ctx, id: string, data: UpdateLeadInput): Promise<LeadDto> {
  const row = await db(ctx).lead.update({
    where: { id, organizationId: ctx.orgId },
    data: {
      name: data.name,
      source: data.source,
      status: data.status ? leadIn[data.status] : undefined,
      ownerId: data.ownerId,
    },
  })
  return toLead(row)
}

export async function softDeleteLead(ctx: Ctx, id: string): Promise<void> {
  const existing = await db(ctx).lead.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!existing) throw new Error("Lead not found")
  await db(ctx).lead.update({
    where: { id, organizationId: ctx.orgId },
    data: { deletedAt: new Date() },
  })
}

export async function listOpportunities(ctx: Ctx): Promise<OpportunityDto[]> {
  const rows = await db(ctx).opportunity.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  })
  return rows.map(toOpp)
}

export async function findOpportunity(ctx: Ctx, id: string): Promise<OpportunityDto | null> {
  const row = await db(ctx).opportunity.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
  })
  return row ? toOpp(row) : null
}

export async function createOpportunity(
  ctx: Ctx,
  data: CreateOpportunityInput,
): Promise<OpportunityDto> {
  if (data.customerId) {
    const c = await db(ctx).customer.findFirst({
      where: { id: data.customerId, organizationId: ctx.orgId, deletedAt: null },
      select: { id: true },
    })
    if (!c) throw new Error("Customer not found in this organization")
  }
  const row = await db(ctx).opportunity.create({
    data: {
      organizationId: ctx.orgId,
      name: data.name,
      customerId: data.customerId ?? null,
      leadId: data.leadId ?? null,
      stage: stageIn[data.stage],
      amount: data.amount,
      ownerId: data.ownerId ?? null,
    },
  })
  return toOpp(row)
}

export async function updateOpportunity(
  ctx: Ctx,
  id: string,
  data: UpdateOpportunityInput,
): Promise<OpportunityDto> {
  const row = await db(ctx).opportunity.update({
    where: { id, organizationId: ctx.orgId },
    data: {
      name: data.name,
      customerId: data.customerId,
      leadId: data.leadId,
      stage: data.stage ? stageIn[data.stage] : undefined,
      amount: data.amount,
      ownerId: data.ownerId,
    },
  })
  return toOpp(row)
}

export async function softDeleteOpportunity(ctx: Ctx, id: string): Promise<void> {
  const existing = await db(ctx).opportunity.findFirst({
    where: { id, organizationId: ctx.orgId, deletedAt: null },
    select: { id: true },
  })
  if (!existing) throw new Error("Opportunity not found")
  await db(ctx).opportunity.update({
    where: { id, organizationId: ctx.orgId },
    data: { deletedAt: new Date() },
  })
}
