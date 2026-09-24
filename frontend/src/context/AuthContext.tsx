import React, { createContext, useContext, useState, useCallback } from 'react';
import { CivicRole, UserProfile } from '../types';

export interface OfficerMetadata {
  jurisdiction: string;
  commandFocus: string;
  activeQueueCount: number;
  allowedRoutes: string[];
  primaryMetrics: { label: string; value: string; hint: string }[];
}

export const OFFICER_DETAILS: Record<CivicRole, { profile: UserProfile; meta: OfficerMetadata }> = {
  admin: {
    profile: {
      id: 'usr-admin-00',
      name: 'State ICCC Super Administrator',
      email: 'admin@metravue.chennai.gov.in',
      role: 'admin',
      designation: 'Chief Director & System Administrator',
      department: 'Integrated Command and Control Centre (ICCC)',
      agency: 'State Municipal Administration & Digital Hub',
      badge_number: 'ICCC-ADMIN-001',
      avatar_initials: 'AD',
      last_login: 'Active Now (Superuser Terminal)'
    },
    meta: {
      jurisdiction: 'State-wide Unified ICCC Operations (Police, PWD, RTO & Urban Local Bodies)',
      commandFocus: 'Omnipotent Master Control: Work Orders, PCR 112 Dispatch, e-Challan, VAHAN Audits & Executive Sanctions',
      activeQueueCount: 15,
      allowedRoutes: ['command', 'incidents', 'work-orders', 'analytics', 'memory', 'fleet', 'capture'],
      primaryMetrics: [
        { label: 'System Control', value: '100% Master', hint: 'Full Read / Write across all civic domains' },
        { label: 'Open Work Orders', value: '8 Active', hint: '3 Critical P0 hazards' },
        { label: 'Active Violations', value: '7 Ingested', hint: 'Hit & Run, Rash Driving, Pedestrians' },
        { label: 'Active Fleet Online', value: '5 / 5 Units', hint: 'Transit Edge AI sensing' }
      ]
    }
  },
  admin2: {
    profile: {
      id: 'usr-admin-02',
      name: 'Dr. V. Arvind, Ph.D.',
      email: 'admin2@metravue.chennai.gov.in',
      role: 'admin2',
      designation: 'Chief Director of Fleet Edge AI & Autonomous Systems',
      department: 'Decentralized Edge Telematics & MLOps Command (ICCC-Edge)',
      agency: 'State Urban Transport & Edge Intelligence Authority',
      badge_number: 'EDGE-ADMIN-002',
      avatar_initials: 'EA',
      last_login: 'Active Now (Edge Computing MLOps Deck)'
    },
    meta: {
      jurisdiction: 'State-Wide Autonomous Edge Fleet & Transit NPU Cluster',
      commandFocus: 'Edge AI Nodes, 3-Tier Telemetry Routing, Onboard YOLO Optimization, SSD Ring Buffers & Bandwidth Conservation',
      activeQueueCount: 12,
      allowedRoutes: ['command', 'fleet', 'analytics', 'incidents', 'work-orders', 'memory', 'capture'],
      primaryMetrics: [
        { label: 'Edge Fleet NPU', value: '6-20 TOPS active', hint: 'Rockchip RK3588 + Jetson Orin Nodes' },
        { label: 'Bandwidth Saved', value: '98.8% Cellular', hint: 'Metadata JSON vs raw 1080p stream' },
        { label: 'Active Edge Nodes', value: '5 / 5 Online', hint: 'Zero-hardware RTSP + NPU sync' },
        { label: 'Offline Ring Buffers', value: '100% Retained', hint: '128GB SSD local circular buffer' }
      ]
    }
  },
  traffic_police: {
    profile: {
      id: 'usr-police-01',
      name: 'S. Priya, IPS',
      email: 'traffic_police@metravue.chennai.gov.in',
      role: 'traffic_police',
      designation: 'Deputy Commissioner of Police (Traffic)',
      department: 'Traffic Enforcement & PCR Interceptor Wing',
      agency: 'Greater Chennai Traffic Police (GCTP)',
      badge_number: 'GCTP-IPS-009',
      avatar_initials: 'SP',
      last_login: 'Active Now (Live Dispatch Wall)'
    },
    meta: {
      jurisdiction: 'Greater Chennai Police Commissionerate (All 4 Traffic Zones)',
      commandFocus: 'Hit & Run Evasions, Rash Driving, Low-Confidence ANPR Review & PCR 112 Rapid Dispatch',
      activeQueueCount: 7,
      allowedRoutes: ['command', 'incidents', 'capture'],
      primaryMetrics: [
        { label: 'Active Violations', value: '7 Ingested', hint: 'Hit & Run, Rash Driving, Pedestrians' },
        { label: 'Draft e-Challans', value: '₹21,000 pending', hint: 'MVA Sec 184 / 177 / 134 citation sum' },
        { label: 'PCR Dispatches', value: '3 Units rolling', hint: '112 Quick-Response Fleet active' },
        { label: 'Hit & Run Active', value: '1 Case Alert', hint: 'BNS Section 106(2) Priority Case' }
      ]
    }
  },
  pwd_engineer: {
    profile: {
      id: 'usr-pwd-02',
      name: 'Er. K. Shanmugam, M.E.',
      email: 'pwd_engineer@metravue.chennai.gov.in',
      role: 'pwd_engineer',
      designation: 'Superintending Engineer (Roads & Bridges)',
      department: 'Bus Route Roads & Works Dept',
      agency: 'GCC & Tamil Nadu Highways PWD',
      badge_number: 'PWD-ENG-312',
      avatar_initials: 'KS',
      last_login: '3m ago (Field Toughbook)'
    },
    meta: {
      jurisdiction: 'Chennai Arterial Corridors & PWD Division 4 (GST Rd, OMR, Anna Salai)',
      commandFocus: 'Pothole Triaging, 3D Mesh Depth Audits, Contractor Work Orders & SLA Enforcement',
      activeQueueCount: 8,
      allowedRoutes: ['command', 'work-orders', 'memory', 'capture'],
      primaryMetrics: [
        { label: 'Open Work Orders', value: '8 Active', hint: '3 Critical P0 hazards' },
        { label: 'Asphalt Demanded', value: '3.36 Tonnes', hint: 'Dense Bituminous Macadam (DBM)' },
        { label: 'Avg RPI Score', value: '78.3', hint: 'Authoritative IRC weighted formula' },
        { label: 'Contractor SLA Target', value: '< 24 hrs', hint: 'L&T / GMR / TNRDC contract bound' }
      ]
    }
  },
  rto_officer: {
    profile: {
      id: 'usr-rto-03',
      name: 'Thiru M. Natarajan',
      email: 'rto_officer@metravue.chennai.gov.in',
      role: 'rto_officer',
      designation: 'Regional Transport Officer (Chennai Central / TN-01)',
      department: 'Vehicle Compliance & Registration Authority',
      agency: 'Tamil Nadu Transport Department (RTO)',
      badge_number: 'TN-RTO-01',
      avatar_initials: 'MN',
      last_login: '12m ago (VAHAN Sarathi Gateway)'
    },
    meta: {
      jurisdiction: 'Regional Transport Office Network (TN-01 to TN-22 Jurisdictions)',
      commandFocus: 'Confirmed ANPR Hits, VAHAN National Registry Cross-Reference & HSRP Compliance Audits',
      activeQueueCount: 5,
      allowedRoutes: ['command', 'incidents'],
      primaryMetrics: [
        { label: 'Confirmed ANPR Hits', value: '7 Plates', hint: 'Multi-bus verified vehicle reads' },
        { label: 'RTO Jurisdictions', value: 'TN-01 to TN-22', hint: 'Chennai Central, South, West & OMR' },
        { label: 'Compliance Flags', value: '100% Audited', hint: 'VAHAN / Sarathi fitness cross-check' },
        { label: 'HSRP Non-Compliance', value: '0 Suspended', hint: 'High Security Plate standard' }
      ]
    }
  },
  commissioner: {
    profile: {
      id: 'usr-comm-04',
      name: 'Dr. R. Sundaravel, IAS',
      email: 'commissioner@metravue.chennai.gov.in',
      role: 'commissioner',
      designation: 'Transport Commissioner & Secretary to Govt',
      department: 'Transport & Urban Infrastructure Oversight',
      agency: 'Government of Tamil Nadu',
      badge_number: 'GOV-IAS-001',
      avatar_initials: 'RS',
      last_login: 'Active Now (Executive Secretariat)'
    },
    meta: {
      jurisdiction: 'State of Tamil Nadu — Urban Transport & Infrastructure Oversight',
      commandFocus: 'Executive City Rollup, Multi-Corridor Risk Scoring, Budget Allocation & Policy Sanctions',
      activeQueueCount: 0,
      allowedRoutes: ['command', 'analytics', 'memory'],
      primaryMetrics: [
        { label: 'Overall Road Health', value: '82.4%', hint: 'City-wide aggregate pavement index' },
        { label: 'Corridors Monitored', value: '8 Arterials', hint: '100% spatial sync (NH-32, OMR, Anna Salai)' },
        { label: 'Active Fleet Online', value: '5 / 5 Units', hint: 'Transit Edge AI sensing' },
        { label: 'Total Fine Penalties', value: '₹21,000', hint: 'Statutory recovery pool' }
      ]
    }
  }
};

