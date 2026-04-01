export type PersonaId = "architect" | "cto" | "developer" | "risk-officer";

export interface Persona {
  id: PersonaId;
  label: string;
  title: string;
  icon: string;
  description: string;
  defaultPage: string;
  signalPriorities: string[];
  viewpointFilter: string[];
  dashboardFocus: string[];
}

export const PERSONAS: Persona[] = [
  {
    id: "architect",
    label: "Solution Architect",
    title: "Sarah Chen",
    icon: "🏗️",
    description: "Full system view with compliance and integration focus",
    defaultPage: "/",
    signalPriorities: ["incident", "performance", "lifecycle", "compliance"],
    viewpointFilter: ["solution-architect"],
    dashboardFocus: ["compliance_score", "lifecycle_score"],
  },
  {
    id: "cto",
    label: "CTO / EA Lead",
    title: "James Rivera",
    icon: "👔",
    description: "Strategic view — goals, capabilities, health scores",
    defaultPage: "/health",
    signalPriorities: ["lifecycle", "compliance", "feedback"],
    viewpointFilter: ["engineering-manager", "cto"],
    dashboardFocus: ["overall_score", "review_score"],
  },
  {
    id: "developer",
    label: "Developer",
    title: "Alex Kim",
    icon: "💻",
    description: "Container-level detail with integration specs and signals",
    defaultPage: "/signals",
    signalPriorities: ["incident", "performance", "change"],
    viewpointFilter: ["developer", "tech-lead"],
    dashboardFocus: ["signal_score"],
  },
  {
    id: "risk-officer",
    label: "Risk Officer",
    title: "Patricia Wells",
    icon: "🛡️",
    description: "Compliance findings, policy drift, and deprecation risks",
    defaultPage: "/signals",
    signalPriorities: ["compliance", "lifecycle"],
    viewpointFilter: ["risk-officer", "sre"],
    dashboardFocus: ["compliance_score"],
  },
];
