import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { UserRole } from '@/lib/supabase/types'

// Validar que el usuario sea ADMIN
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  if (profile?.role !== 'ADMIN') {
    return null;
  }
  
  return user;
}

export async function GET() {
  const adminUser = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminClient = createAdminClient();
  
  // Obtenemos los usuarios de Auth
  const { data: authData, error: authError } = await adminClient.auth.admin.listUsers();
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
  
  // Obtenemos los perfiles
  const { data: profiles, error: profError } = await adminClient.from('profiles').select('*');
  if (profError) return NextResponse.json({ error: profError.message }, { status: 500 });
  
  const mergedUsers = authData.users.map(u => {
    const profile = profiles.find(p => p.id === u.id);
    return {
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      full_name: profile?.full_name || '',
      role: profile?.role || 'VIEWER'
    };
  });
  
  return NextResponse.json({ users: mergedUsers });
}

export async function POST(request: Request) {
  const adminUser = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminClient = createAdminClient();
  
  try {
    const body = await request.json();
    const { email, password, full_name, role } = body;
    
    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // 1. Crear el usuario en Auth
    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });
    
    if (createError) throw createError;
    
    if (!userData.user) {
      throw new Error("Failed to create user");
    }

    // 2. Crear/Actualizar el perfil con el rol asignado
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: userData.user.id,
        full_name,
        email,
        role: role as UserRole
      });
      
    if (profileError) {
      // Intento de rollback
      await adminClient.auth.admin.deleteUser(userData.user.id);
      throw profileError;
    }
    
    return NextResponse.json({ success: true, user: userData.user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const adminUser = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const userId = url.searchParams.get('id');
  
  if (!userId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  
  if (userId === adminUser.id) {
    return NextResponse.json({ error: 'No puedes eliminar tu propio usuario' }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const adminUser = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, role } = body;
    
    if (!id || !role) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    
    if (id === adminUser.id && role !== 'ADMIN') {
      return NextResponse.json({ error: 'No puedes quitarte el rol ADMIN a ti mismo' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('profiles')
      .update({ role })
      .eq('id', id);
      
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
