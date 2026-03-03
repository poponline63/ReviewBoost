import { Express, Request } from "express";
import QRCode from "qrcode";
import * as storage from "./storage";
import { sendReviewRequestEmail } from "./email";
import { generateReviewResponse, analyzeSentiment, extractKeywords } from "./ai";

function uid(req: Request): number {
  return (req.user as Express.User).id;
}

export function registerRoutes(app: Express) {

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  // ── Business ────────────────────────────────────────────────
  app.get("/api/business", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const biz = await storage.getBusiness(uid(req));
    res.json(biz);
  });

  app.patch("/api/business", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const biz = await storage.updateBusiness(uid(req), req.body);
    res.json(biz);
  });

  // ── Customers ───────────────────────────────────────────────
  app.get("/api/customers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const list = await storage.getCustomers(uid(req));
    res.json(list);
  });

  app.post("/api/customers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { name, email, phone } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });
    const c = await storage.addCustomer(uid(req), { name, email, phone });
    res.status(201).json(c);
  });

  app.delete("/api/customers/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteCustomer(uid(req), Number(req.params.id));
    res.sendStatus(204);
  });

  // ── Review Requests ─────────────────────────────────────────
  app.get("/api/requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const list = await storage.getReviewRequests(uid(req));
    res.json(list);
  });

  app.post("/api/requests/send", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { customerIds, method, platform, scheduleTiming } = req.body;
    const biz = await storage.getBusiness(uid(req));
    if (!biz) return res.status(400).json({ message: "Business not found" });

    const reviewLink = biz.googlePlaceId
      ? `https://search.google.com/local/writereview?placeid=${biz.googlePlaceId}`
      : "#";

    const customers = await storage.getCustomers(uid(req));
    const selected = customers.filter(c => customerIds.includes(c.id));

    const results = await Promise.all(
      selected.map(async customer => {
        const request = await storage.createReviewRequest(uid(req), {
          customerName: customer.name,
          customerEmail: customer.email ?? undefined,
          customerPhone: customer.phone ?? undefined,
          method,
          platform: platform ?? "Google",
          customerId: customer.id,
        });

        // Send email if method includes email
        if ((method === "email" || method === "both") && customer.email) {
          try {
            await sendReviewRequestEmail({
              toEmail: customer.email,
              customerName: customer.name,
              businessName: biz.name,
              reviewLink,
              subject: biz.emailSubject ?? "We'd love your feedback!",
              body: biz.smsTemplate ?? "Hi {name}, thanks for choosing {business}. {link}",
            });
          } catch (err) {
            console.error("Email send failed:", err);
          }
        }

        return request;
      })
    );

    res.json({ sent: results.length, requests: results });
  });

  // ── Templates ───────────────────────────────────────────────
  app.get("/api/templates", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(await storage.getTemplates(uid(req)));
  });

  app.post("/api/templates", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const t = await storage.createTemplate(uid(req), req.body);
    res.status(201).json(t);
  });

  app.patch("/api/templates/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const t = await storage.updateTemplate(uid(req), Number(req.params.id), req.body);
    res.json(t);
  });

  app.post("/api/templates/:id/set-default", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.setDefaultTemplate(uid(req), Number(req.params.id));
    res.sendStatus(204);
  });

  app.delete("/api/templates/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteTemplate(uid(req), Number(req.params.id));
    res.sendStatus(204);
  });

  // ── QR Codes ────────────────────────────────────────────────
  app.get("/api/qrcodes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(await storage.getQrCodes(uid(req)));
  });

  app.post("/api/qrcodes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const biz = await storage.getBusiness(uid(req));
    const qr = await storage.createQrCode(uid(req), req.body);
    res.status(201).json(qr);
  });

  app.get("/api/qrcodes/:id/image", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const codes = await storage.getQrCodes(uid(req));
    const qr = codes.find(q => q.id === Number(req.params.id));
    if (!qr) return res.sendStatus(404);

    const biz = await storage.getBusiness(uid(req));
    const link = biz?.googlePlaceId
      ? `https://search.google.com/local/writereview?placeid=${biz.googlePlaceId}`
      : `https://reviewboost.app/review/${qr.id}`;

    const png = await QRCode.toBuffer(link, {
      width: qr.size === "small" ? 200 : qr.size === "large" ? 800 : qr.size === "xlarge" ? 1200 : 400,
      color: { dark: "#000000", light: "#ffffff" },
    });

    res.set("Content-Type", "image/png");
    res.send(png);
  });

  app.delete("/api/qrcodes/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteQrCode(uid(req), Number(req.params.id));
    res.sendStatus(204);
  });

  // ── Reviews ─────────────────────────────────────────────────
  app.get("/api/reviews", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(await storage.getReviews(uid(req)));
  });

  app.post("/api/reviews", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { customerName, rating, text, platform, reviewDate } = req.body;
    if (!customerName || !rating || !text || !platform) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const sentiment = analyzeSentiment(text, Number(rating));
    const keywords = extractKeywords(text);
    const review = await storage.addReview(uid(req), {
      customerName, rating: Number(rating), text, platform,
      sentiment, keywords, reviewDate: reviewDate ?? new Date().toISOString().split("T")[0],
    });
    res.status(201).json(review);
  });

  app.post("/api/reviews/:id/generate-response", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const reviews = await storage.getReviews(uid(req));
    const review = reviews.find(r => r.id === Number(req.params.id));
    if (!review) return res.sendStatus(404);

    const biz = await storage.getBusiness(uid(req));
    const response = await generateReviewResponse({
      customerName: review.customerName,
      rating: review.rating,
      reviewText: review.text,
      businessName: biz?.name ?? "Our Business",
      businessDescription: biz?.description ?? "",
      style: (biz?.responseStyle as "professional" | "friendly" | "formal") ?? "professional",
    });

    res.json({ response });
  });

  app.patch("/api/reviews/:id/respond", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { response } = req.body;
    const review = await storage.updateReview(uid(req), Number(req.params.id), {
      response, responded: true,
    });
    res.json(review);
  });

  // ── Stats ───────────────────────────────────────────────────
  app.get("/api/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const [allReviews, allRequests] = await Promise.all([
      storage.getReviews(uid(req)),
      storage.getReviewRequests(uid(req)),
    ]);

    const avgRating = allReviews.length > 0
      ? (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1)
      : "0";

    const platformBreakdown: Record<string, number> = {};
    allReviews.forEach(r => { platformBreakdown[r.platform] = (platformBreakdown[r.platform] ?? 0) + 1; });

    res.json({
      totalReviews: allReviews.length,
      totalRequests: allRequests.length,
      avgRating,
      responseRate: allReviews.length > 0
        ? Math.round((allReviews.filter(r => r.responded).length / allReviews.length) * 100)
        : 0,
      positiveReviews: allReviews.filter(r => r.rating >= 4).length,
      negativeReviews: allReviews.filter(r => r.rating <= 2).length,
      neutralReviews: allReviews.filter(r => r.rating === 3).length,
      sentimentScore: allReviews.length > 0
        ? Math.round((allReviews.filter(r => r.rating >= 4).length / allReviews.length) * 100)
        : 0,
      platformBreakdown,
    });
  });
}
