import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/layout/Header";
import { SidebarNav } from "./components/layout/SidebarNav";
import { BottomNav } from "./components/layout/BottomNav";
import { CommandCenter } from "./pages/CommandCenter";
import { LoginPortal } from "./pages/LoginPortal";
// Lazy-loaded routes — each page is a separate JS chunk downloaded on first visit
const Analytics    = React.lazy(() => import("./pages/Analytics").then(m => ({ default: m.Analytics })));
const WorkOrders   = React.lazy(() => import("./pages/WorkOrders").then(m => ({ default: m.WorkOrders })));
const FleetNodes   = React.lazy(() => import("./pages/FleetNodes").then(m => ({ default: m.FleetNodes })));
const MobileDashcam = React.lazy(() => import("./pages/MobileDashcam").then(m => ({ default: m.MobileDashcam })));
const RoadMemory   = React.lazy(() => import("./pages/RoadMemory").then(m => ({ default: m.RoadMemory })));
const IncidentList = React.lazy(() => import("./pages/IncidentList").then(m => ({ default: m.IncidentList })));
import { RPIFormulaModal } from "./components/modals/RPIFormulaModal";
import { BriefModal } from "./components/modals/BriefModal";
import { CommandPalette } from "./components/modals/CommandPalette";
import { AuthModal } from "./components/modals/AuthModal";
import { InterventionSimulatorModal } from "./components/modals/InterventionSimulatorModal";
import { StreamModelConfigModal } from "./components/modals/StreamModelConfigModal";
import { DocumentExportModal } from "./components/modals/DocumentExportModal";
import { KeyboardShortcutsModal } from "./components/modals/KeyboardShortcutsModal";
import { SensorFusionModal } from "./components/modals/SensorFusionModal";
import { audioAlerts } from "./utils/audioAlerts";
import { useTelemetrySocket } from "./hooks/useTelemetrySocket";
import { INITIAL_CORRIDORS, api } from "./services/api";
import { WorkOrderStatus, TrafficIncident } from "./types";
import { useTheme } from "./context/ThemeContext";
import { useToast } from "./context/ToastContext";
import { useAuth } from "./context/AuthContext";

const VALID_ROUTES = ["command", "incidents", "memory", "analytics", "fleet", "work-orders", "capture"] as const;
type AppRoute = typeof VALID_ROUTES[number];

// Keyboard shortcut map: digit key → route
const ROUTE_SHORTCUTS: Record<string, AppRoute> = {
  "1": "command",
  "2": "incidents",
  "3": "memory",
  "4": "analytics",
  "5": "fleet",
  "6": "work-orders",
  "7": "capture",
};

