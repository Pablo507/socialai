import { createClient } from '@supabase/supabase-js';

// ✅ FIX: Fuerza que esta ruta sea dinámica y nunca se cachee
// Sin esto, Vercel devuelve el mismo contador para todos los usuarios (PRERENDER cache)
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) return Response.json({ count: 0 });

    const { data } = await supabase
      .from('user_usage')
      .select('generation_count')
      .eq('user_id', userId)
      .single();

    return Response.json(
      { count: data?.generation_count ?? 0 },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch {
    return Response.json({ count: 0 });
  }
}
