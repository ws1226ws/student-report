// supabase/functions/admin-teachers/index.ts
//
// Edge Function สำหรับ admin จัดการบัญชีครู (สร้าง / ลบ / เปลี่ยนรหัสผ่าน)
// ตรวจสอบสิทธิ์ admin จาก JWT ของ caller ก่อนเสมอ แล้วใช้ service_role
// เรียก auth.admin.* API
//
// Deploy: Supabase Dashboard → Edge Functions → Deploy a new function
//   ชื่อ: admin-teachers   (ตรงกับชื่อ folder)
//
// Env vars (auto-injected โดย Supabase ไม่ต้องตั้งเอง):
//   SUPABASE_URL · SUPABASE_ANON_KEY · SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SB_URL = Deno.env.get('SUPABASE_URL')!;
const SB_ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const SB_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const EMAIL_SUFFIX = '@studentreport.local';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'content-type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'ไม่มี Authorization header' }, 401);

    // 1) Verify caller via their JWT
    const userClient = createClient(SB_URL, SB_ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes?.user) {
      return json({ error: 'JWT ไม่ถูกต้องหรือหมดอายุ' }, 401);
    }
    const callerId = userRes.user.id;

    // 2) Check role
    const { data: profile, error: profErr } = await userClient
      .from('profiles')
      .select('role')
      .eq('user_id', callerId)
      .single();
    if (profErr || profile?.role !== 'admin') {
      return json({ error: 'เฉพาะ admin เท่านั้น' }, 403);
    }

    // 3) Service-role client for admin operations
    const admin = createClient(SB_URL, SB_SERVICE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');

    // ---------- create ----------
    if (action === 'create') {
      const username = String(body.username || '').trim().toLowerCase();
      const password = String(body.password || '');
      const name = String(body.name || '').trim() || username;
      const avatar = String(body.avatar || '#FF6E8A');

      if (!username || !/^[a-z0-9_]{2,32}$/.test(username))
        return json({ error: 'username ต้องเป็น a-z, 0-9, _ ความยาว 2-32' }, 400);
      if (password.length < 6)
        return json({ error: 'password ต้องอย่างน้อย 6 ตัวอักษร' }, 400);

      // Duplicate check
      const { data: dup } = await admin
        .from('profiles')
        .select('user_id')
        .eq('username', username)
        .maybeSingle();
      if (dup) return json({ error: `username "${username}" ถูกใช้แล้ว` }, 409);

      const email = username + EMAIL_SUFFIX;
      const { data: created, error: createErr } =
        await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
      if (createErr || !created?.user) {
        return json({ error: createErr?.message || 'สร้างบัญชีไม่สำเร็จ' }, 400);
      }

      const { error: insErr } = await admin.from('profiles').insert({
        user_id: created.user.id,
        username,
        full_name: name,
        role: 'teacher',
        avatar,
      });
      if (insErr) {
        // rollback auth user
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ error: insErr.message }, 400);
      }

      return json({
        ok: true,
        teacher: {
          id: username,
          name,
          avatar,
          role: 'teacher',
          user_id: created.user.id,
        },
      });
    }

    // ---------- delete ----------
    if (action === 'delete') {
      const username = String(body.username || '').trim().toLowerCase();
      if (!username) return json({ error: 'ต้องระบุ username' }, 400);

      const { data: target } = await admin
        .from('profiles')
        .select('user_id, role')
        .eq('username', username)
        .maybeSingle();
      if (!target) return json({ error: 'ไม่พบบัญชีนี้' }, 404);
      if (target.role === 'admin')
        return json({ error: 'ห้ามลบบัญชี admin' }, 400);
      if (target.user_id === callerId)
        return json({ error: 'ห้ามลบบัญชีของตัวเอง' }, 400);

      const { error: delErr } = await admin.auth.admin.deleteUser(
        target.user_id,
      );
      // profiles row จะถูก cascade ลบไปด้วย (FK on delete cascade)
      if (delErr) return json({ error: delErr.message }, 400);

      return json({ ok: true });
    }

    // ---------- set_password ----------
    if (action === 'set_password') {
      const username = String(body.username || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!username) return json({ error: 'ต้องระบุ username' }, 400);
      if (password.length < 6)
        return json({ error: 'password ต้องอย่างน้อย 6 ตัวอักษร' }, 400);

      const { data: target } = await admin
        .from('profiles')
        .select('user_id')
        .eq('username', username)
        .maybeSingle();
      if (!target) return json({ error: 'ไม่พบบัญชีนี้' }, 404);

      const { error: updErr } = await admin.auth.admin.updateUserById(
        target.user_id,
        { password },
      );
      if (updErr) return json({ error: updErr.message }, 400);

      return json({ ok: true });
    }

    return json({ error: 'action ไม่รู้จัก (รองรับ create/delete/set_password)' }, 400);
  } catch (e) {
    console.error('admin-teachers error:', e);
    return json({ error: (e as Error)?.message || String(e) }, 500);
  }
});
