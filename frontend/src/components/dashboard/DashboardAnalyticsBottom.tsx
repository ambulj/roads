import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Bus, TrendingUp, Wrench, ArrowRight } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface DashboardAnalyticsBottomProps {
  fleetCount?: number;
  workOrdersCount?: number;
  onNavigate?: (route: string) => void;
}

export const DashboardAnalyticsBottom: React.FC<DashboardAnalyticsBottomProps> = ({
  fleetCount = 24,
  workOrdersCount = 12,
  onNavigate,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subtextColor = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "#1e293b" : "#f1f5f9";

  // ── Card 1: Fleet Status (Donut) ──
  // Reference values: Running 18 (Green), Idle 4 (Blue), Maintenance 2 (Orange)
  const fleetSeries = [18, 4, 2];
  const fleetOptions: ApexOptions = {
    chart: {
      type: "donut",
      sparkline: { enabled: true },
      background: "transparent",
    },
    colors: ["#10b981", "#3b82f6", "#f59e0b"],
    labels: ["Running", "Idle", "Maintenance"],
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: "72%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total Buses",
              color: subtextColor,
              fontSize: "11px",
              fontFamily: "inherit",
              formatter: () => "24",
            },
            value: {
              show: true,
              fontSize: "22px",
              fontFamily: "inherit",
              fontWeight: 800,
              color: textColor,
              offsetY: -2,
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    tooltip: {
      theme: isDark ? "dark" : "light",
      y: { formatter: (val) => `${val} Buses` },
    },
    legend: { show: false },
  };

  // ── Card 2: 7-Day Detection Trend (Multi-line area) ──
  // Reference series: Road Hazards (Orange), Waterlogging (Cyan), Traffic Events (Purple)
  // Categories: 3 Sep, 4 Sep, 5 Sep, 6 Sep, 7 Sep, 8 Sep, 9 Sep
  const trendSeries = [
    { name: "Road Hazards", data: [8, 12, 10, 18, 15, 24, 20] },
    { name: "Waterlogging", data: [3, 5, 8, 4, 3, 7, 5] },
    { name: "Traffic Events", data: [5, 9, 7, 12, 11, 16, 14] },
  ];

  const trendOptions: ApexOptions = {
    chart: {
      type: "line",
      toolbar: { show: false },
      sparkline: { enabled: false },
      background: "transparent",
      animations: { enabled: true },
    },
    colors: ["#f59e0b", "#06b6d4", "#a855f7"],
    stroke: { curve: "smooth", width: 2.5 },
    markers: {
      size: 3.5,
      strokeWidth: 1.5,
      strokeColors: isDark ? "#0E1424" : "#ffffff",
      hover: { size: 6 }
    },
    xaxis: {
      categories: ["3 Sep", "4 Sep", "5 Sep", "6 Sep", "7 Sep", "8 Sep", "9 Sep"],
      labels: {
        style: {
          colors: subtextColor,
          fontSize: "10.5px",
          fontFamily: "inherit",
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: {
          colors: subtextColor,
          fontSize: "10.5px",
          fontFamily: "inherit",
        },
      },
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 3,
      padding: { left: 5, right: 5, top: 0, bottom: 0 },
    },
    tooltip: {
      theme: isDark ? "dark" : "light",
      shared: true,
      intersect: false,
    },
    legend: {
      show: true,
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "11px",
      labels: { colors: subtextColor },
      markers: { size: 4 },
    },
  };

  // ── Card 3: Work Order Status (Donut) ──
  // Reference values: Open 5 (Red), Assigned 4 (Blue), In Progress 2 (Yellow), Resolved 1 (Green)
  const workOrderSeries = [5, 4, 2, 1];
  const workOrderOptions: ApexOptions = {
    chart: {
      type: "donut",
      sparkline: { enabled: true },
      background: "transparent",
    },
    colors: ["#ef4444", "#3b82f6", "#f59e0b", "#10b981"],
    labels: ["Open", "Assigned", "In Progress", "Resolved"],
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: "72%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total Orders",
              color: subtextColor,
              fontSize: "11px",
              fontFamily: "inherit",
              formatter: () => "12",
            },
            value: {
              show: true,
              fontSize: "22px",
              fontFamily: "inherit",
              fontWeight: 800,
              color: textColor,
              offsetY: -2,
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    tooltip: {
      theme: isDark ? "dark" : "light",
      y: { formatter: (val) => `${val} Orders` },
    },
    legend: { show: false },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full select-none">
      {/* CARD 1: Fleet Status */}
      <div className="p-5 rounded-2xl bg-[#F8FAFD] dark:bg-[#0E1424] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Bus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Fleet Status</h3>
            </div>
            <button
              onClick={() => onNavigate?.("fleet")}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 gap-4">
            {/* Donut Chart */}
            <div className="w-32 h-32 shrink-0">
              <Chart options={fleetOptions} series={fleetSeries} type="donut" width="100%" height="100%" />
            </div>

            {/* Legend List */}
            <div className="flex-1 space-y-2 text-xs font-medium">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Running
                </span>
                <span className="font-bold text-slate-900 dark:text-white">18</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Idle
                </span>
                <span className="font-bold text-slate-900 dark:text-white">4</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Maintenance
                </span>
                <span className="font-bold text-slate-900 dark:text-white">2</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 2: Detection Trend (Last 7 days) */}
      <div className="p-5 rounded-2xl bg-[#F8FAFD] dark:bg-[#0E1424] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Detection Trend</h3>
              </div>
              <p className="text-[10.5px] text-slate-400 mt-0.5">Last 7 days</p>
            </div>
            <button
              onClick={() => onNavigate?.("analytics")}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-40 w-full">
            <Chart options={trendOptions} series={trendSeries} type="line" width="100%" height="100%" />
          </div>
        </div>
      </div>

      {/* CARD 3: Work Order Status */}
      <div className="p-5 rounded-2xl bg-[#F8FAFD] dark:bg-[#0E1424] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Work Order Status</h3>
            </div>
            <button
              onClick={() => onNavigate?.("work-orders")}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 gap-4">
            {/* Donut Chart */}
            <div className="w-32 h-32 shrink-0">
              <Chart options={workOrderOptions} series={workOrderSeries} type="donut" width="100%" height="100%" />
            </div>

            {/* Legend List */}
            <div className="flex-1 space-y-2 text-xs font-medium">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Open
                </span>
                <span className="font-bold text-slate-900 dark:text-white">5</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Assigned
                </span>
                <span className="font-bold text-slate-900 dark:text-white">4</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  In Progress
                </span>
                <span className="font-bold text-slate-900 dark:text-white">2</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Resolved
                </span>
                <span className="font-bold text-slate-900 dark:text-white">1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
