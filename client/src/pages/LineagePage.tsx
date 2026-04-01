import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, useRoute } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Workflow, ArrowRight, ArrowLeft, RefreshCw } from "lucide-react";
import type { Entity } from "@shared/schema";

// Parse query params from hash URL or window.location.search (wouter hash-mode puts params in search)
function useHashQueryParams(): Record<string, string> {
  const [params, setParams] = useState<Record<string, string>>({});
  useEffect(() => {
    function parse() {
      const result: Record<string, string> = {};
      // Check window.location.search first (wouter hash navigate puts params here)
      if (window.location.search) {
        new URLSearchParams(window.location.search).forEach((v, k) => { result[k] = v; });
      }
      // Also check for params inside the hash (e.g. #/lineage?entity=...)
      const hash = window.location.hash;
      const qIndex = hash.indexOf("?");
      if (qIndex !== -1) {
        const qs = hash.slice(qIndex + 1);
        new URLSearchParams(qs).forEach((v, k) => { result[k] = v; });
      }
      setParams(result);
    }
    parse();
    window.addEventListener("hashchange", parse);
    window.addEventListener("popstate", parse);
    return () => {
      window.removeEventListener("hashchange", parse);
      window.removeEventListener("popstate", parse);
    };
  }, []);
  return params;
}

// Kind ordering and colors
const KIND_ORDER = ["goal", "capability", "process", "system", "container", "data_entity", "standard", "decision"];
const KIND_LABELS: Record<string, string> = {
  goal: "Goals", capability: "Capabilities", process: "Processes",
  system: "Systems", container: "Containers", data_entity: "Data Entities",
  standard: "Standards", decision: "Decisions",
};
const KIND_COLORS: Record<string, string> = {
  goal: "#2563EB", capability: "#6B4C9A", process: "#0F7173",
  system: "#1B3A5C", container: "#0F7173", data_entity: "#7C5E3C",
  standard: "#6D28D9", decision: "#D97706",
};

const NODE_WIDTH = 160;
const NODE_HEIGHT = 48;
const COL_GAP = 100;
const ROW_GAP = 24;
const PADDING = 48;

