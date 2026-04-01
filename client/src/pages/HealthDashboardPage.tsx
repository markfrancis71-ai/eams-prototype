import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import {
  HeartPulse, Building2, AlertTriangle, FileWarning, Clock,
} from "lucide-react";
import { usePersona } from "@/lib/persona-context";

interface DomainHealth {
  domain: string;
  entity_count: number;
  overall_score: number;
  compliance_score: number;
  signal_score: number;
  lifecycle_score: number;
  review_score: number;
  findings_count: number;
  active_signals: number;
  critical_signals: number;
  deprecated_count: number;
}

interface KindHealth {
  kind: string;
  total: number;
  active: number;
  deprecated: number;
  proposed: number;
}

interface HealthData {
  overall_score: number;
  domains: DomainHealth[];
  kinds: KindHealth[];
  total_entities: number;
  total_findings: number;
  total_signals: number;
}

const SCORE_COLOR = (score: number) =>
  score >= 80 ? "#10b981" : score >= 60 ? "#eab308" : score >= 40 ? "#f97316" : "#ef4444";

const SCORE_BG = (score: number) =>
  score >= 80 ? "text-emerald-400" : score >= 60 ? "text-yellow-400" : score >= 40 ? "text-orange-400" : "text-red-400";

const KIND_COLORS: Record<string, string> = {
  goal: "#2563EB", capability: "#6B4C9A", process: "#0F7173",
  system: "#1B3A5C", container: "#0F7173", data_entity: "#7C5E3C",
  standard: "#6D28D9", decision: "#D97706", actor: "#64748B",
};

const DIMENSION_LABELS: Record<string, string> = {
  compliance_score: "Compliance",
  signal_score: "Signals",
  lifecycle_score: "Lifecycle",
  review_score: "Review Freshness",
  overall_score: "Overall",
};

