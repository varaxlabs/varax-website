interface SendLicenseEmailParams {
  apiKey: string;
  to: string;
  org: string;
  licenseKey: string;
}

export async function sendLicenseEmail({
  apiKey,
  to,
  org,
  licenseKey,
}: SendLicenseEmailParams): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Varax <licenses@varax.io>",
      to: [to],
      subject: "Your Varax License Key",
      html: `
<h2>Welcome to Varax, ${escapeHtml(org)}!</h2>
<p>Your license key is ready. To activate, run:</p>
<pre><code>varax license activate ${escapeHtml(licenseKey)}</code></pre>
<p>Store this key securely — it is tied to your subscription and cannot be recovered if lost.</p>
<p>If you have any questions, reply to this email or visit <a href="https://varax.io/docs">our documentation</a>.</p>
<p>— Varax</p>
      `.trim(),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API error (${response.status}): ${body}`);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
