// Seed fixtures migrated from lib/data/organization.ts (v0 mock).
// IDs are preserved from the mock so cross-references stay intact in dev.
// This is the ONLY place mock-derived data is allowed (PRD invariant I8).

export const organizationFixture = {
  id: "org-001",
  name: "PT Surya Synergy Group",
  code: "SSG",
  taxNumber: "01.234.567.8-901.000",
  address: "Jl. Sudirman No. 123, Jakarta Pusat 10220",
  phone: "+62 21 5555 1234",
  email: "info@suryasynergy.com",
  website: "https://suryasynergy.com",
  status: "ACTIVE" as const,
  createdAt: new Date("2020-01-15"),
}

export const branchFixtures = [
  { id: "branch-001", name: "Jakarta Head Office", code: "JKT-HQ", address: "Jl. Sudirman No. 123, Jakarta Pusat 10220", phone: "+62 21 5555 1234", manager: "Ahmad Wijaya", status: "ACTIVE" as const, createdAt: new Date("2020-01-15") },
  { id: "branch-002", name: "Surabaya Branch", code: "SBY-01", address: "Jl. Pemuda No. 45, Surabaya 60271", phone: "+62 31 5555 5678", manager: "Budi Santoso", status: "ACTIVE" as const, createdAt: new Date("2021-03-20") },
  { id: "branch-003", name: "Bandung Branch", code: "BDG-01", address: "Jl. Asia Afrika No. 78, Bandung 40112", phone: "+62 22 5555 9012", manager: "Citra Dewi", status: "ACTIVE" as const, createdAt: new Date("2022-07-10") },
  { id: "branch-004", name: "Medan Branch", code: "MDN-01", address: "Jl. Gatot Subroto No. 56, Medan 20113", phone: "+62 61 5555 3456", manager: null, status: "INACTIVE" as const, createdAt: new Date("2023-01-05") },
]

export const departmentFixtures = [
  { id: "dept-001", branchId: "branch-001", name: "Human Resources", code: "HR", description: "Manages employee relations, recruitment, and development", headCount: 15, status: "ACTIVE" as const, createdAt: new Date("2020-01-15") },
  { id: "dept-002", branchId: "branch-001", name: "Finance & Accounting", code: "FIN", description: "Handles financial operations, budgeting, and reporting", headCount: 22, status: "ACTIVE" as const, createdAt: new Date("2020-01-15") },
  { id: "dept-003", branchId: "branch-001", name: "Information Technology", code: "IT", description: "Manages technology infrastructure and software development", headCount: 35, status: "ACTIVE" as const, createdAt: new Date("2020-01-15") },
  { id: "dept-004", branchId: "branch-001", name: "Sales & Marketing", code: "SM", description: "Drives revenue growth and brand awareness", headCount: 45, status: "ACTIVE" as const, createdAt: new Date("2020-01-15") },
  { id: "dept-005", branchId: "branch-001", name: "Operations", code: "OPS", description: "Manages day-to-day business operations", headCount: 28, status: "ACTIVE" as const, createdAt: new Date("2020-01-15") },
  { id: "dept-006", branchId: "branch-002", name: "Regional Sales", code: "RS-SBY", description: "Regional sales operations for East Java", headCount: 18, status: "ACTIVE" as const, createdAt: new Date("2021-03-20") },
  { id: "dept-007", branchId: "branch-003", name: "Regional Sales", code: "RS-BDG", description: "Regional sales operations for West Java", headCount: 12, status: "ACTIVE" as const, createdAt: new Date("2022-07-10") },
]

export const positionFixtures = [
  { id: "pos-001", departmentId: "dept-001", name: "HR Director", code: "HR-DIR", level: 1, description: "Leads HR department strategy and operations", status: "ACTIVE" as const, createdAt: new Date("2020-01-15") },
  { id: "pos-002", departmentId: "dept-001", name: "HR Manager", code: "HR-MGR", level: 2, description: "Manages HR team and daily operations", status: "ACTIVE" as const, createdAt: new Date("2020-01-15") },
  { id: "pos-003", departmentId: "dept-001", name: "HR Specialist", code: "HR-SPE", level: 3, description: "Handles specific HR functions", status: "ACTIVE" as const, createdAt: new Date("2020-01-15") },
  { id: "pos-004", departmentId: "dept-002", name: "Finance Director", code: "FIN-DIR", level: 1, description: "Oversees all financial operations", status: "ACTIVE" as const, createdAt: new Date("2020-01-15") },
  { id: "pos-005", departmentId: "dept-002", name: "Finance Manager", code: "FIN-MGR", level: 2, description: "Manages finance team", status: "ACTIVE" as const, createdAt: new Date("2020-01-15") },
  { id: "pos-006", departmentId: "dept-002", name: "Senior Accountant", code: "FIN-SAC", level: 3, description: "Senior accounting role", status: "ACTIVE" as const, createdAt: new Date("2020-01-15") },
  { id: "pos-007", departmentId: "dept-002", name: "Accountant", code: "FIN-ACC", level: 4, description: "Handles accounting tasks", status: "ACTIVE" as const, createdAt: new Date("2020-01-15") },
  { id: "pos-008", departmentId: "dept-003", name: "IT Director", code: "IT-DIR", level: 1, description: "Leads IT strategy and infrastructure", status: "ACTIVE" as const, createdAt: new Date("2020-01-15") },
  { id: "pos-009", departmentId: "dept-003", name: "Development Manager", code: "IT-DVM", level: 2, description: "Manages software development team", status: "ACTIVE" as const, createdAt: new Date("2020-01-15") },
  { id: "pos-010", departmentId: "dept-003", name: "Senior Developer", code: "IT-SDE", level: 3, description: "Senior software development role", status: "ACTIVE" as const, createdAt: new Date("2020-01-15") },
  { id: "pos-011", departmentId: "dept-003", name: "Developer", code: "IT-DEV", level: 4, description: "Software development role", status: "ACTIVE" as const, createdAt: new Date("2020-01-15") },
  { id: "pos-012", departmentId: "dept-004", name: "Sales Director", code: "SM-DIR", level: 1, description: "Leads sales strategy", status: "ACTIVE" as const, createdAt: new Date("2020-01-15") },
  { id: "pos-013", departmentId: "dept-004", name: "Sales Manager", code: "SM-MGR", level: 2, description: "Manages sales team", status: "ACTIVE" as const, createdAt: new Date("2020-01-15") },
  { id: "pos-014", departmentId: "dept-004", name: "Sales Executive", code: "SM-EXE", level: 3, description: "Handles client relationships", status: "ACTIVE" as const, createdAt: new Date("2020-01-15") },
]
