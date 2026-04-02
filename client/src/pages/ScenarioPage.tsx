import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FlaskConical, Trash2, AlertTriangle, XCircle, Ban, Plus, Play,
} from "lucide-react";
import type { Entity } from "@shared/schema";
import { analyzeScenarioStatic } from "@/lib/static-api";

const KIND_COLORS: Record<string, string> = {
  goal: "#2563EB", capability: "#6B4C9A", process: "#0F7173",
  system: "#1B3A5C", container: "#0F7173", data_entity: "#7C5E3C",
  standard: "#6D28D9", decision: "#D97706", actor: "#64748B",
};

const ACTION_TYPES = [
  { value: "deprecate", label: "Deprecate System", icon: Ban },
  { value: "remove", label: "Remove Container", icon: Trash2 },
  { value: "decommission", label: "Decommission System", icon: XCircle },
];

const RISK_COLORS: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low: "bg-green-500/15 text-green-400 border-green-500/30",
};

interface ScenarioAction {
  type: string;
  target_entity_id: string;
  entity_name: string;
  entity_kind: string;
}

interface AnalysisResult {
  action: { type: string; target_entity_id: string };
  entity: any;
  direct_impact: number;
  total_impact: number;
  affected_entities: { eams_id: string; name: string; kind: string }[];
  affected_relationships: any[];
  risk_level: string;
  warnings: string[];
}

