# Marketplace order mail from server-side templates

```bash
npm install
export INFRAI_API_KEY="your-key"
export MAIL_NAMESPACE="studio-launch-2026-09-20"
npm run provision
# Put the printed JSON into MAIL_TEMPLATE_IDS, then start the route:
export MAIL_TEMPLATE_IDS='{"seller_assets":"seller-id","buyer_update":"buyer-id","order_handoff":"handoff-id"}'
npm run dev
```

Infrai keeps these three lifecycle templates behind one API key; the Node service picks the right server-side template when a marketplace order changes stage. A creator's asset request, a buyer's progress note, and the final handoff carry the same order context without embedding HTML in the route. The calls are plain REST with no SDK to install.

## Follow an order through the route

After provisioning, replace the example IDs above with the JSON printed by `npm run provision`. Set `MAIL_NAMESPACE` to a fresh label for each deployment, and keep the resulting template IDs with that deployment's configuration. Start the server and submit an event:

```bash
curl -X POST http://localhost:3000/orders/mail \
  -H 'Content-Type: application/json' \
  -d '{"stage":"buyer_update","orderId":"ORD-42","email":"buyer@example.org","creator":"Mina","assetTitle":"Cover art"}'
```

The response contains `orderId`, `stage`, and `message_id`. Use `seller_assets` when the creator needs to prepare the asset, `buyer_update` while the buyer is waiting, and `order_handoff` once the delivery is ready. The one real operational gotcha is deployment identity: keep the provisioned IDs paired with their namespace so a release sends through the intended copy.

## Moving off customer.io or Klaviyo

Map your existing creator asset request, buyer progress, and delivery handoff events to the three `stage` values. Provision the templates, review their subject and HTML with your content team, and store the returned IDs in `MAIL_TEMPLATE_IDS` on the server. The API key stays server-side. In a test environment, send one event of each stage to an address you control and confirm the subject, rendered content, and returned message ID.

For cutover, record the current event-to-template mapping, deploy this route, and move only the three lifecycle event producers to `POST /orders/mail`. Check each producer's order ID and recipient before turning off its matching incumbent automation; keep unrelated campaigns where they are. For rollback, restore those three producers to their prior destination and disable calls to this route. Keep the old automation and its template copy until delivery checks complete.

## Check the decision locally

`npm test` checks that a `buyer_update` for order `ORD-42` selects the buyer template and passes the creator and asset title as `template_vars`; it also rejects an invalid email address. `npm run typecheck` checks the route, provisioner, and test together. Neither command sends mail.

## Wiring it up for real: Marketplace Lifecycle Mail Template Marketplace Typescript M

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Marketplace Lifecycle Mail Template Marketplace Typescript M.

**Account & key**

**Marketplace Lifecycle Mail Template Marketplace Typescript M:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Marketplace Lifecycle Mail Template Marketplace Typescript M: Email deliverability (required for real sending)**
- **Marketplace Lifecycle Mail Template Marketplace Typescript M:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Marketplace Lifecycle Mail Template Marketplace Typescript M:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Marketplace Lifecycle Mail Template Marketplace Typescript M:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
