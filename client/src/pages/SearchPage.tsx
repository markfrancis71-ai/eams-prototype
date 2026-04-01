import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Search, Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Entity } from "@shared/schema";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500", proposed: "bg-amber-500",
  deprecated: "bg-red-500", retired: "bg-gray-500",
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: results, isLoading } = useQuery<Entity[]>({
    queryKey: ["/api/search", query, domainFilter, kindFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (domainFilter) params.set("domain", domainFilter);
      if (kindFilter) params.set("kind", kindFilter);
      if (statusFilter) params.set("status", statusFilter);
      const res = await apiRequest("GET", `/api/search?${params.toString()}`);
      return res.json();
    },
  });

  const { data: domains } = useQuery<string[]>({ queryKey: ["/api/domains"] });

  // Group results by kind
  const grouped = (results || []).reduce<Record<string, Entity[]>>((acc, e) => {
    (acc[e.kind] = acc[e.kind] || []).push(e);
    return acc;
  }, {});

  const hasFilters = domainFilter || kindFilter || statusFilter;

  return (
    <div className="p-6 max-w-[900px]" data-testid="search-page">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Search</h1>
      </div>

      {/* Search input */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search entities by name, ID, or description..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            data-testid="search-page-input"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        <Select value={domainFilter} onValueChange={v => setDomainFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[140px] h-7 text-xs" data-testid="filter-domain">
            <SelectValue placeholder="Domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All domains</SelectItem>
            {(domains || []).map(d => <SelectItem key={d} value={d} className="text-xs capitalize">{d}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={kindFilter} onValueChange={v => setKindFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[140px] h-7 text-xs" data-testid="filter-kind">
            <SelectValue placeholder="Kind" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All kinds</SelectItem>
            {["system", "container", "capability", "process", "data_entity", "goal", "decision", "standard", "actor"].map(k =>
              <SelectItem key={k} value={k} className="text-xs">{k}</SelectItem>
            )}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={v => setStatusFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[140px] h-7 text-xs" data-testid="filter-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All statuses</SelectItem>
            {["active", "proposed", "deprecated", "retired"].map(s =>
              <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
            )}
          </SelectContent>
        </Select>

        {hasFilters && (
          <button
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            onClick={() => { setDomainFilter(""); setKindFilter(""); setStatusFilter(""); }}
            data-testid="clear-filters"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}

        <span className="text-xs text-muted-foreground ml-auto">{(results || []).length} results</span>
      </div>

      {/* Results grouped by kind */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-12 bg-muted rounded" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([kind, items]) => (
            <div key={kind}>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                {kind.replace(/_/g, " ")} ({items.length})
              </h3>
              <div className="space-y-0.5">
                {items.map(e => (
                  <Link
                    key={e.eams_id}
                    href={`/entities/${encodeURIComponent(e.eams_id)}`}
                    className="flex items-center gap-3 px-3 py-2 rounded hover:bg-card group"
                    data-testid={`search-result-${e.eams_id}`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLORS[e.status]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm group-hover:text-primary truncate">{e.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono truncate">{e.eams_id}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize shrink-0">{e.domain}</Badge>
                    {e.criticality && <Badge variant="outline" className="text-[10px] shrink-0">{e.criticality}</Badge>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-12">
              {query ? "No matching entities found" : "Enter a search query or apply filters"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
