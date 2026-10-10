import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  await connection()
  const supabase = await createClient()
  const { data, error } = await supabase.from('areas').select('id,name,parent_id').eq('active', true).not('parent_id', 'is', null).order('name')
  if (error) return Response.json({ error: 'Unable to load campus areas' }, { status: 500 })
  return Response.json({ areas: data })
}
