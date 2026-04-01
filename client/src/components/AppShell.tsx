import { useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Network, Search, Eye, GitBranch, BrainCircuit, ChevronRight,
  ChevronDown, Circle, AlertTriangle, Layers, FileCode, Play,
  Menu, X, Command, User, Workflow, Zap, Boxes, HeartPulse, FlaskConical,
  Check, Compass,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePersona } from "@/lib/persona-context";
import { PERSONAS } from "@/lib/personas";
import { useTour } from "@/lib/tour-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Entity, CompileRecord } from "@shared/schema";

const KIND_GROUPS = ["system", "container", "capability", "process", "data_entity", "goal", "decision", "standard", "actor", "infrastructure"];
const KIND_LABELS: Record<string, string> = {
  system: "Systems", container: "Containers", capability: "Capabilities",
  process: "Processes", data_entity: "Data Entities", goal: "Goals",
  decision: "Decisions", standard: "Standards", actor: "Actors",
  infrastructure: "Infrastructure", data_product: "Data Products",
};
const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500", proposed: "bg-amber-500",
  deprecated: "bg-red-500", retired: "bg-gray-500",
};
const COMPLIANCE_ICONS: Record<string, boolean> = { violation: true, warning: true };

type SidebarTab = "domains" | "search" | "viewpoints" | "branches" | "advisory";

function EamsLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-label="EAMS Logo">
      <rect x="2" y="2" width="28" height="28" rx="6" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M8 10h16M8 16h12M8 22h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="16" r="3" fill="hsl(181 76% 25%)" />
    </svg>
  );
}

