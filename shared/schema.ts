import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // "risk-assessment", "policy-compliance", "incident-report", etc.
  organizationData: jsonb("organization_data").notNull(),
  riskData: jsonb("risk_data"),
  reportData: jsonb("report_data"),
  status: text("status").notNull().default("draft"), // "draft", "completed"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const riskItems = pgTable("risk_items", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").references(() => reports.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  likelihood: integer("likelihood").notNull(), // 1-5
  impact: integer("impact").notNull(), // 1-5
  riskLevel: text("risk_level").notNull(), // "very-low", "low", "medium", "high", "critical"
  mitigation: text("mitigation"),
  status: text("status").notNull().default("open"), // "open", "mitigated", "accepted"
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRiskItemSchema = createInsertSchema(riskItems).omit({
  id: true,
});

export const organizationSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  industry: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  size: z.string().optional(),
  framework: z.string().optional(),
  logoUrl: z.string().optional(),
});

export const reportDetailsSchema = z.object({
  title: z.string().min(1, "Report title is required"),
  period: z.string().min(1, "Report period is required"),
  type: z.string().min(1, "Report type is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertRiskItem = z.infer<typeof insertRiskItemSchema>;
export type RiskItem = typeof riskItems.$inferSelect;
export type OrganizationData = z.infer<typeof organizationSchema>;
export type ReportDetails = z.infer<typeof reportDetailsSchema>;
