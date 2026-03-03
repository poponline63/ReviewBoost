import { db } from "./db";
import {
  users, businesses, customers, reviewRequests, templates, qrCodes, reviews,
  type User, type Business, type Customer, type ReviewRequest,
  type Template, type InsertTemplate, type QrCode, type InsertQrCode,
  type Review, type InsertReview,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  const { timingSafeEqual } = await import("crypto");
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// ── Users ─────────────────────────────────────────────────────
export async function getUserById(id: number): Promise<User | undefined> {
  const [u] = await db.select().from(users).where(eq(users.id, id));
  return u;
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const [u] = await db.select().from(users).where(eq(users.username, username));
  return u;
}

export async function createUser(data: { username: string; password: string; email?: string }): Promise<User> {
  const [u] = await db.insert(users).values({
    username: data.username,
    password: await hashPassword(data.password),
    email: data.email,
  }).returning();

  // Create default business profile
  await db.insert(businesses).values({ userId: u.id, name: "My Business" });

  // Seed default templates
  await seedDefaultTemplates(u.id);

  return u;
}

async function getBusinessIdForUser(userId: number): Promise<number> {
  const [b] = await db.select().from(businesses).where(eq(businesses.userId, userId));
  if (!b) throw new Error("Business not found");
  return b.id;
}

// ── Business ──────────────────────────────────────────────────
export async function getBusiness(userId: number): Promise<Business | undefined> {
  const [b] = await db.select().from(businesses).where(eq(businesses.userId, userId));
  return b;
}

export async function updateBusiness(userId: number, data: Partial<Business>): Promise<Business> {
  const [b] = await db.update(businesses)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(businesses.userId, userId))
    .returning();
  return b;
}

// ── Customers ─────────────────────────────────────────────────
export async function getCustomers(userId: number): Promise<Customer[]> {
  const bid = await getBusinessIdForUser(userId);
  return db.select().from(customers).where(eq(customers.businessId, bid)).orderBy(desc(customers.createdAt));
}

export async function addCustomer(userId: number, data: { name: string; email?: string; phone?: string }): Promise<Customer> {
  const bid = await getBusinessIdForUser(userId);
  const [c] = await db.insert(customers).values({ businessId: bid, name: data.name, email: data.email, phone: data.phone }).returning();
  return c;
}

export async function deleteCustomer(userId: number, customerId: number): Promise<void> {
  const bid = await getBusinessIdForUser(userId);
  await db.delete(customers).where(and(eq(customers.id, customerId), eq(customers.businessId, bid)));
}

// ── Review Requests ───────────────────────────────────────────
export async function getReviewRequests(userId: number): Promise<ReviewRequest[]> {
  const bid = await getBusinessIdForUser(userId);
  return db.select().from(reviewRequests).where(eq(reviewRequests.businessId, bid)).orderBy(desc(reviewRequests.createdAt));
}

export async function createReviewRequest(userId: number, data: {
  customerName: string; customerEmail?: string; customerPhone?: string;
  method: string; platform: string; customerId?: number;
}): Promise<ReviewRequest> {
  const bid = await getBusinessIdForUser(userId);
  const [r] = await db.insert(reviewRequests).values({
    businessId: bid,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
    method: data.method,
    platform: data.platform,
    customerId: data.customerId,
    status: "sent",
    sentAt: new Date(),
  }).returning();
  return r;
}

// ── Templates ─────────────────────────────────────────────────
export async function getTemplates(userId: number): Promise<Template[]> {
  const bid = await getBusinessIdForUser(userId);
  return db.select().from(templates).where(eq(templates.businessId, bid)).orderBy(templates.createdAt);
}

export async function createTemplate(userId: number, data: InsertTemplate): Promise<Template> {
  const bid = await getBusinessIdForUser(userId);
  const [t] = await db.insert(templates).values({
    businessId: bid,
    name: data.name,
    category: data.category ?? "General",
    emailSubject: data.emailSubject,
    emailBody: data.emailBody,
    smsBody: data.smsBody,
    isDefault: data.isDefault ?? false,
  }).returning();
  return t;
}

export async function updateTemplate(userId: number, templateId: number, data: Partial<Template>): Promise<Template> {
  const bid = await getBusinessIdForUser(userId);
  const [t] = await db.update(templates)
    .set(data)
    .where(and(eq(templates.id, templateId), eq(templates.businessId, bid)))
    .returning();
  return t;
}

