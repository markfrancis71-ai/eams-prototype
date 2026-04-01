import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Layers, Box, Hexagon, Database, Target, FileText, Shield, CircleUser, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Entity } from "@shared/schema";

const KIND_ICONS: Record<string, any> = {
  system: Box, container: Database, capability: Hexagon,
  process: FileText, data_entity: Database, goal: Target,
  decision: FileText, standard: Shield, actor: CircleUser,
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500", proposed: "bg-amber-500",
  deprecated: "bg-red-500", retired: "bg-gray-500",
};

const CRITICALITY_COLORS: Record<string, string> = {
  "tier-1": "text-red-400 bg-red-500/10 border-red-500/20",
  "tier-2": "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "tier-3": "text-blue-400 bg-blue-500/10 border-blue-500/20",
};

export default function DomainsPage() {
  const { data: domains } = useQuery<string[]>({ queryKey: ["/api/domains"] });
  const { data: allEntities } = useQuery<Entity[]>({
    queryKey: ["/api/search", "all"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/search?q=");
      return res.json();
    },
  });
  const { data: findings } = useQuery<any[]>({
    queryKey: ["/api/compile/records"],
  });

  const mainEntities = (allEntities || []).filter(e => e.branch === "main");
  const entitiesByDomain = (domain: string) => mainEntities.filter(e => e.domain === domain);
  const systemsByDomain = (domain: string) => entitiesByDomain(domain).filter(e => e.kind === "system");
  const kindCount = (domain: string, kind: string) => entitiesByDomain(domain).filter(e => e.kind === kind).length;

  return (
    <div className="p-6 max-w-[1200px]" data-testid="domains-page">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Architecture Domains</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mainEntities.length} entities across {(domains || []).length} domains
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(domains || []).map(domain => {
          const systems = systemsByDomain(domain);
          const total = entitiesByDomain(domain).length;
          const violations = entitiesByDomain(domain).filter(e => e.compliance_status === "violation").length;
          const warnings = entitiesByDomain(domain).filter(e => e.compliance_status === "warning").length;

          return (
            <div key={domain} className="border border-border rounded-lg bg-card p-4" data-testid={`domain-card-${domain}`}>
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-primary" />
                <h2 className="text-base font-semibold capitalize">{domain}</h2>
                <Badge variant="outline" className="ml-auto text-xs">{total} entities</Badge>
              </div>

              {/* Kind breakdown */}
              <div className="flex flex-wrap gap-2 mb-3">
                {["system", "container", "capability", "process", "data_entity"].map(kind => {
                  const count = kindCount(domain, kind);
                  if (count === 0) return null;
                  return (
                    <span key={kind} className="text-[11px] text-muted-foreground">
                      {count} {kind === "data_entity" ? (count === 1 ? "data entity" : "data entities") : kind === "capability" ? (count === 1 ? "capability" : "capabilities") : kind === "process" ? (count === 1 ? "process" : "processes") : count === 1 ? kind : kind + "s"}
                    </span>
                  );
                })}
              </div>

              {/* Compliance status */}
              {(violations > 0 || warnings > 0) && (
                <div className="flex items-center gap-3 mb-3 text-xs">
                  {violations > 0 && (
                    <span className="flex items-center gap-1 text-red-400">
                      <AlertTriangle className="w-3 h-3" /> {violations} violation{violations !== 1 ? "s" : ""}
                    </span>
                  )}
                  {warnings > 0 && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <AlertTriangle className="w-3 h-3" /> {warnings} warning{warnings !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              )}

              {/* Systems list */}
              <div className="space-y-1">
                {systems.map(sys => (
                  <Link
                    key={sys.eams_id}
                    href={`/entities/${encodeURIComponent(sys.eams_id)}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/50 group"
                    data-testid={`system-link-${sys.eams_id}`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLORS[sys.status]}`} />
                    <span className="text-sm group-hover:text-primary truncate">{sys.name}</span>
                    {sys.criticality && (
                      <Badge variant="outline" className={`text-[10px] px-1 py-0 ml-auto shrink-0 ${CRITICALITY_COLORS[sys.criticality] || ""}`}>
                        {sys.criticality}
                      </Badge>
                    )}
                    {sys.compliance_status === "violation" && (
                      <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                    )}
                    {sys.compliance_status === "warning" && (
                      <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
