import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Body = {
  targetUserId: string;
  type: 'approved' | 'rejected';
  userName?: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ✅ THIS IS THE FIX
    const callerId = req.headers.get('x-supabase-auth-user-id');

    if (!callerId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 🔒 Admin check
    const { data: isAdmin, error: adminError } = await supabase.rpc(
      'is_admin',
      { p_user_id: callerId }
    );

    if (adminError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: corsHeaders }
      );
    }

    const { targetUserId, type, userName }: Body = await req.json();

    const { data: targetUser } =
      await supabase.auth.admin.getUserById(targetUserId);

    if (!targetUser?.user?.email) {
      return new Response(
        JSON.stringify({ error: 'Target user not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    let displayName = userName ?? 'there';

    if (!userName) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('user_id', targetUserId)
        .maybeSingle();

      displayName =
        profile?.display_name || profile?.username || 'there';
    }

    const subject =
      type === 'approved'
        ? 'Your CampusCanvas account has been approved 🎉'
        : 'CampusCanvas verification update';

    const html =
      type === 'approved'
        ? `<p>Hi ${displayName}, your account has been approved.</p>`
        : `<p>Hi ${displayName}, your verification request was not approved.</p>`;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CampusCanvas <no-reply@contact.blockcelerate.net>',
        to: targetUser.user.email,
        subject,
        html,
      }),
    });

    if (!emailRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Email failed' }),
        { status: 502, headers: corsHeaders }
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: corsHeaders }
    );
  }
});