function DomainTree({ onNavigate }: { onNavigate: (eamsId: string) => void }) {
  const [, setLocation] = useLocation();
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set(["claims"]));
  const [expandedKinds, setExpandedKinds] = useState<Set<string>>(new Set(["claims:system"]));

  const { data: domains } = useQuery<string[]>({ queryKey: ["/api/domains"] });
  const { data: allEntities } = useQuery<Entity[]>({
    queryKey: ["/api/search"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/search?q=");
      return res.json();
    },
  });

  const toggleDomain = (d: string) => {
    const next = new Set(expandedDomains);
    next.has(d) ? next.delete(d) : next.add(d);
    setExpandedDomains(next);
  };

  const toggleKind = (key: string) => {
    const next = new Set(expandedKinds);
    next.has(key) ? next.delete(key) : next.add(key);
    setExpandedKinds(next);
  };

  const entitiesByDomainKind = (domain: string, kind: string) =>
    (allEntities || []).filter(e => e.domain === domain && e.kind === kind && e.branch === "main");

  return (
    <div className="text-sm" data-testid="domain-tree">
      {(domains || []).map(domain => (
        <div key={domain}>
          <button
            className="flex items-center gap-1.5 w-full px-2 py-1.5 hover:bg-accent/50 rounded text-left font-medium capitalize"
            onClick={() => toggleDomain(domain)}
            data-testid={`domain-${domain}`}
          >
            {expandedDomains.has(domain) ? <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />}
            <Layers className="w-3.5 h-3.5 shrink-0 text-primary" />
            <span>{domain}</span>
          </button>
          {expandedDomains.has(domain) && (
            <div className="ml-3 border-l border-border">
              {KIND_GROUPS.map(kind => {
                const items = entitiesByDomainKind(domain, kind);
                if (items.length === 0) return null;
                const key = `${domain}:${kind}`;
                return (
                  <div key={kind} className="ml-2">
                    <button
                      className="flex items-center gap-1.5 w-full px-2 py-1 hover:bg-accent/50 rounded text-left text-muted-foreground text-xs"
                      onClick={() => toggleKind(key)}
                      data-testid={`kind-group-${key}`}
                    >
                      {expandedKinds.has(key) ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
                      <span className="uppercase tracking-wide">{KIND_LABELS[kind] || kind}</span>
                      <span className="ml-auto opacity-60">{items.length}</span>
                    </button>
                    {expandedKinds.has(key) && (
                      <div className="ml-4">
                        {items.map(entity => (
                          <button
                            key={entity.eams_id}
                            className="flex items-center gap-1.5 w-full px-2 py-1 hover:bg-accent/50 rounded text-left text-xs group"
                            onClick={() => {
                              onNavigate(entity.eams_id);
                              setLocation(`/entities/${encodeURIComponent(entity.eams_id)}`);
                            }}
                            data-testid={`entity-tree-${entity.eams_id}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_COLORS[entity.status] || "bg-gray-500"}`} />
                            <span className="truncate group-hover:text-primary">{entity.name}</span>
                            {COMPLIANCE_ICONS[entity.compliance_status || ""] && (
                              <AlertTriangle className="w-3 h-3 shrink-0 text-amber-500 ml-auto" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SidebarSearch({ onNavigate }: { onNavigate: (eamsId: string) => void }) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const { data: results } = useQuery<Entity[]>({
    queryKey: ["/api/search", { q: query }],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/search?q=${encodeURIComponent(query)}`);
      return res.json();
    },
    enabled: query.length >= 2,
  });

  return (
    <div data-testid="sidebar-search">
      <input
        type="search"
        placeholder="Search entities..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="w-full px-3 py-1.5 rounded bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        data-testid="search-input"
      />
      {results && results.length > 0 && (
        <div className="mt-2 space-y-0.5 text-xs">
          {results.slice(0, 20).map(e => (
            <button
              key={e.eams_id}
              className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-accent/50 rounded text-left"
              onClick={() => {
                onNavigate(e.eams_id);
                setLocation(`/entities/${encodeURIComponent(e.eams_id)}`);
              }}
              data-testid={`search-result-${e.eams_id}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_COLORS[e.status]}`} />
              <span className="truncate">{e.name}</span>
              <Badge variant="outline" className="ml-auto text-[10px] px-1 py-0">{e.kind}</Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarViewpoints() {
  const [, setLocation] = useLocation();
  const { data: viewpoints } = useQuery<any[]>({ queryKey: ["/api/viewpoints"] });

  return (
    <div className="space-y-0.5 text-xs" data-testid="sidebar-viewpoints">
      {(viewpoints || []).map(vp => (
        <button
          key={vp.viewpoint_id}
          className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-accent/50 rounded text-left"
          onClick={() => setLocation(`/viewpoints/${encodeURIComponent(vp.viewpoint_id)}`)}
          data-testid={`viewpoint-${vp.viewpoint_id}`}
        >
          <Eye className="w-3.5 h-3.5 shrink-0 text-primary" />
          <span className="truncate">{vp.name}</span>
        </button>
      ))}
    </div>
  );
}

function SidebarBranches() {
  const [, setLocation] = useLocation();
  const { data: branchesList } = useQuery<any[]>({ queryKey: ["/api/branches"] });
  const intentColors: Record<string, string> = {
    project: "bg-blue-500/20 text-blue-400", proposal: "bg-purple-500/20 text-purple-400",
    experiment: "bg-amber-500/20 text-amber-400", migration: "bg-emerald-500/20 text-emerald-400",
  };

  return (
    <div className="space-y-1 text-xs" data-testid="sidebar-branches">
      {(branchesList || []).map(b => (
        <button
          key={b.branch_name}
          className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-accent/50 rounded text-left"
          onClick={() => setLocation(`/branches/${encodeURIComponent(b.branch_name)}`)}
          data-testid={`branch-${b.branch_name}`}
        >
          <GitBranch className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{b.branch_name}</span>
          <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${intentColors[b.intent] || "bg-muted text-muted-foreground"}`}>
            {b.intent}
          </span>
        </button>
      ))}
    </div>
  );
}

function SidebarAdvisory() {
  const [, setLocation] = useLocation();
  const { data: advisoryList } = useQuery<any[]>({ queryKey: ["/api/advisory"] });
  const typeColors: Record<string, string> = {
    compliance_assessment: "bg-red-500/20 text-red-400",
    risk_identification: "bg-amber-500/20 text-amber-400",
    explanation: "bg-blue-500/20 text-blue-400",
    design_alternatives: "bg-purple-500/20 text-purple-400",
  };

  return (
    <div className="space-y-1 text-xs" data-testid="sidebar-advisory">
      {(advisoryList || []).map(a => (
        <button
          key={a.advisory_id}
          className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-accent/50 rounded text-left"
          onClick={() => setLocation(`/advisory/${encodeURIComponent(a.advisory_id)}`)}
          data-testid={`advisory-${a.advisory_id}`}
        >
          <BrainCircuit className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{a.scope_entity_id}</span>
          <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${typeColors[a.output_type] || "bg-muted"}`}>
            {a.status === "pending" ? "●" : "✓"}
          </span>
        </button>
      ))}
    </div>
  );
}

function TourButton() {
  const { startTour } = useTour();
  return (
    <button
      onClick={() => startTour()}
      className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
      data-testid="start-tour-button"
    >
      <Compass className="w-3.5 h-3.5" />
      <span>Tour</span>
    </button>
  );
}

function PersonaSwitcher() {
  const { persona, setPersonaId } = usePersona();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-accent/50 text-xs" data-testid="persona-switcher">
          <span>{persona.icon}</span>
          <span className="text-foreground font-medium">{persona.title}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px]">
        {PERSONAS.map(p => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => setPersonaId(p.id)}
            className="flex items-start gap-3 py-2 cursor-pointer"
            data-testid={`persona-option-${p.id}`}
          >
            <span className="text-lg mt-0.5">{p.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{p.title}</span>
                {persona.id === p.id && <Check className="w-3.5 h-3.5 text-primary" />}
              </div>
              <div className="text-[11px] text-muted-foreground">{p.label}</div>
              <div className="text-[10px] text-muted-foreground/70 mt-0.5">{p.description}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("domains");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  const { data: compileStatus } = useQuery<any>({
    queryKey: ["/api/compile/status"],
  });

  const compileColor = compileStatus?.status === "success" ? "bg-emerald-500" :
    compileStatus?.status === "partial_success" ? "bg-amber-500" :
    compileStatus?.status === "failed" ? "bg-red-500" : "bg-gray-500";

  const tabs: { id: SidebarTab; icon: any; label: string }[] = [
    { id: "domains", icon: Network, label: "Domains" },
    { id: "search", icon: Search, label: "Search" },
    { id: "viewpoints", icon: Eye, label: "Viewpoints" },
    { id: "branches", icon: GitBranch, label: "Branches" },
    { id: "advisory", icon: BrainCircuit, label: "Advisory" },
  ];

  const handleNavigate = useCallback((_eamsId: string) => {}, []);

  // Quick search overlay
  const QuickSearch = () => {
    const [query, setQuery] = useState("");
    const { data: results } = useQuery<Entity[]>({
      queryKey: ["/api/search", { q: query, modal: true }],
      queryFn: async () => {
        const res = await apiRequest("GET", `/api/search?q=${encodeURIComponent(query)}`);
        return res.json();
      },
      enabled: query.length >= 2,
    });

    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60" onClick={() => setSearchOpen(false)}>
        <div className="w-[560px] bg-card border border-border rounded-lg shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              autoFocus
              type="text"
              placeholder="Search entities, systems, containers..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none"
              data-testid="quick-search-input"
            />
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">ESC</kbd>
          </div>
          {results && results.length > 0 && (
            <ScrollArea className="max-h-[300px]">
              <div className="p-2 space-y-0.5">
                {results.slice(0, 15).map(e => (
                  <button
                    key={e.eams_id}
                    className="flex items-center gap-3 w-full px-3 py-2 hover:bg-accent/50 rounded text-left text-sm"
                    onClick={() => {
                      setSearchOpen(false);
                      setLocation(`/entities/${encodeURIComponent(e.eams_id)}`);
                    }}
                    data-testid={`quick-result-${e.eams_id}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[e.status]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{e.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{e.eams_id}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{e.kind}</Badge>
                    <Badge variant="outline" className="text-[10px] shrink-0 capitalize">{e.domain}</Badge>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
          {query.length >= 2 && (!results || results.length === 0) && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No results found</div>
          )}
        </div>
      </div>
    );
  };

  // Keyboard shortcut for Cmd+K
  if (typeof window !== "undefined") {
    (window as any).__eamsSearchHandler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    if (!(window as any).__eamsSearchBound) {
      window.addEventListener("keydown", (window as any).__eamsSearchHandler);
      (window as any).__eamsSearchBound = true;
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden" data-testid="app-shell">
      {/* Top Bar */}
      <header className="h-10 flex items-center gap-3 px-3 border-b border-border bg-card/50 shrink-0 z-30">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground" data-testid="toggle-sidebar">
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
        <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary">
          <EamsLogo />
          <span className="text-sm font-semibold tracking-tight">EAMS</span>
        </Link>

        <div className="flex items-center gap-1.5 ml-4">
          <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">main</span>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 ml-2">
              <span className={`w-2 h-2 rounded-full ${compileColor}`} />
              <span className="text-xs text-muted-foreground">{compileStatus?.status || "none"}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>Compile: {compileStatus?.status || "No compile records"}</TooltipContent>
        </Tooltip>

        <div className="flex-1" />

        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1 rounded bg-muted/50 border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
          data-testid="global-search-button"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
          <kbd className="text-[10px] ml-2 px-1 py-0.5 rounded bg-background border border-border">⌘K</kbd>
        </button>

        <TourButton />
        <PersonaSwitcher />
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-[260px] shrink-0 border-r border-border bg-sidebar flex flex-col overflow-hidden" data-testid="sidebar">
            {/* Sidebar tabs */}
            <div className="flex border-b border-border shrink-0">
              {tabs.map(tab => (
                <Tooltip key={tab.id}>
                  <TooltipTrigger asChild>
                    <button
                      className={`flex-1 flex items-center justify-center py-2 text-xs transition-colors ${
                        sidebarTab === tab.id
                          ? "text-primary border-b-2 border-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setSidebarTab(tab.id)}
                      data-testid={`sidebar-tab-${tab.id}`}
                    >
                      <tab.icon className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{tab.label}</TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Sidebar content */}
            <ScrollArea className="flex-1 p-2">
              {sidebarTab === "domains" && <DomainTree onNavigate={handleNavigate} />}
              {sidebarTab === "search" && <SidebarSearch onNavigate={handleNavigate} />}
              {sidebarTab === "viewpoints" && <SidebarViewpoints />}
              {sidebarTab === "branches" && <SidebarBranches />}
              {sidebarTab === "advisory" && <SidebarAdvisory />}
            </ScrollArea>

            {/* Sidebar footer nav */}
            <div className="border-t border-border p-2 space-y-0.5 shrink-0">
              <Link href="/health" className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded" data-testid="nav-health">
                <HeartPulse className="w-3.5 h-3.5" /> Health
              </Link>
              <Link href="/scenarios" className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded" data-testid="nav-scenarios">
                <FlaskConical className="w-3.5 h-3.5" /> Scenarios
              </Link>
              <Link href="/signals" className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded" data-testid="nav-signals">
                <Zap className="w-3.5 h-3.5" /> Signals
              </Link>
              <Link href="/metamodel" className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded" data-testid="nav-metamodel">
                <Boxes className="w-3.5 h-3.5" /> Metamodel
              </Link>
              <Link href="/compile" className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded" data-testid="nav-compile">
                <Play className="w-3.5 h-3.5" /> Compile
              </Link>
              <Link href="/dsl" className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded" data-testid="nav-dsl">
                <FileCode className="w-3.5 h-3.5" /> DSL Editor
              </Link>
              <Link href="/lineage" className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded" data-testid="nav-lineage">
                <Workflow className="w-3.5 h-3.5" /> Lineage
              </Link>
            </div>
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto" data-testid="main-content">
          {children}
        </main>
      </div>

      {/* Status Bar */}
      <footer className="h-6 flex items-center px-3 border-t border-border bg-card/30 text-[10px] text-muted-foreground shrink-0 gap-4" data-testid="status-bar">
        <span>EAMS v0.1-prototype</span>
        <span className="opacity-50">|</span>
        <span className="flex items-center gap-1">
          <GitBranch className="w-3 h-3" /> main
        </span>
        <span className="opacity-50">|</span>
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${compileColor}`} />
          Last compile: {compileStatus?.compile_id || "none"}
        </span>
        <div className="flex-1" />
        <span>{compileStatus?.entities_total || 0} entities</span>
      </footer>

      {/* Quick search overlay */}
      {searchOpen && <QuickSearch />}
    </div>
  );
}
