import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertReportSchema, insertRiskItemSchema, organizationSchema, reportDetailsSchema } from "@shared/schema";
import { z } from "zod";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Create a new report
  app.post("/api/reports", async (req, res) => {
    try {
      const validatedData = insertReportSchema.parse(req.body);
      const report = await storage.createReport(validatedData);
      res.json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create report" });
      }
    }
  });

  // Get report by ID
  app.get("/api/reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const report = await storage.getReport(id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to get report" });
    }
  });

  // Update report
  app.patch("/api/reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertReportSchema.partial().parse(req.body);
      const report = await storage.updateReport(id, validatedData);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update report" });
      }
    }
  });

  // Get all reports
  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await storage.getReportsByUserId(1); // Mock user ID
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to get reports" });
    }
  });

  // Create risk item
  app.post("/api/risk-items", async (req, res) => {
    try {
      const validatedData = insertRiskItemSchema.parse(req.body);
      const riskItem = await storage.createRiskItem(validatedData);
      res.json(riskItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create risk item" });
      }
    }
  });

  // Get risk items for a report
  app.get("/api/reports/:reportId/risk-items", async (req, res) => {
    try {
      const reportId = parseInt(req.params.reportId);
      const riskItems = await storage.getRiskItemsByReportId(reportId);
      res.json(riskItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to get risk items" });
    }
  });

  // Update risk item
  app.patch("/api/risk-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertRiskItemSchema.partial().parse(req.body);
      const riskItem = await storage.updateRiskItem(id, validatedData);
      if (!riskItem) {
        return res.status(404).json({ message: "Risk item not found" });
      }
      res.json(riskItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update risk item" });
      }
    }
  });

  // Delete risk item
  app.delete("/api/risk-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteRiskItem(id);
      if (!deleted) {
        return res.status(404).json({ message: "Risk item not found" });
      }
      res.json({ message: "Risk item deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete risk item" });
    }
  });

  // File upload for logos
  app.post("/api/upload/logo", upload.single("logo"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // In a real app, you'd save to a file storage service
      // For now, return a mock URL
      const logoUrl = `/uploads/logos/${Date.now()}-${req.file.originalname}`;
      res.json({ logoUrl });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload logo" });
    }
  });

  // CSV file upload
  app.post("/api/upload/csv", upload.single("csv"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const csvData = req.file.buffer.toString('utf-8');
      res.json({ data: csvData });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload CSV" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
