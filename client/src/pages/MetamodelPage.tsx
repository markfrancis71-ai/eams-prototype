import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Boxes } from "lucide-react";

interface MetamodelNode {
  kind: string;
  label: string;
  description: string;
  color: string;
}

interface MetamodelEdge {
  from: string;
  to: string;
  rel_type: string;
  label: string;
}

interface MetamodelData {
  nodes: MetamodelNode[];
  edges: MetamodelEdge[];
  counts: Record<string, number>;
}

// Layout positions for each kind (x, y) on a 900x600 canvas
const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  goal:        { x: 450, y: 50 },
  capability:  { x: 450, y: 150 },
  process:     { x: 450, y: 250 },
  actor:       { x: 150, y: 350 },
  system:      { x: 450, y: 350 },
  decision:    { x: 750, y: 350 },
  container:   { x: 300, y: 470 },
  data_entity: { x: 600, y: 470 },
  standard:    { x: 750, y: 470 },
};

const NODE_WIDTH = 140;
const NODE_HEIGHT = 56;

function getEdgePath(
  fromPos: { x: number; y: number },
  toPos: { x: number; y: number },
  isSelfRef: boolean
): string {
  if (isSelfRef) {
    // Self-referencing loop
    const loopSize = 30;
    return `M ${fromPos.x + NODE_WIDTH / 2} ${fromPos.y}
            C ${fromPos.x + NODE_WIDTH / 2 + loopSize * 2} ${fromPos.y - loopSize * 2},
              ${fromPos.x + NODE_WIDTH / 2 + loopSize * 3} ${fromPos.y + NODE_HEIGHT / 2},
              ${fromPos.x + NODE_WIDTH} ${fromPos.y + NODE_HEIGHT / 2}`;
  }

  // Compute center points
  const fromCx = fromPos.x + NODE_WIDTH / 2;
  const fromCy = fromPos.y + NODE_HEIGHT / 2;
  const toCx = toPos.x + NODE_WIDTH / 2;
  const toCy = toPos.y + NODE_HEIGHT / 2;

  // Determine edge attachment points
  const dx = toCx - fromCx;
  const dy = toCy - fromCy;
  const angle = Math.atan2(dy, dx);

  var startX: number, startY: number, endX: number, endY: number;

  // From node: exit from closest edge
  if (Math.abs(Math.cos(angle)) * NODE_HEIGHT > Math.abs(Math.sin(angle)) * NODE_WIDTH) {
    // Exit from left or right
    startX = fromCx + (Math.sign(dx) * NODE_WIDTH) / 2;
    startY = fromCy;
  } else {
    // Exit from top or bottom
    startX = fromCx;
    startY = fromCy + (Math.sign(dy) * NODE_HEIGHT) / 2;
  }

  // To node: enter from closest edge
  const revAngle = angle + Math.PI;
  if (Math.abs(Math.cos(revAngle)) * NODE_HEIGHT > Math.abs(Math.sin(revAngle)) * NODE_WIDTH) {
    endX = toCx + (Math.sign(-dx) * NODE_WIDTH) / 2;
    endY = toCy;
  } else {
    endX = toCx;
    endY = toCy + (Math.sign(-dy) * NODE_HEIGHT) / 2;
  }

  // Curved path
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const offset = Math.min(30, Math.sqrt(dx * dx + dy * dy) * 0.15);
  const perpX = -Math.sin(angle) * offset;
  const perpY = Math.cos(angle) * offset;

  return `M ${startX} ${startY} Q ${midX + perpX} ${midY + perpY}, ${endX} ${endY}`;
}

function getEdgeLabelPos(
  fromPos: { x: number; y: number },
  toPos: { x: number; y: number },
  isSelfRef: boolean
): { x: number; y: number } {
  if (isSelfRef) {
    return { x: fromPos.x + NODE_WIDTH / 2 + 55, y: fromPos.y - 10 };
  }
  const fromCx = fromPos.x + NODE_WIDTH / 2;
  const fromCy = fromPos.y + NODE_HEIGHT / 2;
  const toCx = toPos.x + NODE_WIDTH / 2;
  const toCy = toPos.y + NODE_HEIGHT / 2;
  return { x: (fromCx + toCx) / 2, y: (fromCy + toCy) / 2 - 8 };
}

