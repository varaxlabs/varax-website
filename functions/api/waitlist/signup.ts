interface Env {
  LICENSE_KV: KVNamespace;
  BREVO_API_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const headers = { 'Content-Type': 'application/json' };

  try {
    const { email, tag, company, clusters } = (await request.json()) as {
      email?: string;
      tag?: string;
      company?: string;
      clusters?: string;
    };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400, headers });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const prefix = tag ? `waitlist:${tag}` : 'waitlist';
    const key = `${prefix}:${normalizedEmail}`;
    const existing = await env.LICENSE_KV.get(key);

    if (!existing) {
      const entry: Record<string, string> = {
        email: normalizedEmail,
        signedUp: new Date().toISOString(),
      };
      if (tag) entry.tag = tag;
      if (company) entry.company = company.trim();
      if (clusters) entry.clusters = clusters;
      await env.LICENSE_KV.put(key, JSON.stringify(entry));
    }

    // Add contact to Brevo "varax-interest" list
    if (env.BREVO_API_KEY) {
      const attributes: Record<string, string> = {};
      if (company) attributes.COMPANY = company.trim();
      if (clusters) attributes.CLUSTERS = clusters;

      await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'api-key': env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          listIds: [2],
          updateEnabled: true,
          ...(Object.keys(attributes).length > 0 && { attributes }),
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400, headers });
  }
};
