import { NextResponse } from "next/server"
import { isDemoAuthEnabled, resolvedDemoCredentials } from "@/lib/demo-env"

export async function GET() {
  if (!isDemoAuthEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 404 })
  }

  const creds = resolvedDemoCredentials()
  if (!creds) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 })
  }

  return NextResponse.json({ email: creds.email, password: creds.password })
}
