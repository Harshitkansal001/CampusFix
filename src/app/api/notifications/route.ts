import { z } from 'zod'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  await connection()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 })

  const { data, error } = await supabase.from('notifications').select('id,report_id,message,read_at,created_at').order('created_at', { ascending: false })
  if (error) return Response.json({ error: 'Unable to load notifications' }, { status: 500 })
  return Response.json({ notifications: data })
}

export async function PATCH(request: Request) {
  await connection()
  const parsed = z.object({ id: z.number().int().positive() }).safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Invalid notification ID' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 })

  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', parsed.data.id)
  if (error) return Response.json({ error: 'Unable to update notification' }, { status: 500 })
  return Response.json({ ok: true })
}
