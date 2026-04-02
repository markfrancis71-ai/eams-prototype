import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Play, CheckCircle, AlertTriangle, XCircle, Clock, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CompileRecord } from "@shared/schema";
import { mockCompile } from "@/lib/static-api";

const OUTCOME_ICON: Record<string, any> = {
  success: CheckCircle, partial_success: AlertTriangle, failed: XCircle,
};
const OUTCOME_COLOR: Record<string, string> = {
  success: "text-emerald-400", partial_success: "text-amber-400", failed: "text-red-400",
};

export default function CompilePage() {
  const { data: records, isLoading } = useQuery<CompileRecord[]>({
    queryKey: ["/api/compile/records"],
  });

  const compileMutation = useMutation({
    mutationFn: async () => {
      // Always use client-side mock (works in both static and local mode)
      return mockCompile();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/compile/records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/compile/status"] });
    },
  });

  return (
    <div className="p-6 max-w-[900px]" data-testid="compile-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Compile Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Validate, compile, and publish architecture definitions
          </p>
        </div>
        <Button
          onClick={() => compileMutation.mutate()}
          disabled={compileMutation.isPending}
          className="h-8 text-xs"
          data-testid="trigger-compile"
        >
          <Play className="w-3.5 h-3.5 mr-1" />
          {compileMutation.isPending ? "Compiling..." : "Trigger Compile"}
        </Button>
      </div>

      {/* Latest compile status */}
      {records && records.length > 0 && (() => {
        const latest = records[records.length - 1];
        const Icon = OUTCOME_ICON[latest.outcome || ""] || Clock;
        const timings = JSON.parse(latest.stage_timings || "{}");
        const findings = JSON.parse(latest.compliance_findings || "{}");
        const blocked = JSON.parse(latest.blocked_entities || "[]");

        return (
          <div className="border border-border rounded-lg p-4 bg-card mb-6" data-testid="latest-compile">
            <div className="flex items-center gap-2 mb-3">
              <Icon className={`w-5 h-5 ${OUTCOME_COLOR[latest.outcome || ""]}`} />
              <span className="text-sm font-semibold">Latest Compile: {latest.compile_id}</span>
              <Badge variant="outline" className="text-xs">{latest.outcome}</Badge>
              <Badge variant="outline" className="text-xs">{latest.branch}</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-background rounded p-2">
                <div className="text-[10px] text-muted-foreground">Total</div>
                <div className="text-lg font-semibold">{latest.entities_total}</div>
              </div>
              <div className="bg-background rounded p-2">
                <div className="text-[10px] text-muted-foreground">Passed</div>
                <div className="text-lg font-semibold text-emerald-400">{latest.entities_passed}</div>
              </div>
              <div className="bg-background rounded p-2">
                <div className="text-[10px] text-muted-foreground">Blocked</div>
                <div className="text-lg font-semibold text-red-400">{latest.entities_blocked}</div>
              </div>
              <div className="bg-background rounded p-2">
                <div className="text-[10px] text-muted-foreground">Findings</div>
                <div className="text-lg font-semibold text-amber-400">
                  {(findings.violations || 0) + (findings.warnings || 0)}
                </div>
              </div>
            </div>

            {/* Stage timings */}
            <div className="mb-3">
              <div className="text-xs text-muted-foreground mb-1.5">Stage Timings (ms)</div>
              <div className="flex gap-1">
                {Object.entries(timings).map(([stage, ms]) => {
                  const total = Object.values(timings).reduce((a: number, b: any) => a + (b as number), 0);
                  const pct = (total > 0) ? ((ms as number) / total * 100) : 0;
                  return (
                    <div
                      key={stage}
                      className="h-6 rounded flex items-center justify-center text-[9px] text-white font-mono"
                      style={{
                        width: `${Math.max(pct, 5)}%`,
                        backgroundColor: `hsl(${181 + Object.keys(timings).indexOf(stage) * 30} 50% 35%)`,
                      }}
                      title={`${stage}: ${ms}ms`}
                    >
                      {pct > 8 ? stage : ""}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Compliance summary */}
            <div className="flex items-center gap-4 text-xs">
              {findings.violations > 0 && (
                <span className="text-red-400">{findings.violations} violations</span>
              )}
              {findings.warnings > 0 && (
                <span className="text-amber-400">{findings.warnings} warnings</span>
              )}
              {findings.advisories > 0 && (
                <span className="text-blue-400">{findings.advisories} advisories</span>
              )}
            </div>

            {/* Blocked entities */}
            {blocked.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-red-400 mb-1">Blocked Entities:</div>
                <div className="flex flex-wrap gap-1">
                  {blocked.map((id: string) => (
                    <Badge key={id} variant="outline" className="text-[10px] text-red-400 border-red-500/30">{id}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="text-[10px] text-muted-foreground mt-3 flex items-center gap-3">
              <span>SHA: {latest.git_sha}</span>
              <span>Trigger: {latest.trigger}</span>
              {latest.completed_at && <span>Completed: {new Date(latest.completed_at).toLocaleString()}</span>}
            </div>
          </div>
        );
      })()}

      {/* Compile history */}
      <h2 className="text-sm font-medium mb-3">Compile History</h2>
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {[1,2].map(i => <div key={i} className="h-12 bg-muted rounded" />)}
        </div>
      ) : (
        <div className="space-y-1">
          {(records || []).slice().reverse().map(r => {
            const Icon = OUTCOME_ICON[r.outcome || ""] || Clock;
            return (
              <div key={r.compile_id} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-card text-sm" data-testid={`compile-record-${r.compile_id}`}>
                <Icon className={`w-4 h-4 ${OUTCOME_COLOR[r.outcome || ""]}`} />
                <span className="font-mono text-xs">{r.compile_id}</span>
                <Badge variant="outline" className="text-[10px]">{r.branch}</Badge>
                <Badge variant="outline" className="text-[10px]">{r.outcome}</Badge>
                <span className="text-xs text-muted-foreground">
                  {r.entities_passed}/{r.entities_total} passed
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {r.completed_at ? new Date(r.completed_at).toLocaleString() : ""}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
