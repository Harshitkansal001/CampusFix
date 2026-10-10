import { z } from 'zod'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const createReport = z.object({
  areaId: z.uuid(),
  description: z.string().trim().min(10).max(5000),
  locationDetail: z.string().trim().max(200).optional(),
})
const reportOffset = z.coerce.number().int().min(0).max(5000000).default(0)
const pageSize = 50

export async function GET(request: Request) {
  await connection()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 })

  const offset = reportOffset.safeParse(new URL(request.url).searchParams.get('offset') ?? 0)
  if (!offset.success) return Response.json({ error: 'Invalid offset' }, { status: 400 })

  const { data, error } = await supabase.from('reports').select('id,reference,area_id,location_detail,description,status,priority,category_id,assigned_to,photo_path,created_at,updated_at,areas(name)').order('created_at', { ascending: false }).range(offset.data, offset.data + pageSize - 1)
  if (error) return Response.json({ error: 'Unable to load reports' }, { status: 500 })
  return Response.json({ reports: data, hasMore: data.length === pageSize })
}

export async function POST(request: Request) {
  await connection()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 })

  const parsed = createReport.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Invalid report', details: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await supabase.rpc('create_report', {
    p_area_id: parsed.data.areaId,
    p_description: parsed.data.description,
    p_location_detail: parsed.data.locationDetail ?? null,
  })
  if (error) return Response.json({ error: error.code === '22023' ? 'Invalid campus area' : 'Unable to create report' }, { status: error.code === '22023' ? 400 : 500 })
  return Response.json({ report: data }, { status: 201 })
}
