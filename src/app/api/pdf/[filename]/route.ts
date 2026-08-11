import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { filename } = await params

  // Get temporary signed URL (valid for 60 seconds)
  const { data, error } = await supabase.storage
    .from('actas_der')
    .createSignedUrl(filename, 60)

  if (error || !data) {
    return new NextResponse('Error generating secure URL', { status: 500 })
  }

  return NextResponse.redirect(data.signedUrl)
}
