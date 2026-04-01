import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useTour } from "@/lib/tour-context";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const TOUR_STEPS = [
  {
    id: "welcome",
    title: "Welcome to EAMS",
    description: "The Enterprise Architecture Management System is a living model of your architecture — entities, relationships, compliance, and operational signals all in one place.",
    target: null as string | null,
    page: "/",
  },
  {
    id: "domains",
    title: "Architecture Domains",
    description: "The home page shows all domains with entity counts, compliance violations, and warnings. Click any system to drill in.",
    target: "[data-testid='main-content']",
    page: "/",
  },
  {
    id: "entity-detail",
    title: "Entity Deep Dive",
    description: "Every entity has a rich detail page — metadata, technology stack, NFR profiles, relationships, compliance findings, and signals. This is your system of record.",
    target: "[data-testid='main-content']",
    page: "/entities/system.claims-processing",
  },
  {
    id: "viewpoint",
    title: "Viewpoint Diagrams",
    description: "Viewpoints render architecture diagrams from live data — not static drawings. Change the data, and diagrams update automatically. Export to Structurizr DSL or Mermaid.",
    target: "[data-testid='main-content']",
    page: "/viewpoints/viewpoint.c4-context",
  },
  {
    id: "lineage",
    title: "Goal-to-Container Lineage",
    description: "Trace any entity upward to business goals or downward to containers. This traceability chain answers 'why does this system exist?' and 'what breaks if it fails?'",
    target: "[data-testid='main-content']",
    page: "/lineage/container.adjudication-api",
  },
  {
    id: "health",
    title: "Architecture Health Scores",
    description: "Composite health scores per domain — compliance, signal severity, lifecycle freshness, and review status. Red means attention needed. Green means healthy.",
    target: "[data-testid='main-content']",
    page: "/health",
  },
  {
    id: "signals",
    title: "Operational Signal Queue",
    description: "Production incidents, lifecycle alerts, and compliance drift — enriched with architecture context. Click any affected entity badge to drill in. Filtered by your current persona role.",
    target: "[data-testid='main-content']",
    page: "/signals",
  },
  {
    id: "scenarios",
    title: "What-If Scenario Builder",
    description: "Simulate deprecating a system or removing a container. See the blast radius instantly — affected entities, risk level, and a visual impact diagram.",
    target: "[data-testid='main-content']",
    page: "/scenarios",
  },
  {
    id: "metamodel",
    title: "The EAMS Metamodel",
    description: "This diagram shows the entity types and valid relationships that form the EAMS schema. Goals → Capabilities → Processes → Systems → Containers. Click any type to browse its entities.",
    target: "[data-testid='main-content']",
    page: "/metamodel",
  },
  {
    id: "finish",
    title: "Ready to Explore",
    description: "You've seen the core flows. Switch personas in the top bar to see role-based views. Use the sidebar to navigate domains, viewpoints, branches, and advisory outputs. Every page is backed by live architecture data.",
    target: null,
    page: null as string | null,
  },
];

export default function GuidedTour() {
  const { tourActive, endTour } = useTour();
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [, setLocation] = useLocation();

  const step = TOUR_STEPS[currentStep];

  const measureTarget = useCallback(() => {
    if (!step?.target) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step.target);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [step]);

  const showStep = useCallback(() => {
    measureTarget();
    setVisible(true);
  }, [measureTarget]);

  // Navigate and show step
  const goToStep = useCallback((idx: number) => {
    setVisible(false);
    setCurrentStep(idx);
    const nextStep = TOUR_STEPS[idx];

    if (nextStep.page) {
      setLocation(nextStep.page);
      setTimeout(() => {
        showStep();
      }, 800);
    } else {
      setTimeout(() => {
        showStep();
      }, 100);
    }
  }, [setLocation, showStep]);

  // Start tour
  useEffect(() => {
    if (tourActive) {
      setCurrentStep(0);
      goToStep(0);
    } else {
      setVisible(false);
    }
  }, [tourActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update rect on resize/scroll
  useEffect(() => {
    if (!visible || !step?.target) return;
    const handleResize = () => measureTarget();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [visible, step, measureTarget]);

  if (!tourActive || !visible) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const isCentered = !step.target || !targetRect;

  // Compute spotlight box-shadow mask
  const spotlightStyle = targetRect ? {
    boxShadow: `0 0 0 9999px rgba(0,0,0,0.65), 0 0 0 4px rgba(15,113,115,0.4)`,
    position: "fixed" as const,
    top: targetRect.top - 6,
    left: targetRect.left - 6,
    width: targetRect.width + 12,
    height: targetRect.height + 12,
    borderRadius: 8,
    zIndex: 51,
    pointerEvents: "none" as const,
  } : null;

  // Tooltip position — always centered in viewport for readability
  const tooltipStyle: React.CSSProperties = {
    position: "fixed",
    bottom: 32,
    right: 32,
    zIndex: 52,
  };

  return (
    <>
      {/* Backdrop (only when centered / no spotlight) */}
      {isCentered && (
        <div
          className="fixed inset-0 bg-black/65 z-50"
          onClick={endTour}
        />
      )}

      {/* Spotlight cutout */}
      {spotlightStyle && <div style={spotlightStyle} />}

      {/* Tooltip Card */}
      <div
        style={tooltipStyle}
        className="bg-card border border-border rounded-lg shadow-2xl p-4 max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
        data-testid="tour-tooltip"
      >
        {/* Step counter */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Step {currentStep + 1} of {TOUR_STEPS.length}
          </span>
          <button
            onClick={endTour}
            className="text-muted-foreground hover:text-foreground"
            data-testid="tour-close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold mb-1.5">{step.title}</h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">{step.description}</p>

        {/* Progress dots */}
        <div className="flex items-center gap-1 mb-3">
          {TOUR_STEPS.map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === currentStep ? "bg-primary" : i < currentStep ? "bg-primary/40" : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          {!isFirst && (
            <button
              onClick={() => goToStep(currentStep - 1)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              data-testid="tour-back"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={endTour}
            className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground mr-2"
            data-testid="tour-skip"
          >
            Skip Tour
          </button>
          {isLast ? (
            <button
              onClick={endTour}
              className="px-3 py-1.5 rounded bg-[#0F7173] hover:bg-[#0F7173]/80 text-white text-xs font-medium"
              data-testid="tour-finish"
            >
              Get Started
            </button>
          ) : (
            <button
              onClick={() => goToStep(currentStep + 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#0F7173] hover:bg-[#0F7173]/80 text-white text-xs font-medium"
              data-testid="tour-next"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
