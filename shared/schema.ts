import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Users ─────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Business profile ──────────────────────────────────────────
export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  name: text("name").notNull().default("My Business"),
  description: text("description").default(""),
  googlePlaceId: text("google_place_id").default(""),
  yelpUrl: text("yelp_url").default(""),
  facebookUrl: text("facebook_url").default(""),
  trustpilotUrl: text("trustpilot_url").default(""),
  tripadvisorUrl: text("tripadvisor_url").default(""),
  deliveryMethod: text("delivery_method").notNull().default("email"),
  scheduleTiming: text("schedule_timing").notNull().default("immediate"),
  smsTemplate: text("sms_template").default("Hi {name}! Thanks for choosing {business}. We'd love your feedback! {link}"),
  emailSubject: text("email_subject").default("We'd love your feedback!"),
  responseStyle: text("response_style").notNull().default("professional"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Customers ─────────────────────────────────────────────────
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Review requests ───────────────────────────────────────────
export const reviewRequests = pgTable("review_requests", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  customerId: integer("customer_id"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  method: text("method").notNull().default("email"), // email | sms | both
  status: text("status").notNull().default("pending"), // pending | sent | opened | reviewed
  platform: text("platform").notNull().default("Google"),
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Templates ─────────────────────────────────────────────────
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull().default("General"),
  emailSubject: text("email_subject").notNull(),
  emailBody: text("email_body").notNull(),
  smsBody: text("sms_body").default(""),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── QR Codes ──────────────────────────────────────────────────
export const qrCodes = pgTable("qr_codes", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  name: text("name").notNull(),
  platform: text("platform").notNull().default("Google"),
  style: text("style").notNull().default("standard"),
  size: text("size").notNull().default("medium"),
  customText: text("custom_text").default("Scan to Review Us!"),
  includeText: boolean("include_text").notNull().default(true),
  scans: integer("scans").notNull().default(0),
  reviews: integer("reviews").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Reviews (manually synced / added) ─────────────────────────
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  customerName: text("customer_name").notNull(),
  rating: integer("rating").notNull(),
  text: text("text").notNull(),
  platform: text("platform").notNull(),
  sentiment: text("sentiment").notNull().default("neutral"),
  responded: boolean("responded").notNull().default(false),
  response: text("response"),
  keywords: jsonb("keywords").default([]),
  emotions: jsonb("emotions").default([]),
  reviewDate: text("review_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Types ─────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Business = typeof businesses.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;
export type ReviewRequest = typeof reviewRequests.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;
export type QrCode = typeof qrCodes.$inferSelect;
export type InsertQrCode = typeof qrCodes.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// ── Insert schemas ─────────────────────────────────────────────
export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  email: z.string().email().optional(),
});

export const insertCustomerSchema = z.object({ name: z.string().min(1), email: z.string().email().optional(), phone: z.string().optional() });
export const insertTemplateSchema = z.object({ name: z.string().min(1), category: z.string().optional(), emailSubject: z.string(), emailBody: z.string(), smsBody: z.string().optional(), isDefault: z.boolean().optional() });
export const insertQrCodeSchema = z.object({ name: z.string().min(1), platform: z.string().optional(), style: z.string().optional(), size: z.string().optional(), customText: z.string().optional(), includeText: z.boolean().optional() });
export const insertReviewSchema = z.object({ customerName: z.string(), rating: z.number(), text: z.string(), platform: z.string(), reviewDate: z.string().optional() });
