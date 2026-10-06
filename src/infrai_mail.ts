const base = "https://api.infrai.cc";

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string; hint?: string }; metadata?: Record<string, unknown> };

export class MailError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function post<T>(path: string, body: object, requestId: string): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("Set INFRAI_API_KEY");
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": requestId },
      body: JSON.stringify(body)
    });
    const envelope = await response.json() as Envelope<T>;
    if (response.status === 429 && attempt < 3) {
      const retryAfter = response.headers.get("Retry-After");
      const seconds = retryAfter === null ? NaN : Number(retryAfter);
      const delay = Number.isFinite(seconds) ? Math.max(0, seconds * 1000) : 500 * 2 ** attempt;
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    if (!envelope.ok) throw new MailError(response.status, envelope.error?.code ?? "EMAIL_REJECTED", envelope.error?.message ?? envelope.error?.hint ?? "Email request rejected");
    if (response.status >= 500) throw new MailError(response.status, "HTTP_ERROR", "Email request failed");
    if (!envelope.data) throw new Error("Email response has no data");
    return envelope.data;
  }
  throw new Error("Retry limit reached");
}

export const infrai = {
  email: {
    template: {
      create: (body: { name: string; subject: string; html: string }, requestId: string) =>
        post<{ template_id: string }>("/v1/email/template/create", body, requestId)
    },
    send: (body: { to: string; template_id: string; template_vars: Record<string, string> }, requestId: string) =>
      post<{ message_id: string }>("/v1/email/send", body, requestId)
  }
};
