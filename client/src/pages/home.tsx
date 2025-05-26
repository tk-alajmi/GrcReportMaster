import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { REPORT_TEMPLATES } from "@/types/report";

export default function Home() {
  const [, setLocation] = useLocation();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleContinue = () => {
    if (selectedTemplate) {
      setLocation(`/organization?template=${selectedTemplate}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            GRC Report Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create professional Governance, Risk, and Compliance reports with automated risk matrices and expert recommendations.
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Select Report Template</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {REPORT_TEMPLATES.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate === template.id
                    ? "ring-2 ring-primary border-primary"
                    : "hover:border-gray-300"
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <i className={`fas fa-${template.icon} text-primary`} />
                    </div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedTemplate}
            size="lg"
            className="px-8"
          >
            Continue with Selected Template
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-magic text-blue-600 text-xl" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Automated Generation</h3>
            <p className="text-gray-600 text-sm">
              Intelligent risk matrices and recommendations based on your inputs
            </p>
          </div>
          <div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-file-pdf text-green-600 text-xl" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Professional Export</h3>
            <p className="text-gray-600 text-sm">
              Export to PDF, Word, or HTML with customizable branding
            </p>
          </div>
          <div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-shield-alt text-purple-600 text-xl" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Privacy Focused</h3>
            <p className="text-gray-600 text-sm">
              No data storage by default - your information stays private
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