const getInitialRoute = (): AppRoute => {
  const hash = window.location.hash.replace(/^#\/?/, "").trim();
  if (VALID_ROUTES.includes(hash as AppRoute)) return hash as AppRoute;
  try {
    const saved = localStorage.getItem("roadsaarthi_active_route");
    if (saved && VALID_ROUTES.includes(saved as AppRoute)) return saved as AppRoute;
  } catch {}
  return "command";
};

export const App: React.FC = () => {
  const { isAuthenticated, user, meta, hasAccessToRoute } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(getInitialRoute);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isRPIModalOpen, setIsRPIModalOpen] = useState(false);
  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [isStreamModelModalOpen, setIsStreamModelModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isSensorFusionModalOpen, setIsSensorFusionModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<TrafficIncident | null>(null);
  const { toggleTheme } = useTheme();
  const { info: showInfoToast, warning: showWarningToast } = useToast();

  const { isConnected, fleet, clusters, incidents, metrics, auditLogs, latestLatency, setClusters, setIncidents, sendIngest, sendIncident } = useTelemetrySocket();

  const handleNavigate = useCallback((route: string) => {
    const target = route.replace(/^#\/?/, "").trim() as AppRoute;
    if (VALID_ROUTES.includes(target)) {
      if (!hasAccessToRoute(target)) {
        showWarningToast("Access Restricted", `Your officer clearance (${user.designation}) does not permit access to this module.`);
        setCurrentRoute("command");
        window.location.hash = "#/command";
        return;
      }
      setCurrentRoute(target);
      window.location.hash = `#/${target}`;
      try { localStorage.setItem("roadsaarthi_active_route", target); } catch {}
      setIsMobileMenuOpen(false);
    }
  }, [hasAccessToRoute, user, showWarningToast]);

  // If role switches and current route is no longer authorized, return to command center
  useEffect(() => {
    if (!hasAccessToRoute(currentRoute)) {
      setCurrentRoute("command");
      window.location.hash = "#/command";
    }
  }, [user.role, hasAccessToRoute, currentRoute]);

  const handleSelectIncident = useCallback((inc: TrafficIncident) => {
    setSelectedIncident(inc);
    handleNavigate("command");
  }, [handleNavigate]);

  // ── Keyboard Shortcuts ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      // Cmd/Ctrl+K → Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Escape → close any open modal
      if (e.key === "Escape") {
        if (isCommandPaletteOpen) { setIsCommandPaletteOpen(false); return; }
        if (isDocumentModalOpen) { setIsDocumentModalOpen(false); return; }
        if (isShortcutsModalOpen) { setIsShortcutsModalOpen(false); return; }
        if (isRPIModalOpen) { setIsRPIModalOpen(false); return; }
        if (isBriefModalOpen) { setIsBriefModalOpen(false); return; }
        if (isAuthModalOpen) { setIsAuthModalOpen(false); return; }
        if (isInterventionModalOpen) { setIsInterventionModalOpen(false); return; }
        if (isSensorFusionModalOpen) { setIsSensorFusionModalOpen(false); return; }
        if (isMobileMenuOpen) { setIsMobileMenuOpen(false); return; }
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // 1-7 → Navigate to routes if permitted
      if (ROUTE_SHORTCUTS[e.key]) {
        handleNavigate(ROUTE_SHORTCUTS[e.key]);
        return;
      }

      // T → Toggle theme
      if (e.key === "t" || e.key === "T") {
        toggleTheme();
        return;
      }

      // S → Toggle sidebar (desktop)
      if (e.key === "s" || e.key === "S") {
        setIsSidebarCollapsed((prev) => !prev);
        return;
      }

      // ? → Open Keyboard Shortcuts Modal
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setIsShortcutsModalOpen(true);
        return;
      }

      // M → Toggle Audio Mute
      if (e.key === "m" || e.key === "M") {
        audioAlerts.toggleMute();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthenticated, handleNavigate, toggleTheme, isCommandPaletteOpen, isRPIModalOpen, isBriefModalOpen, isAuthModalOpen, isInterventionModalOpen, isSensorFusionModalOpen, isMobileMenuOpen]);

  // Deep Linking & URL Query Sync (e.g. #/command?bus=BUS-TN01-1042)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleDeepLink = () => {
      const rawHash = window.location.hash.replace(/^#\/?/, "").trim();
      const [routePart, queryPart] = rawHash.split('?');
      const targetRoute = routePart as AppRoute;

      if (VALID_ROUTES.includes(targetRoute)) {
        if (hasAccessToRoute(targetRoute)) {
          setCurrentRoute(targetRoute);
          try { localStorage.setItem("roadsaarthi_active_route", targetRoute); } catch {}
        }
      }

      if (queryPart) {
        const params = new URLSearchParams(queryPart);
        const incidentId = params.get('incident') || params.get('id');
        if (incidentId) {
          const match = incidents.find(i => i.id === incidentId);
          if (match) setSelectedIncident(match);
        }
      }
    };

    handleDeepLink();
    window.addEventListener("hashchange", handleDeepLink);
    return () => window.removeEventListener("hashchange", handleDeepLink);
  }, [isAuthenticated, hasAccessToRoute, incidents]);

  const handleUpdateStatus = async (
    orderId: string, 
    newStatus: WorkOrderStatus,
    beforeImg?: string,
    afterImg?: string,
    notes?: string
  ) => {
    setClusters((prev) => prev.map((c) => (
      c.id === orderId || c.cluster_code === orderId 
        ? { 
            ...c, 
            status: newStatus,
            ...(beforeImg ? { before_image_url: beforeImg } : {}),
            ...(afterImg ? { after_image_url: afterImg } : {}),
            ...(notes ? { field_notes: notes } : {})
          } 
        : c
    )));
    await api.updateClusterStatus(orderId, newStatus, beforeImg, afterImg, notes);
  };

  const handleTriggerDedup = async () => {
    await api.triggerDeduplication();
    alert("15-meter DBSCAN Spatial Clustering executed. Redundant telemetry merged.");
  };

  // Render Dedicated Municipal Login Portal if not authenticated
  if (!isAuthenticated) {
    return <LoginPortal onLoginSuccess={() => handleNavigate("command")} />;
  }

  return (
    <div className="flex flex-col h-[100dvh] w-screen overflow-hidden font-sans select-none relative transition-colors duration-200 bg-[#f0efea] dark:bg-[#111319] text-[#20232a] dark:text-[#f3f0e9]">
      {/* Full-width Top Header */}
      <Header
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen((p) => !p)}
        onToggleSidebar={() => setIsSidebarCollapsed((p) => !p)}
        isBackendConnected={isConnected}
        activeNodesCount={fleet.filter((b) => b.is_online).length}
        onOpenRPIModal={() => setIsRPIModalOpen(true)}
        onOpenBriefModal={() => setIsBriefModalOpen(true)}
        onTriggerDedup={handleTriggerDedup}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenInterventionModal={() => setIsInterventionModalOpen(true)}
        onOpenStreamModelModal={() => setIsStreamModelModalOpen(true)}
        onOpenDocumentModal={() => setIsDocumentModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onOpenSensorFusionModal={() => setIsSensorFusionModalOpen(true)}
        incidents={incidents}
        onSelectIncident={handleSelectIncident}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Navigation Sidebar */}
        <SidebarNav
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((p) => !p)}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          incidentsCount={incidents.length}
          fleetCount={fleet.filter((b) => b.is_online).length}
          clustersCount={clusters.length}
          isBackendConnected={isConnected}
          onTriggerDedup={handleTriggerDedup}
        />

        {/* Page Area */}
        <main className="flex-1 flex flex-col overflow-hidden min-h-0 bg-[#f0efea] dark:bg-[#111319] pb-14 md:pb-0 transition-colors" aria-label="Operations workspace">
          <React.Suspense fallback={
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading…</span>
              </div>
            </div>
          }>
            {currentRoute === "command" && (
              <CommandCenter
                metrics={metrics}
                clusters={clusters}
                fleet={fleet}
                incidents={incidents}
                auditLogs={auditLogs}
                onOpenRPIModal={() => setIsRPIModalOpen(true)}
                onOpenBriefModal={() => setIsBriefModalOpen(true)}
                onNavigateToCapture={() => handleNavigate("capture")}
                onNavigate={handleNavigate}
                selectedIncident={selectedIncident}
                onSelectIncident={setSelectedIncident}
              />
            )}
            {currentRoute === "memory" && hasAccessToRoute("memory") && <RoadMemory />}
            {currentRoute === "incidents" && hasAccessToRoute("incidents") && (
              <IncidentList
                incidents={incidents}
                onUpdateStatus={async (incId, newStatus) => {
                  setIncidents((prev) => prev.map((i) => (i.id === incId ? { ...i, status: newStatus } : i)));
                  try { await api.updateIncident(incId, newStatus); } catch (err) { console.error("Failed to update incident:", err); }
                }}
              />
            )}
            {currentRoute === "analytics" && hasAccessToRoute("analytics") && (
              <Analytics metrics={metrics} corridors={INITIAL_CORRIDORS} fleet={fleet} />
            )}
            {currentRoute === "work-orders" && hasAccessToRoute("work-orders") && (
              <WorkOrders clusters={clusters} onUpdateStatus={handleUpdateStatus} />
            )}
            {currentRoute === "fleet" && hasAccessToRoute("fleet") && (
              <FleetNodes fleet={fleet} />
            )}
            {currentRoute === "capture" && hasAccessToRoute("capture") && (
              <MobileDashcam
                clusters={clusters}
                onBackToDashboard={() => handleNavigate("command")}
                onSendIngest={sendIngest}
                onSendIncident={sendIncident}
                onAddCluster={(newCl) => setClusters((prev) => [newCl, ...prev])}
                onUpdateWorkOrder={async (orderId, newStatus, beforeImg, afterImg, notes) => {
                  setClusters((prev) =>
                    prev.map((c) =>
                      c.id === orderId || c.cluster_code === orderId
                        ? { ...c, status: newStatus, before_image_url: beforeImg || c.before_image_url, after_image_url: afterImg || c.after_image_url, field_notes: notes || c.field_notes }
                        : c
                    )
                  );
                  await api.updateClusterStatus(orderId, newStatus, beforeImg, afterImg, notes);
                }}
              />
            )}
          </React.Suspense>
        </main>

        {/* Mobile Bottom Nav */}
        <BottomNav currentRoute={currentRoute} onNavigate={handleNavigate} />
      </div>

      {/* Modals */}
      <SensorFusionModal isOpen={isSensorFusionModalOpen} onClose={() => setIsSensorFusionModalOpen(false)} />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
        onTriggerDedup={handleTriggerDedup}
        onOpenRPIModal={() => setIsRPIModalOpen(true)}
        onOpenBriefModal={() => setIsBriefModalOpen(true)}
      />
      <RPIFormulaModal isOpen={isRPIModalOpen} onClose={() => setIsRPIModalOpen(false)} />
      <BriefModal isOpen={isBriefModalOpen} onClose={() => setIsBriefModalOpen(false)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <InterventionSimulatorModal
        isOpen={isInterventionModalOpen}
        onClose={() => setIsInterventionModalOpen(false)}
      />
      <StreamModelConfigModal
        isOpen={isStreamModelModalOpen}
        onClose={() => setIsStreamModelModalOpen(false)}
      />
      <DocumentExportModal
        isOpen={isDocumentModalOpen}
        onClose={() => setIsDocumentModalOpen(false)}
      />
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
};

export default App;
