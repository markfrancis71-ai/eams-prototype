import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { GitBranch, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Branch } from "@shared/schema";

const INTENT_COLORS: Record<string, string> = {
  project: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  proposal: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  experiment: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  migration: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const REVIEW_COLORS: Record<string, string> = {
  draft: "bg-gray-500/15 text-gray-400", "in-review": "bg-blue-500/15 text-blue-400",
  approved: "bg-emerald-500/15 text-emerald-400", merged: "bg-purple-500/15 text-purple-400",
};

export default function BranchesPage() {
  const { data: branches, isLoading } = useQuery<Branch[]>({ queryKey: ["/api/branches"] });

  return (
    <div className="p-6 max-w-[900px]" data-testid="branches-page">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Branches</h1>
        <p className="text-sm text-muted-foreground mt-1">Architecture change branches and proposals</p>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1,2].map(i => <div key={i} className="h-24 bg-muted rounded-lg" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {(branches || []).map(b => (
            <Link
              key={b.branch_name}
              href={`/branches/${encodeURIComponent(b.branch_name)}`}
              className="block border border-border rounded-lg p-4 bg-card hover:border-primary/30 transition-colors"
              data-testid={`branch-card-${b.branch_name}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold font-mono">{b.branch_name}</span>
                <Badge className={`text-[10px] border ${INTENT_COLORS[b.intent || ""] || ""}`}>{b.intent}</Badge>
                <Badge className={`text-[10px] ${REVIEW_COLORS[b.review_status || ""] || ""}`}>{b.review_status}</Badge>
              </div>
              {b.description && <p className="text-xs text-muted-foreground mb-2">{b.description}</p>}
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                {b.author && <span className="flex items-center gap-1"><User className="w-3 h-3" />{b.author}</span>}
                <span>base: {b.base_branch}</span>
                {b.created_at && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(b.created_at).toLocaleDateString()}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
