import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type RoleRow = {
  gym_id: string | null
  role: string | null
  is_platform_admin: boolean | null
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const { data: rows } = await supabase.rpc('get_my_role')
  const row = (rows as RoleRow[] | null)?.[0]

  if (row?.is_platform_admin) {
    return NextResponse.redirect(new URL('/hq', request.url))
  }
  if (row?.gym_id) {
    return NextResponse.redirect(new URL('/partner', request.url))
  }

  return NextResponse.redirect(new URL('/auth/denied', request.url))
}
