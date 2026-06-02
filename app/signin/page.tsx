import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { SignInForm } from "./signin-form"

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  const session = await getSession()
  if (session) redirect("/dashboard")

  const params = await searchParams
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <SignInForm callbackUrl={params.callbackUrl ?? "/dashboard"} initialError={params.error} />
    </div>
  )
}
