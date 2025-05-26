import { users, reports, riskItems, type User, type InsertUser, type Report, type InsertReport, type RiskItem, type InsertRiskItem } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Report operations
  createReport(report: InsertReport): Promise<Report>;
  getReport(id: number): Promise<Report | undefined>;
  updateReport(id: number, data: Partial<InsertReport>): Promise<Report | undefined>;
  getReportsByUserId(userId: number): Promise<Report[]>;
  
  // Risk item operations
  createRiskItem(riskItem: InsertRiskItem): Promise<RiskItem>;
  getRiskItemsByReportId(reportId: number): Promise<RiskItem[]>;
  updateRiskItem(id: number, data: Partial<InsertRiskItem>): Promise<RiskItem | undefined>;
  deleteRiskItem(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private reports: Map<number, Report>;
  private riskItems: Map<number, RiskItem>;
  private currentUserId: number;
  private currentReportId: number;
  private currentRiskItemId: number;

  constructor() {
    this.users = new Map();
    this.reports = new Map();
    this.riskItems = new Map();
    this.currentUserId = 1;
    this.currentReportId = 1;
    this.currentRiskItemId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = this.currentReportId++;
    const now = new Date();
    const report: Report = { 
      ...insertReport, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.reports.set(id, report);
    return report;
  }

  async getReport(id: number): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async updateReport(id: number, data: Partial<InsertReport>): Promise<Report | undefined> {
    const existing = this.reports.get(id);
    if (!existing) return undefined;
    
    const updated: Report = { 
      ...existing, 
      ...data, 
      updatedAt: new Date() 
    };
    this.reports.set(id, updated);
    return updated;
  }

  async getReportsByUserId(userId: number): Promise<Report[]> {
    // For now, return all reports since we don't have user association
    return Array.from(this.reports.values());
  }

  async createRiskItem(insertRiskItem: InsertRiskItem): Promise<RiskItem> {
    const id = this.currentRiskItemId++;
    const riskItem: RiskItem = { ...insertRiskItem, id };
    this.riskItems.set(id, riskItem);
    return riskItem;
  }

  async getRiskItemsByReportId(reportId: number): Promise<RiskItem[]> {
    return Array.from(this.riskItems.values()).filter(
      (item) => item.reportId === reportId
    );
  }

  async updateRiskItem(id: number, data: Partial<InsertRiskItem>): Promise<RiskItem | undefined> {
    const existing = this.riskItems.get(id);
    if (!existing) return undefined;
    
    const updated: RiskItem = { ...existing, ...data };
    this.riskItems.set(id, updated);
    return updated;
  }

  async deleteRiskItem(id: number): Promise<boolean> {
    return this.riskItems.delete(id);
  }
}

export const storage = new MemStorage();
