import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Watermark } from "@/components/watermark";
import Home from "@/pages/home";
import OrganizationForm from "@/pages/organization-form";
import RiskAssessment from "@/pages/risk-assessment";
import ReportPreview from "@/pages/report-preview";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/organization" component={OrganizationForm} />
      <Route path="/risk-assessment" component={RiskAssessment} />
      <Route path="/report-preview" component={ReportPreview} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="grc-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
          <Watermark />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