export default function MetamodelPage() {
  const [, setLocation] = useLocation();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null);

  const { data: metamodel, isLoading } = useQuery<MetamodelData>({
    queryKey: ["/api/metamodel"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/metamodel");
      return res.json();
    },
  });

  const handleNodeClick = useCallback((kind: string) => {
    setLocation(`/search?kind=${kind}`);
  }, [setLocation]);

  const connectedEdges = useMemo(() => {
    if (!hoveredNode || !metamodel) return new Set<number>();
    const set = new Set<number>();
    metamodel.edges.forEach((e, i) => {
      if (e.from === hoveredNode || e.to === hoveredNode) set.add(i);
    });
    return set;
  }, [hoveredNode, metamodel]);

  if (isLoading || !metamodel) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-6 w-48 bg-muted rounded" />
        <div className="h-4 w-80 bg-muted rounded" />
        <div className="h-[500px] bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="metamodel-page">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Boxes className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold" data-testid="metamodel-title">EAMS Metamodel</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Entity types and valid relationships
        </p>
      </div>

      {/* SVG Diagram */}
      <div className="bg-card border border-border rounded-lg p-4 overflow-auto" data-testid="metamodel-diagram">
        <svg
          viewBox="0 0 900 560"
          className="w-full"
          style={{ minHeight: 460, maxWidth: 900, margin: "0 auto", display: "block" }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#64748B" />
            </marker>
            {metamodel.nodes.map(node => (
              <marker
                key={`arrow-${node.kind}`}
                id={`arrow-${node.kind}`}
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill={node.color} opacity="0.6" />
              </marker>
            ))}
          </defs>

          {/* Edges */}
          {metamodel.edges.map((edge, idx) => {
            const fromPos = NODE_POSITIONS[edge.from];
            const toPos = NODE_POSITIONS[edge.to];
            if (!fromPos || !toPos) return null;

            const isSelfRef = edge.from === edge.to;
            const path = getEdgePath(fromPos, toPos, isSelfRef);
            const labelPos = getEdgeLabelPos(fromPos, toPos, isSelfRef);
            const sourceNode = metamodel.nodes.find(n => n.kind === edge.from);
            const edgeColor = sourceNode?.color || "#64748B";

            const isConnected = connectedEdges.has(idx);
            const isDimmed = hoveredNode !== null && !isConnected;
            const isEdgeHovered = hoveredEdge === idx;

            return (
              <g
                key={`edge-${idx}`}
                data-testid={`metamodel-edge-${edge.from}-${edge.to}`}
                onMouseEnter={() => setHoveredEdge(idx)}
                onMouseLeave={() => setHoveredEdge(null)}
              >
                <path
                  d={path}
                  fill="none"
                  stroke={edgeColor}
                  strokeWidth={isEdgeHovered ? 2.5 : 1.5}
                  strokeOpacity={isDimmed ? 0.15 : isEdgeHovered ? 0.9 : 0.4}
                  markerEnd={`url(#arrow-${edge.from})`}
                  style={{ transition: "stroke-opacity 0.2s, stroke-width 0.2s" }}
                />
                {/* Wider invisible path for easier hovering */}
                <path
                  d={path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={12}
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="9"
                  opacity={isDimmed ? 0.2 : isEdgeHovered ? 1 : 0.7}
                  style={{ transition: "opacity 0.2s", pointerEvents: "none" }}
                >
                  {edge.label}
                </text>
                {/* Tooltip on edge hover */}
                {isEdgeHovered && (
                  <text
                    x={labelPos.x}
                    y={labelPos.y - 14}
                    textAnchor="middle"
                    fill="#E2E8F0"
                    fontSize="10"
                    fontWeight="500"
                  >
                    {edge.from} → {edge.to}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {metamodel.nodes.map(node => {
            const pos = NODE_POSITIONS[node.kind];
            if (!pos) return null;

            const count = metamodel.counts[node.kind] || 0;
            const isDimmed = hoveredNode !== null && hoveredNode !== node.kind && !connectedEdges.size;
            const isHighlighted = hoveredNode === node.kind;
            const isConnectedNode = hoveredNode !== null && hoveredNode !== node.kind &&
              metamodel.edges.some((e, i) => connectedEdges.has(i) && (e.from === node.kind || e.to === node.kind));

            var nodeOpacity = 1;
            if (hoveredNode !== null && !isHighlighted && !isConnectedNode) {
              nodeOpacity = 0.3;
            }

            return (
              <g
                key={node.kind}
                data-testid={`metamodel-node-${node.kind}`}
                onClick={() => handleNodeClick(node.kind)}
                onMouseEnter={() => setHoveredNode(node.kind)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                opacity={nodeOpacity}
              >
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={8}
                  fill={node.color}
                  stroke={isHighlighted ? "#E2E8F0" : node.color}
                  strokeWidth={isHighlighted ? 2 : 1}
                  opacity={isHighlighted ? 1 : 0.85}
                />
                <text
                  x={pos.x + NODE_WIDTH / 2}
                  y={pos.y + 22}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="13"
                  fontWeight="600"
                >
                  {node.label}
                </text>
                <text
                  x={pos.x + NODE_WIDTH / 2}
                  y={pos.y + 40}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="10"
                  opacity={0.75}
                >
                  {count} {count === 1 ? "entity" : "entities"}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4" data-testid="metamodel-legend">
        {metamodel.nodes.map(node => (
          <div
            key={node.kind}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <span
              className="w-3 h-3 rounded"
              style={{ backgroundColor: node.color }}
            />
            <span>{node.label}</span>
            <span className="text-[10px] opacity-60">— {node.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