export default function HealthDashboardPage() {
  const { persona } = usePersona();

  const { data: health, isLoading } = useQuery<HealthData>({
    queryKey: ["/api/health"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/health");
      return res.json();
    },
  });

  if (isLoading || !health) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-6 w-48 bg-muted rounded" />
        <div className="h-4 w-80 bg-muted rounded" />
        <div className="h-40 bg-muted rounded" />
      </div>
    );
  }

  const focusDimensions = persona.dashboardFocus.map(d => DIMENSION_LABELS[d] || d).join(", ");

  return (
    <div className="p-6 max-w-[1100px]" data-testid="health-dashboard-page">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold">Architecture Health</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Composite health scores across domains
        </p>
      </div>

      {/* Persona focus note */}
      <div className="mb-4 px-3 py-2 rounded bg-primary/5 border border-primary/20 text-xs text-muted-foreground" data-testid="persona-focus-note">
        Focus areas for <strong className="text-foreground">{persona.label}</strong>: {focusDimensions}
      </div>

      {/* Top Section — Overall Score + KPIs */}
      <div className="flex items-start gap-6 mb-8">
        {/* Score Ring */}
        <div className="shrink-0" data-testid="overall-score-ring">
          <ScoreRing score={health.overall_score} size={140} />
        </div>

        {/* KPI Cards */}
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            icon={<Building2 className="w-4 h-4" />}
            label="Total Entities"
            value={health.total_entities}
          />
          <KpiCard
            icon={<AlertTriangle className="w-4 h-4" />}
            label="Active Signals"
            value={health.total_signals}
            sub={health.domains.reduce((sum, d) => sum + d.critical_signals, 0) > 0
              ? `${health.domains.reduce((sum, d) => sum + d.critical_signals, 0)} critical`
              : undefined}
          />
          <KpiCard
            icon={<FileWarning className="w-4 h-4" />}
            label="Compliance Findings"
            value={health.total_findings}
          />
          <KpiCard
            icon={<Clock className="w-4 h-4" />}
            label="Reviews Due"
            value={health.domains.reduce((sum, d) => {
              const overdue = d.review_score < 100 ? Math.round(d.entity_count * (100 - d.review_score) / 100) : 0;
              return sum + overdue;
            }, 0)}
          />
        </div>
      </div>

      {/* Middle Section — Domain Health Cards */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold mb-3">Domain Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {health.domains.map(domain => {
            const isFocused = persona.dashboardFocus.some(f =>
              f === "overall_score" || domain[f as keyof DomainHealth] !== undefined
            );
            return (
              <div
                key={domain.domain}
                className={`bg-card border rounded-lg p-4 ${isFocused ? "border-primary/40 ring-1 ring-primary/20" : "border-border"}`}
                data-testid={`domain-card-${domain.domain}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-semibold capitalize">{domain.domain}</span>
                  <span className={`text-lg font-bold ml-auto ${SCORE_BG(domain.overall_score)}`}>
                    {domain.overall_score}
                  </span>
                </div>
                <div className="space-y-2">
                  <ScoreBar
                    label="Compliance"
                    score={domain.compliance_score}
                    highlight={persona.dashboardFocus.includes("compliance_score")}
                  />
                  <ScoreBar
                    label="Signals"
                    score={domain.signal_score}
                    highlight={persona.dashboardFocus.includes("signal_score")}
                  />
                  <ScoreBar
                    label="Lifecycle"
                    score={domain.lifecycle_score}
                    highlight={persona.dashboardFocus.includes("lifecycle_score")}
                  />
                  <ScoreBar
                    label="Review"
                    score={domain.review_score}
                    highlight={persona.dashboardFocus.includes("review_score")}
                  />
                </div>
                <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
                  <span>{domain.entity_count} entities</span>
                  <span>·</span>
                  <span>{domain.findings_count} findings</span>
                  <span>·</span>
                  <span>{domain.active_signals} signals</span>
                  <span>·</span>
                  <span>{domain.deprecated_count} deprecated</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Section — Entity Kind Breakdown */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Entity Kind Breakdown</h2>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs" data-testid="kind-breakdown-table">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2 px-4 font-medium">Kind</th>
                <th className="text-right py-2 px-4 font-medium">Total</th>
                <th className="text-left py-2 px-4 font-medium w-[300px]">Distribution</th>
                <th className="text-right py-2 px-4 font-medium">Active</th>
                <th className="text-right py-2 px-4 font-medium">Deprecated</th>
                <th className="text-right py-2 px-4 font-medium">Proposed</th>
              </tr>
            </thead>
            <tbody>
              {health.kinds.map(kind => {
                const maxTotal = Math.max(...health.kinds.map(k => k.total), 1);
                const activeW = (kind.active / maxTotal) * 100;
                const deprecatedW = (kind.deprecated / maxTotal) * 100;
                const proposedW = (kind.proposed / maxTotal) * 100;
                return (
                  <tr key={kind.kind} className="border-b border-border/50 hover:bg-accent/30" data-testid={`kind-row-${kind.kind}`}>
                    <td className="py-2 px-4">
                      <Link href={`/search?kind=${kind.kind}`} className="flex items-center gap-2 hover:text-primary">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: KIND_COLORS[kind.kind] || "#64748B" }} />
                        <span className="capitalize">{kind.kind.replace(/_/g, " ")}</span>
                      </Link>
                    </td>
                    <td className="text-right py-2 px-4 font-medium">{kind.total}</td>
                    <td className="py-2 px-4">
                      <div className="flex h-3 rounded-full overflow-hidden bg-muted/30">
                        {activeW > 0 && <div className="bg-emerald-500" style={{ width: `${activeW}%` }} />}
                        {deprecatedW > 0 && <div className="bg-red-500" style={{ width: `${deprecatedW}%` }} />}
                        {proposedW > 0 && <div className="bg-amber-500" style={{ width: `${proposedW}%` }} />}
                      </div>
                    </td>
                    <td className="text-right py-2 px-4 text-emerald-400">{kind.active}</td>
                    <td className="text-right py-2 px-4 text-red-400">{kind.deprecated}</td>
                    <td className="text-right py-2 px-4 text-amber-400">{kind.proposed}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Active</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Deprecated</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Proposed</span>
        </div>
      </div>
    </div>
  );
}

function ScoreRing({ score, size }: { score: number; size: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;
  const color = SCORE_COLOR(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor" strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[10px] text-muted-foreground">overall</span>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3" data-testid={`kpi-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-lg font-bold">{value}</div>
      {sub && <div className="text-[10px] text-red-400">{sub}</div>}
    </div>
  );
}

function ScoreBar({ label, score, highlight }: { label: string; score: number; highlight?: boolean }) {
  const color = SCORE_COLOR(score);
  return (
    <div className="flex items-center gap-2">
      <span className={`text-[10px] w-20 ${highlight ? "text-primary font-semibold" : "text-muted-foreground"}`}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className={`text-[10px] w-7 text-right ${highlight ? "font-semibold" : ""}`} style={{ color }}>{score}</span>
    </div>
  );
}
