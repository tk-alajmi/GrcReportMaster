import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, FileText, Share } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { RiskMatrix } from "@/components/risk-matrix";
import { generatePDF } from "@/lib/pdf-generator";
import { RISK_LEVELS, type FormStep } from "@/types/report";
import type { Report, RiskItem, OrganizationData } from "@shared/schema";

export default function ReportPreview() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [reportId, setReportId] = useState<number | null>(null);

  // Get report ID from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('reportId');
    if (id && id !== 'new') {
      setReportId(parseInt(id));
    }
  }, []);

  // Fetch report data
  const { data: report, isLoading: isLoadingReport } = useQuery({
    queryKey: [`/api/reports/${reportId}`],
    enabled: !!reportId,
  });

  // Fetch risk items
  const { data: riskItems = [], isLoading: isLoadingRisks } = useQuery({
    queryKey: [`/api/reports/${reportId}/risk-items`],
    enabled: !!reportId,
  });

  const steps: FormStep[] = [
    { id: 'template', title: 'Select Template', description: 'Choose report type', completed: true, current: false },
    { id: 'organization', title: 'Organization Info', description: 'Company details', completed: true, current: false },
    { id: 'risk', title: 'Risk Assessment', description: 'Evaluate risks', completed: true, current: false },
    { id: 'review', title: 'Review & Export', description: 'Generate report', completed: false, current: true },
  ];

  const handleBack = () => {
    setLocation(`/risk-assessment?reportId=${reportId}`);
  };

  const handleExportPDF = async () => {
    if (!report || !riskItems) {
      toast({
        title: "Error",
        description: "Report data not available for export.",
        variant: "destructive",
      });
      return;
    }

    try {
      const pdfBlob = generatePDF(report, riskItems);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Your report has been exported as PDF.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRiskCounts = () => {
    const counts = {
      'very-low': 0,
      'low': 0,
      'medium': 0,
      'high': 0,
      'critical': 0
    };

    riskItems.forEach((item: RiskItem) => {
      counts[item.riskLevel as keyof typeof counts]++;
    });

    return counts;
  };

  if (!reportId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">No report selected. Please start from the beginning.</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => setLocation("/")}>Go to Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingReport || isLoadingRisks) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex max-w-7xl mx-auto">
          <Sidebar steps={steps} />
          <main className="flex-1 p-6">
            <div className="text-center py-12">Loading report data...</div>
          </main>
        </div>
      </div>
    );
  }

  const orgData = report?.organizationData as OrganizationData;
  const riskCounts = getRiskCounts();
  const totalRisks = riskItems.length;
  const criticalAndHighRisks = riskCounts.critical + riskCounts.high;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex max-w-7xl mx-auto">
        <Sidebar steps={steps} />
        
        <main className="flex-1 p-6">
          <Card className="shadow-sm border border-gray-200">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Report Preview & Export
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Review your completed report and export to PDF
                  </p>
                </div>
                <div className="text-sm text-gray-500">Step 4 of 4</div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* Report Header */}
              <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {report?.title}
                    </h1>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Organization:</strong> {orgData?.name}</p>
                      {orgData?.industry && <p><strong>Industry:</strong> {orgData.industry}</p>}
                      <p><strong>Report Type:</strong> {report?.type?.replace('-', ' ').toUpperCase()}</p>
                      <p><strong>Generated:</strong> {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleExportPDF} className="bg-primary hover:bg-blue-700">
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Executive Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{totalRisks}</div>
                        <div className="text-sm text-gray-600">Total Risks</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{riskCounts.critical}</div>
                        <div className="text-sm text-gray-600">Critical</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{riskCounts.high}</div>
                        <div className="text-sm text-gray-600">High</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{riskCounts.medium}</div>
                        <div className="text-sm text-gray-600">Medium</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Key Findings</h3>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>• {totalRisks} total risk items identified across {Object.keys(riskCounts).length} risk levels</li>
                    <li>• {criticalAndHighRisks} risks require immediate or high-priority attention</li>
                    <li>• {riskCounts.low + riskCounts['very-low']} risks are at acceptable levels with current controls</li>
                    {criticalAndHighRisks > 0 && (
                      <li className="font-medium">• Immediate action recommended for critical and high-risk items</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Risk Matrix */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Risk Matrix Visualization</h2>
                <RiskMatrix />
                
                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                  {Object.entries(riskCounts).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="capitalize">{level.replace('-', ' ')}</span>
                      <Badge className={RISK_LEVELS[level as keyof typeof RISK_LEVELS].color}>
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Details */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Risk Details</h2>
                <div className="space-y-4">
                  {riskItems.map((risk: RiskItem) => (
                    <Card key={risk.id} className="border-l-4" style={{ 
                      borderLeftColor: risk.riskLevel === 'critical' ? '#dc2626' : 
                                      risk.riskLevel === 'high' ? '#ea580c' :
                                      risk.riskLevel === 'medium' ? '#ca8a04' : '#16a34a'
                    }}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-1">{risk.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{risk.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Category: {risk.category}</span>
                              <span>Likelihood: {risk.likelihood}/5</span>
                              <span>Impact: {risk.impact}/5</span>
                              <span>Status: {risk.status}</span>
                            </div>
                            {risk.mitigation && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-700">Mitigation:</p>
                                <p className="text-xs text-gray-600">{risk.mitigation}</p>
                              </div>
                            )}
                          </div>
                          <Badge className={RISK_LEVELS[risk.riskLevel as keyof typeof RISK_LEVELS].color}>
                            {RISK_LEVELS[risk.riskLevel as keyof typeof RISK_LEVELS].label}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommendations</h2>
                <div className="space-y-4">
                  {riskCounts.critical > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-medium text-red-900 mb-2">Critical Priority Actions</h3>
                      <ul className="space-y-1 text-sm text-red-800">
                        {riskItems
                          .filter((risk: RiskItem) => risk.riskLevel === 'critical')
                          .map((risk: RiskItem) => (
                            <li key={risk.id}>• Address "{risk.name}" immediately</li>
                          ))}
                      </ul>
                    </div>
                  )}
                  
                  {riskCounts.high > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h3 className="font-medium text-orange-900 mb-2">High Priority Actions</h3>
                      <ul className="space-y-1 text-sm text-orange-800">
                        {riskItems
                          .filter((risk: RiskItem) => risk.riskLevel === 'high')
                          .map((risk: RiskItem) => (
                            <li key={risk.id}>• Plan mitigation for "{risk.name}"</li>
                          ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">General Recommendations</h3>
                    <ul className="space-y-1 text-sm text-blue-800">
                      <li>• Conduct quarterly risk assessment reviews</li>
                      <li>• Update risk register as new threats emerge</li>
                      <li>• Test incident response procedures regularly</li>
                      <li>• Provide ongoing security awareness training</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-6 border-t">
                <Button type="button" variant="outline" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Risk Assessment
                </Button>
                
                <div className="flex space-x-3">
                  <Button variant="outline">
                    <Share className="w-4 h-4 mr-2" />
                    Share Report
                  </Button>
                  <Button onClick={handleExportPDF} className="bg-primary hover:bg-blue-700">
                    <FileText className="w-4 h-4 mr-2" />
                    Export as PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
