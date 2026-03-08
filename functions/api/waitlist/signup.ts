interface Env {
  LICENSE_KV: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const headers = { 'Content-Type': 'application/json' };

  try {
    const { email } = (await request.json()) as { email?: string };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400, headers });
    }

    const key = `waitlist:${email.toLowerCase().trim()}`;
    const existing = await env.LICENSE_KV.get(key);

    if (!existing) {
      await env.LICENSE_KV.put(key, JSON.stringify({
        email: email.toLowerCase().trim(),
        signedUp: new Date().toISOString(),
      }));
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400, headers });
  }
};
