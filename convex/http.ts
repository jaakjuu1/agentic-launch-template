import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/webhooks/clerk",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = await request.json();
    await ctx.runMutation(internal.audit.recordWebhookEvent, {
      payload,
      source: "clerk",
      title: "Clerk webhook received",
    });
    return new Response(JSON.stringify({ ok: true, provider: "clerk" }), {
      headers: { "content-type": "application/json" },
      status: 200,
    });
  }),
});

http.route({
  path: "/webhooks/stripe",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = await request.json();
    await ctx.runMutation(internal.audit.recordWebhookEvent, {
      payload,
      source: "stripe",
      title: "Stripe webhook received",
    });
    return Response.json({ ok: true, provider: "stripe" });
  }),
});

http.route({
  path: "/webhooks/revenuecat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = await request.json();
    await ctx.runMutation(internal.audit.recordWebhookEvent, {
      payload,
      source: "revenuecat",
      title: "RevenueCat webhook received",
    });
    return Response.json({ ok: true, provider: "revenuecat" });
  }),
});

http.route({
  path: "/webhooks/resend",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = await request.json();
    await ctx.runMutation(internal.audit.recordWebhookEvent, {
      payload,
      source: "resend",
      title: "Resend event received",
    });
    return Response.json({ ok: true, provider: "resend" });
  }),
});

export default http;
