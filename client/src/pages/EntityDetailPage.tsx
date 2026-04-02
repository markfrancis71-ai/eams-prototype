import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useRoute, Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Box, AlertTriangle, ExternalLink, ArrowRight, ArrowLeft, Shield,
  FileText, Zap, Activity, Clock, Server, Database as DbIcon, Workflow,
  ChevronDown, Copy, Download, Loader2,
} from "lucide-react";
import type { Entity, Relationship, ComplianceFinding, Signal } from "@shared/schema";
import { generateArtifactHTML } from "@/lib/static-api";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  proposed: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  deprecated: "bg-red-500/15 text-red-400 border-red-500/30",
  retired: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

const KIND_COLORS: Record<string, string> = {
  system: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  container: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  capability: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  process: "bg-green-500/15 text-green-400 border-green-500/30",
  data_entity: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  goal: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  decision: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  standard: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  actor: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

const SEVERITY_COLORS: Record<string, string> = {
  violation: "text-red-400 bg-red-500/10", warning: "text-amber-400 bg-amber-500/10",
  advisory: "text-blue-400 bg-blue-500/10",
};
const SIGNAL_SEVERITY: Record<string, string> = {
  critical: "text-red-400", high: "text-red-400", medium: "text-amber-400", low: "text-blue-400",
};

type EnrichedRelationship = Relationship & {
  from_entity_name?: string; from_entity_kind?: string;
  to_entity_name?: string; to_entity_kind?: string;
};

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex py-1.5 text-sm border-b border-border/50 last:border-b-0">
      <span className="w-40 shrink-0 text-muted-foreground text-xs">{label}</span>
      <span className="text-foreground font-mono text-xs">{value}</span>
    </div>
  );
}

