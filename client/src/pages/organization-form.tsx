import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { FileUpload } from "@/components/file-upload";
import { CSVUpload } from "@/components/csv-upload";
import { RiskMatrix } from "@/components/risk-matrix";
import { useFormPersistence } from "@/hooks/use-form-persistence";
import { apiRequest } from "@/lib/queryClient";
import { organizationSchema, reportDetailsSchema, type OrganizationData, type ReportDetails } from "@shared/schema";
import type { FormStep } from "@/types/report";

const formSchema = z.object({
  organization: organizationSchema,
  report: reportDetailsSchema,
});

type FormData = z.infer<typeof formSchema>;

export default function OrganizationForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [uploadedLogo, setUploadedLogo] = useState<File | null>(null);
  const [currentReportId, setCurrentReportId] = useState<number | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organization: {
        name: "",
        industry: "",
        contact: "",
        email: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        size: "",
        framework: "",
        logoUrl: "",
      },
      report: {
        title: "",
        period: "",
        type: "risk-assessment",
      },
    },
  });

  const { save: saveToStorage, load: loadFromStorage } = useFormPersistence(
    "grc-organization-form",
    form.watch()
  );

  // Load saved data on mount
  useEffect(() => {
    const savedData = loadFromStorage();
    if (savedData) {
      form.reset(savedData);
    }
    
    // Get template from URL
    const params = new URLSearchParams(window.location.search);
    const template = params.get('template');
    if (template) {
      form.setValue('report.type', template);
    }
  }, [form, loadFromStorage]);

  const createReportMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/reports", {
        title: data.report.title,
        type: data.report.type,
        organizationData: data.organization,
        reportData: data.report,
        status: "draft",
      });
      return response.json();
    },
    onSuccess: (report) => {
      setCurrentReportId(report.id);
      toast({
        title: "Report Created",
        description: "Your report has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);
      const response = await apiRequest("POST", "/api/upload/logo", formData);
      return response.json();
    },
    onSuccess: (data) => {
      form.setValue("organization.logoUrl", data.logoUrl);
      toast({
        title: "Logo Uploaded",
        description: "Your company logo has been uploaded successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    },
  });

  const steps: FormStep[] = [
    { id: 'template', title: 'Select Template', description: 'Choose report type', completed: true, current: false },
    { id: 'organization', title: 'Organization Info', description: 'Company details', completed: false, current: true },
    { id: 'risk', title: 'Risk Assessment', description: 'Evaluate risks', completed: false, current: false },
    { id: 'review', title: 'Review & Export', description: 'Generate report', completed: false, current: false },
  ];

  const handleLogoUpload = (file: File) => {
    setUploadedLogo(file);
    uploadLogoMutation.mutate(file);
  };

  const handleLogoRemove = () => {
    setUploadedLogo(null);
    form.setValue("organization.logoUrl", "");
  };

  const handleSave = () => {
    saveToStorage();
    toast({
      title: "Progress Saved",
      description: "Your form data has been saved locally.",
    });
  };

  const handleBack = () => {
    setLocation("/");
  };

  const onSubmit = (data: FormData) => {
    createReportMutation.mutate(data);
    // On success, navigate to risk assessment
    if (currentReportId || createReportMutation.isSuccess) {
      setLocation(`/risk-assessment?reportId=${currentReportId || 'new'}`);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'save':
        handleSave();
        break;
      case 'load-previous':
        const savedData = loadFromStorage();
        if (savedData) {
          form.reset(savedData);
          toast({
            title: "Data Loaded",
            description: "Previous form data has been restored.",
          });
        } else {
          toast({
            title: "No Saved Data",
            description: "No previous form data found.",
            variant: "destructive",
          });
        }
        break;
      case 'sample-data':
        // Fill with sample data
        form.setValue('organization.name', 'TechCorp Solutions LLC');
        form.setValue('organization.industry', 'technology');
        form.setValue('organization.contact', 'Sarah Johnson');
        form.setValue('organization.email', 'sarah.johnson@techcorp.com');
        form.setValue('organization.address', '123 Innovation Drive, Suite 500');
        form.setValue('organization.city', 'San Francisco');
        form.setValue('organization.state', 'CA');
        form.setValue('organization.zip', '94105');
        form.setValue('organization.size', 'small');
        form.setValue('organization.framework', 'iso27001');
        form.setValue('report.title', 'Cybersecurity Risk Assessment Q1 2024');
        form.setValue('report.period', 'Q1 2024 (January - March)');
        toast({
          title: "Sample Data Loaded",
          description: "Form has been filled with sample data.",
        });
        break;
      case 'import-csv':
        toast({
          title: "CSV Import",
          description: "Scroll down to the Data Import section to upload CSV files.",
        });
        // Scroll to CSV section
        setTimeout(() => {
          const csvSection = document.querySelector('[data-csv-section]');
          if (csvSection) {
            csvSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
        break;
      default:
        console.log('Quick action:', action);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex max-w-7xl mx-auto">
        <Sidebar steps={steps} onQuickAction={handleQuickAction} />
        
        <main className="flex-1 p-6">
          <Card className="shadow-sm border border-gray-200">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Organization Information
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Provide your company details for the report header
                  </p>
                </div>
                <div className="text-sm text-gray-500">Step 2 of 4</div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Company Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="organization.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Company Name <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="organization.industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select industry" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="technology">Technology</SelectItem>
                              <SelectItem value="healthcare">Healthcare</SelectItem>
                              <SelectItem value="financial">Financial Services</SelectItem>
                              <SelectItem value="manufacturing">Manufacturing</SelectItem>
                              <SelectItem value="retail">Retail</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="organization.contact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Contact</FormLabel>
                          <FormControl>
                            <Input placeholder="Contact person name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="organization.email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contact@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Address Information */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="organization.address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Street address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="organization.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="City" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="organization.state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State/Province</FormLabel>
                            <FormControl>
                              <Input placeholder="State" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="organization.zip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP/Postal Code</FormLabel>
                            <FormControl>
                              <Input placeholder="ZIP Code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Company Size and Framework */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="organization.size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Size</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="startup">Startup (1-10 employees)</SelectItem>
                              <SelectItem value="small">Small (11-50 employees)</SelectItem>
                              <SelectItem value="medium">Medium (51-250 employees)</SelectItem>
                              <SelectItem value="large">Large (251+ employees)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="organization.framework"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Compliance Framework</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select framework" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="iso27001">ISO 27001</SelectItem>
                              <SelectItem value="nist">NIST Cybersecurity Framework</SelectItem>
                              <SelectItem value="sox">SOX</SelectItem>
                              <SelectItem value="gdpr">GDPR</SelectItem>
                              <SelectItem value="hipaa">HIPAA</SelectItem>
                              <SelectItem value="custom">Custom Framework</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <FormLabel>Company Logo (Optional)</FormLabel>
                    <div className="mt-2">
                      <FileUpload
                        accept="image/*"
                        onFileSelect={handleLogoUpload}
                        onFileRemove={handleLogoRemove}
                        uploadedFile={uploadedLogo}
                        title="Click to upload or drag and drop"
                        description="PNG, JPG up to 2MB"
                      />
                    </div>
                  </div>

                  {/* Report Details */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Report Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="report.title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Report Title <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Enter report title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="report.period"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Report Period <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Q1 2024, Annual 2023" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* CSV Upload */}
                  <CSVUpload onDataImport={(type, data) => console.log('Imported', type, data)} />

                  {/* Form Actions */}
                  <div className="flex items-center justify-between pt-6 border-t">
                    <Button type="button" variant="outline" onClick={handleBack}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Templates
                    </Button>
                    
                    <div className="flex items-center space-x-3">
                      <Button type="button" variant="outline" onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Progress
                      </Button>
                      
                      <Button 
                        type="submit" 
                        disabled={createReportMutation.isPending}
                        className="bg-primary hover:bg-blue-700"
                      >
                        {createReportMutation.isPending ? (
                          "Processing..."
                        ) : (
                          <>
                            Continue to Risk Assessment
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Risk Preview */}
          <Card className="mt-6 shadow-sm border border-gray-200">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Risk Assessment Preview
              </CardTitle>
              <p className="text-sm text-gray-600">
                Preview of your risk matrix and assessment structure
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Interactive Risk Matrix</h4>
                <RiskMatrix />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
