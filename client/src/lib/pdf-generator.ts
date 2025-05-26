import jsPDF from 'jspdf';
import type { Report, OrganizationData, RiskItem } from '@shared/schema';
import { RISK_LEVELS } from '@/types/report';

export class PDFGenerator {
  private doc: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number;
  private yPosition: number;

  constructor() {
    this.doc = new jsPDF();
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.margin = 20;
    this.yPosition = this.margin;
  }

  generateReport(report: Report, riskItems: RiskItem[] = []): Blob {
    this.addCoverPage(report);
    this.addNewPage();
    this.addExecutiveSummary(report, riskItems);
    this.addNewPage();
    this.addRiskMatrix(riskItems);
    this.addNewPage();
    this.addRiskDetails(riskItems);
    this.addNewPage();
    this.addRecommendations(riskItems);

    return new Blob([this.doc.output('blob')], { type: 'application/pdf' });
  }

  private addCoverPage(report: Report) {
    const orgData = report.organizationData as OrganizationData;
    
    // Header
    this.doc.setFontSize(24);
    this.doc.setFont(undefined, 'bold');
    this.addText(report.title, this.pageWidth / 2, 80, 'center');
    
    // Organization info
    this.doc.setFontSize(16);
    this.doc.setFont(undefined, 'normal');
    this.addText(orgData.name, this.pageWidth / 2, 120, 'center');
    
    if (orgData.address) {
      this.addText(orgData.address, this.pageWidth / 2, 140, 'center');
    }
    
    if (orgData.city && orgData.state) {
      this.addText(`${orgData.city}, ${orgData.state} ${orgData.zip || ''}`, this.pageWidth / 2, 160, 'center');
    }

    // Report details
    const reportData = report.reportData as any;
    if (reportData?.period) {
      this.doc.setFontSize(12);
      this.addText(`Report Period: ${reportData.period}`, this.pageWidth / 2, 200, 'center');
    }

    // Date
    this.addText(`Generated: ${new Date().toLocaleDateString()}`, this.pageWidth / 2, 220, 'center');

    // Footer
    this.addText('Confidential & Proprietary', this.pageWidth / 2, this.pageHeight - 30, 'center');
  }

  private addExecutiveSummary(report: Report, riskItems: RiskItem[]) {
    this.addSectionHeader('Executive Summary');
    
    const criticalRisks = riskItems.filter(item => item.riskLevel === 'critical').length;
    const highRisks = riskItems.filter(item => item.riskLevel === 'high').length;
    const totalRisks = riskItems.length;

    this.addText('This report presents a comprehensive risk assessment of the organization\'s');
    this.addText('cybersecurity posture and compliance status.');
    this.addText('');
    this.addText('Key Findings:');
    this.addText(`• Total risks identified: ${totalRisks}`);
    this.addText(`• Critical risks: ${criticalRisks}`);
    this.addText(`• High risks: ${highRisks}`);
    this.addText('');
    
    if (criticalRisks > 0) {
      this.addText('Immediate attention is required for critical risk items to ensure');
      this.addText('organizational security and compliance.');
    } else {
      this.addText('No critical risks identified. Focus on high and medium risks');
      this.addText('for continued improvement.');
    }
  }

  private addRiskMatrix(riskItems: RiskItem[]) {
    this.addSectionHeader('Risk Matrix');
    
    // Simple text-based matrix representation
    this.addText('Risk Distribution:');
    this.addText('');
    
    const riskCounts = {
      'very-low': 0,
      'low': 0,
      'medium': 0,
      'high': 0,
      'critical': 0
    };

    riskItems.forEach(item => {
      riskCounts[item.riskLevel as keyof typeof riskCounts]++;
    });

    Object.entries(riskCounts).forEach(([level, count]) => {
      const label = RISK_LEVELS[level as keyof typeof RISK_LEVELS].label;
      this.addText(`${label}: ${count} risk(s)`);
    });
  }

  private addRiskDetails(riskItems: RiskItem[]) {
    this.addSectionHeader('Risk Details');
    
    riskItems.forEach((item, index) => {
      if (this.yPosition > this.pageHeight - 60) {
        this.addNewPage();
      }
      
      this.doc.setFont(undefined, 'bold');
      this.addText(`${index + 1}. ${item.name}`);
      this.doc.setFont(undefined, 'normal');
      
      if (item.description) {
        this.addText(`Description: ${item.description}`);
      }
      
      this.addText(`Category: ${item.category}`);
      this.addText(`Risk Level: ${RISK_LEVELS[item.riskLevel as keyof typeof RISK_LEVELS].label}`);
      this.addText(`Likelihood: ${item.likelihood}/5`);
      this.addText(`Impact: ${item.impact}/5`);
      
      if (item.mitigation) {
        this.addText(`Mitigation: ${item.mitigation}`);
      }
      
      this.addText('');
    });
  }

  private addRecommendations(riskItems: RiskItem[]) {
    this.addSectionHeader('Recommendations');
    
    const criticalRisks = riskItems.filter(item => item.riskLevel === 'critical');
    const highRisks = riskItems.filter(item => item.riskLevel === 'high');
    
    this.addText('Priority Actions:');
    this.addText('');
    
    if (criticalRisks.length > 0) {
      this.addText('1. Address Critical Risks Immediately:');
      criticalRisks.forEach(risk => {
        this.addText(`   • ${risk.name}`);
      });
      this.addText('');
    }
    
    if (highRisks.length > 0) {
      this.addText('2. Plan Mitigation for High Risks:');
      highRisks.forEach(risk => {
        this.addText(`   • ${risk.name}`);
      });
      this.addText('');
    }
    
    this.addText('3. Regular Review and Updates:');
    this.addText('   • Conduct quarterly risk assessments');
    this.addText('   • Update risk register as new threats emerge');
    this.addText('   • Review and test incident response procedures');
  }

  private addSectionHeader(title: string) {
    if (this.yPosition > this.pageHeight - 40) {
      this.addNewPage();
    }
    
    this.doc.setFontSize(16);
    this.doc.setFont(undefined, 'bold');
    this.addText(title);
    this.doc.setFontSize(12);
    this.doc.setFont(undefined, 'normal');
    this.addText('');
  }

  private addText(text: string, x?: number, y?: number, align: 'left' | 'center' | 'right' = 'left') {
    const xPos = x || this.margin;
    const yPos = y || this.yPosition;
    
    if (align === 'center') {
      this.doc.text(text, xPos, yPos, { align: 'center' });
    } else if (align === 'right') {
      this.doc.text(text, xPos, yPos, { align: 'right' });
    } else {
      this.doc.text(text, xPos, yPos);
    }
    
    if (!y) {
      this.yPosition += 15;
    }
  }

  private addNewPage() {
    this.doc.addPage();
    this.yPosition = this.margin;
  }
}

export function generatePDF(report: Report, riskItems: RiskItem[] = []): Blob {
  const generator = new PDFGenerator();
  return generator.generateReport(report, riskItems);
}