export default function EntityDetailPage() {
  const [, params] = useRoute("/entities/:eams_id");
  const [, setLocation] = useLocation();
  const eamsId = params?.eams_id ? decodeURIComponent(params.eams_id) : "";

  const { data: bundle, isLoading } = useQuery<any>({
    queryKey: ["/api/entities", eamsId, "context-bundle"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/entities/${encodeURIComponent(eamsId)}/context-bundle`);
      return res.json();
    },
    enabled: !!eamsId,
  });

  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportHtml, setReportHtml] = useState("");
  const [reportTitle, setReportTitle] = useState("");

  const generateReport = useMutation({
    mutationFn: async (template: string) => {
      // Always use client-side generation (works in both static and local mode)
      if (!bundle) throw new Error("No entity data");
      return generateArtifactHTML(
        bundle.entity,
        bundle.relationships || [],
        bundle.compliance_findings || [],
        bundle.signals || [],
        template,
      );
    },
    onSuccess: (data: any) => {
      setReportTitle(data.title || "Report");
      setReportHtml(data.html || "");
      setReportDialogOpen(true);
    },
  });

  const handleCopyHtml = useCallback(() => {
    if (reportHtml) {
      navigator.clipboard.writeText(reportHtml).catch(() => {
        // fallback: create a temporary textarea
        const ta = document.createElement("textarea");
        ta.value = reportHtml;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      });
    }
  }, [reportHtml]);

  const handleDownloadHtml = useCallback(() => {
    if (reportHtml) {
      const blob = new Blob([reportHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportTitle.replace(/[^a-zA-Z0-9-_ ]/g, "")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [reportHtml, reportTitle]);

  if (isLoading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-6 w-64 bg-muted rounded" />
        <div className="h-4 w-96 bg-muted rounded" />
        <div className="h-40 bg-muted rounded" />
      </div>
    );
  }

  if (!bundle?.entity) {
    return <div className="p-6 text-muted-foreground">Entity not found: {eamsId}</div>;
  }

  const entity: Entity = bundle.entity;
  const rels: EnrichedRelationship[] = bundle.relationships || [];
  const findings: ComplianceFinding[] = bundle.compliance_findings || [];
  const decisions: Entity[] = bundle.decisions || [];
  const signals: Signal[] = bundle.signals || [];

  const outbound = rels.filter(r => r.from_entity_id === eamsId);
  const inbound = rels.filter(r => r.to_entity_id === eamsId);

  return (
    <div className="p-6 max-w-[900px]" data-testid="entity-detail-page">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-semibold" data-testid="entity-name">{entity.name}</h1>
          {entity.compliance_status === "violation" && <AlertTriangle className="w-4 h-4 text-red-400" />}
          {entity.compliance_status === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400" />}
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                disabled={generateReport.isPending}
                data-testid="generate-report-button"
              >
                {generateReport.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                Generate Report
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => generateReport.mutate("system-overview")}
                data-testid="report-system-overview"
              >
                <FileText className="w-3.5 h-3.5 mr-2" />
                System Overview
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => generateReport.mutate("integration-spec")}
                data-testid="report-integration-spec"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-2" />
                Integration Specification
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => setLocation(`/lineage/${encodeURIComponent(eamsId)}`)}
            data-testid="view-lineage-button"
          >
            <Workflow className="w-3.5 h-3.5" /> View Lineage
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="outline" className="text-[11px] font-mono">{entity.eams_id}</Badge>
          <Badge className={`text-[11px] border ${KIND_COLORS[entity.kind] || ""}`}>{entity.kind}</Badge>
          <Badge className={`text-[11px] border ${STATUS_COLORS[entity.status] || ""}`}>{entity.status}</Badge>
          <Badge variant="outline" className="text-[11px] capitalize">{entity.domain}</Badge>
          {entity.criticality && <Badge variant="outline" className="text-[11px]">{entity.criticality}</Badge>}
          {entity.compliance_status && (
            <Badge variant="outline" className={`text-[11px] ${
              entity.compliance_status === "violation" ? "text-red-400 border-red-500/30" :
              entity.compliance_status === "warning" ? "text-amber-400 border-amber-500/30" :
              entity.compliance_status === "compliant" ? "text-emerald-400 border-emerald-500/30" :
              "text-muted-foreground"
            }`}>
              {entity.compliance_status}
            </Badge>
          )}
        </div>
        {entity.description && (
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{entity.description}</p>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-muted/50 mb-4" data-testid="entity-tabs">
          <TabsTrigger value="overview" className="text-xs" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="technology" className="text-xs" data-testid="tab-technology">Technology</TabsTrigger>
          <TabsTrigger value="nfr" className="text-xs" data-testid="tab-nfr">NFR Profile</TabsTrigger>
          <TabsTrigger value="relationships" className="text-xs" data-testid="tab-relationships">
            Relationships <span className="ml-1 text-muted-foreground">({rels.length})</span>
          </TabsTrigger>
          <TabsTrigger value="compliance" className="text-xs" data-testid="tab-compliance">
            Compliance <span className="ml-1 text-muted-foreground">({findings.length})</span>
          </TabsTrigger>
          <TabsTrigger value="decisions" className="text-xs" data-testid="tab-decisions">Decisions</TabsTrigger>
          <TabsTrigger value="signals" className="text-xs" data-testid="tab-signals">Signals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-1 bg-card border border-border rounded-lg p-4">
            <InfoRow label="EAMS ID" value={entity.eams_id} />
            <InfoRow label="Kind" value={entity.kind} />
            <InfoRow label="Domain" value={entity.domain} />
            <InfoRow label="Status" value={entity.status} />
            <InfoRow label="Lifecycle" value={entity.lifecycle} />
            <InfoRow label="Criticality" value={entity.criticality} />
            <InfoRow label="Architect" value={entity.ownership_architect} />
            <InfoRow label="Business Owner" value={entity.ownership_business_owner} />
            <InfoRow label="TPM ID" value={entity.tpm_id} />
            <InfoRow label="Parent System" value={entity.parent_system_id} />
            <InfoRow label="Container Type" value={entity.container_type} />
            <InfoRow label="Created" value={entity.metadata_created} />
            <InfoRow label="Last Reviewed" value={entity.metadata_last_reviewed} />
            <InfoRow label="Review Due" value={entity.metadata_review_due} />
            <InfoRow label="Tags" value={entity.tags ? JSON.parse(entity.tags).join(", ") : null} />
          </div>
        </TabsContent>

        <TabsContent value="technology">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Server className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Technology Stack</span>
            </div>
            <div className="space-y-1">
              <InfoRow label="Primary" value={entity.technology_primary} />
              <InfoRow label="Language" value={entity.technology_language} />
              <InfoRow label="Framework" value={entity.technology_framework} />
              <InfoRow label="Runtime" value={entity.technology_runtime} />
              <InfoRow label="Hosting" value={entity.technology_hosting} />
            </div>
            {!entity.technology_primary && (
              <p className="text-sm text-muted-foreground italic">No technology details available</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="nfr">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Non-Functional Requirements</span>
            </div>
            <div className="space-y-1">
              <InfoRow label="Availability" value={entity.nfr_availability} />
              <InfoRow label="Throughput" value={entity.nfr_throughput} />
              <InfoRow label="Latency" value={entity.nfr_latency} />
              <InfoRow label="Data Classification" value={entity.nfr_data_classification} />
              <InfoRow label="Encryption" value={entity.nfr_encryption} />
              <InfoRow label="Retention" value={entity.nfr_retention} />
            </div>
            {!entity.nfr_availability && !entity.nfr_data_classification && (
              <p className="text-sm text-muted-foreground italic">No NFR profile defined</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="relationships">
          <div className="space-y-4">
            {/* Outbound */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <ArrowRight className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Outbound ({outbound.length})</span>
              </div>
              {outbound.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No outbound relationships</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs" data-testid="outbound-rels-table">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-1.5 pr-3 font-medium">Type</th>
                        <th className="text-left py-1.5 pr-3 font-medium">Target</th>
                        <th className="text-left py-1.5 pr-3 font-medium">Criticality</th>
                        <th className="text-left py-1.5 pr-3 font-medium">Protocol</th>
                        <th className="text-left py-1.5 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outbound.map(r => (
                        <tr key={r.id} className="border-b border-border/50 hover:bg-accent/30">
                          <td className="py-1.5 pr-3 font-mono text-primary">{r.rel_type}</td>
                          <td className="py-1.5 pr-3">
                            <Link href={`/entities/${encodeURIComponent(r.to_entity_id)}`} className="text-foreground hover:text-primary underline-offset-2 hover:underline">
                              {r.to_entity_name || r.to_entity_id}
                            </Link>
                          </td>
                          <td className="py-1.5 pr-3">
                            {r.criticality && <Badge variant="outline" className="text-[10px]">{r.criticality}</Badge>}
                          </td>
                          <td className="py-1.5 pr-3 font-mono text-muted-foreground">{r.protocol || "—"}</td>
                          <td className="py-1.5 text-muted-foreground">{r.description || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Inbound */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Inbound ({inbound.length})</span>
              </div>
              {inbound.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No inbound relationships</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs" data-testid="inbound-rels-table">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-1.5 pr-3 font-medium">Type</th>
                        <th className="text-left py-1.5 pr-3 font-medium">Source</th>
                        <th className="text-left py-1.5 pr-3 font-medium">Criticality</th>
                        <th className="text-left py-1.5 pr-3 font-medium">Protocol</th>
                        <th className="text-left py-1.5 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inbound.map(r => (
                        <tr key={r.id} className="border-b border-border/50 hover:bg-accent/30">
                          <td className="py-1.5 pr-3 font-mono text-primary">{r.rel_type}</td>
                          <td className="py-1.5 pr-3">
                            <Link href={`/entities/${encodeURIComponent(r.from_entity_id)}`} className="text-foreground hover:text-primary underline-offset-2 hover:underline">
                              {r.from_entity_name || r.from_entity_id}
                            </Link>
                          </td>
                          <td className="py-1.5 pr-3">
                            {r.criticality && <Badge variant="outline" className="text-[10px]">{r.criticality}</Badge>}
                          </td>
                          <td className="py-1.5 pr-3 font-mono text-muted-foreground">{r.protocol || "—"}</td>
                          <td className="py-1.5 text-muted-foreground">{r.description || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="compliance">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Compliance Findings ({findings.length})</span>
            </div>
            {findings.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No compliance findings</p>
            ) : (
              <div className="space-y-3">
                {findings.map(f => (
                  <div key={f.id} className="border border-border/50 rounded p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-[10px] ${SEVERITY_COLORS[f.severity || ""]}`}>{f.severity}</Badge>
                      <span className="text-xs font-mono text-muted-foreground">{f.rule_id}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{f.standard_id}</span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">{f.finding}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                      <span>{f.deterministic ? "Deterministic" : "LLM-assessed"}</span>
                      {f.compile_id && <span>• compile: {f.compile_id}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="decisions">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Related Decisions ({decisions.length})</span>
            </div>
            {decisions.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No related decisions</p>
            ) : (
              <div className="space-y-2">
                {decisions.map((d: any) => (
                  <Link
                    key={d.eams_id}
                    href={`/entities/${encodeURIComponent(d.eams_id)}`}
                    className="block border border-border/50 rounded p-3 hover:bg-accent/30"
                    data-testid={`decision-${d.eams_id}`}
                  >
                    <div className="text-sm font-medium">{d.name}</div>
                    {d.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{d.description}</p>}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="signals">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Signals ({signals.length})</span>
            </div>
            {signals.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No signals for this entity</p>
            ) : (
              <div className="space-y-2">
                {signals.map((s: any) => (
                  <div key={s.id} className="border border-border/50 rounded p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px]">{s.signal_type}</Badge>
                      <span className={`text-xs font-medium ${SIGNAL_SEVERITY[s.severity || ""]}`}>{s.severity}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{s.source}</span>
                    </div>
                    <div className="text-sm font-medium">{s.title}</div>
                    <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Report Preview Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-[850px] max-h-[90vh] flex flex-col" data-testid="report-preview-dialog">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base">{reportTitle}</DialogTitle>
                <DialogDescription className="text-xs">Preview generated report</DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={handleCopyHtml}
                  data-testid="copy-html-button"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy HTML
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={handleDownloadHtml}
                  data-testid="download-html-button"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 mt-2">
            <iframe
              srcDoc={reportHtml}
              className="w-full h-[65vh] border border-border rounded"
              sandbox="allow-same-origin"
              title="Report Preview"
              data-testid="report-preview-iframe"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
