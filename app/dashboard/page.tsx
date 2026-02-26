// app/page.tsx
// Página principal — redirige al dashboard o muestra landing

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Si ya está logueado → ir al dashboard
  if (user) {
    redirect('/dashboard');
  }

  // Si no → ir al dashboard igual (la app funciona sin login hasta el límite)
  redirect('/dashboard');
}
