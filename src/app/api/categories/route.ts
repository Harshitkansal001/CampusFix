import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  await connection()
  const supabase = await createClient()
  const { data, error } = await supabase.from('categories').select('id,name').eq('active', true).order('name')
  if (error) return Response.json({ error: 'Unable to load categories' }, { status: 500 })
  return Response.json({ categories: data })
}
