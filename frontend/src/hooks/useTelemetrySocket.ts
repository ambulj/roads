import { useEffect, useRef, useState, useCallback } from 'react';
import { FleetNode, HazardCluster, MetricSummary, PerceptionLogEntry, TrafficIncident } from '../types';
import { INITIAL_CLUSTERS, INITIAL_FLEET, INITIAL_METRICS, INITIAL_AUDIT_LOGS, INITIAL_INCIDENTS } from '../services/api';

export function useTelemetrySocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [fleet, setFleet] = useState<FleetNode[]>(INITIAL_FLEET);
  const [clusters, setClusters] = useState<HazardCluster[]>(INITIAL_CLUSTERS);
  const [incidents, setIncidents] = useState<TrafficIncident[]>(INITIAL_INCIDENTS);
  const [metrics, setMetrics] = useState<MetricSummary>(INITIAL_METRICS);
  const [auditLogs, setAuditLogs] = useState<PerceptionLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [latestLatency, setLatestLatency] = useState<number>(72);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDestroyedRef = useRef(false);

  const connect = useCallback(() => {
    if (isDestroyedRef.current) return;
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const rawHost = window.location.hostname;
      // Resolve localhost to 127.0.0.1 on Windows to bypass IPv6 [::1] proxy trap
      const safeHost = rawHost === 'localhost' ? '127.0.0.1' : rawHost;

      // Prefer explicit env var override; fall back to smart host detection
      // In production (port 80/443): route through reverse proxy; in dev: direct to backend
      const wsUrl: string =
        (import.meta.env.VITE_WS_URL as string | undefined) ??
        ((!window.location.port || window.location.port === '80' || window.location.port === '443')
          ? `${protocol}//${window.location.host}/ws/telemetry`
          : `${protocol}//127.0.0.1:8000/ws/telemetry`);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      const pushAuditLog = (newLog?: PerceptionLogEntry) => {
        if (!newLog) return;
        setAuditLogs((prev) => {
          if (prev.length > 0 && prev[0].id === newLog.id) {
            return prev;
          }
          const filtered = prev.filter((l) => l.id !== newLog.id);
          return [newLog, ...filtered.slice(0, 19)];
        });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'SNAPSHOT') {
            if (data.metrics) setMetrics(data.metrics);
            if (data.fleet) setFleet(data.fleet);
            if (data.clusters) setClusters(data.clusters);
            if (data.incidents) setIncidents(data.incidents);
            if (data.audit_logs) setAuditLogs(data.audit_logs);
          } else if (data.type === 'TELEMETRY_TICK') {
            if (data.fleet) setFleet(data.fleet);
            if (data.metrics) setMetrics(data.metrics);
            if (data.latest_log) {
              pushAuditLog(data.latest_log);
              setLatestLatency(data.latest_log.latency_ms || 75);
            }
          } else if (data.type === 'INGEST_BROADCAST') {
            if (data.metrics) setMetrics(data.metrics);
            if (data.clusters) setClusters(data.clusters);
            if (data.latest_log) {
              pushAuditLog(data.latest_log);
              setLatestLatency(data.latest_log.latency_ms || 80);
            }
          } else if (data.type === 'INCIDENT_ALERT') {
            if (data.incident) {
              setIncidents((prev) => [data.incident, ...prev.filter((i) => i.id !== data.incident.id)]);
            }
            if (data.metrics) setMetrics(data.metrics);
            if (data.latest_log) {
              pushAuditLog(data.latest_log);
              setLatestLatency(data.latest_log.latency_ms || 70);
            }
          } else if (data.type === 'INCIDENT_UPDATE') {
            if (data.incident_id && data.update) {
              setIncidents((prev) => prev.map((i) => (i.id === data.incident_id ? { ...i, ...data.update } : i)));
            }
            if (data.metrics) setMetrics(data.metrics);
          } else if (data.type === 'SYNTHETIC_CYCLE_TICK') {
            if (data.metrics) setMetrics(data.metrics);
            if (data.clusters) setClusters(data.clusters);
            if (data.incidents) setIncidents(data.incidents);
            if (data.fleet) setFleet(data.fleet);
            if (data.latest_log) {
              pushAuditLog(data.latest_log);
              setLatestLatency(data.latest_log.latency_ms || 65);
            }
          }
        } catch {
          // ignore parsing error
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        if (!isDestroyedRef.current && !reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connect();
          }, 3000);
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch {
      setIsConnected(false);
      if (!isDestroyedRef.current && !reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null;
          connect();
        }, 3000);
      }
    }
  }, []);

  useEffect(() => {
    isDestroyedRef.current = false;
    const timer = setTimeout(() => {
      if (!isDestroyedRef.current) {
        connect();
      }
    }, 50);

    return () => {
      isDestroyedRef.current = true;
      clearTimeout(timer);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        const ws = wsRef.current;
        wsRef.current = null;
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => {
            try { ws.close(); } catch {}
          };
          ws.onerror = null;
          ws.onclose = null;
        } else if (ws.readyState === WebSocket.OPEN) {
          try { ws.close(); } catch {}
        }
      }
    };
  }, [connect]);



  // Client-side smooth corridor trajectory heartbeat when server is disconnected
  useEffect(() => {
    if (isConnected) return;

    const WAYPOINTS: Record<string, [number, number][]> = {
      'BUS-TN01-1042': [[12.9250, 80.1170], [12.9516, 80.1462], [12.9680, 80.1580], [12.9880, 80.1750], [13.0067, 80.2030]],
      'BUS-TN02-3891': [[13.0080, 80.2520], [12.9890, 80.2480], [12.9650, 80.2430], [12.9380, 80.2360], [12.9010, 80.2280]],
      'BUS-TN01-2098': [[13.0827, 80.2707], [13.0640, 80.2630], [13.0580, 80.2520], [13.0410, 80.2450], [13.0210, 80.2250]],
      'BUS-TN03-4410': [[13.0020, 80.2150], [12.9880, 80.2200], [12.9780, 80.2180], [12.9720, 80.2310]],
      'BUS-TN02-5501': [[13.0067, 80.2030], [13.0200, 80.2070], [13.0350, 80.2110], [13.0510, 80.2120], [13.0690, 80.1980]],
    };

    const progressMap: Record<string, { prog: number; fwd: boolean }> = {};

    const interval = setInterval(() => {
      if (document.hidden) return; // Don't update when tab is not visible

      setFleet((prev) =>
        prev.map((bus) => {
          const pts = WAYPOINTS[bus.id];
          if (!pts || pts.length < 2) {
            return {
              ...bus,
              speed_kmh: Math.round(Math.max(24, Math.min(48, bus.speed_kmh + (Math.random() - 0.5) * 2))),
            };
          }

          if (!progressMap[bus.id]) {
            progressMap[bus.id] = { prog: Math.random() * 0.7, fwd: true };
          }

          const st = progressMap[bus.id];
          const delta = 0.018 + Math.random() * 0.008;
          st.prog += st.fwd ? delta : -delta;

          if (st.prog >= 1.0) {
            st.prog = 1.0;
            st.fwd = false;
          } else if (st.prog <= 0.0) {
            st.prog = 0.0;
            st.fwd = true;
          }

          const numSegs = pts.length - 1;
          const segFloat = st.prog * numSegs;
          const segIdx = Math.min(Math.floor(segFloat), numSegs - 1);
          const t = segFloat - segIdx;

          const p1 = pts[segIdx];
          const p2 = pts[segIdx + 1];

          const newLat = p1[0] + (p2[0] - p1[0]) * t;
          const newLng = p1[1] + (p2[1] - p1[1]) * t;

          const dLat = st.fwd ? p2[0] - p1[0] : p1[0] - p2[0];
          const dLng = st.fwd ? p2[1] - p1[1] : p1[1] - p2[1];
          const rad = Math.atan2(dLng * Math.cos(newLat * Math.PI / 180), dLat);
          const degHeading = Math.round((rad * 180 / Math.PI + 360) % 360);

          return {
            ...bus,
            lat: Number(newLat.toFixed(5)),
            lng: Number(newLng.toFixed(5)),
            heading: degHeading,
            speed_kmh: Math.round(30 + Math.random() * 12),
            edge_fps: Number((26 + (Math.random() - 0.5) * 3).toFixed(1)),
          };
        })
      );
      setLatestLatency(Math.floor(62 + Math.random() * 20));
    }, 2500);

    return () => clearInterval(interval);
  }, [isConnected]);

  const sendIngest = useCallback((ingestPayload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'INGEST', payload: ingestPayload }));
    } else {
      // Local simulated ingest
      setMetrics((prev) => ({
        ...prev,
        total_ingests: prev.total_ingests + 1,
      }));
      setAuditLogs((prev) => [
        {
          id: `local-${Date.now()}`,
          timestamp: 'Just now',
          bus_id: ingestPayload.bus_id || 'MOBILE-DASHCAM',
          corridor: 'Mobile Ingest Corridor',
          message: `Windshield detection: ${ingestPayload.defect_type} recorded at 5Hz lock.`,
          latency_ms: Math.floor(70 + Math.random() * 20),
          type: 'LOCAL INGEST'
        },
        ...prev.slice(0, 19)
      ]);
    }
  }, []);

  const sendIncident = useCallback((incidentPayload: Partial<TrafficIncident>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'INCIDENT', payload: incidentPayload }));
    } else {
      // Local simulated incident
      const newInc: TrafficIncident = {
        id: `inc-${Date.now().toString(36)}`,
        reporting_bus_id: incidentPayload.reporting_bus_id || 'MOBILE-DASHCAM-01',
        incident_type: incidentPayload.incident_type || 'RASH_DRIVING',
        plate_number: incidentPayload.plate_number,
        plate_confidence: incidentPayload.plate_confidence ?? 0.95,
        vehicle_color: incidentPayload.vehicle_color,
        vehicle_class: incidentPayload.vehicle_class,
        target_speed_kmh: incidentPayload.target_speed_kmh ?? 0.0,
        is_intercepted: false,
        road_name: incidentPayload.road_name || 'Greater Chennai Metropolitan Arterial',
        lat: incidentPayload.lat || 13.0067,
        lng: incidentPayload.lng || 80.2030,
        occurred_at: 'Just now',
        status: 'ACTIVE_ALERT'
      };
      setIncidents((prev) => [newInc, ...prev]);
      setMetrics((prev) => ({
        ...prev,
        active_incidents: (prev.active_incidents || 0) + 1
      }));
      setAuditLogs((prev) => [
        {
          id: `local-inc-${Date.now()}`,
          timestamp: 'Just now',
          bus_id: newInc.reporting_bus_id,
          corridor: newInc.road_name,
          message: `Incident Logged: ${newInc.incident_type} [${newInc.plate_number || newInc.vehicle_class}]`,
          latency_ms: 68,
          type: 'INCIDENT ALERT'
        },
        ...prev.slice(0, 19)
      ]);
    }
  }, []);

  return {
    isConnected,
    fleet,
    clusters,
    incidents,
    metrics,
    auditLogs,
    latestLatency,
    setClusters,
    setIncidents,
    sendIngest,
    sendIncident
  };
}
