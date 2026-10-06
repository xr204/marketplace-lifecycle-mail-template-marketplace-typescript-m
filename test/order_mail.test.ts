import assert from "node:assert/strict";
import { test } from "node:test";
import { orderEvent, selectMail } from "../src/order_mail_service.js";

test("buyer progress chooses buyer template and keeps asset context", () => {
  const event = orderEvent.parse({ stage: "buyer_update", orderId: "ORD-42", email: "buyer@example.org", creator: "Mina", assetTitle: "Cover art" });
  const mail = selectMail(event, { seller_assets: "seller-id", buyer_update: "buyer-id", order_handoff: "handoff-id" });
  assert.deepEqual(mail, {
    to: "buyer@example.org", template_id: "buyer-id",
    template_vars: { order_id: "ORD-42", creator: "Mina", asset_title: "Cover art" },
    requestId: "marketplace:ORD-42:buyer_update"
  });
  assert.equal(orderEvent.safeParse({ ...event, email: "bad-address" }).success, false);
});
