import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Check auth configuration via Supabase REST API
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        'apikey': anonKey!,
        'Authorization': `Bearer ${anonKey}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({
        status: 'error',
        message: 'Failed to fetch auth settings',
        error: await response.text(),
      }, { status: 500 })
    }

    const settings = await response.json()

    return NextResponse.json({
      status: 'success',
      message: 'Auth configuration retrieved',
      settings: {
        external: settings.external,
        disable_signup: settings.disable_signup,
        autoconfirm: settings.autoconfirm,
        mailer_autoconfirm: settings.mailer_autoconfirm,
        phone_autoconfirm: settings.phone_autoconfirm,
        // Don't expose sensitive SMTP details
        email_provider_configured: !!settings.smtp_host || !!settings.mailer_provider,
      },
      supabaseUrl,
      hasAnonKey: !!anonKey,
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
