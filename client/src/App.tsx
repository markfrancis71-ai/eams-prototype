import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PersonaProvider } from "@/lib/persona-context";
import { TourProvider } from "@/lib/tour-context";
import GuidedTour from "@/components/GuidedTour";
import AppShell from "@/components/AppShell";
import DomainsPage from "@/pages/DomainsPage";
import EntityDetailPage from "@/pages/EntityDetailPage";
import ViewpointsPage from "@/pages/ViewpointsPage";
import ViewpointDiagramPage from "@/pages/ViewpointDiagramPage";
import BranchesPage from "@/pages/BranchesPage";
import BranchDiffPage from "@/pages/BranchDiffPage";
import AdvisoryPage from "@/pages/AdvisoryPage";
import AdvisoryDetailPage from "@/pages/AdvisoryDetailPage";
import SearchPage from "@/pages/SearchPage";
import CompilePage from "@/pages/CompilePage";
import DslEditorPage from "@/pages/DslEditorPage";
import LineagePage from "@/pages/LineagePage";
import SignalQueuePage from "@/pages/SignalQueuePage";
import MetamodelPage from "@/pages/MetamodelPage";
import ScenarioPage from "@/pages/ScenarioPage";
import HealthDashboardPage from "@/pages/HealthDashboardPage";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <AppShell>
      <Switch>
        <Route path="/" component={DomainsPage} />
        <Route path="/entities/:eams_id" component={EntityDetailPage} />
        <Route path="/viewpoints" component={ViewpointsPage} />
        <Route path="/viewpoints/:id" component={ViewpointDiagramPage} />
        <Route path="/branches" component={BranchesPage} />
        <Route path="/branches/:slug" component={BranchDiffPage} />
        <Route path="/advisory" component={AdvisoryPage} />
        <Route path="/advisory/:id" component={AdvisoryDetailPage} />
        <Route path="/search" component={SearchPage} />
        <Route path="/compile" component={CompilePage} />
        <Route path="/dsl" component={DslEditorPage} />
        <Route path="/lineage" component={LineagePage} />
        <Route path="/lineage/:entityId" component={LineagePage} />
        <Route path="/signals" component={SignalQueuePage} />
        <Route path="/metamodel" component={MetamodelPage} />
        <Route path="/scenarios" component={ScenarioPage} />
        <Route path="/health" component={HealthDashboardPage} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function App() {
  return (
    <PersonaProvider>
      <TourProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router hook={useHashLocation}>
              <AppRouter />
              <GuidedTour />
            </Router>
          </TooltipProvider>
        </QueryClientProvider>
      </TourProvider>
    </PersonaProvider>
  );
}

export default App;