export const SEEDED_OFFICERS: Record<CivicRole, UserProfile> = {
  admin: OFFICER_DETAILS.admin.profile,
  admin2: OFFICER_DETAILS.admin2.profile,
  traffic_police: OFFICER_DETAILS.traffic_police.profile,
  pwd_engineer: OFFICER_DETAILS.pwd_engineer.profile,
  rto_officer: OFFICER_DETAILS.rto_officer.profile,
  commissioner: OFFICER_DETAILS.commissioner.profile,
};

// Map legacy role strings to canonical CivicRole
export const CANONICAL_ROLE_MAP: Record<string, CivicRole> = {
  admin: 'admin',
  admin2: 'admin2',
  edge_admin: 'admin2',
  commissioner: 'commissioner',
  safety: 'traffic_police',
  traffic_police: 'traffic_police',
  maintenance: 'pwd_engineer',
  pwd_engineer: 'pwd_engineer',
  operations: 'rto_officer',
  rto_officer: 'rto_officer',
  analyst: 'commissioner'
};

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile;
  meta: OfficerMetadata;
  login: (role: CivicRole, remember?: boolean) => Promise<boolean>;
  loginWithCredentials: (identifier: string, password?: string, remember?: boolean) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: CivicRole) => void;
  returnToDemo: () => void;
  hasAccessToRoute: (route: string) => boolean;
  canDispatchWorkOrder: boolean;
  canIssueEChallan: boolean;
  canDeploySumpPump: boolean;
  canEscalatePCR: boolean;
  canReviewANPR: boolean;
  canLookupRTO: boolean;
  canFlagRTOCompliance: boolean;
  canRunInterventions: boolean;
  canExportReports: boolean;
  canEditSettings: boolean;
  canManageSettings: boolean;
  isReadOnly: boolean;
  getRoleBadgeLabel: (role: CivicRole) => string;
  getRoleColor: (role: CivicRole) => { bg: string; text: string; border: string };
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_ROLE_KEY = 'SheherSaathi_active_role';
const STORAGE_AUTH_KEY = 'SheherSaathi_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedAuth = localStorage.getItem(STORAGE_AUTH_KEY);
      if (savedAuth === 'true') return true;
      if (savedAuth === 'false') return false;
    }
    return true; // Default logged in with active officer
  });

  const [activeRole, setActiveRole] = useState<CivicRole>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_ROLE_KEY);
      if (saved && CANONICAL_ROLE_MAP[saved]) return CANONICAL_ROLE_MAP[saved];
      try { localStorage.setItem(STORAGE_ROLE_KEY, 'traffic_police'); } catch {}
    }
    return 'traffic_police';
  });

  const [liveKPIs, setLiveKPIs] = useState<{ label: string; value: string; hint: string }[]>([]);

  const refreshKPIs = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('SheherSaathi_jwt_token') : null;
      const res = await fetch('/api/auth/kpis', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.primaryMetrics && Array.isArray(data.primaryMetrics)) {
          setLiveKPIs(data.primaryMetrics);
        }
      }
    } catch {}
  }, []);

  const currentRole = OFFICER_DETAILS[activeRole] ? activeRole : 'traffic_police';
  const user = OFFICER_DETAILS[currentRole].profile;
  const baseMeta = OFFICER_DETAILS[currentRole].meta;
  const meta: OfficerMetadata = {
    ...baseMeta,
    primaryMetrics: liveKPIs.length > 0 ? liveKPIs : baseMeta.primaryMetrics
  };

  const authenticateWithBackend = useCallback(async (payload: { role?: string; username?: string; email?: string; password?: string }) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.access_token && typeof window !== 'undefined') {
        localStorage.setItem('SheherSaathi_jwt_token', data.access_token);
      }
      return data;
    }
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.detail || `Authentication failed (HTTP ${res.status})`);
  }, []);

  const syncBackendToken = useCallback((role: CivicRole) => {
    authenticateWithBackend({ role })
      .then(() => refreshKPIs())
      .catch(() => {});
  }, [authenticateWithBackend, refreshKPIs]);

  React.useEffect(() => {
    syncBackendToken(activeRole);
  }, [activeRole, syncBackendToken]);

  const login = useCallback(async (role: CivicRole, remember: boolean = true): Promise<boolean> => {
    const canonical = CANONICAL_ROLE_MAP[role] || 'traffic_police';
    if (OFFICER_DETAILS[canonical]) {
      setActiveRole(canonical);
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_ROLE_KEY, canonical);
        if (remember) {
          localStorage.setItem(STORAGE_AUTH_KEY, 'true');
        } else {
          sessionStorage.setItem(STORAGE_AUTH_KEY, 'true');
          localStorage.removeItem(STORAGE_AUTH_KEY);
        }
      }
      await authenticateWithBackend({ role: canonical });
      return true;
    }
    return false;
  }, [authenticateWithBackend]);

  const loginWithCredentials = useCallback(async (identifier: string, password?: string, remember: boolean = true): Promise<boolean> => {
    const trimmed = identifier.trim();
    if (!trimmed) {
      throw new Error('Please enter your official Email ID, Badge Number, or Persona.');
    }

    const authData = await authenticateWithBackend({ 
      username: trimmed, 
      email: trimmed,
      password: password || 'chennai@2026' 
    });

    let resolvedRole: CivicRole = 'traffic_police';
    if (authData?.user?.role && CANONICAL_ROLE_MAP[authData.user.role]) {
      resolvedRole = CANONICAL_ROLE_MAP[authData.user.role];
    } else {
      // Client-side fallback lookup
      const match = (Object.keys(OFFICER_DETAILS) as CivicRole[]).find((r) => {
        const p = OFFICER_DETAILS[r].profile;
        return (
          r.toLowerCase() === trimmed.toLowerCase() ||
          p.email.toLowerCase() === trimmed.toLowerCase() ||
          p.badge_number.toLowerCase() === trimmed.toLowerCase() ||
          p.name.toLowerCase().includes(trimmed.toLowerCase())
        );
      });
      if (match) {
        resolvedRole = match;
      } else {
        throw new Error(`Officer persona '${trimmed}' not recognized. Available profiles: traffic_police, pwd_engineer, rto_officer, commissioner.`);
      }
    }

    setActiveRole(resolvedRole);
    setIsAuthenticated(true);
    await refreshKPIs();
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ROLE_KEY, resolvedRole);
      if (remember) {
        localStorage.setItem(STORAGE_AUTH_KEY, 'true');
      } else {
        sessionStorage.setItem(STORAGE_AUTH_KEY, 'true');
        localStorage.removeItem(STORAGE_AUTH_KEY);
      }
    }
    return true;
  }, [authenticateWithBackend, refreshKPIs]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_AUTH_KEY, 'false');
      localStorage.removeItem('SheherSaathi_jwt_token');
      sessionStorage.removeItem(STORAGE_AUTH_KEY);
    }
  }, []);

  const switchRole = useCallback((newRole: CivicRole) => {
    const canonical = CANONICAL_ROLE_MAP[newRole] || 'traffic_police';
    if (OFFICER_DETAILS[canonical]) {
      setActiveRole(canonical);
      setIsAuthenticated(true);
      syncBackendToken(canonical);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_ROLE_KEY, canonical);
        localStorage.setItem(STORAGE_AUTH_KEY, 'true');
      }
    }
  }, [syncBackendToken]);

  const returnToDemo = useCallback(() => {
    setActiveRole('traffic_police');
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_ROLE_KEY);
      localStorage.setItem(STORAGE_AUTH_KEY, 'true');
    }
  }, []);

  const hasAccessToRoute = useCallback((route: string): boolean => {
    const r = route.replace(/^#\/?/, '').trim();
    if (r === '' || r === 'command') return true;
    return meta.allowedRoutes.includes(r);
  }, [meta]);

  // ── Strict Role-Gated Capabilities ──────────────────────────────────────────
  // 0. Admin Superuser: Omnipotent master control across all 4 civic domains with zero restrictions.
  // 1. Traffic Police: PCR dispatch, e-challans, ANPR triage. No PWD work order approval.
  // 2. Road / PWD Authority: Work order approval, contractor assignment, SLA enforcement, sump pumps. No police dispatches.
  // 3. RTO / Transport Dept: VAHAN RTO lookup, compliance audits. No police dispatch, no road paving approvals.
  // 4. Transport Commissioner: Executive oversight rollup, high-value intervention sanctions, policy reports. Read-mostly in queues.
  const isAdmin = activeRole === 'admin' || activeRole === 'admin2';
  const canDispatchWorkOrder = isAdmin || activeRole === 'pwd_engineer' || activeRole === 'commissioner';
  const canIssueEChallan = isAdmin || activeRole === 'traffic_police';
  const canDeploySumpPump = isAdmin || activeRole === 'pwd_engineer';
  const canEscalatePCR = isAdmin || activeRole === 'traffic_police';
  const canReviewANPR = isAdmin || activeRole === 'traffic_police' || activeRole === 'rto_officer' || activeRole === 'commissioner';
  const canLookupRTO = isAdmin || activeRole === 'rto_officer' || activeRole === 'traffic_police' || activeRole === 'commissioner';
  const canFlagRTOCompliance = isAdmin || activeRole === 'rto_officer';
  const canRunInterventions = isAdmin || activeRole === 'pwd_engineer' || activeRole === 'commissioner';
  const canExportReports = isAdmin || activeRole === 'commissioner' || activeRole === 'pwd_engineer';
  const canManageSettings = isAdmin || activeRole === 'commissioner';
  const canEditSettings = canManageSettings;
  const isReadOnly = !isAdmin && activeRole === 'commissioner';

  const getRoleBadgeLabel = (role: CivicRole): string => {
    switch (role) {
      case 'admin': return 'System Administrator (Master Control)';
      case 'admin2': return 'Edge AI Ops Director (Admin 2)';
      case 'traffic_police': return 'Traffic Police (City Wing)';
      case 'pwd_engineer': return 'Road / PWD Maintenance Authority';
      case 'rto_officer': return 'RTO / Transport Department';
      case 'commissioner': return 'Senior Oversight / Transport Commissioner';
      default: return 'Civic Officer';
    }
  };

  const getRoleColor = (role: CivicRole) => {
    switch (role) {
      case 'admin':
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-950/80',
          text: 'text-emerald-800 dark:text-emerald-300',
          border: 'border-emerald-300 dark:border-emerald-800'
        };
      case 'admin2':
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-950/90 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
          text: 'text-emerald-900 dark:text-emerald-300 font-bold',
          border: 'border-emerald-400 dark:border-emerald-500'
        };
      case 'traffic_police':
        return {
          bg: 'bg-rose-100 dark:bg-rose-950/80',
          text: 'text-rose-800 dark:text-rose-300',
          border: 'border-rose-300 dark:border-rose-800'
        };
      case 'pwd_engineer':
        return {
          bg: 'bg-amber-100 dark:bg-amber-950/80',
          text: 'text-amber-800 dark:text-amber-300',
          border: 'border-amber-300 dark:border-amber-800'
        };
      case 'rto_officer':
        return {
          bg: 'bg-blue-100 dark:bg-blue-950/80',
          text: 'text-blue-800 dark:text-blue-300',
          border: 'border-blue-300 dark:border-blue-800'
        };
      case 'commissioner':
        return {
          bg: 'bg-purple-100 dark:bg-purple-950/80',
          text: 'text-purple-800 dark:text-purple-300',
          border: 'border-purple-300 dark:border-purple-800'
        };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        meta,
        login,
        loginWithCredentials,
        logout,
        switchRole,
        returnToDemo,
        hasAccessToRoute,
        canDispatchWorkOrder,
        canIssueEChallan,
        canDeploySumpPump,
        canEscalatePCR,
        canReviewANPR,
        canLookupRTO,
        canFlagRTOCompliance,
        canRunInterventions,
        canExportReports,
        canEditSettings,
        canManageSettings,
        isReadOnly,
        getRoleBadgeLabel,
        getRoleColor
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
