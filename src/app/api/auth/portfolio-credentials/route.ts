import { NextResponse } from "next/server"
import { resolvedDemoCredentials } from "@/lib/demo-env"

export async function GET() {
  const creds = resolvedDemoCredentials()
  if (!creds) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 })
  }

  return NextResponse.json({ email: creds.email, password: creds.password })
}
