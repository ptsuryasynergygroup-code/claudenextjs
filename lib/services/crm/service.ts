import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/auth"
import { requireEntitlement } from "@/lib/entitlement"
import { requirePermission } from "@/lib/rbac"
import { auditLog, diff } from "@/lib/audit"
import * as repo from "@/lib/entities/crm/repository"
import {
  type CustomerDto,
  type LeadDto,
  type OpportunityDto,
  CreateCustomerSchema,
  UpdateCustomerSchema,
  CreateLeadSchema,
  UpdateLeadSchema,
  CreateOpportunitySchema,
  UpdateOpportunitySchema,
} from "@/lib/entities/crm/schema"
import { notFound } from "@/lib/errors"

const MODULE = "crm"

export async function getCustomers(): Promise<CustomerDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "crm.view")
  return repo.listCustomers({ orgId: s.orgId })
}

export async function createCustomer(input: unknown): Promise<CustomerDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "crm.create")
  const data = CreateCustomerSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const c = await repo.createCustomer({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Customer", entityId: c.id, action: "create",
      description: `Created customer: ${c.name}`, newValue: { name: c.name },
    })
    return c
  })
}

export async function updateCustomer(id: string, input: unknown): Promise<CustomerDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "crm.edit")
  const data = UpdateCustomerSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const before = await repo.findCustomer({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Customer")
    const after = await repo.updateCustomer({ orgId: s.orgId, tx }, id, data)
    const d = diff({ name: before.name, status: before.status }, { name: after.name, status: after.status })
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Customer", entityId: after.id, action: "update",
      description: `Updated customer: ${after.name}`, oldValue: d.old, newValue: d.new,
    })
    return after
  })
}

export async function deleteCustomer(id: string): Promise<void> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "crm.delete")
  await prisma.$transaction(async (tx) => {
    const before = await repo.findCustomer({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Customer")
    await repo.softDeleteCustomer({ orgId: s.orgId, tx }, id)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Customer", entityId: id, action: "delete",
      description: `Deleted customer: ${before.name}`, oldValue: { name: before.name },
    })
  })
}

export async function getLeads(): Promise<LeadDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "crm.view")
  return repo.listLeads({ orgId: s.orgId })
}

export async function createLead(input: unknown): Promise<LeadDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "crm.create")
  const data = CreateLeadSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const l = await repo.createLead({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Lead", entityId: l.id, action: "create",
      description: `Created lead: ${l.name}`, newValue: { name: l.name, status: l.status },
    })
    return l
  })
}

export async function updateLead(id: string, input: unknown): Promise<LeadDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "crm.edit")
  const data = UpdateLeadSchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const before = await repo.findLead({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Lead")
    const after = await repo.updateLead({ orgId: s.orgId, tx }, id, data)
    const d = diff({ name: before.name, status: before.status }, { name: after.name, status: after.status })
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Lead", entityId: after.id, action: "update",
      description: `Updated lead: ${after.name}`, oldValue: d.old, newValue: d.new,
    })
    return after
  })
}

export async function deleteLead(id: string): Promise<void> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "crm.delete")
  await prisma.$transaction(async (tx) => {
    const before = await repo.findLead({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Lead")
    await repo.softDeleteLead({ orgId: s.orgId, tx }, id)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Lead", entityId: id, action: "delete",
      description: `Deleted lead: ${before.name}`, oldValue: { name: before.name },
    })
  })
}

export async function getOpportunities(): Promise<OpportunityDto[]> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "crm.view")
  return repo.listOpportunities({ orgId: s.orgId })
}

export async function createOpportunity(input: unknown): Promise<OpportunityDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "crm.create")
  const data = CreateOpportunitySchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const o = await repo.createOpportunity({ orgId: s.orgId, tx }, data)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Opportunity", entityId: o.id, action: "create",
      description: `Created opportunity: ${o.name}`, newValue: { name: o.name, amount: o.amount },
    })
    return o
  })
}

export async function updateOpportunity(id: string, input: unknown): Promise<OpportunityDto> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "crm.edit")
  const data = UpdateOpportunitySchema.parse(input)
  return prisma.$transaction(async (tx) => {
    const before = await repo.findOpportunity({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Opportunity")
    const after = await repo.updateOpportunity({ orgId: s.orgId, tx }, id, data)
    const d = diff({ stage: before.stage, amount: before.amount }, { stage: after.stage, amount: after.amount })
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Opportunity", entityId: after.id, action: "update",
      description: `Updated opportunity: ${after.name}`, oldValue: d.old, newValue: d.new,
    })
    return after
  })
}

export async function deleteOpportunity(id: string): Promise<void> {
  const s = await requireSession()
  await requireEntitlement(s.orgId, MODULE)
  await requirePermission(s.userId, "crm.delete")
  await prisma.$transaction(async (tx) => {
    const before = await repo.findOpportunity({ orgId: s.orgId, tx }, id)
    if (!before) notFound("Opportunity")
    await repo.softDeleteOpportunity({ orgId: s.orgId, tx }, id)
    await auditLog.emit({
      tx, orgId: s.orgId, userId: s.userId, userName: s.name,
      entityType: "Opportunity", entityId: id, action: "delete",
      description: `Deleted opportunity: ${before.name}`, oldValue: { name: before.name },
    })
  })
}
