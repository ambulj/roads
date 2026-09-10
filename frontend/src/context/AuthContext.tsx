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
      id: 'usr-admin-01',
      name: 'Dr. R. Sundaravel, IAS',
      email: 'admin@metravue.chennai.gov.in',
      role: 'admin',
      designation: 'Chief Road Engineer & Commissioner',
      department: 'Command & Policy Operations',
      agency: 'Greater Chennai Corporation (GCC)',
      badge_number: 'GCC-ADM-001',
      avatar_initials: 'RS',
      last_login: 'Active Now (Biometric 2FA)'
    },
    meta: {
      jurisdiction: 'Greater Chennai Metropolitan Region (All 15 Zones)',
      commandFocus: 'Executive Oversight, Multi-Agency Coordination & Policy Directives',
      activeQueueCount: 38,
      allowedRoutes: ['command', 'fleet', 'memory', 'incidents', 'work-orders', 'analytics', 'capture'],
      primaryMetrics: [
        { label: 'Overall Road Health', value: '78.4%', hint: '+2.1% this month' },
        { label: 'SLA Compliance', value: '94.2%', hint: 'Within 24h targets' },
        { label: 'Active Fleet Units', value: '5 Live Buses', hint: '100% NPU online' },
        { label: 'Total Fines Logged', value: '₹4,85,500', hint: 'Auto e-Challan sum' }
      ]
    }
  },
  operations: {
    profile: {
      id: 'usr-ops-02',
      name: 'Capt. M. Balaji',
      email: 'operations@metravue.chennai.gov.in',
      role: 'operations',
      designation: 'Chief Transport Operations Manager',
      department: 'Intelligent Transit Monitoring',
      agency: 'Metropolitan Transport Corp (MTC)',
      badge_number: 'MTC-OPS-104',
      avatar_initials: 'MB',
      last_login: '14m ago via Central Ops Wall'
    },
    meta: {
      jurisdiction: 'MTC Transit Network & Depot Corridors (NH-32, OMR, Anna Salai)',
      commandFocus: 'Bus Headway Optimization, Edge NPU Telemetry & Route Diversions',
      activeQueueCount: 12,
      allowedRoutes: ['command', 'fleet', 'memory', 'analytics', 'capture'],
      primaryMetrics: [
        { label: 'Fleet Online', value: '5 / 5 Units', hint: '100% telemetry ping' },
        { label: 'Avg Corridor Speed', value: '38.4 km/h', hint: 'GST Road optimal' },
        { label: 'Edge FPS Rate', value: '27.2 FPS', hint: 'Sony IMX335 active' },
        { label: 'Headway Variance', value: '±2.4 mins', hint: 'Within schedule' }
      ]
    }
  },
  maintenance: {
    profile: {
      id: 'usr-maint-03',
      name: 'Er. K. Shanmugam, M.E.',
      email: 'maintenance@metravue.chennai.gov.in',
      role: 'maintenance',
      designation: 'Superintending Engineer (Roads & Bridges)',
      department: 'Bus Route Roads & Works Dept',
      agency: 'GCC Engineering Wing',
      badge_number: 'GCC-ENG-312',
      avatar_initials: 'KS',
      last_login: '4m ago (Mobile Toughbook)'
    },
    meta: {
      jurisdiction: 'Zone 8 (Anna Nagar) to Zone 14 (Perungudi) Arterials',
      commandFocus: '3D Distress Depth Triage, Asphalt Estimations & Contractor Work Orders',
      activeQueueCount: 19,
      allowedRoutes: ['command', 'work-orders', 'memory', 'analytics', 'capture'],
      primaryMetrics: [
        { label: 'Open Work Orders', value: '12 Active', hint: '4 Critical P0 D40s' },
        { label: 'Asphalt Demanded', value: '3.84 Tonnes', hint: 'Dense Macadam DBM' },
        { label: 'Avg RPI Score', value: '88.4', hint: 'Prioritized by formula' },
        { label: 'Contractor SLA', value: '18.5 hrs avg', hint: 'Target < 24 hrs' }
      ]
    }
  },
  safety: {
    profile: {
      id: 'usr-safety-04',
      name: 'S. Priya, IPS',
      email: 'safety@metravue.chennai.gov.in',
      role: 'safety',
      designation: 'Deputy Commissioner of Police (Traffic)',
      department: 'Traffic Enforcement & PCR Fleet',
      agency: 'Greater Chennai Traffic Police (GCTP)',
      badge_number: 'GCTP-IPS-009',
      avatar_initials: 'SP',
      last_login: 'Active Now (Enforcement Console)'
    },
    meta: {
      jurisdiction: 'Greater Chennai Traffic Police Control Command (112 Interceptor Fleet)',
      commandFocus: 'ANPR Hit-and-Run Interception, Zebra Violations & Rapid PCR Dispatch',
      activeQueueCount: 16,
      allowedRoutes: ['command', 'incidents', 'memory', 'analytics', 'capture'],
      primaryMetrics: [
        { label: 'Active Violations', value: '7 Ingested', hint: 'ANPR plate match' },
        { label: 'Auto e-Challans', value: '₹14,500 pending', hint: 'MVA Sec 177/184' },
        { label: 'PCR Dispatches', value: '3 Units rolling', hint: 'Avg ETA 4.2 mins' },
        { label: 'Hit & Run Alerts', value: '1 Active Case', hint: 'GST Rd Airport' }
      ]
    }
  },
  analyst: {
    profile: {
      id: 'usr-analyst-05',
      name: 'V. Divya, M.Tech',
      email: 'analyst@metravue.chennai.gov.in',
      role: 'analyst',
      designation: 'Senior Mobility Data Analyst',
      department: 'Urban Transport Planning Wing',
      agency: 'Chennai Metro Development Authority (CMDA)',
      badge_number: 'CMDA-ANA-045',
      avatar_initials: 'VD',
      last_login: '1h ago (Read-Only Session)'
    },
    meta: {
      jurisdiction: 'Chennai Metropolitan Area (Spatial Data & Infrastructure Planning)',
      commandFocus: 'Multi-Modal Corridors, Pavement Deterioration Curves & Policy Impact',
      activeQueueCount: 0,
      allowedRoutes: ['command', 'memory', 'analytics'],
      primaryMetrics: [
        { label: 'Corridor Datasets', value: '8 Monitored', hint: '100% spatial sync' },
        { label: 'DBSCAN Dedup Ratio', value: '53.0%', hint: '585 down to 275' },
        { label: 'Surface Degradation', value: '4.8% / quarter', hint: 'Pre-monsoon trend' },
        { label: 'Access Mode', value: 'Read-Only Clearance', hint: 'Planning view' }
      ]
    }
  }
};

