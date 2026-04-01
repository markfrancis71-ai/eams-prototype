import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Eye, Users, Layers, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ViewpointDefinition } from "@shared/schema";
import { usePersona } from "@/lib/persona-context";

export default function ViewpointsPage() {
  const { persona } = usePersona();
  const { data: viewpoints, isLoading } = useQuery<ViewpointDefinition[]>({
    queryKey: ["/api/viewpoints"],
  });

  const recommended = useMemo(() => {
    if (!viewpoints) return [];
    return viewpoints.filter(vp => {
      const stakeholders: string[] = JSON.parse(vp.stakeholders || "[]");
      return persona.viewpointFilter.some(tag => stakeholders.includes(tag));
    });
  }, [viewpoints, persona.viewpointFilter]);

  const ViewpointCard = ({ vp }: { vp: ViewpointDefinition }) => {
    const stakeholders = JSON.parse(vp.stakeholders || "[]");
    return (
      <Link
        key={vp.viewpoint_id}
        href={`/viewpoints/${encodeURIComponent(vp.viewpoint_id)}`}
        className="block border border-border rounded-lg p-4 bg-card hover:bg-card/80 hover:border-primary/30 transition-colors"
        data-testid={`viewpoint-card-${vp.viewpoint_id}`}
      >
        <div className="flex items-start gap-3">
          <Eye className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{vp.name}</span>
              <Badge variant="outline" className="text-[10px] font-mono">{vp.viewpoint_id}</Badge>
            </div>
            {vp.description && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{vp.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Layers className="w-3 h-3" /> {vp.scope_strategy}
              </span>
              {stakeholders.length > 0 && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" /> {stakeholders.join(", ")}
                </span>
              )}
              {vp.version && <Badge variant="outline" className="text-[10px]">v{vp.version}</Badge>}
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="p-6 max-w-[900px]" data-testid="viewpoints-page">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Viewpoint Catalog</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pre-defined architectural viewpoints for diagram generation
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-lg" />)}
        </div>
      ) : (
        <>
        {/* Recommended for you */}
        {recommended.length > 0 && (
          <div className="mb-6" data-testid="recommended-viewpoints">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">Recommended for you</h2>
              <span className="text-[10px] text-muted-foreground">Based on {persona.label} role</span>
            </div>
            <div className="space-y-3">
              {recommended.map(vp => <ViewpointCard key={vp.viewpoint_id} vp={vp} />)}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {(viewpoints || []).map(vp => (
            <ViewpointCard key={vp.viewpoint_id} vp={vp} />
          ))}
        </div>
        </>
      )}
    </div>
  );
}
