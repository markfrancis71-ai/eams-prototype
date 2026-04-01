import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useRoute, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Eye, Download, RefreshCw, Copy, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Entity, ViewpointDefinition } from "@shared/schema";

// D3 force-directed graph using SVG
function DiagramRenderer({ renderGraph, onNodeClick }: { renderGraph: any; onNodeClick: (id: string) => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!renderGraph?.nodes) return;

    // Layout nodes using force-directed simulation (simplified)
    const width = 900;
    const height = 600;
    const nodeCount = renderGraph.nodes.length;

    // Group by domain for initial positioning
    const domains = [...new Set(renderGraph.nodes.map((n: any) => n.data?.domain || ""))];
    const domainPositions: Record<string, { x: number; y: number }> = {};
    domains.forEach((d, i) => {
      const angle = (2 * Math.PI * i) / domains.length;
      const radius = Math.min(width, height) * 0.3;
      domainPositions[d as string] = {
        x: width / 2 + radius * Math.cos(angle),
        y: height / 2 + radius * Math.sin(angle),
      };
    });

    const layoutNodes = renderGraph.nodes.map((n: any, i: number) => {
      const domainPos = domainPositions[n.data?.domain || ""] || { x: width / 2, y: height / 2 };
      const spread = 80 + nodeCount * 3;
      return {
        ...n,
        x: domainPos.x + (Math.random() - 0.5) * spread,
        y: domainPos.y + (Math.random() - 0.5) * spread,
        vx: 0,
        vy: 0,
      };
    });

    // Simple force simulation
    const nodeMap = new Map(layoutNodes.map((n: any) => [n.id, n]));
    const simEdges = renderGraph.edges.map((e: any) => ({
      ...e,
      source: nodeMap.get(e.from),
      target: nodeMap.get(e.to),
    })).filter((e: any) => e.source && e.target);

    // Run iterations
    for (let tick = 0; tick < 150; tick++) {
      const alpha = 1 - tick / 150;
      // Repulsion between all nodes
      for (let i = 0; i < layoutNodes.length; i++) {
        for (let j = i + 1; j < layoutNodes.length; j++) {
          const a = layoutNodes[i];
          const b = layoutNodes[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (200 * alpha) / dist;
          dx = (dx / dist) * force;
          dy = (dy / dist) * force;
          a.x -= dx;
          a.y -= dy;
          b.x += dx;
          b.y += dy;
        }
      }
      // Attraction along edges
      for (const e of simEdges) {
        let dx = e.target.x - e.source.x;
        let dy = e.target.y - e.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 120) * 0.02 * alpha;
        dx = (dx / dist) * force;
        dy = (dy / dist) * force;
        e.source.x += dx;
        e.source.y += dy;
        e.target.x -= dx;
        e.target.y -= dy;
      }
      // Center gravity
      for (const n of layoutNodes) {
        n.x += (width / 2 - n.x) * 0.01 * alpha;
        n.y += (height / 2 - n.y) * 0.01 * alpha;
      }
    }

    setNodes(layoutNodes);
    setEdges(simEdges);
  }, [renderGraph]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      k: Math.max(0.2, Math.min(3, prev.k * delta)),
    }));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".diagram-node")) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning.current) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      }));
    }
    if (dragging) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const x = (e.clientX - rect.left - transform.x) / transform.k;
      const y = (e.clientY - rect.top - transform.y) / transform.k;
      setNodes(prev => prev.map(n => n.id === dragging ? { ...n, x: x + dragOffset.x, y: y + dragOffset.y } : n));
    }
  }, [dragging, dragOffset, transform]);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
    setDragging(null);
  }, []);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string, nodeX: number, nodeY: number) => {
    e.stopPropagation();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = (e.clientX - rect.left - transform.x) / transform.k;
    const my = (e.clientY - rect.top - transform.y) / transform.k;
    setDragging(nodeId);
    setDragOffset({ x: nodeX - mx, y: nodeY - my });
  }, [transform]);

  const nodeWidth = 160;
  const nodeHeight = 50;

  return (
    <div className="relative w-full h-full bg-background rounded-lg border border-border overflow-hidden">
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        data-testid="diagram-svg"
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748B" />
          </marker>
          <marker id="arrowhead-critical" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#EF4444" />
          </marker>
        </defs>
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
          {/* Groups */}
          {(renderGraph?.groups || []).map((g: any) => {
            const memberNodes = nodes.filter(n => g.members.includes(n.id));
            if (memberNodes.length === 0) return null;
            const minX = Math.min(...memberNodes.map(n => n.x)) - 20;
            const minY = Math.min(...memberNodes.map(n => n.y)) - 35;
            const maxX = Math.max(...memberNodes.map(n => n.x)) + nodeWidth + 20;
            const maxY = Math.max(...memberNodes.map(n => n.y)) + nodeHeight + 20;
            return (
              <g key={g.id}>
                <rect x={minX} y={minY} width={maxX - minX} height={maxY - minY}
                  rx="8" fill={g.color || "rgba(15,113,115,0.1)"} stroke="rgba(15,113,115,0.3)" strokeWidth="1" strokeDasharray="4 4" />
                <text x={minX + 8} y={minY + 14} className="text-[10px]" fill="#94A3B8">{g.label}</text>
              </g>
            );
          })}

          {/* Edges */}
          {edges.map((e: any, i: number) => {
            if (!e.source || !e.target) return null;
            const sx = e.source.x + nodeWidth / 2;
            const sy = e.source.y + nodeHeight / 2;
            const tx = e.target.x + nodeWidth / 2;
            const ty = e.target.y + nodeHeight / 2;
            const isCritical = e.display?.style === "solid";
            const strokeColor = e.display?.color || "#64748B";
            const strokeWidth = e.display?.weight || 1;

            return (
              <g key={`edge-${i}`}>
                <line
                  x1={sx} y1={sy} x2={tx} y2={ty}
                  stroke={strokeColor} strokeWidth={strokeWidth}
                  strokeDasharray={isCritical ? "none" : "4 4"}
                  markerEnd={isCritical ? "url(#arrowhead-critical)" : "url(#arrowhead)"}
                  opacity={0.6}
                />
                {/* Edge label */}
                <text x={(sx + tx) / 2} y={(sy + ty) / 2 - 5}
                  textAnchor="middle" className="text-[8px]" fill="#64748B"
                >
                  {e.labels?.protocol || e.rel_type}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(n => {
            const isHovered = hoveredNode === n.id;
            const isDashed = n.display?.dashed;

            return (
              <g
                key={n.id}
                className="diagram-node cursor-pointer"
                transform={`translate(${n.x}, ${n.y})`}
                onMouseEnter={() => setHoveredNode(n.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onMouseDown={(e) => handleNodeMouseDown(e, n.id, n.x, n.y)}
                onDoubleClick={() => onNodeClick(n.id)}
                data-testid={`diagram-node-${n.id}`}
              >
                {/* Node shape */}
                {n.display?.shape === "person" ? (
                  <>
                    <circle cx={nodeWidth / 2} cy={12} r={10} fill={n.display?.color || "#4A5568"} stroke={isHovered ? "#0F7173" : "transparent"} strokeWidth="2" />
                    <rect x={10} y={24} width={nodeWidth - 20} height={nodeHeight - 24} rx="4"
                      fill={n.display?.color || "#4A5568"} stroke={isHovered ? "#0F7173" : "transparent"} strokeWidth="2" />
                  </>
                ) : n.display?.shape === "cylinder" ? (
                  <>
                    <ellipse cx={nodeWidth / 2} cy={8} rx={nodeWidth / 2 - 4} ry={8}
                      fill={n.display?.color || "#7C5E3C"} stroke={isHovered ? "#0F7173" : "transparent"} strokeWidth="2" />
                    <rect x={4} y={8} width={nodeWidth - 8} height={nodeHeight - 16} fill={n.display?.color || "#7C5E3C"}
                      stroke={isHovered ? "#0F7173" : "transparent"} strokeWidth="2" />
                    <ellipse cx={nodeWidth / 2} cy={nodeHeight - 8} rx={nodeWidth / 2 - 4} ry={8}
                      fill={n.display?.color || "#7C5E3C"} stroke={isHovered ? "#0F7173" : "transparent"} strokeWidth="2" />
                  </>
                ) : (
                  <rect x="0" y="0" width={nodeWidth} height={nodeHeight} rx="6"
                    fill={n.display?.color || "#1B3A5C"}
                    stroke={isHovered ? "#0F7173" : "rgba(255,255,255,0.1)"}
                    strokeWidth={isHovered ? 2 : 1}
                    strokeDasharray={isDashed ? "6 3" : "none"}
                    opacity={isHovered ? 1 : 0.9}
                  />
                )}

                {/* Name */}
                <text x={nodeWidth / 2} y={nodeHeight / 2 - 4} textAnchor="middle"
                  fill="white" className="text-[11px] font-medium pointer-events-none"
                  style={{ fontSize: "11px" }}
                >
                  {n.name.length > 20 ? n.name.slice(0, 18) + "…" : n.name}
                </text>
                {/* Technology */}
                <text x={nodeWidth / 2} y={nodeHeight / 2 + 10} textAnchor="middle"
                  fill="rgba(255,255,255,0.6)" className="text-[9px] pointer-events-none"
                  style={{ fontSize: "9px" }}
                >
                  {n.labels?.secondary || ""}
                </text>

                {/* Badges */}
                {n.display?.badges?.map((badge: string, bi: number) => (
                  <g key={bi} transform={`translate(${nodeWidth - 6 - bi * 8}, -4)`}>
                    <circle r="4" fill={badge === "violation" ? "#EF4444" : badge === "deprecated" ? "#EF4444" : "#F59E0B"} />
                  </g>
                ))}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {hoveredNode && (() => {
        const n = nodes.find(nd => nd.id === hoveredNode);
        if (!n) return null;
        return (
          <div className="absolute top-2 right-2 bg-card border border-border rounded-lg p-3 shadow-lg max-w-[250px] text-xs z-10">
            <div className="font-semibold text-sm">{n.name}</div>
            <div className="text-muted-foreground mt-1 font-mono">{n.id}</div>
            {n.data?.description && <p className="text-muted-foreground mt-1 line-clamp-3">{n.data.description}</p>}
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-[10px]">{n.kind}</Badge>
              {n.data?.domain && <Badge variant="outline" className="text-[10px] capitalize">{n.data.domain}</Badge>}
            </div>
          </div>
        );
      })()}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-card/80 backdrop-blur border border-border rounded p-2 text-[10px] flex flex-wrap gap-3">
        {[
          { label: "System", color: "#1B3A5C" }, { label: "Container", color: "#0F7173" },
          { label: "Capability", color: "#6B4C9A" }, { label: "Actor", color: "#4A5568" },
          { label: "Data", color: "#7C5E3C" }, { label: "Goal", color: "#2563EB" },
          { label: "Decision", color: "#D97706" }, { label: "Standard", color: "#6D28D9" },
        ].map(item => (
          <span key={item.label} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// Parse query params from hash URL (e.g., /#/viewpoints/id?scope_system=foo)
function useHashQueryParams(): Record<string, string> {
  const [params, setParams] = useState<Record<string, string>>({});
  useEffect(() => {
    function parse() {
      const hash = window.location.hash; // e.g., #/viewpoints/id?scope_system=foo
      const qIndex = hash.indexOf("?");
      if (qIndex === -1) { setParams({}); return; }
      const qs = hash.slice(qIndex + 1);
      const result: Record<string, string> = {};
      new URLSearchParams(qs).forEach((v, k) => { result[k] = v; });
      setParams(result);
    }
    parse();
    window.addEventListener("hashchange", parse);
    return () => window.removeEventListener("hashchange", parse);
  }, []);
  return params;
}

// Sanitize IDs for Structurizr/Mermaid (replace dots, dashes, slashes with underscores)
function sanitizeId(id: string): string {
  return id.replace(/[.\-\/]/g, "_");
}

function generateStructurizrDSL(renderGraph: any, viewpointName: string): string {
  const nodes = renderGraph?.nodes || [];
  const edges = renderGraph?.edges || [];

  const modelLines: string[] = [];

  for (const n of nodes) {
    const sid = sanitizeId(n.id);
    const kind = n.kind || "softwareSystem";
    const name = (n.name || n.id).replace(/"/g, "'");
    const desc = (n.data?.description || "").replace(/"/g, "'");
    const tech = n.data?.technology_primary || "";
    if (tech) {
      modelLines.push(`    ${sid} = ${kind} "${name}" "${desc}" {`);
      modelLines.push(`      technology "${tech}"`);
      modelLines.push(`    }`);
    } else {
      modelLines.push(`    ${sid} = ${kind} "${name}" "${desc}"`);
    }
  }

  for (const e of edges) {
    const from = sanitizeId(e.from);
    const to = sanitizeId(e.to);
    const rel = (e.rel_type || "uses").replace(/"/g, "'");
    const proto = (e.labels?.protocol || "").replace(/"/g, "'");
    modelLines.push(`    ${from} -> ${to} "${rel}" "${proto}"`);
  }

  // Find first node as root system
  const rootId = nodes.length > 0 ? sanitizeId(nodes[0].id) : "root";
  const vpName = (viewpointName || "Viewpoint").replace(/"/g, "'");

  return [
    `workspace {`,
    `  model {`,
    ...modelLines,
    `  }`,
    `  views {`,
    `    container ${rootId} "${vpName}" {`,
    `      include *`,
    `      autoLayout`,
    `    }`,
    `  }`,
    `}`,
  ].join("\n");
}

function generateMermaidDiagram(renderGraph: any): string {
  const nodes = renderGraph?.nodes || [];
  const edges = renderGraph?.edges || [];
  const groups = renderGraph?.groups || [];

  const lines: string[] = ["graph TD"];

  // Node definitions
  for (const n of nodes) {
    const sid = sanitizeId(n.id);
    const name = (n.name || n.id).replace(/"/g, "'");
    const tech = n.data?.technology_primary || "";
    const label = tech ? `${name}<br/>${tech}` : name;
    lines.push(`  ${sid}["${label}"]`);
  }

  // Edge definitions
  for (const e of edges) {
    const from = sanitizeId(e.from);
    const to = sanitizeId(e.to);
    const label = (e.labels?.protocol || e.rel_type || "").replace(/"/g, "'");
    lines.push(`  ${from} -->|"${label}"| ${to}`);
  }

  // Subgraphs for groups
  for (const g of groups) {
    const groupLabel = (g.label || g.id).replace(/"/g, "'");
    lines.push(`  subgraph ${groupLabel}`);
    for (const memberId of (g.members || [])) {
      lines.push(`    ${sanitizeId(memberId)}`);
    }
    lines.push(`  end`);
  }

  return lines.join("\n");
}

export default function ViewpointDiagramPage() {
  const [, params] = useRoute("/viewpoints/:id");
  const [, setLocation] = useLocation();
  const viewpointId = params?.id ? decodeURIComponent(params.id) : "";
  const hashParams = useHashQueryParams();
  const { toast } = useToast();

  const [selectedEntity, setSelectedEntity] = useState(hashParams.scope_system || hashParams.entity_id || "system.claims-processing");
  const [selectedDomain, setSelectedDomain] = useState(hashParams.scope_domain || hashParams.domain || "claims");

  // Sync from URL params on initial load
  useEffect(() => {
    if (hashParams.scope_system || hashParams.entity_id) {
      setSelectedEntity(hashParams.scope_system || hashParams.entity_id || "");
    }
    if (hashParams.scope_domain || hashParams.domain) {
      setSelectedDomain(hashParams.scope_domain || hashParams.domain || "");
    }
  }, [hashParams.scope_system, hashParams.entity_id, hashParams.scope_domain, hashParams.domain]);

  const { data: viewpoint } = useQuery<ViewpointDefinition>({
    queryKey: ["/api/viewpoints", viewpointId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/viewpoints/${encodeURIComponent(viewpointId)}`);
      return res.json();
    },
    enabled: !!viewpointId,
  });

  const { data: allEntities } = useQuery<Entity[]>({
    queryKey: ["/api/search", "for-viewpoint"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/search?q=&kind=system");
      return res.json();
    },
  });

  const scopeStrategy = viewpoint?.scope_strategy;
  const scopeParams = scopeStrategy === "parameter-seed"
    ? `entity_id=${encodeURIComponent(selectedEntity)}`
    : scopeStrategy === "domain-query"
    ? `domain=${encodeURIComponent(selectedDomain)}`
    : "";

  const { data: resolved, isLoading, refetch } = useQuery<any>({
    queryKey: ["/api/viewpoints", viewpointId, "resolve", scopeParams],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/viewpoints/${encodeURIComponent(viewpointId)}/resolve?${scopeParams}`);
      return res.json();
    },
    enabled: !!viewpointId && !!viewpoint,
  });

  const systems = (allEntities || []).filter(e => e.kind === "system" && e.branch === "main");
  const domains = [...new Set((allEntities || []).map(e => e.domain))];

  const handleNodeClick = (eamsId: string) => {
    setLocation(`/entities/${encodeURIComponent(eamsId)}`);
  };

  const handleExportSVG = () => {
    const svg = document.querySelector("[data-testid='diagram-svg']");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${viewpointId}-diagram.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportStructurizr = async () => {
    if (!resolved?.render_graph) return;
    const dsl = generateStructurizrDSL(resolved.render_graph, viewpoint?.name || viewpointId);
    try {
      await navigator.clipboard.writeText(dsl);
      toast({ title: "Structurizr DSL copied", description: "Diagram DSL copied to clipboard" });
    } catch {
      // Fallback: download as file
      const blob = new Blob([dsl], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${viewpointId}-diagram.dsl`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Structurizr DSL downloaded", description: "Saved as .dsl file" });
    }
  };

  const handleExportMermaid = async () => {
    if (!resolved?.render_graph) return;
    const mmd = generateMermaidDiagram(resolved.render_graph);
    try {
      await navigator.clipboard.writeText(mmd);
      toast({ title: "Mermaid diagram copied", description: "Mermaid diagram text copied to clipboard" });
    } catch {
      // Fallback: download as file
      const blob = new Blob([mmd], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${viewpointId}-diagram.mmd`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Mermaid diagram downloaded", description: "Saved as .mmd file" });
    }
  };

  return (
    <div className="h-full flex flex-col" data-testid="viewpoint-diagram-page">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border shrink-0 bg-card/50">
        <Eye className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">{viewpoint?.name || viewpointId}</span>

        {/* Scope selector */}
        {scopeStrategy === "parameter-seed" && (
          <Select value={selectedEntity} onValueChange={setSelectedEntity}>
            <SelectTrigger className="w-[220px] h-7 text-xs" data-testid="scope-entity-select">
              <SelectValue placeholder="Select entity" />
            </SelectTrigger>
            <SelectContent>
              {systems.map(s => (
                <SelectItem key={s.eams_id} value={s.eams_id} className="text-xs">{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {scopeStrategy === "domain-query" && (
          <Select value={selectedDomain} onValueChange={setSelectedDomain}>
            <SelectTrigger className="w-[160px] h-7 text-xs" data-testid="scope-domain-select">
              <SelectValue placeholder="Select domain" />
            </SelectTrigger>
            <SelectContent>
              {domains.map(d => (
                <SelectItem key={d} value={d} className="text-xs capitalize">{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => refetch()} data-testid="refresh-diagram">
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
        </Button>

        <div className="flex-1" />

        {resolved && (
          <span className="text-[10px] text-muted-foreground">
            {resolved.render_graph?.metadata?.node_count || 0} nodes · {resolved.render_graph?.metadata?.edge_count || 0} edges
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs" data-testid="export-dropdown-trigger">
              <Download className="w-3.5 h-3.5 mr-1" /> Export <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            <DropdownMenuItem
              className="text-xs cursor-pointer"
              onClick={handleExportSVG}
              data-testid="export-svg"
            >
              <Download className="w-3.5 h-3.5 mr-2" /> SVG
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-xs cursor-pointer"
              onClick={handleExportStructurizr}
              data-testid="export-structurizr"
            >
              <Copy className="w-3.5 h-3.5 mr-2" /> Structurizr DSL
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-xs cursor-pointer"
              onClick={handleExportMermaid}
              data-testid="export-mermaid"
            >
              <Copy className="w-3.5 h-3.5 mr-2" /> Mermaid
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Diagram area */}
      <div className="flex-1 p-2 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Resolving viewpoint...
          </div>
        ) : resolved?.render_graph ? (
          <DiagramRenderer renderGraph={resolved.render_graph} onNodeClick={handleNodeClick} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Select scope parameters to render diagram
          </div>
        )}
      </div>
    </div>
  );
}