export async function setDefaultTemplate(userId: number, templateId: number): Promise<void> {
  const bid = await getBusinessIdForUser(userId);
  await db.update(templates).set({ isDefault: false }).where(eq(templates.businessId, bid));
  await db.update(templates).set({ isDefault: true }).where(and(eq(templates.id, templateId), eq(templates.businessId, bid)));
}

export async function deleteTemplate(userId: number, templateId: number): Promise<void> {
  const bid = await getBusinessIdForUser(userId);
  await db.delete(templates).where(and(eq(templates.id, templateId), eq(templates.businessId, bid)));
}

// ── QR Codes ──────────────────────────────────────────────────
export async function getQrCodes(userId: number): Promise<QrCode[]> {
  const bid = await getBusinessIdForUser(userId);
  return db.select().from(qrCodes).where(eq(qrCodes.businessId, bid)).orderBy(desc(qrCodes.createdAt));
}

export async function createQrCode(userId: number, data: InsertQrCode): Promise<QrCode> {
  const bid = await getBusinessIdForUser(userId);
  const [q] = await db.insert(qrCodes).values({
    businessId: bid,
    name: data.name,
    platform: data.platform ?? "Google",
    style: data.style ?? "standard",
    size: data.size ?? "medium",
    customText: data.customText,
    includeText: data.includeText ?? true,
  }).returning();
  return q;
}

export async function deleteQrCode(userId: number, qrId: number): Promise<void> {
  const bid = await getBusinessIdForUser(userId);
  await db.delete(qrCodes).where(and(eq(qrCodes.id, qrId), eq(qrCodes.businessId, bid)));
}

// ── Reviews ───────────────────────────────────────────────────
export async function getReviews(userId: number): Promise<Review[]> {
  const bid = await getBusinessIdForUser(userId);
  return db.select().from(reviews).where(eq(reviews.businessId, bid)).orderBy(desc(reviews.createdAt));
}

export async function addReview(userId: number, data: Omit<InsertReview, 'businessId'>): Promise<Review> {
  const bid = await getBusinessIdForUser(userId);
  const [r] = await db.insert(reviews).values({
    businessId: bid,
    customerName: data.customerName,
    rating: data.rating,
    text: data.text,
    platform: data.platform,
    sentiment: data.sentiment ?? "neutral",
    keywords: data.keywords ?? [],
    emotions: data.emotions ?? [],
    reviewDate: data.reviewDate,
    responded: false,
  }).returning();
  return r;
}

export async function updateReview(userId: number, reviewId: number, data: Partial<Review>): Promise<Review> {
  const bid = await getBusinessIdForUser(userId);
  const [r] = await db.update(reviews)
    .set(data)
    .where(and(eq(reviews.id, reviewId), eq(reviews.businessId, bid)))
    .returning();
  return r;
}

// ── Seed default templates ────────────────────────────────────
async function seedDefaultTemplates(userId: number): Promise<void> {
  const bid = await getBusinessIdForUser(userId);
  const defaultTemplates = [
    {
      name: "Restaurant Thank You",
      category: "Restaurant",
      emailSubject: "Thanks for dining with us!",
      emailBody: "Hi {name},\n\nThank you for dining at {business}! We hope you enjoyed your meal.\n\nIf you had a great experience, we'd be grateful if you could share it with others:\n\n{link}\n\nWe look forward to serving you again!\n\n{business}",
      smsBody: "Thanks for dining at {business}, {name}! Loved your meal? Share your experience: {link}",
      isDefault: true,
    },
    {
      name: "Professional Service Follow-up",
      category: "Professional Services",
      emailSubject: "How was your experience with {business}?",
      emailBody: "Hi {name},\n\nThank you for choosing {business}. We hope you had a great experience.\n\nWould you mind taking a moment to share your feedback?\n\n{link}\n\nThank you!\n\n{business} Team",
      smsBody: "Hi {name}! Thanks for choosing {business}. We'd love your feedback! {link}",
      isDefault: false,
    },
    {
      name: "E-commerce Order Delivered",
      category: "E-commerce",
      emailSubject: "How do you like your order from {business}?",
      emailBody: "Hi {name},\n\nYour order has been delivered! We hope you're loving your purchase from {business}.\n\nWould you take 30 seconds to let us know how we did?\n\n{link}\n\nThank you!\n\n{business}",
      smsBody: "Hi {name}! Got your order from {business}? Love it? Leave us a quick review: {link}",
      isDefault: false,
    },
  ];

  for (const t of defaultTemplates) {
    await db.insert(templates).values({ businessId: bid, ...t });
  }
}
