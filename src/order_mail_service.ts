import { createServer } from "node:http";
import { z } from "zod";
import { infrai, MailError } from "./infrai_mail.js";

export const orderEvent = z.discriminatedUnion("stage", [
  z.object({ stage: z.literal("seller_assets"), orderId: z.string().min(1), email: z.string().email(), creator: z.string().min(1), assetTitle: z.string().min(1) }),
  z.object({ stage: z.literal("buyer_update"), orderId: z.string().min(1), email: z.string().email(), creator: z.string().min(1), assetTitle: z.string().min(1) }),
  z.object({ stage: z.literal("order_handoff"), orderId: z.string().min(1), email: z.string().email(), creator: z.string().min(1), assetTitle: z.string().min(1) })
]);
export type OrderEvent = z.infer<typeof orderEvent>;
export type Stage = OrderEvent["stage"];

export function selectMail(event: OrderEvent, templates: Record<Stage, string>) {
  return {
    to: event.email,
    template_id: templates[event.stage],
    template_vars: { order_id: event.orderId, creator: event.creator, asset_title: event.assetTitle },
    requestId: `marketplace:${event.orderId}:${event.stage}`
  };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const templates = z.object({ seller_assets: z.string().min(1), buyer_update: z.string().min(1), order_handoff: z.string().min(1) })
    .parse(JSON.parse(process.env.MAIL_TEMPLATE_IDS ?? "{}"));
  const server = createServer(async (req, res) => {
    if (req.method !== "POST" || req.url !== "/orders/mail") {
      res.writeHead(404).end();
      return;
    }
    try {
      let raw = "";
      for await (const part of req) raw += part;
      const event = orderEvent.parse(JSON.parse(raw));
      const { requestId, ...body } = selectMail(event, templates);
      const sent = await infrai.email.send(body, requestId);
      res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ orderId: event.orderId, stage: event.stage, message_id: sent.message_id }));
    } catch (error) {
      const status = error instanceof z.ZodError || error instanceof SyntaxError ? 400 : error instanceof MailError ? (error.status >= 400 && error.status < 500 ? error.status : 502) : 502;
      res.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify({ error: error instanceof MailError ? error.code : status === 400 ? "INVALID_INPUT" : "DELIVERY_ERROR" }));
    }
  });
  server.listen(Number(process.env.PORT ?? 3000), () => console.log(`Order mail listening on ${process.env.PORT ?? 3000}`));
}