function LineageGraph({
  nodes,
  edges,
  onNodeClick,
}: {
  nodes: Entity[];
  edges: { from_entity_id: string; to_entity_id: string; rel_type: string; protocol?: string | null }[];
  onNodeClick: (id: string) => void;
}) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: Entity } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Group nodes by kind, preserving KIND_ORDER
  const presentKinds = KIND_ORDER.filter(k => nodes.some(n => n.kind === k));
  // Also include any kinds not in the predefined order
  const extraKinds = [...new Set(nodes.map(n => n.kind))].filter(k => !KIND_ORDER.includes(k));
  const allKinds = [...presentKinds, ...extraKinds];

  const colIndex: Record<string, number> = {};
  allKinds.forEach((k, i) => { colIndex[k] = i; });

  // Assign positions
  const nodesByKind: Record<string, Entity[]> = {};
  for (const k of allKinds) nodesByKind[k] = [];
  for (const n of nodes) nodesByKind[n.kind]?.push(n);

  const nodePositions: Record<string, { x: number; y: number }> = {};
  for (const k of allKinds) {
    const ci = colIndex[k];
    const kindNodes = nodesByKind[k] || [];
    kindNodes.forEach((n, ri) => {
      nodePositions[n.eams_id] = {
        x: PADDING + ci * (NODE_WIDTH + COL_GAP),
        y: PADDING + 40 + ri * (NODE_HEIGHT + ROW_GAP),
      };
    });
  }

  // SVG dimensions
  const numCols = allKinds.length;
  const maxRows = Math.max(1, ...allKinds.map(k => (nodesByKind[k] || []).length));
  const svgWidth = PADDING * 2 + numCols * NODE_WIDTH + (numCols - 1) * COL_GAP;
  const svgHeight = PADDING * 2 + 40 + maxRows * (NODE_HEIGHT + ROW_GAP);

  const handleNodeClick = (n: Entity) => {
    onNodeClick(n.eams_id);
  };

  const handleNodeMouseEnter = (e: React.MouseEvent, n: Entity) => {
    setHoveredNode(n.eams_id);
    const rect = containerRef.current?.getBoundingClientRect();
    const pos = nodePositions[n.eams_id];
    if (rect && pos) {
      setTooltip({
        x: pos.x + NODE_WIDTH / 2,
        y: pos.y,
        node: n,
      });
    }
  };

  const handleNodeMouseLeave = () => {
    setHoveredNode(null);
    setTooltip(null);
  };

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No lineage data found
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-auto bg-background">
      <svg
        width={svgWidth}
        height={svgHeight}
        className="block"
        data-testid="lineage-svg"
      >
        <defs>
          <marker id="lineage-arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748B" />
          </marker>
        </defs>

        {/* Column headers */}
        {allKinds.map((k, ci) => (
          <text
            key={k}
            x={PADDING + ci * (NODE_WIDTH + COL_GAP) + NODE_WIDTH / 2}
            y={PADDING + 20}
            textAnchor="middle"
            fill={KIND_COLORS[k] || "#64748B"}
            style={{ fontSize: "11px", fontWeight: 600 }}
          >
            {KIND_LABELS[k] || k}
          </text>
        ))}

        {/* Column separators */}
        {allKinds.slice(1).map((_, ci) => (
          <line
            key={ci}
            x1={PADDING + ci * (NODE_WIDTH + COL_GAP) + NODE_WIDTH + COL_GAP / 2}
            y1={PADDING + 30}
            x2={PADDING + ci * (NODE_WIDTH + COL_GAP) + NODE_WIDTH + COL_GAP / 2}
            y2={svgHeight - PADDING}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
        ))}

        {/* Edges */}
        {edges.map((e, i) => {
          const fromPos = nodePositions[e.from_entity_id];
          const toPos = nodePositions[e.to_entity_id];
          if (!fromPos || !toPos) return null;
          const x1 = fromPos.x + NODE_WIDTH;
          const y1 = fromPos.y + NODE_HEIGHT / 2;
          const x2 = toPos.x;
          const y2 = toPos.y + NODE_HEIGHT / 2;
          const mid = (x1 + x2) / 2;
          const label = e.protocol || e.rel_type || "";
          return (
            <g key={i}>
              <path
                d={`M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`}
                stroke="#64748B"
                strokeWidth="1.5"
                fill="none"
                opacity={0.5}
                markerEnd="url(#lineage-arrow)"
              />
              {label && (
                <text
                  x={mid}
                  y={(y1 + y2) / 2 - 4}
                  textAnchor="middle"
                  fill="#64748B"
                  style={{ fontSize: "9px" }}
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map(n => {
          const pos = nodePositions[n.eams_id];
          if (!pos) return null;
          const color = KIND_COLORS[n.kind] || "#4A5568";
          const isHovered = hoveredNode === n.eams_id;
          return (
            <g
              key={n.eams_id}
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={() => handleNodeClick(n)}
              onMouseEnter={(e) => handleNodeMouseEnter(e, n)}
              onMouseLeave={handleNodeMouseLeave}
              style={{ cursor: "pointer" }}
              data-testid={`lineage-node-${n.eams_id}`}
            >
              <rect
                x={0} y={0}
                width={NODE_WIDTH} height={NODE_HEIGHT}
                rx={6}
                fill={color}
                stroke={isHovered ? "white" : "rgba(255,255,255,0.15)"}
                strokeWidth={isHovered ? 2 : 1}
                opacity={isHovered ? 1 : 0.88}
              />
              <text
                x={NODE_WIDTH / 2}
                y={NODE_HEIGHT / 2 - 4}
                textAnchor="middle"
                fill="white"
                style={{ fontSize: "11px", fontWeight: 500, pointerEvents: "none" }}
              >
                {n.name.length > 20 ? n.name.slice(0, 18) + "…" : n.name}
              </text>
              <text
                x={NODE_WIDTH / 2}
                y={NODE_HEIGHT / 2 + 10}
                textAnchor="middle"
                fill="rgba(255,255,255,0.55)"
                style={{ fontSize: "9px", pointerEvents: "none" }}
              >
                {n.eams_id.length > 24 ? n.eams_id.slice(0, 22) + "…" : n.eams_id}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (() => {
        const n = tooltip.node;
        return (
          <div
            className="absolute z-20 bg-card border border-border rounded-lg p-3 shadow-xl max-w-[240px] text-xs pointer-events-none"
            style={{ left: tooltip.x + 8, top: tooltip.y - 8 }}
            data-testid="lineage-tooltip"
          >
            <div className="font-semibold text-sm">{n.name}</div>
            <div className="text-muted-foreground font-mono mt-0.5">{n.eams_id}</div>
            {n.description && <p className="text-muted-foreground mt-1 line-clamp-3">{n.description}</p>}
            <div className="flex gap-1.5 mt-2 flex-wrap">
              <Badge variant="outline" className="text-[10px]">{n.kind}</Badge>
              <Badge variant="outline" className="text-[10px] capitalize">{n.domain}</Badge>
              <Badge variant="outline" className="text-[10px]">{n.status}</Badge>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default function LineagePage() {
  const [, setLocation] = useLocation();
  const [, routeParams] = useRoute("/lineage/:entityId");
  const hashParams = useHashQueryParams();

  // Priority: route param > hash/search param
  const initialEntity = routeParams?.entityId ? decodeURIComponent(routeParams.entityId) : (hashParams.entity || "");
  const [selectedEntity, setSelectedEntity] = useState(initialEntity);
  const [direction, setDirection] = useState<"up" | "down">("up");

  // Sync entity from URL param
  useEffect(() => {
    const fromRoute = routeParams?.entityId ? decodeURIComponent(routeParams.entityId) : null;
    const fromHash = hashParams.entity;
    if (fromRoute) setSelectedEntity(fromRoute);
    else if (fromHash) setSelectedEntity(fromHash);
  }, [routeParams?.entityId, hashParams.entity]);

  // Load all entities for the dropdown
  const { data: allEntities } = useQuery<Entity[]>({
    queryKey: ["/api/search"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/search?q=");
      return res.json();
    },
  });

  // Load lineage data
  const { data: lineageData, isLoading, refetch } = useQuery<{
    nodes: Entity[];
    edges: { from_entity_id: string; to_entity_id: string; rel_type: string; protocol?: string | null }[];
  }>({
    queryKey: ["/api/graph/lineage", selectedEntity, direction],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/graph/lineage/${encodeURIComponent(selectedEntity)}?direction=${direction}`
      );
      return res.json();
    },
    enabled: !!selectedEntity,
  });

  const handleNodeClick = (eamsId: string) => {
    setLocation(`/entities/${encodeURIComponent(eamsId)}`);
  };

  const mainEntities = (allEntities || []).filter(e => e.branch === "main");

  return (
    <div className="h-full flex flex-col" data-testid="lineage-page">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border shrink-0 bg-card/50">
        <Workflow className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Lineage View</span>

        {/* Entity selector */}
        <Select value={selectedEntity} onValueChange={setSelectedEntity}>
          <SelectTrigger className="w-[260px] h-7 text-xs" data-testid="lineage-entity-select">
            <SelectValue placeholder="Select entity..." />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {mainEntities.map(e => (
              <SelectItem key={e.eams_id} value={e.eams_id} className="text-xs">
                <span className="font-mono text-muted-foreground mr-2">{e.kind}</span>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Direction toggle */}
        <div className="flex items-center gap-1 rounded-md border border-border p-0.5" data-testid="direction-toggle">
          <Button
            variant={direction === "up" ? "secondary" : "ghost"}
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => setDirection("up")}
            data-testid="direction-up"
          >
            <ArrowLeft className="w-3 h-3 mr-1" /> Upward
          </Button>
          <Button
            variant={direction === "down" ? "secondary" : "ghost"}
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => setDirection("down")}
            data-testid="direction-down"
          >
            Downward <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => refetch()}
          data-testid="lineage-refresh"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
        </Button>

        <div className="flex-1" />

        {lineageData && (
          <span className="text-[10px] text-muted-foreground">
            {lineageData.nodes?.length || 0} nodes · {lineageData.edges?.length || 0} edges
          </span>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-1.5 border-b border-border bg-card/30 shrink-0 flex-wrap">
        {KIND_ORDER.map(k => (
          <span key={k} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: KIND_COLORS[k] }} />
            {KIND_LABELS[k] || k}
          </span>
        ))}
      </div>

      {/* Graph area */}
      <div className="flex-1 overflow-auto min-h-0">
        {!selectedEntity ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <Workflow className="w-8 h-8 opacity-30" />
            <p className="text-sm">Select an entity to view its lineage traceability chain</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Loading lineage...
          </div>
        ) : (
          <LineageGraph
            nodes={lineageData?.nodes || []}
            edges={lineageData?.edges || []}
            onNodeClick={handleNodeClick}
          />
        )}
      </div>
    </div>
  );
}
