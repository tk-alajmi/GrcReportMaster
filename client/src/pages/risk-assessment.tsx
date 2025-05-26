import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Plus, Edit2, Trash2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { RiskMatrix } from "@/components/risk-matrix";
import { apiRequest } from "@/lib/queryClient";
import { insertRiskItemSchema, type RiskItem } from "@shared/schema";
import { calculateRiskLevel, RISK_LEVELS, type FormStep } from "@/types/report";

const riskFormSchema = insertRiskItemSchema.omit({ reportId: true });

type RiskFormData = z.infer<typeof riskFormSchema>;

export default function RiskAssessment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [reportId, setReportId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<RiskItem | null>(null);
  const [selectedMatrixCell, setSelectedMatrixCell] = useState<{ likelihood: number; impact: number } | null>(null);

  // Get report ID from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('reportId');
    if (id && id !== 'new') {
      setReportId(parseInt(id));
    }
  }, []);

  const form = useForm<RiskFormData>({
    resolver: zodResolver(riskFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      likelihood: 1,
      impact: 1,
      riskLevel: "very-low",
      mitigation: "",
      status: "open",
    },
  });

  // Fetch risk items
  const { data: riskItems = [], isLoading } = useQuery({
    queryKey: [`/api/reports/${reportId}/risk-items`],
    enabled: !!reportId,
  });

  const createRiskMutation = useMutation({
    mutationFn: async (data: RiskFormData) => {
      if (!reportId) throw new Error("No report ID");
      
      const response = await apiRequest("POST", "/api/risk-items", {
        ...data,
        reportId,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Risk Item Created",
        description: "Risk item has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/reports/${reportId}/risk-items`] });
      form.reset();
      setIsDialogOpen(false);
      setSelectedMatrixCell(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create risk item.",
        variant: "destructive",
      });
    },
  });

  const updateRiskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<RiskFormData> }) => {
      const response = await apiRequest("PATCH", `/api/risk-items/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Risk Item Updated",
        description: "Risk item has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/reports/${reportId}/risk-items`] });
      form.reset();
      setIsDialogOpen(false);
      setEditingRisk(null);
      setSelectedMatrixCell(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update risk item.",
        variant: "destructive",
      });
    },
  });

  const deleteRiskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/risk-items/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Risk Item Deleted",
        description: "Risk item has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/reports/${reportId}/risk-items`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete risk item.",
        variant: "destructive",
      });
    },
  });

  const steps: FormStep[] = [
    { id: 'template', title: 'Select Template', description: 'Choose report type', completed: true, current: false },
    { id: 'organization', title: 'Organization Info', description: 'Company details', completed: true, current: false },
    { id: 'risk', title: 'Risk Assessment', description: 'Evaluate risks', completed: false, current: true },
    { id: 'review', title: 'Review & Export', description: 'Generate report', completed: false, current: false },
  ];

  const handleMatrixCellClick = (likelihood: number, impact: number) => {
    setSelectedMatrixCell({ likelihood, impact });
    form.setValue('likelihood', likelihood);
    form.setValue('impact', impact);
    form.setValue('riskLevel', calculateRiskLevel(likelihood, impact));
  };

  const handleEditRisk = (risk: RiskItem) => {
    setEditingRisk(risk);
    form.reset({
      name: risk.name,
      description: risk.description || "",
      category: risk.category,
      likelihood: risk.likelihood,
      impact: risk.impact,
      riskLevel: risk.riskLevel,
      mitigation: risk.mitigation || "",
      status: risk.status,
    });
    setSelectedMatrixCell({ likelihood: risk.likelihood, impact: risk.impact });
    setIsDialogOpen(true);
  };

  const handleNewRisk = () => {
    setEditingRisk(null);
    form.reset();
    setSelectedMatrixCell(null);
    setIsDialogOpen(true);
  };

  const handleDeleteRisk = (id: number) => {
    if (confirm("Are you sure you want to delete this risk item?")) {
      deleteRiskMutation.mutate(id);
    }
  };

  const onSubmit = (data: RiskFormData) => {
    if (editingRisk) {
      updateRiskMutation.mutate({ id: editingRisk.id, data });
    } else {
      createRiskMutation.mutate(data);
    }
  };

  const handleBack = () => {
    setLocation("/organization");
  };

  const handleContinue = () => {
    setLocation(`/report-preview?reportId=${reportId}`);
  };

  // Update risk level when likelihood or impact changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'likelihood' || name === 'impact') {
        const likelihood = value.likelihood || 1;
        const impact = value.impact || 1;
        form.setValue('riskLevel', calculateRiskLevel(likelihood, impact));
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

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
                    Risk Assessment
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Identify, evaluate, and document organizational risks
                  </p>
                </div>
                <div className="text-sm text-gray-500">Step 3 of 4</div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* Risk Matrix */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Risk Matrix</h3>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={handleNewRisk}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Risk Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingRisk ? "Edit Risk Item" : "Add New Risk Item"}
                        </DialogTitle>
                      </DialogHeader>
                      
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Risk Name *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Phishing Attacks" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="category"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                                      <SelectItem value="operational">Operational</SelectItem>
                                      <SelectItem value="financial">Financial</SelectItem>
                                      <SelectItem value="compliance">Compliance</SelectItem>
                                      <SelectItem value="strategic">Strategic</SelectItem>
                                      <SelectItem value="reputational">Reputational</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Describe the risk in detail..."
                                    className="min-h-[80px]"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name="likelihood"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Likelihood (1-5) *</FormLabel>
                                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="1">1 - Very Low</SelectItem>
                                      <SelectItem value="2">2 - Low</SelectItem>
                                      <SelectItem value="3">3 - Medium</SelectItem>
                                      <SelectItem value="4">4 - High</SelectItem>
                                      <SelectItem value="5">5 - Very High</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="impact"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Impact (1-5) *</FormLabel>
                                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="1">1 - Very Low</SelectItem>
                                      <SelectItem value="2">2 - Low</SelectItem>
                                      <SelectItem value="3">3 - Medium</SelectItem>
                                      <SelectItem value="4">4 - High</SelectItem>
                                      <SelectItem value="5">5 - Very High</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="status"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Status</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="open">Open</SelectItem>
                                      <SelectItem value="mitigated">Mitigated</SelectItem>
                                      <SelectItem value="accepted">Accepted</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="mitigation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mitigation Measures</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Describe current or planned mitigation measures..."
                                    className="min-h-[80px]"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end space-x-3">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={createRiskMutation.isPending || updateRiskMutation.isPending}
                            >
                              {editingRisk ? "Update Risk" : "Add Risk"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <RiskMatrix 
                  onCellClick={handleMatrixCellClick}
                  selectedCell={selectedMatrixCell}
                />
              </div>

              {/* Risk Items List */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Items</h3>
                {isLoading ? (
                  <div className="text-center py-8">Loading risk items...</div>
                ) : riskItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No risk items added yet. Click "Add Risk Item" to get started.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {riskItems.map((risk: RiskItem) => (
                      <div key={risk.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${RISK_LEVELS[risk.riskLevel as keyof typeof RISK_LEVELS].matrixColor}`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{risk.name}</p>
                            <p className="text-xs text-gray-500">{risk.category}</p>
                            {risk.description && (
                              <p className="text-xs text-gray-600 mt-1">{risk.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={RISK_LEVELS[risk.riskLevel as keyof typeof RISK_LEVELS].color}>
                            {RISK_LEVELS[risk.riskLevel as keyof typeof RISK_LEVELS].label}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRisk(risk)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRisk(risk.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-6 border-t mt-8">
                <Button type="button" variant="outline" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Organization
                </Button>
                
                <Button 
                  onClick={handleContinue}
                  className="bg-primary hover:bg-blue-700"
                  disabled={riskItems.length === 0}
                >
                  Continue to Review
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
