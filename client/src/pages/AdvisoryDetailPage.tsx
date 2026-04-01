import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRoute } from "wouter";
import { BrainCircuit, AlertTriangle, CheckCircle, Info, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdvisoryOutput } from "@shared/schema";

export default function AdvisoryDetailPage() {
  const [, params] = useRoute("/advisory/:id");
  const advisoryId = params?.id ? decodeURIComponent(params.id) : "";
  const [disposition, setDisposition] = useState("noted");
  const [note, setNote] = useState("");

  const { data: advisory, isLoading } = useQuery<AdvisoryOutput>({
    queryKey: ["/api/advisory", advisoryId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/advisory/${encodeURIComponent(advisoryId)}`);
      return res.json();
    },
    enabled: !!advisoryId,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/advisory/${encodeURIComponent(advisoryId)}/acknowledge`, {
        disposition, note, by: "architect@company.com",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/advisory", advisoryId] });
    },
  });

  if (isLoading) {
    return <div className="p-6 animate-pulse"><div className="h-6 w-64 bg-muted rounded" /></div>;
  }
  if (!advisory) {
    return <div className="p-6 text-muted-foreground">Advisory not found</div>;
  }

  let content: any = {};
  try { content = JSON.parse(advisory.content || "{}"); } catch {}

  const SEVERITY_ICONS: Record<string, any> = {
    violation: AlertTriangle, warning: AlertTriangle, advisory: Info,
  };
  const SEVERITY_COLORS: Record<string, string> = {
    violation: "text-red-400", warning: "text-amber-400", advisory: "text-blue-400",
    high: "text-red-400", medium: "text-amber-400", low: "text-blue-400",
  };

  return (
    <div className="p-6 max-w-[900px]" data-testid="advisory-detail-page">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <BrainCircuit className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold">{content.summary || "Advisory Output"}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs font-mono">{advisory.advisory_id}</Badge>
          <Badge variant="outline" className="text-xs">{advisory.output_type}</Badge>
          <Badge variant="outline" className="text-xs">{advisory.status}</Badge>
          {advisory.disposition && <Badge variant="outline" className="text-xs">{advisory.disposition}</Badge>}
          <span className="text-xs text-muted-foreground">scope: {advisory.scope_entity_id}</span>
        </div>
      </div>

      {/* Findings (for compliance_assessment) */}
      {content.findings && (
        <div className="mb-6">
          <h2 className="text-sm font-medium mb-3">Findings</h2>
          <div className="space-y-2">
            {content.findings.map((f: any, i: number) => {
              const Icon = SEVERITY_ICONS[f.severity] || Info;
              return (
                <div key={i} className="border border-border rounded-lg p-3 bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${SEVERITY_COLORS[f.severity] || ""}`} />
                    <span className="text-sm font-medium">{f.category || f.title}</span>
                    <Badge variant="outline" className={`text-[10px] ${SEVERITY_COLORS[f.severity] || ""}`}>{f.severity}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{f.detail}</p>
                  {f.mitigation && <p className="text-xs text-primary mt-1">Mitigation: {f.mitigation}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Risks (for risk_identification) */}
      {content.risks && (
        <div className="mb-6">
          <h2 className="text-sm font-medium mb-3">Identified Risks</h2>
          <div className="space-y-2">
            {content.risks.map((r: any, i: number) => (
              <div key={i} className="border border-border rounded-lg p-3 bg-card">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className={`w-4 h-4 ${SEVERITY_COLORS[r.severity] || ""}`} />
                  <span className="text-sm font-medium">{r.title}</span>
                  <Badge variant="outline" className={`text-[10px] ${SEVERITY_COLORS[r.severity] || ""}`}>{r.severity}</Badge>
                  {r.likelihood && <Badge variant="outline" className="text-[10px]">P: {r.likelihood}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{r.detail}</p>
                {r.mitigation && <p className="text-xs text-primary mt-1">Mitigation: {r.mitigation}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explanation */}
      {content.explanation && (
        <div className="mb-6">
          <h2 className="text-sm font-medium mb-2">Explanation</h2>
          <div className="bg-card border border-border rounded-lg p-4 text-sm text-muted-foreground leading-relaxed">
            {content.explanation}
          </div>
        </div>
      )}

      {/* Impact analysis */}
      {content.impact_analysis && (
        <div className="mb-6">
          <h2 className="text-sm font-medium mb-2">Impact Analysis</h2>
          <div className="bg-card border border-border rounded-lg p-4 text-sm space-y-1">
            {content.impact_analysis.affected_systems && (
              <div className="text-xs"><span className="text-muted-foreground">Affected:</span> {content.impact_analysis.affected_systems.join(", ")}</div>
            )}
            {content.impact_analysis.risk_level && (
              <div className="text-xs"><span className="text-muted-foreground">Risk:</span> {content.impact_analysis.risk_level}</div>
            )}
            {content.impact_analysis.implementation_effort && (
              <div className="text-xs"><span className="text-muted-foreground">Effort:</span> {content.impact_analysis.implementation_effort}</div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {content.recommendations && (
        <div className="mb-6">
          <h2 className="text-sm font-medium mb-2">Recommendations</h2>
          <ul className="space-y-1">
            {content.recommendations.map((r: string, i: number) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Data gaps */}
      {advisory.data_gaps && (
        <div className="mb-6">
          <h2 className="text-sm font-medium mb-2">Data Gaps</h2>
          <ul className="space-y-1">
            {JSON.parse(advisory.data_gaps).map((g: string, i: number) => (
              <li key={i} className="text-xs text-amber-400 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Acknowledge controls */}
      {advisory.status === "pending" && (
        <div className="border border-amber-500/30 rounded-lg p-4 bg-amber-500/5">
          <h3 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Review Required
          </h3>
          <div className="flex items-start gap-3">
            <Select value={disposition} onValueChange={setDisposition}>
              <SelectTrigger className="w-[200px] h-8 text-xs" data-testid="disposition-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accepted" className="text-xs">Accepted</SelectItem>
                <SelectItem value="accepted_with_modifications" className="text-xs">Accepted with modifications</SelectItem>
                <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
                <SelectItem value="noted" className="text-xs">Noted</SelectItem>
              </SelectContent>
            </Select>
            <input
              type="text"
              placeholder="Notes (optional)"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              data-testid="acknowledge-note"
            />
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={() => acknowledgeMutation.mutate()}
              disabled={acknowledgeMutation.isPending}
              data-testid="acknowledge-button"
            >
              {acknowledgeMutation.isPending ? "..." : "Acknowledge"}
            </Button>
          </div>
        </div>
      )}

      {advisory.acknowledged_at && (
        <div className="text-xs text-muted-foreground mt-4">
          Acknowledged by {advisory.acknowledged_by} on {new Date(advisory.acknowledged_at).toLocaleString()}
        </div>
      )}
    </div>
  );
}
