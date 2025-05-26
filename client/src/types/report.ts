export interface RiskMatrixCell {
  likelihood: number;
  impact: number;
  riskLevel: 'very-low' | 'low' | 'medium' | 'high' | 'critical';
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'risk-assessment' | 'policy-compliance' | 'incident-report' | 'business-impact' | 'vendor-risk';
}

export interface FormStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

export interface CSVData {
  headers: string[];
  rows: string[][];
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'risk-assessment',
    name: 'Risk Assessment Report',
    description: 'Comprehensive evaluation of organizational risks and controls',
    icon: 'shield-alt',
    type: 'risk-assessment'
  },
  {
    id: 'policy-compliance',
    name: 'Policy Compliance Gap Analysis',
    description: 'Analysis of compliance gaps against regulatory frameworks',
    icon: 'clipboard-check',
    type: 'policy-compliance'
  },
  {
    id: 'incident-report',
    name: 'Incident Report',
    description: 'Documentation and analysis of security incidents',
    icon: 'exclamation-triangle',
    type: 'incident-report'
  },
  {
    id: 'business-impact',
    name: 'Business Impact Analysis',
    description: 'Assessment of potential business disruptions and recovery strategies',
    icon: 'chart-line',
    type: 'business-impact'
  },
  {
    id: 'vendor-risk',
    name: 'Vendor Risk Assessment',
    description: 'Evaluation of third-party vendor security and compliance',
    icon: 'handshake',
    type: 'vendor-risk'
  }
];

export const RISK_LEVELS = {
  'very-low': { label: 'Very Low', color: 'bg-green-100 text-green-800', matrixColor: 'bg-green-100' },
  'low': { label: 'Low', color: 'bg-green-100 text-green-800', matrixColor: 'bg-green-200' },
  'medium': { label: 'Medium', color: 'bg-yellow-100 text-yellow-800', matrixColor: 'bg-yellow-200' },
  'high': { label: 'High', color: 'bg-orange-100 text-orange-800', matrixColor: 'bg-orange-300' },
  'critical': { label: 'Critical', color: 'bg-red-100 text-red-800', matrixColor: 'bg-red-400 text-white' }
};

export function calculateRiskLevel(likelihood: number, impact: number): 'very-low' | 'low' | 'medium' | 'high' | 'critical' {
  const score = likelihood * impact;
  
  if (score <= 4) return 'very-low';
  if (score <= 8) return 'low';
  if (score <= 12) return 'medium';
  if (score <= 16) return 'high';
  return 'critical';
}
