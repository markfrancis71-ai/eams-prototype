import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BrainCircuit, AlertTriangle, Info, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AdvisoryOutput } from "@shared/schema";

const TYPE_LABELS: Record<string, string> = {
  compliance_assessment: "Compliance Assessment",
  risk_identification: "Risk Identification",
  explanation: "Explanation",
  design_alternatives: "Design Alternatives",
  impact_analysis: "Impact Analysis",
  standards_guidance: "Standards Guidance",
};

const TYPE_COLORS: Record<string, string> = {
  compliance_assessment: "bg-red-500/15 text-red-400 border-red-500/30",
  risk_identification: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  explanation: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  design_alternatives: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400",
  completed: "bg-emerald-500/15 text-emerald-400",
  acknowledged: "bg-blue-500/15 text-blue-400",
};

export default function AdvisoryPage() {
  const { data: advisories, isLoading } = useQuery<AdvisoryOutput[]>({ queryKey: ["/api/advisory"] });

  const pending = (advisories || []).filter(a => a.status === "pending");
  const completed = (advisories || []).filter(a => a.status !== "pending");

  return (
    <div className="p-6 max-w-[900px]" data-testid="advisory-page">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Advisory Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">LLM-generated architectural assessments and recommendations</p>
      </div>

      {pending.length > 0 && (
        <div className="mb-6 border border-amber-500/30 rounded-lg p-3 bg-amber-500/5">
          <div className="flex items-center gap-2 text-sm text-amber-400 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">{pending.length} pending advisory output{pending.length !== 1 ? "s" : ""} require review</span>
          </div>
          <p className="text-xs text-muted-foreground">Outputs with disposition "acknowledge-required" must be reviewed before proceeding.</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-lg" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {(advisories || []).map(a => {
            let content: any = {};
            try { content = JSON.parse(a.content || "{}"); } catch {}

            return (
              <Link
                key={a.advisory_id}
                href={`/advisory/${encodeURIComponent(a.advisory_id)}`}
                className="block border border-border rounded-lg p-4 bg-card hover:border-primary/30 transition-colors"
                data-testid={`advisory-card-${a.advisory_id}`}
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <BrainCircuit className="w-4 h-4 text-primary" />
                  <Badge className={`text-[10px] border ${TYPE_COLORS[a.output_type || ""] || ""}`}>
                    {TYPE_LABELS[a.output_type || ""] || a.output_type}
                  </Badge>
                  <Badge className={`text-[10px] ${STATUS_COLORS[a.status || ""] || ""}`}>{a.status}</Badge>
                  {a.disposition && <Badge variant="outline" className="text-[10px]">{a.disposition}</Badge>}
                  <span className="text-[10px] text-muted-foreground ml-auto">{a.advisory_id}</span>
                </div>

                <div className="text-sm font-medium mb-1">{content.summary || "Advisory output"}</div>
                <div className="text-xs text-muted-foreground">
                  Scope: {a.scope_entity_id} ({a.scope_mode})
                </div>
                {a.generated_at && (
                  <div className="text-[10px] text-muted-foreground mt-1">
                    Generated: {new Date(a.generated_at).toLocaleString()}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
