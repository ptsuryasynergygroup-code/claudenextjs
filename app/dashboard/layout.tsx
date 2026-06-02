import { redirect } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { getSession } from '@/lib/auth'
import { listEnabledModules } from '@/lib/entitlement'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // middleware already guards this, but re-check so we can pass session data
  // and entitlement-driven nav into the shell.
  const session = await getSession()
  if (!session) redirect('/signin')

  const enabledModules = await listEnabledModules(session.orgId)

  return (
    <SidebarProvider>
      <AppSidebar enabledModules={enabledModules} />
      <SidebarInset>
        <DashboardHeader user={{ name: session.name, email: session.email }} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
