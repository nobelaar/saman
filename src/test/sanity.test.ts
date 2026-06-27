import { describe, it, expect } from 'vitest'
import { supabase } from '@/lib/supabase'
import { fixturePost, fixturePost2 } from '@/test/mocks'

describe('sanity: infra MSW + supabase real client', () => {
  it('fetches posts for a centro through mocked REST', async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('centro_id', fixturePost.centro_id)
      .order('created_at', { ascending: false })
    expect(error).toBeNull()
    expect(data).toHaveLength(2)
    expect(data?.[0].contenido).toBe(fixturePost2.contenido)
  })

  it('returns undefined/null for empty query without single', async () => {
    const { data } = await supabase
      .from('centros_acopio')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .maybeSingle()
    expect(data?.nombre).toBe(fixturePost && 'Centro La Candelaria')
  })
})