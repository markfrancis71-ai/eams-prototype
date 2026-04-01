import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Zap, AlertTriangle, Activity, Clock, Shield, RefreshCw, MessageSquare,
  ChevronDown, ChevronRight, Search,
} from "lucide-react";
import type { Signal, Entity } from "@shared/schema";
import { usePersona } from "@/lib/persona-context";

const SIGNAL_TYPE_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  incident: { color: "bg-red-500/15 text-red-400 border-red-500/30", icon: AlertTriangle, label: "Incident" },
  performance: { color: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: Activity, label: "Performance" },
  lifecycle: { color: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: Clock, label: "Lifecycle" },
  compliance: { color: "bg-violet-500/15 text-violet-400 border-violet-500/30", icon: Shield, label: "Compliance" },
  change: { color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: RefreshCw, label: "Change" },
  feedback: { color: "bg-slate-500/15 text-slate-300 border-slate-500/30", icon: MessageSquare, label: "Feedback" },
};

const SEVERITY_CONFIG: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low: "bg-green-500/15 text-green-400 border-green-500/30",
};

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

export default function SignalQueuePage() {
  const { persona } = usePersona();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [searchText, setSearchText] = useState("");
  const [expandedSignals, setExpandedSignals] = useState<Set<string>>(new Set());

  const { data: signals, isLoading } = useQuery<Signal[]>({
    queryKey: ["/api/signals"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/signals");
      return res.json();
    },
  });

  const { data: allEntities } = useQuery<Entity[]>({
    queryKey: ["/api/search", "all-for-signals"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/search?q=");
      return res.json();
    },
  });

  const entityMap = useMemo(() => {
    const map = new Map<string, Entity>();
    if (allEntities) {
      for (const e of allEntities) {
        map.set(e.eams_id, e);
      }
    }
    return map;
  }, [allEntities]);

  const filteredSignals = useMemo(() => {
    if (!signals) return [];
    var result = [...signals];
    if (typeFilter !== "all") {
      result = result.filter(s => s.signal_type === typeFilter);
    }
    if (severityFilter !== "all") {
      result = result.filter(s => s.severity === severityFilter);
    }
    if (searchText) {
      const lower = searchText.toLowerCase();
      result = result.filter(s =>
        s.title.toLowerCase().includes(lower) ||
        (s.description || "").toLowerCase().includes(lower) ||
        s.source.toLowerCase().includes(lower)
      );
    }
    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return result;
  }, [signals, typeFilter, severityFilter, searchText]);

  const severityCounts = useMemo(() => {
    if (!signals) return { critical: 0, high: 0, medium: 0, low: 0 };
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const s of signals) {
      const sev = s.severity as keyof typeof counts;
      if (sev in counts) counts[sev]++;
    }
    return counts;
  }, [signals]);

  const toggleExpand = (signalId: string) => {
    const next = new Set(expandedSignals);
    if (next.has(signalId)) next.delete(signalId); else next.add(signalId);
    setExpandedSignals(next);
  };

  if (isLoading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-6 w-48 bg-muted rounded" />
        <div className="h-4 w-80 bg-muted rounded" />
        <div className="h-20 bg-muted rounded" />
        <div className="h-20 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[960px]" data-testid="signal-queue-page">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold" data-testid="signal-queue-title">Signal Queue</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Operational signals enriched with architecture context
        </p>
      </div>

      {/* Persona banner */}
      <div className="mb-4 px-3 py-2 rounded bg-primary/5 border border-primary/20 text-xs text-muted-foreground" data-testid="persona-signal-banner">
        Showing signals relevant to <strong className="text-foreground">{persona.label}</strong>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap" data-testid="signal-stats">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs text-muted-foreground">Critical</span>
          <span className="text-xs font-semibold text-red-400">{severityCounts.critical}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-xs text-muted-foreground">High</span>
          <span className="text-xs font-semibold text-orange-400">{severityCounts.high}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-xs text-muted-foreground">Medium</span>
          <span className="text-xs font-semibold text-yellow-400">{severityCounts.medium}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-muted-foreground">Low</span>
          <span className="text-xs font-semibold text-green-400">{severityCounts.low}</span>
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{filteredSignals.length} signal{filteredSignals.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap" data-testid="signal-filters">
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="h-8 px-2 rounded bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            data-testid="filter-signal-type"
          >
            <option value="all">All Types</option>
            <option value="incident">Incident</option>
            <option value="performance">Performance</option>
            <option value="lifecycle">Lifecycle</option>
            <option value="compliance">Compliance</option>
            <option value="change">Change</option>
            <option value="feedback">Feedback</option>
          </select>
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="h-8 px-2 rounded bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            data-testid="filter-severity"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search signals..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            data-testid="signal-search-input"
          />
        </div>
      </div>

      {/* Signal list */}
      <div className="space-y-3" data-testid="signal-list">
        {filteredSignals.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No signals match your filters
          </div>
        )}
        {filteredSignals.map(signal => {
          const config = SIGNAL_TYPE_CONFIG[signal.signal_type] || SIGNAL_TYPE_CONFIG.feedback;
          const TypeIcon = config.icon;
          const affectedIds: string[] = JSON.parse(signal.affected_entities || "[]");
          const isExpanded = expandedSignals.has(signal.signal_id);

          return (
            <div
              key={signal.signal_id}
              className={`bg-card border rounded-lg p-4 transition-colors ${
                persona.signalPriorities.includes(signal.signal_type)
                  ? "border-primary/40 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/30"
              }`}
              data-testid={`signal-card-${signal.signal_id}`}
            >
              {/* Signal header */}
              <div className="flex items-start gap-3">
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${config.color}`}>
                  <TypeIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-[10px] border ${config.color}`}>{config.label}</Badge>
                    <Badge variant="outline" className={`text-[10px] border ${SEVERITY_CONFIG[signal.severity || "low"]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1 ${SEVERITY_DOT[signal.severity || "low"]}`} />
                      {signal.severity}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                      {formatRelativeTime(signal.timestamp)}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium mt-1.5" data-testid={`signal-title-${signal.signal_id}`}>
                    {signal.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[11px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted/50">
                      {signal.source} · {signal.source_id}
                    </span>
                  </div>

                  {/* Description (truncated or full) */}
                  <p className={`text-xs text-muted-foreground mt-2 leading-relaxed ${!isExpanded ? "line-clamp-2" : ""}`}>
                    {signal.description}
                  </p>

                  {/* Expand toggle */}
                  {(signal.description || "").length > 120 && (
                    <button
                      onClick={() => toggleExpand(signal.signal_id)}
                      className="text-[11px] text-primary hover:text-primary/80 mt-1 flex items-center gap-0.5"
                      data-testid={`signal-expand-${signal.signal_id}`}
                    >
                      {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      {isExpanded ? "Show less" : "Show more"}
                    </button>
                  )}

                  {/* Architecture Context */}
                  {affectedIds.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-border/50">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Architecture Context</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {affectedIds.map(eid => {
                          const ent = entityMap.get(eid);
                          return (
                            <Link
                              key={eid}
                              href={`/entities/${encodeURIComponent(eid)}`}
                              data-testid={`signal-entity-badge-${eid}`}
                            >
                              <Badge
                                variant="outline"
                                className="text-[11px] cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors"
                              >
                                {ent ? ent.name : eid}
                              </Badge>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
