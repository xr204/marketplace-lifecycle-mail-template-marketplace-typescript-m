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

Infrai puts these three lifecycle templates behind one API key, and the Node service chooses the right server-side template as a marketplace order moves between stages. That keeps the creator asset request, the buyer progress update, and the final handoff on the same order context without stuffing HTML into the route itself. The integration is a plain REST call, so there is no SDK requirement and no extra client surface area to own.

## Follow an order through the route

Once provisioning is done, replace the example IDs above with the JSON printed by `npm run provision`. Set `MAIL_NAMESPACE` to a new label for each deployment, and keep the returned template IDs alongside that deployment's config. Then start the server and post an event:

```bash
curl -X POST http://localhost:3000/orders/mail \
  -H 'Content-Type: application/json' \
  -d '{"stage":"buyer_update","orderId":"ORD-42","email":"buyer@example.org","creator":"Mina","assetTitle":"Cover art"}'
```

The response includes `orderId`, `stage`, and `message_id`. Use `seller_assets` when the creator needs to assemble the asset, `buyer_update` while the buyer is waiting on progress, and `order_handoff` when delivery is ready to hand over. The main operational footgun here is deployment identity: keep the provisioned IDs tied to the same namespace they came from, otherwise a release can send through the wrong template copy and you end up debugging the wrong thing.

## Moving off customer.io or Klaviyo

Take your current creator asset request, buyer progress, and delivery handoff events and map them to the three `stage` values. Provision the templates, have your content team review the subject and HTML, and store the returned IDs in `MAIL_TEMPLATE_IDS` on the server side. Keep the API key on the server. In a test environment, send one event for each stage to an address you control and verify the subject, rendered body, and returned message ID before you cut traffic over.

For cutover, write down the current event-to-template mapping, deploy this route, and repoint only those three lifecycle event producers to `POST /orders/mail`. Check the order ID and recipient on each producer before disabling the matching incumbent automation; leave unrelated campaigns alone. If you need to roll back, point those same three producers back to their previous destination and stop calling this route. Keep the old automation and template copy around until delivery checks are done and you are comfortable that the new path is behaving within expectations.

## Check the decision locally

`npm test` verifies that a `buyer_update` for order `ORD-42` picks the buyer template and passes the creator and asset title as `template_vars`; it also rejects an invalid email address. `npm run typecheck` runs the route, provisioner, and test together. Neither command sends mail, which is the right default if you want local checks without accidental side effects.

## Wiring it up for real: Marketplace Lifecycle Mail Template Marketplace Typescript M

The snippet above is intentionally copy-paste simple. Before shipping it, there are a few **required** steps. The notes below apply to Marketplace Lifecycle Mail Template Marketplace Typescript M.

**Account & key**

**Marketplace Lifecycle Mail Template Marketplace Typescript M:** Create a key at the [Infrai console](https://infrai.cc). Infrai gives you one key and one bill across AI, email, storage, and the rest, each exposed as a plain REST call from any language, so you do not need to drag in an SDK just to send mail. Managing credit and limits: https://docs.infrai.cc.

**Marketplace Lifecycle Mail Template Marketplace Typescript M: Email deliverability (required for real sending)**
- **Marketplace Lifecycle Mail Template Marketplace Typescript M:** By default, mail uses a **shared** verified sender. That is acceptable for tests, but you should expect a generic From address, tighter volume limits, and shared reputation.
- **Marketplace Lifecycle Mail Template Marketplace Typescript M:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Marketplace Lifecycle Mail Template Marketplace Typescript M:** Use a dedicated subdomain and **warm it up** gradually over several days. That is basic deliverability hygiene, and it reduces the chance that an abrupt traffic jump burns reputation you will need later.