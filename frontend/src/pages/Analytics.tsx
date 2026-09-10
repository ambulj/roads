import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { 
  ChartColumn, Eye, Layers, TriangleAlert, ShieldCheck, TrendingUp, 
  Sparkles, MapPin, Truck, Moon, Sun, School, AlertOctagon, CheckCircle2, ShieldAlert 
} from 'lucide-react';
import { CorridorRisk, MetricSummary, FleetNode, SafeCorridor, DarkSpotSegment } from '../types';
import { Card, Badge, Button } from '../components/ui';
import { MonsoonInundationPredictor } from '../components/analytics/MonsoonInundationPredictor';
import { api, INITIAL_SAFE_CORRIDORS, INITIAL_DARK_SPOTS } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface AnalyticsProps {
  metrics: MetricSummary;
  corridors: CorridorRisk[];
  fleet: FleetNode[];
}

export const Analytics: React.FC<AnalyticsProps> = ({ metrics, corridors, fleet }) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [safeCorridors, setSafeCorridors] = useState<SafeCorridor[]>(INITIAL_SAFE_CORRIDORS);
  const [darkSpots, setDarkSpots] = useState<DarkSpotSegment[]>(INITIAL_DARK_SPOTS);

  useEffect(() => {
    api.getSafeCorridors().then(setSafeCorridors);
    api.getDarkSpots().then(setDarkSpots);
  }, []);

  // Dual-spline ApexCharts configuration
  const splineOptions: any = {
    chart: {
      type: 'area',
      background: 'transparent',
      toolbar: { show: false },
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    theme: { mode: isDark ? 'dark' : 'light' },
    stroke: { curve: 'smooth', width: [3, 2] },
    colors: ['#2563eb', '#dc2626'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0.05,
        stops: [0, 90, 100]
      }
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
      labels: { style: { colors: isDark ? '#94a3b8' : '#64748b', fontSize: '11px' } },
      axisBorder: { color: isDark ? '#334155' : '#cbd5e1' },
      axisTicks: { color: isDark ? '#334155' : '#cbd5e1' }
    },
    yaxis: [
      {
        title: { text: 'Speed (km/h)', style: { color: '#2563eb', fontSize: '11px', fontWeight: 600 } },
        labels: { style: { colors: isDark ? '#94a3b8' : '#64748b', fontSize: '11px' } }
      },
      {
        opposite: true,
        title: { text: 'Distress (events/h)', style: { color: '#dc2626', fontSize: '11px', fontWeight: 600 } },
        labels: { style: { colors: isDark ? '#94a3b8' : '#64748b', fontSize: '11px' } }
      }
    ],
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: isDark ? '#cbd5e1' : '#334155' },
      fontSize: '11px'
    },
    grid: {
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
      strokeDashArray: 4
    }
  };

  const splineSeries = [
    {
      name: 'Transit Speed (km/h)',
      data: [54, 58, 62, 59, 42, 31, 28, 34, 39, 32, 29, 44]
    },
    {
      name: 'Distress Ingestion Rate',
      data: [2, 1, 1, 3, 9, 14, 16, 12, 11, 15, 13, 5]
    }
  ];

  // Radial Bar ApexCharts configuration for RPI weights
  const radialOptions: any = {
    chart: {
      type: 'radialBar',
      background: 'transparent',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    theme: { mode: isDark ? 'dark' : 'light' },
    plotOptions: {
      radialBar: {
        offsetY: 0,
        startAngle: 0,
        endAngle: 270,
        hollow: { margin: 5, size: '25%', background: 'transparent' },
        track: { background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
        dataLabels: {
          name: { show: true, fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' },
          value: { show: true, fontSize: '14px', color: isDark ? '#f1f5f9' : '#0f172a', fontWeight: 700, formatter: (val: number) => `${val}%` },
          total: {
            show: true,
            label: 'Total Weight',
            formatter: () => '100%'
          }
        }
      }
    },
    colors: ['#dc2626', '#f59e0b', '#2563eb', '#4f46e5'],
    labels: ['Severity (40%)', 'Passes (20%)', 'Road Class (20%)', 'POI Proximity (20%)'],
    legend: {
      show: true,
      floating: true,
      fontSize: '11px',
      position: 'bottom',
      offsetX: -10,
      offsetY: 0,
      labels: { useSeriesColors: true }
    }
  };

  const radialSeries = [40, 20, 20, 20];

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar p-5 md:p-6 lg:p-7 space-y-5 max-w-[1750px] mx-auto w-full select-none">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">Road Network Analytics</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            MoRTH road condition reporting · Multi-factor priority index · Formula v2.6
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" size="sm" dot>Live Data</Badge>
          <Button variant="outline" size="sm" icon={<ChartColumn className="w-3.5 h-3.5" />}>Export Report</Button>
        </div>
      </div>

      {/* Sleek 4-Stat Analytics KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Ingests */}
        <Card className="p-3.5 flex flex-col justify-between shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="uppercase tracking-wider font-semibold">Total Ingests</span>
            <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">{metrics.total_ingests}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate ml-auto">Raw Mobile Ingests</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: '85%' }} />
          </div>
        </Card>

        {/* Deduplication Ratio */}
        <Card className="p-3.5 flex flex-col justify-between shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="uppercase tracking-wider font-semibold">Deduplication</span>
            <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">{metrics.deduplication_ratio}%</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate ml-auto">Noise Rejection</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${metrics.deduplication_ratio}%` }} />
          </div>
        </Card>

        {/* Avg Priority Score */}
        <Card className="p-3.5 flex flex-col justify-between shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="uppercase tracking-wider font-semibold">Avg Priority</span>
            <TriangleAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">{metrics.avg_priority_score}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate ml-auto">Dynamic RPI</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(metrics.avg_priority_score / 100) * 100}%` }} />
          </div>
        </Card>

        {/* Critical Hazards */}
        <Card className="p-3.5 flex flex-col justify-between shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="uppercase tracking-wider font-semibold">Critical Potholes</span>
            <ShieldCheck className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">{metrics.critical_hazards}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate ml-auto">Emergency Infill</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full" style={{ width: '60%' }} />
          </div>
        </Card>
      </div>

      {/* 2-Column Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Dual Spline Time Series */}
        <Card className="lg:col-span-8 p-4 lg:p-5 flex flex-col shadow-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">Defect Frequency vs Operating Velocity</span>
            </div>
            <Badge variant="medium" size="sm">
              CORRELATION
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Time-series correlation between bus operating speed (km/h) and distress frequency along arterial routes
          </p>
          <div className="h-64">
            <Chart options={splineOptions} series={splineSeries} type="area" height="100%" />
          </div>
        </Card>

        {/* Right: RPI Factor Weights Radial Bar */}
        <Card className="lg:col-span-4 p-4 lg:p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">Priority Factor Weights</span>
              </div>
              <Badge variant="purple" size="sm">
                DISTRIBUTION
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-1">
              Multi-radial breakdown of the 4 priority factors: Severity, Frequency, Highway, and POI proximity
            </p>
            <div className="h-60 flex items-center justify-center">
              <Chart options={radialOptions} series={radialSeries} type="radialBar" height="100%" />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Target: Zero Accident Corridor</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">Formula V2.6 Active</span>
          </div>
        </Card>
      </div>

      {/* NEW: 2-Column Analytical Deep-Dive (Pavement Deterioration vs Contractor Expenditure) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: 6-Month Pavement Deterioration Index by Corridor */}
        <Card className="lg:col-span-7 p-4 lg:p-5 flex flex-col shadow-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                Pavement Degradation Index (PCI Decay)
              </span>
            </div>
            <Badge variant="success" size="sm">
              6-MONTH TREND
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Pavement Condition Index (PCI) decay trajectory across top 4 arterial transit corridors
          </p>
          <div className="h-64">
            <Chart
              options={{
                chart: { type: 'bar', background: 'transparent', toolbar: { show: false } },
                theme: { mode: isDark ? 'dark' : 'light' },
                colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
                plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 } },
                dataLabels: { enabled: false },
                xaxis: {
                  categories: ['May 25', 'Jun 25', 'Jul 25', 'Aug 25', 'Sep 25'],
                  labels: { style: { colors: isDark ? '#94a3b8' : '#64748b', fontSize: '11px' } }
                },
                yaxis: {
                  title: { text: 'Pavement Quality (PCI)', style: { color: isDark ? '#94a3b8' : '#64748b' } },
                  max: 100,
                  labels: { style: { colors: isDark ? '#94a3b8' : '#64748b' } }
                },
                legend: { position: 'top', horizontalAlign: 'right', labels: { colors: isDark ? '#cbd5e1' : '#334155' } },
                grid: { borderColor: isDark ? '#1e293b' : '#e2e8f0', strokeDashArray: 3 }
              }}
              series={[
                { name: 'Anna Salai (CBD)', data: [88, 85, 82, 79, 76] },
                { name: 'OMR IT Express', data: [92, 89, 87, 85, 83] },
                { name: 'GST Road (NH-32)', data: [74, 69, 64, 58, 52] },
                { name: 'Inner Ring Road', data: [80, 76, 71, 66, 61] }
              ]}
              type="bar"
              height="100%"
            />
          </div>
        </Card>

        {/* Right: Municipal Road Repair Cost Breakdown */}
        <Card className="lg:col-span-5 p-4 lg:p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                  Contractor Liquidated Damages
                </span>
              </div>
              <Badge variant="purple" size="sm">
                IRC:SP:20
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-2">
              Monthly escrow debits and contractor penalties levied under MoRTH Quality Audits
            </p>
            <div className="h-56">
              <Chart
                options={{
                  chart: { type: 'donut', background: 'transparent' },
                  theme: { mode: isDark ? 'dark' : 'light' },
                  colors: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'],
                  labels: ['Pothole SLA Breaches', 'Defective Asphalt Material', 'Missing Zebra Paint', 'Waterlogging Ponding'],
                  plotOptions: { pie: { donut: { size: '68%' } } },
                  dataLabels: { enabled: false },
                  legend: { position: 'bottom', labels: { colors: isDark ? '#94a3b8' : '#64748b' }, fontSize: '10.5px' }
                }}
                series={[45, 25, 18, 12]}
                type="donut"
                height="100%"
              />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>Total Debited: <b className="text-rose-600 dark:text-rose-400">₹8,45,000</b></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% Escrow Recovery</span>
          </div>
        </Card>
      </div>

      {/* Monsoon Elevation & Hydroplaning 30-Min Rush-Hour Predictor */}
      <MonsoonInundationPredictor />

      {/* Arterial Road Corridor Risk Matrix Table */}
      <Card className="p-4 lg:p-6 flex flex-col gap-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100">
                Chennai Arterial Road Corridor Risk Matrix
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Dynamic risk priority index calculated across primary transit routes in the Greater Chennai region
            </p>
          </div>
          <Badge variant="medium" size="sm" className="self-start sm:self-auto font-semibold">
            {corridors.length} Arterials Monitored
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] uppercase">
                <th className="pb-3 font-semibold">Corridor Name</th>
                <th className="pb-3 font-semibold">Classification</th>
                <th className="pb-3 font-semibold text-center">Clusters</th>
                <th className="pb-3 font-semibold text-center">Raw Ingests</th>
                <th className="pb-3 font-semibold text-center">Critical Potholes</th>
                <th className="pb-3 font-semibold">Average RPI</th>
                <th className="pb-3 font-semibold">Action Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {corridors.map((c) => {
                const isPriority = c.action_status === 'PRIORITY DISPATCH';
                return (
                  <tr key={c.corridor_name} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>{c.corridor_name}</span>
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400 text-[11px]">{c.classification}</td>
                    <td className="py-3 text-center text-slate-700 dark:text-slate-300 font-medium">{c.clusters_count}</td>
                    <td className="py-3 text-center text-blue-600 dark:text-blue-400 font-bold font-mono">{c.raw_ingests}</td>
                    <td className="py-3 text-center">
                      {c.critical_d40_count > 0 ? (
                        <Badge variant="critical" size="sm" className="font-bold font-mono">
                          {c.critical_d40_count}
                        </Badge>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 font-mono">0</span>
                      )}
                    </td>
                    <td className="py-3 w-40">
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">RPI Score</span>
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border font-mono ${
                            c.average_rpi >= 85 ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' : 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          }`}>
                            {c.average_rpi}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full bg-gradient-to-r ${
                              c.average_rpi >= 85 ? 'from-amber-500 to-rose-600' : 'from-blue-500 to-amber-500'
                            }`}
                            style={{ width: `${c.average_rpi}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge variant={isPriority ? 'critical' : 'success'} size="sm">
                        {c.action_status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edge Fleet Observation Diagnostics */}
      <Card className="p-4 lg:p-6 flex flex-col gap-4 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100">Edge Fleet Observation Diagnostics</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {fleet.map((bus) => (
            <div key={bus.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1424] p-3 flex flex-col justify-between gap-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs font-mono">{bus.id}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums">{bus.raw_ingests_count}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">ingests</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Route: {bus.route_name}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── 1. VISION ZERO SAFE SCHOOL & HOSPITAL CORRIDORS ────────────────── */}
      <Card className="p-4 lg:p-6 flex flex-col gap-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-rose-500" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100">
                {language === 'hi' ? 'विजन ज़ीरो: स्कूल एवं अस्पताल सुरक्षित गलियारा ऑडिट' : 'Vision Zero: Safe School & Hospital Corridor Index'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'hi'
                  ? 'जेब्रा क्रॉसिंग, चेतावनी बोर्ड और फुटपाथ अतिक्रमण का समग्र सुरक्षा मूल्यांकन (IRC:35 / MoRTH)'
                  : 'Multi-class pedestrian safety audit: Zebra crossing paint, caution signage, and footpath encroachment'}
              </p>
            </div>
          </div>
          <Badge variant="medium" size="sm" className="font-mono">
            {safeCorridors.length} Facilities Monitored
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {safeCorridors.map((c) => {
            const isGradeA = c.letter_grade.startsWith('A');
            const isGradeF = c.letter_grade === 'F';
            const gradeColor = isGradeA ? 'text-emerald-600 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800' : isGradeF ? 'text-rose-600 bg-rose-50 border-rose-300 dark:bg-rose-950/60 dark:border-rose-800' : 'text-amber-600 bg-amber-50 border-amber-300 dark:bg-amber-950/60 dark:border-amber-800';

            return (
              <div key={c.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0E1424] flex flex-col justify-between gap-3 shadow-xs">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                        {c.zone}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        {c.facility_name}
                      </h3>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">{c.corridor_road}</div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-base shrink-0 ${gradeColor}`}>
                      {c.letter_grade}
                    </div>
                  </div>

                  {/* Safety Score Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500">Corridor Safety Score</span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{c.overall_score}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${isGradeA ? 'bg-emerald-500' : isGradeF ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${c.overall_score}%` }} />
                    </div>
                  </div>

                  {/* Audit Checklist */}
                  <div className="mt-3 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Zebra Crossing (IRC:35):</span>
                      <span className={`font-semibold ${c.zebra_crossing_status === 'COMPLIANT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {c.zebra_crossing_status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Caution Signage:</span>
                      <span className={`font-semibold ${c.signage_status === 'INSTALLED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {c.signage_status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Footpath Clearance:</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{c.footpath_clearance_pct}%</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span className="truncate max-w-[200px]">{c.recommended_work_order}</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 shrink-0">{c.last_patrol_bus_id}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── 2. NIGHT-TIME DARK SPOTS & STREETLIGHT OUTAGE MAPPER ───────────── */}
      <Card className="p-4 lg:p-6 flex flex-col gap-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-500" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100">
                {language === 'hi' ? 'रात्रि प्रकाश एवं अंधेरे क्षेत्र (स्ट्रीटलाइट आउटेज ऑडिट)' : 'Night-Time Luminescence & Dark Spot Outage Audit'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'hi'
                  ? 'रात 8 से 12 बजे की बस गश्त द्वारा मापा गया प्रकाश स्तर (<5 Lux) — महिला व पैदल यात्री सुरक्षा'
                  : 'Unlit corridors (<5 Lux over >50m) mapped via Starlight camera gain telemetry for commuter safety'}
              </p>
            </div>
          </div>
          <Badge variant="critical" size="sm" className="font-mono">
            {darkSpots.length} Critical Dark Corridors
          </Badge>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] uppercase">
                <th className="py-2.5 px-3">Unlit Corridor Segment</th>
                <th className="py-2.5 px-3">Zone / Division</th>
                <th className="py-2.5 px-3">Unlit Length</th>
                <th className="py-2.5 px-3 text-center">Avg Luminescence</th>
                <th className="py-2.5 px-3">Nearby Commuter Anchor</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {darkSpots.map((spot) => (
                <tr key={spot.id} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition">
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span>{spot.road_name}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">{spot.zone}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">{spot.length_meters}m</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-mono font-bold border border-rose-200 dark:border-rose-800 text-[11px]">
                      {spot.avg_lux} Lux
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 text-[11px]">{spot.nearby_poi}</td>
                  <td className="py-3 px-3 text-center">
                    <Badge variant="warning" size="sm">
                      Electrical Div Dispatched
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
