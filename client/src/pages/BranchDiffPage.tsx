import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useRoute, Link } from "wouter";
import { GitBranch, Plus, Pencil, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Branch } from "@shared/schema";

export default function BranchDiffPage() {
  const [, params] = useRoute("/branches/:slug");
  const branchName = params?.slug ? decodeURIComponent(params.slug) : "";

  const { data: branch } = useQuery<Branch>({
    queryKey: ["/api/branches", branchName],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/branches/${encodeURIComponent(branchName)}`);
      return res.json();
    },
    enabled: !!branchName,
  });

  const { data: diff, isLoading } = useQuery<any>({
    queryKey: ["/api/diff", branchName],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/diff/${encodeURIComponent(branchName)}`);
      return res.json();
    },
    enabled: !!branchName,
  });

  return (
    <div className="p-6 max-w-[900px]" data-testid="branch-diff-page">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold font-mono">{branchName}</h1>
        </div>
        {branch?.description && <p className="text-sm text-muted-foreground mt-2">{branch.description}</p>}
        <div className="flex items-center gap-3 mt-2">
          {branch?.intent && <Badge variant="outline" className="text-xs">{branch.intent}</Badge>}
          {branch?.review_status && <Badge variant="outline" className="text-xs">{branch.review_status}</Badge>}
          {branch?.author && <span className="text-xs text-muted-foreground">{branch.author}</span>}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-lg" />)}
        </div>
      ) : diff ? (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Plus className="w-4 h-4" /> {diff.summary?.added || 0} added
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <Pencil className="w-4 h-4" /> {diff.summary?.modified || 0} modified
            </span>
            <span className="flex items-center gap-1.5 text-red-400">
              <Minus className="w-4 h-4" /> {diff.summary?.removed || 0} removed
            </span>
          </div>

          {/* Added */}
          {diff.added?.length > 0 && (
            <div className="border border-emerald-500/30 rounded-lg p-4 bg-emerald-500/5">
              <h3 className="text-sm font-medium text-emerald-400 mb-2 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Added Entities
              </h3>
              <div className="space-y-1">
                {diff.added.map((e: any) => (
                  <Link
                    key={e.eams_id}
                    href={`/entities/${encodeURIComponent(e.eams_id)}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-emerald-500/10 text-sm"
                    data-testid={`diff-added-${e.eams_id}`}
                  >
                    <span className="font-mono text-xs text-muted-foreground">{e.eams_id}</span>
                    <span>{e.name}</span>
                    <Badge variant="outline" className="text-[10px] ml-auto">{e.kind}</Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Modified */}
          {diff.modified?.length > 0 && (
            <div className="border border-amber-500/30 rounded-lg p-4 bg-amber-500/5">
              <h3 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                <Pencil className="w-4 h-4" /> Modified Entities
              </h3>
              <div className="space-y-1">
                {diff.modified.map((e: any) => (
                  <div key={e.eams_id} className="flex items-center gap-2 px-2 py-1.5 text-sm">
                    <span className="font-mono text-xs text-muted-foreground">{e.eams_id}</span>
                    <span>{e.name}</span>
                    <Badge variant="outline" className="text-[10px] ml-auto">{e.kind}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Removed */}
          {diff.removed?.length > 0 && (
            <div className="border border-red-500/30 rounded-lg p-4 bg-red-500/5">
              <h3 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                <Minus className="w-4 h-4" /> Removed Entities
              </h3>
              <div className="space-y-1">
                {diff.removed.map((e: any) => (
                  <div key={e.eams_id} className="flex items-center gap-2 px-2 py-1.5 text-sm line-through opacity-60">
                    <span className="font-mono text-xs">{e.eams_id}</span>
                    <span>{e.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!diff.added?.length && !diff.modified?.length && !diff.removed?.length) && (
            <div className="text-sm text-muted-foreground text-center py-8">No differences found</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
