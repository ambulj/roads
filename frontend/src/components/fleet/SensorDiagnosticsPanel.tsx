import React, { useState, useEffect } from "react";
import {
  Activity, Radio, Camera, Cpu, Gauge, Zap,
  Thermometer, Compass, BatteryCharging, Wifi,
  HardDrive, AlertTriangle, ShieldCheck
} from "lucide-react";
import { FleetNode } from "../../types";
import { Card, Badge } from "../ui";

interface SensorDiagnosticsPanelProps {
  bus: FleetNode;
}

export const SensorDiagnosticsPanel: React.FC<SensorDiagnosticsPanelProps> = ({ bus }) => {
  // Live micro-ticking telemetry state to simulate 5Hz sensor stream
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTicks((t) => (t + 1) % 1000);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Compute live fluctuating sensor values based on bus state
  const speed = bus.speed_kmh || 38;
  const imuGz = bus.imu_jerk_gz || 0.98;

  // IMU 6-Axis calculations
  const accelX = Number(((Math.sin(ticks * 0.7) * 0.15)).toFixed(2));
  const accelY = Number(((speed * 0.02) + (Math.cos(ticks * 0.5) * 0.1)).toFixed(2));
  const accelZ = Number((imuGz + (Math.sin(ticks * 1.3) * 0.08)).toFixed(2));

  const gyroX = Number((Math.sin(ticks * 0.4) * 1.2).toFixed(1));
  const gyroY = Number((Math.cos(ticks * 0.6) * 1.5).toFixed(1));
  const gyroZ = Number(((bus.heading ? bus.heading * 0.01 : 0.8) + Math.sin(ticks * 0.3) * 0.5).toFixed(1));

  // GNSS / NavIC
  const satellites = 9 + (ticks % 4);
  const hdop = Number((0.85 + (ticks % 3) * 0.05).toFixed(2));

  // 4G Modem
  const rssi = -68 - (ticks % 7);
  const latency = 45 + (ticks % 15);

  // Power monitor (INA219)
  const voltage = Number((24.2 + (Math.sin(ticks * 0.2) * 0.3)).toFixed(1)); // 24V bus electrical system
  const currentMa = Math.round(260 + (bus.edge_fps || 25) * 4.5 + (ticks % 20));
  const powerW = Number(((voltage * currentMa) / 1000).toFixed(1));

  // Climate (DHT22)
  const asphaltTemp = Number((38.5 + (Math.sin(ticks * 0.1) * 2.2)).toFixed(1));
  const humidity = Math.round(62 + (ticks % 5));

  // OBD-II CAN-Bus (J1939)
  const engineRpm = Math.round(1350 + (speed * 12) + (Math.sin(ticks * 0.8) * 40));
  const throttlePct = Math.min(85, Math.round(20 + speed * 0.9));

  return (
    <div className="flex flex-col gap-4">
      {/* Sensor Suite Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-600 text-white">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Indian Smart Transit Integrated Sensor Suite
              </span>
              <Badge variant="success" size="sm" dot>
                7/7 ONLINE
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              5Hz Multi-Sensor Fusion running on {bus.npu_hardware} Edge NPU
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 dark:text-slate-400">
          <span>Stream ID:</span>
          <span className="text-blue-600 dark:text-blue-400 font-bold">{bus.id}</span>
          <span>•</span>
          <span className="text-emerald-600 dark:text-emerald-400">Lock: 5 Hz</span>
        </div>
      </div>

      {/* Grid of 7 Real Sensors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Sensor 1: MPU-6050 6-Axis IMU */}
        <Card className="p-3.5 flex flex-col justify-between shadow-xs border-l-4 border-l-blue-600">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                <span>MPU-6050 6-Axis IMU</span>
              </div>
              <Badge variant="medium" size="sm">
                I2C @ 100Hz
              </Badge>
            </div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1.5">
              Pothole shock detection and International Roughness Index (IRI) calculation
            </p>

            {/* Readout matrix */}
            <div className="grid grid-cols-3 gap-1.5 mt-3 font-mono text-[10.5px]">
              <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] text-slate-400 uppercase">Accel X</span>
                <div className="font-bold text-slate-800 dark:text-slate-200">{accelX}g</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] text-slate-400 uppercase">Accel Y</span>
                <div className="font-bold text-slate-800 dark:text-slate-200">{accelY}g</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/40 p-1.5 rounded border border-blue-200 dark:border-blue-900">
                <span className="text-[9px] text-blue-500 uppercase font-bold">Shock Z</span>
                <div className="font-bold text-blue-600 dark:text-blue-400">{accelZ}g</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 mt-1.5 font-mono text-[10.5px]">
              <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] text-slate-400 uppercase">Gyro X</span>
                <div className="text-slate-700 dark:text-slate-300">{gyroX}°/s</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] text-slate-400 uppercase">Gyro Y</span>
                <div className="text-slate-700 dark:text-slate-300">{gyroY}°/s</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] text-slate-400 uppercase">Gyro Z</span>
                <div className="text-slate-700 dark:text-slate-300">{gyroZ}°/s</div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
            <span>Roughness (IRI): <b className="text-emerald-600">2.4 m/km (Good)</b></span>
            <span className="text-emerald-500 font-semibold">Calibrated</span>
          </div>
        </Card>

        {/* Sensor 2: Sony IMX335 1080p HDR Camera */}
        <Card className="p-3.5 flex flex-col justify-between shadow-xs border-l-4 border-l-emerald-600">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sony IMX335 Optics</span>
              </div>
              <Badge variant="success" size="sm">
                MIPI-CSI2
              </Badge>
            </div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1.5">
              1920x1080 @ 30 FPS with True WDR starlight low-light sensitivity
            </p>

            <div className="grid grid-cols-2 gap-2 mt-3 font-mono text-[10.5px]">
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] text-slate-400 uppercase">Edge NPU Rate</span>
                <div className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  {bus.edge_fps || 28.4} FPS
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] text-slate-400 uppercase">Camera Temp</span>
                <div className="text-slate-800 dark:text-slate-200 font-bold text-xs">
                  42.8°C
                </div>
              </div>
            </div>

            <div className="mt-2.5">
              <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                <span>AI Confidence Threshold:</span>
                <span className="font-bold text-blue-600">85% INT8 Quantized</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "88%" }} />
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
            <span>Lens: 120° FOV Anti-Glare</span>
            <span className="text-emerald-500 font-semibold">Clean Lock</span>
          </div>
        </Card>

        {/* Sensor 3: u-blox NEO-6M GNSS + NavIC */}
        <Card className="p-3.5 flex flex-col justify-between shadow-xs border-l-4 border-l-indigo-600">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                <Compass className="w-3.5 h-3.5 text-indigo-600" />
                <span>u-blox NEO-6M GNSS</span>
              </div>
              <Badge variant="purple" size="sm">
                NavIC + GPS
              </Badge>
            </div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1.5">
              5 Hz continuous spatial coordinate lock beneath metro pillars & flyovers
            </p>

            <div className="grid grid-cols-2 gap-2 mt-3 font-mono text-[10.5px]">
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] text-slate-400 uppercase">Satellites Fixed</span>
                <div className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  {satellites} Locked
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] text-slate-400 uppercase">HDOP Accuracy</span>
                <div className="text-slate-800 dark:text-slate-200 font-bold text-xs">
                  {hdop} m (1.5m CEP)
                </div>
              </div>
            </div>

            <div className="mt-2.5 bg-slate-50 dark:bg-slate-800 p-1.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-600 dark:text-slate-400">
              <div>LAT: {bus.lat.toFixed(5)}° N</div>
              <div>LNG: {bus.lng.toFixed(5)}° E (Heading: {bus.heading || 45}°)</div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
            <span>Constellation: GPS + NavIC</span>
            <span className="text-emerald-500 font-semibold">3D Differential Fix</span>
          </div>
        </Card>

        {/* Sensor 4: Quectel EC25 4G LTE eSIM */}
        <Card className="p-3.5 flex flex-col justify-between shadow-xs border-l-4 border-l-amber-600">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                <Radio className="w-3.5 h-3.5 text-amber-600" />
                <span>Quectel EC25 4G Modem</span>
              </div>
              <Badge variant="warning" size="sm">
                LTE Cat 4
              </Badge>
            </div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1.5">
              Secure MQTT-over-TLS 1.3 uplink with SQLite store-and-forward fallback
            </p>

            <div className="grid grid-cols-2 gap-2 mt-3 font-mono text-[10.5px]">
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] text-slate-400 uppercase">Uplink RSSI</span>
                <div className="text-amber-600 dark:text-amber-400 font-bold text-xs">
                  {rssi} dBm
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] text-slate-400 uppercase">Ping Latency</span>
                <div className="text-slate-800 dark:text-slate-200 font-bold text-xs">
                  {latency} ms
                </div>
              </div>
            </div>

            <div className="mt-2.5">
              <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                <span>Signal Quality (4/5 Bars):</span>
                <span className="font-bold text-emerald-600">BSR Strong</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: "82%" }} />
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
            <span>Fallback: 32GB Flash eMMC</span>
            <span className="text-emerald-500 font-semibold">0 drops</span>
          </div>
        </Card>

        {/* Sensor 5: INA219 Vehicle Power Monitor */}
        <Card className="p-3.5 flex flex-col justify-between shadow-xs border-l-4 border-l-rose-600">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                <BatteryCharging className="w-3.5 h-3.5 text-rose-600" />
                <span>INA219 Power Monitor</span>
              </div>
              <Badge variant="critical" size="sm">
                12/24V Regulated
              </Badge>
            </div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1.5">
              Surge, reverse-polarity &amp; alternator ripple protection for Indian buses
            </p>

            <div className="grid grid-cols-3 gap-1.5 mt-3 font-mono text-[10.5px]">
              <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] text-slate-400 uppercase">Bus Voltage</span>
                <div className="font-bold text-slate-800 dark:text-slate-200">{voltage} V</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] text-slate-400 uppercase">Draw Current</span>
                <div className="font-bold text-slate-800 dark:text-slate-200">{currentMa} mA</div>
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded border border-rose-200 dark:border-rose-900">
                <span className="text-[9px] text-rose-500 uppercase font-bold">Total Draw</span>
                <div className="font-bold text-rose-600 dark:text-rose-400">{powerW} W</div>
              </div>
            </div>

            <div className="mt-2.5 text-[10px] text-slate-500">
              Low-power operation: Draws &lt; 5W from bus auxiliary circuit.
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
            <span>Input Tolerance: 9V - 36V</span>
            <span className="text-emerald-500 font-semibold">Surge Suppressed</span>
          </div>
        </Card>

        {/* Sensor 6: DHT22 Asphalt Heat & Monsoon Sensor */}
        <Card className="p-3.5 flex flex-col justify-between shadow-xs border-l-4 border-l-teal-600">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                <Thermometer className="w-3.5 h-3.5 text-teal-600" />
                <span>DHT22 Climate / Asphalt</span>
              </div>
              <Badge variant="info" size="sm">
                1-Wire Digital
              </Badge>
            </div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1.5">
              High-temperature bitumen degradation monitoring &amp; monsoon waterlog detection
            </p>

            <div className="grid grid-cols-2 gap-2 mt-3 font-mono text-[10.5px]">
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] text-slate-400 uppercase">Road Surface Heat</span>
                <div className="text-teal-600 dark:text-teal-400 font-bold text-xs">
                  {asphaltTemp}°C
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] text-slate-400 uppercase">Ambient Humidity</span>
                <div className="text-slate-800 dark:text-slate-200 font-bold text-xs">
                  {humidity}% RH
                </div>
              </div>
            </div>

            <div className="mt-2.5 text-[10px] text-slate-500">
              {humidity > 70 ? (
                <span className="text-amber-600 font-semibold">High Monsoon Humidity — Surface softens</span>
              ) : (
                <span className="text-emerald-600 font-semibold">Standard tropical dry condition</span>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
            <span>Bitumen Threshold: 55°C</span>
            <span className="text-emerald-500 font-semibold">Within Limits</span>
          </div>
        </Card>

        {/* Sensor 7: OBD-II CAN Bus (J1939 Transit Standard) */}
        <Card className="p-3.5 flex flex-col justify-between shadow-xs border-l-4 border-l-cyan-600 md:col-span-2 lg:col-span-3">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                <Gauge className="w-3.5 h-3.5 text-cyan-600" />
                <span>OBD-II CAN-Bus Transit Interface (SAE J1939 Standard)</span>
              </div>
              <Badge variant="neutral" size="sm">
                250 kbps CAN
              </Badge>
            </div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1.5">
              Direct diagnostic connection to the public transit bus ECU for speed, braking, and engine load correlation
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 font-mono text-[10.5px]">
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] text-slate-400 uppercase">Engine RPM</span>
                <div className="text-cyan-600 dark:text-cyan-400 font-bold text-xs">{engineRpm} RPM</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] text-slate-400 uppercase">Road Speed</span>
                <div className="text-slate-800 dark:text-slate-200 font-bold text-xs">{speed} km/h</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] text-slate-400 uppercase">Throttle Position</span>
                <div className="text-slate-800 dark:text-slate-200 font-bold text-xs">{throttlePct}%</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] text-slate-400 uppercase">Service Brake</span>
                <div className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">Released (Nominal)</div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
            <span>Bus Model: Ashok Leyland / Tata Starbus Transit</span>
            <span className="text-emerald-500 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> J1939 Compliant
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
};