export default function ScenarioPage() {
  const [actions, setActions] = useState<ScenarioAction[]>([]);
  const [actionType, setActionType] = useState("deprecate");
  const [selectedEntity, setSelectedEntity] = useState("");
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[] | null>(null);

  const { data: allEntities } = useQuery<Entity[]>({
    queryKey: ["/api/search", "scenario-entities"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/search?q=");
      return res.json();
    },
  });

  const entitiesByKind = useMemo(() => {
    const grouped: Record<string, Entity[]> = {};
    for (const e of (allEntities || [])) {
      if (!grouped[e.kind]) grouped[e.kind] = [];
      grouped[e.kind].push(e);
    }
    return grouped;
  }, [allEntities]);

  const analyzeMutation = useMutation({
    mutationFn: async (scenarioActions: ScenarioAction[]) => {
      const mappedActions = scenarioActions.map(a => ({
        type: a.type === "decommission" ? "remove" : a.type,
        target_entity_id: a.target_entity_id,
      }));
      // Always use client-side analysis (works in both static and local mode)
      return analyzeScenarioStatic(mappedActions);
    },
    onSuccess: (data) => {
      setAnalysisResults(data.results);
    },
  });

  const addAction = () => {
    if (!selectedEntity) return;
    const entity = allEntities?.find(e => e.eams_id === selectedEntity);
    if (!entity) return;
    setActions(prev => [...prev, {
      type: actionType,
      target_entity_id: selectedEntity,
      entity_name: entity.name,
      entity_kind: entity.kind,
    }]);
    setSelectedEntity("");
  };

  const removeAction = (idx: number) => {
    setActions(prev => prev.filter((_, i) => i !== idx));
    setAnalysisResults(null);
  };

  return (
    <div className="p-6" data-testid="scenario-page">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold">What-If Scenario Builder</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Simulate architecture changes and preview cascade effects
        </p>
      </div>

      <div className="flex gap-6" style={{ minHeight: "calc(100vh - 200px)" }}>
        {/* Left Panel — Scenario Definition */}
        <div className="w-[400px] shrink-0 space-y-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-sm font-semibold mb-3">Add Action</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Action Type</label>
                <select
                  value={actionType}
                  onChange={e => setActionType(e.target.value)}
                  className="w-full h-8 px-2 rounded bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  data-testid="action-type-select"
                >
                  {ACTION_TYPES.map(at => (
                    <option key={at.value} value={at.value}>{at.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Target Entity</label>
                <select
                  value={selectedEntity}
                  onChange={e => setSelectedEntity(e.target.value)}
                  className="w-full h-8 px-2 rounded bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  data-testid="entity-select"
                >
                  <option value="">Select entity...</option>
                  {Object.entries(entitiesByKind).map(([kind, entities]) => (
                    <optgroup key={kind} label={kind.replace(/_/g, " ").toUpperCase()}>
                      {entities.map(e => (
                        <option key={e.eams_id} value={e.eams_id}>{e.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={addAction}
                disabled={!selectedEntity}
                className="w-full"
                data-testid="add-action-btn"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add to Scenario
              </Button>
            </div>
          </div>

          {/* Action Queue */}
          {actions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Planned Actions ({actions.length})
              </h3>
              {actions.map((action, idx) => {
                const at = ACTION_TYPES.find(a => a.value === action.type);
                const ActionIcon = at?.icon || Ban;
                return (
                  <div
                    key={idx}
                    className="bg-card border border-border rounded-lg p-3 flex items-center gap-3"
                    data-testid={`action-card-${idx}`}
                  >
                    <div className="w-7 h-7 rounded flex items-center justify-center bg-red-500/10 text-red-400">
                      <ActionIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{action.entity_name}</div>
                      <div className="text-[10px] text-muted-foreground">{at?.label || action.type}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{action.entity_kind}</Badge>
                    <button
                      onClick={() => removeAction(idx)}
                      className="text-muted-foreground hover:text-red-400 transition-colors"
                      data-testid={`remove-action-${idx}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <Button
            onClick={() => analyzeMutation.mutate(actions)}
            disabled={actions.length === 0 || analyzeMutation.isPending}
            className="w-full bg-[#0F7173] hover:bg-[#0F7173]/80 text-white"
            data-testid="analyze-btn"
          >
            {analyzeMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play className="w-4 h-4" /> Analyze Impact
              </span>
            )}
          </Button>
        </div>

        {/* Right Panel — Impact Analysis */}
        <div className="flex-1 min-w-0">
          {!analysisResults ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Add actions and analyze to see impact</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {analysisResults.map((result, idx) => (
                <div key={idx} className="bg-card border border-border rounded-lg overflow-hidden" data-testid={`impact-result-${idx}`}>
                  {/* Impact Summary */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={`${RISK_COLORS[result.risk_level]} border`}>
                        {result.risk_level.toUpperCase()} RISK
                      </Badge>
                      <span className="text-sm font-medium">
                        {result.entity?.name || result.action.target_entity_id}
                      </span>
                      <Badge variant="outline" className="text-[10px]">{result.action.type}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span><strong className="text-foreground">{result.direct_impact}</strong> direct dependencies affected</span>
                      <span><strong className="text-foreground">{result.total_impact}</strong> total entities in blast radius</span>
                    </div>
                    {result.warnings.map((w, wi) => (
                      <div key={wi} className="mt-2 px-3 py-2 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        {w}
                      </div>
                    ))}
                  </div>

                  {/* Affected Entities */}
                  {result.affected_entities.length > 0 && (
                    <div className="p-4 border-b border-border">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Affected Entities ({result.affected_entities.length})
                      </h4>
                      <div className="space-y-1">
                        {Object.entries(
                          result.affected_entities.reduce<Record<string, typeof result.affected_entities>>((acc, e) => {
                            if (!acc[e.kind]) acc[e.kind] = [];
                            acc[e.kind].push(e);
                            return acc;
                          }, {})
                        ).map(([kind, entities]) => (
                          <div key={kind} className="mb-2">
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{kind.replace(/_/g, " ")}</div>
                            <div className="flex flex-wrap gap-1.5">
                              {entities.map(e => (
                                <Link key={e.eams_id} href={`/entities/${encodeURIComponent(e.eams_id)}`}>
                                  <Badge
                                    variant="outline"
                                    className="text-[11px] cursor-pointer hover:bg-primary/10 hover:border-primary/50"
                                    style={{ borderColor: KIND_COLORS[e.kind] + "60" }}
                                  >
                                    {e.name}
                                  </Badge>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Impact Visualization */}
                  <div className="p-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Impact Visualization
                    </h4>
                    <ImpactDiagram
                      targetEntity={result.entity}
                      affectedEntities={result.affected_entities}
                      directImpact={result.direct_impact}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ImpactDiagram({
  targetEntity,
  affectedEntities,
  directImpact,
}: {
  targetEntity: any;
  affectedEntities: { eams_id: string; name: string; kind: string }[];
  directImpact: number;
}) {
  if (!targetEntity) return null;

  const width = 600;
  const height = 300;
  const cx = width / 2;
  const cy = height / 2;

  const directEntities = affectedEntities.slice(0, directImpact);
  const transitiveEntities = affectedEntities.slice(directImpact);

  const nodePositions: { x: number; y: number; entity: any; ring: string }[] = [];

  // Direct ring
  const directRadius = 90;
  directEntities.forEach((e, i) => {
    const angle = (i / Math.max(directEntities.length, 1)) * Math.PI * 2 - Math.PI / 2;
    nodePositions.push({
      x: cx + Math.cos(angle) * directRadius,
      y: cy + Math.sin(angle) * directRadius,
      entity: e,
      ring: "direct",
    });
  });

  // Transitive ring
  const transitiveRadius = 140;
  transitiveEntities.slice(0, 12).forEach((e, i) => {
    const total = Math.min(transitiveEntities.length, 12);
    const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
    nodePositions.push({
      x: cx + Math.cos(angle) * transitiveRadius,
      y: cy + Math.sin(angle) * transitiveRadius,
      entity: e,
      ring: "transitive",
    });
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: 300 }} data-testid="impact-diagram">
      {/* Blast radius rings */}
      <circle cx={cx} cy={cy} r={directRadius} fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
      <circle cx={cx} cy={cy} r={transitiveRadius} fill="none" stroke="#eab308" strokeWidth="1" strokeDasharray="4 4" opacity="0.2" />

      {/* Edges from target to affected */}
      {nodePositions.map((node, i) => (
        <line
          key={`edge-${i}`}
          x1={cx} y1={cy}
          x2={node.x} y2={node.y}
          stroke={node.ring === "direct" ? "#f97316" : "#eab308"}
          strokeWidth="1"
          opacity="0.3"
        />
      ))}

      {/* Target node */}
      <g>
        <circle cx={cx} cy={cy} r={24} fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="2" />
        <line x1={cx - 10} y1={cy} x2={cx + 10} y2={cy} stroke="#ef4444" strokeWidth="2" />
        <text x={cx} y={cy + 32} textAnchor="middle" className="text-[9px] fill-red-400" fontFamily="sans-serif">
          {targetEntity.name?.length > 20 ? targetEntity.name.substring(0, 20) + "..." : targetEntity.name}
        </text>
        <text x={cx} y={cy - 28} textAnchor="middle" className="text-[8px] fill-red-400/60" fontFamily="sans-serif">
          ⚠ TARGET
        </text>
      </g>

      {/* Affected nodes */}
      {nodePositions.map((node, i) => {
        const color = node.ring === "direct" ? "#f97316" : "#eab308";
        const name = node.entity.name?.length > 15 ? node.entity.name.substring(0, 15) + "..." : node.entity.name;
        return (
          <g key={`node-${i}`}>
            <circle cx={node.x} cy={node.y} r={14} fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.5" />
            <circle cx={node.x} cy={node.y} r={3} fill={KIND_COLORS[node.entity.kind] || "#64748B"} />
            <text x={node.x} y={node.y + 22} textAnchor="middle" className="text-[8px] fill-muted-foreground" fontFamily="sans-serif">
              {name}
            </text>
          </g>
        );
      })}

      {transitiveEntities.length > 12 && (
        <text x={width - 10} y={height - 10} textAnchor="end" className="text-[9px] fill-muted-foreground" fontFamily="sans-serif">
          +{transitiveEntities.length - 12} more
        </text>
      )}
    </svg>
  );
}
