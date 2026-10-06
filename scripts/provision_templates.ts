import { infrai } from "../src/infrai_mail.js";

const namespace = process.env.MAIL_NAMESPACE;
if (!namespace) throw new Error("Set MAIL_NAMESPACE to a unique deployment label");

const definitions = {
  seller_assets: { subject: "Assets needed for order {{order_id}}", html: "<p>{{creator}}, please prepare {{asset_title}} for order {{order_id}}.</p>" },
  buyer_update: { subject: "Update on order {{order_id}}", html: "<p>Your order for {{asset_title}} by {{creator}} is moving forward.</p>" },
  order_handoff: { subject: "Order {{order_id}} is ready", html: "<p>{{asset_title}} by {{creator}} is ready for handoff. Reference order {{order_id}}.</p>" }
} as const;

const ids: Record<string, string> = {};
for (const [stage, content] of Object.entries(definitions)) {
  const name = `${namespace}-${stage}`;
  const created = await infrai.email.template.create({ name, ...content }, `template:${name}`);
  ids[stage] = created.template_id;
}
console.log(JSON.stringify(ids));