export const SEEDED_OFFICERS: Record<CivicRole, UserProfile> = {
  admin: OFFICER_DETAILS.admin.profile,
  operations: OFFICER_DETAILS.operations.profile,
  maintenance: OFFICER_DETAILS.maintenance.profile,
  safety: OFFICER_DETAILS.safety.profile,
  analyst: OFFICER_DETAILS.analyst.profile,
};

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile;
  meta: OfficerMetadata;
  login: (role: CivicRole, remember?: boolean) => void;
  logout: () => void;
  switchRole: (role: CivicRole) => void;
  returnToDemo: () => void;
  hasAccessToRoute: (route: string) => boolean;
  canDispatchWorkOrder: boolean;
  canIssueEChallan: boolean;
  canDeploySumpPump: boolean;
  canEscalatePCR: boolean;
  canRunInterventions: boolean;
  canEditSettings: boolean;
  canManageSettings: boolean;
  isReadOnly: boolean;
  getRoleBadgeLabel: (role: CivicRole) => string;
  getRoleColor: (role: CivicRole) => { bg: string; text: string; border: string };
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_ROLE_KEY = 'roadsaarthi_active_role';
const STORAGE_AUTH_KEY = 'roadsaarthi_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedAuth = localStorage.getItem(STORAGE_AUTH_KEY);
      if (savedAuth === 'true') return true;
      if (savedAuth === 'false') return false;
    }
    return true; // Default logged in with active officer, can be logged out anytime
  });

  const [activeRole, setActiveRole] = useState<CivicRole>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_ROLE_KEY) as CivicRole;
      if (saved && OFFICER_DETAILS[saved]) return saved;
    }
    return 'maintenance';
  });

  const user = OFFICER_DETAILS[activeRole].profile;
  const meta = OFFICER_DETAILS[activeRole].meta;

  const login = useCallback((role: CivicRole, remember: boolean = true) => {
    if (OFFICER_DETAILS[role]) {
      setActiveRole(role);
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_ROLE_KEY, role);
        if (remember) {
          localStorage.setItem(STORAGE_AUTH_KEY, 'true');
        } else {
          sessionStorage.setItem(STORAGE_AUTH_KEY, 'true');
          localStorage.removeItem(STORAGE_AUTH_KEY);
        }
      }
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_AUTH_KEY, 'false');
      sessionStorage.removeItem(STORAGE_AUTH_KEY);
    }
  }, []);

  const switchRole = useCallback((newRole: CivicRole) => {
    if (OFFICER_DETAILS[newRole]) {
      setActiveRole(newRole);
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_ROLE_KEY, newRole);
        localStorage.setItem(STORAGE_AUTH_KEY, 'true');
      }
    }
  }, []);

  const returnToDemo = useCallback(() => {
    setActiveRole('maintenance');
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_ROLE_KEY);
      localStorage.setItem(STORAGE_AUTH_KEY, 'true');
    }
  }, []);

  const hasAccessToRoute = useCallback((route: string): boolean => {
    // Normalization
    const r = route.replace(/^#\/?/, '').trim();
    if (r === '' || r === 'command') return true;
    return meta.allowedRoutes.includes(r);
  }, [meta]);

  // RBAC Permission checks
  const canDispatchWorkOrder = activeRole === 'admin' || activeRole === 'maintenance';
  const canIssueEChallan = activeRole === 'admin' || activeRole === 'safety';
  const canDeploySumpPump = activeRole === 'admin' || activeRole === 'maintenance';
  const canEscalatePCR = activeRole === 'admin' || activeRole === 'safety';
  const canRunInterventions = activeRole === 'admin' || activeRole === 'operations' || activeRole === 'maintenance';
  const canManageSettings = activeRole === 'admin';
  const canEditSettings = canManageSettings;
  const isReadOnly = activeRole === 'analyst';

  const getRoleBadgeLabel = (role: CivicRole): string => {
    switch (role) {
      case 'admin': return 'Chief Municipal Engineer';
      case 'operations': return 'MTC Operations Manager';
      case 'maintenance': return 'Road Maintenance Division';
      case 'safety': return 'Traffic & Safety Division';
      case 'analyst': return 'Urban Mobility Analyst';
    }
  };

  const getRoleColor = (role: CivicRole) => {
    switch (role) {
      case 'admin':
        return {
          bg: 'bg-purple-100 dark:bg-purple-950/80',
          text: 'text-purple-800 dark:text-purple-300',
          border: 'border-purple-300 dark:border-purple-800'
        };
      case 'operations':
        return {
          bg: 'bg-blue-100 dark:bg-blue-950/80',
          text: 'text-blue-800 dark:text-blue-300',
          border: 'border-blue-300 dark:border-blue-800'
        };
      case 'maintenance':
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-950/80',
          text: 'text-emerald-800 dark:text-emerald-300',
          border: 'border-emerald-300 dark:border-emerald-800'
        };
      case 'safety':
        return {
          bg: 'bg-rose-100 dark:bg-rose-950/80',
          text: 'text-rose-800 dark:text-rose-300',
          border: 'border-rose-300 dark:border-rose-800'
        };
      case 'analyst':
        return {
          bg: 'bg-slate-100 dark:bg-slate-850',
          text: 'text-slate-800 dark:text-slate-300',
          border: 'border-slate-300 dark:border-slate-700'
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
        logout,
        switchRole,
        returnToDemo,
        hasAccessToRoute,
        canDispatchWorkOrder,
        canIssueEChallan,
        canDeploySumpPump,
        canEscalatePCR,
        canRunInterventions,
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
