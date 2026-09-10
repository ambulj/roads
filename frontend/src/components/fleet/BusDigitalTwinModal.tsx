import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { 
  X, 
  Bus, 
  Gauge, 
  Activity, 
  Zap, 
  RotateCw, 
  AlertTriangle, 
  Fuel, 
  Wrench,
  Sparkles,
  Play,
  RotateCcw
} from "lucide-react";

interface BusDigitalTwinModalProps {
  isOpen: boolean;
  onClose: () => void;
  busId?: string;
}

export const BusDigitalTwinModal: React.FC<BusDigitalTwinModalProps> = ({
  isOpen,
  onClose,
  busId = "BUS-04 (DL-1PC-4021)",
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [verticalJerkGz, setVerticalJerkGz] = useState(0.85);
  const [axleStressPct, setAxleStressPct] = useState(48);
  const [impactCount, setImpactCount] = useState(14);
  const [isSimulatingShock, setIsSimulatingShock] = useState(false);

  const busGroupRef = useRef<THREE.Group | null>(null);
  const shockVelocityRef = useRef<number>(0);
  const shockDisplacementRef = useRef<number>(0);

  // Trigger Pothole Shockwave (+3.2g)
  const handleSimulateShock = () => {
    setIsSimulatingShock(true);
    shockVelocityRef.current = 0.35; // Kick upward velocity
    setVerticalJerkGz(3.2);
    setAxleStressPct(88);
    setImpactCount((c) => c + 1);
    setTimeout(() => {
      setIsSimulatingShock(false);
      setVerticalJerkGz(0.85);
      setAxleStressPct(52);
    }, 2800);
  };

  // Three.js Scene Setup
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 420;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080E1A);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(12, 7, 14);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // 2. Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x60a5fa, 1.5);
    dirLight.position.set(10, 15, 10);
    scene.add(dirLight);

    const bottomGlow = new THREE.DirectionalLight(0x10b981, 0.6);
    bottomGlow.position.set(0, -5, 0);
    scene.add(bottomGlow);

    // 3. Grid Pavement Ground
    const grid = new THREE.GridHelper(24, 24, 0x1e293b, 0x0f172a);
    grid.position.y = -0.01;
    scene.add(grid);

    // 4. Construct 3D Bus Group
    const busGroup = new THREE.Group();
    busGroupRef.current = busGroup;
    scene.add(busGroup);

    // Chassis Body (Aerodynamic Public Bus)
    const bodyGeo = new THREE.BoxGeometry(7.5, 2.4, 2.7);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0x2563eb, // Royal Blue GCC Bus
      roughness: 0.2, 
      metalness: 0.4 
    });
    const busBody = new THREE.Mesh(bodyGeo, bodyMat);
    busBody.position.y = 1.9;
    busGroup.add(busBody);

    // Bus Roof Stripe
    const roofGeo = new THREE.BoxGeometry(7.6, 0.3, 2.75);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 3.15;
    busGroup.add(roof);

    // Windshield & Windows
    const glassMat = new THREE.MeshStandardMaterial({ 
      color: 0x0ea5e9, 
      roughness: 0.1, 
      metalness: 0.9, 
      transparent: true, 
      opacity: 0.85 
    });
    // Front windshield
    const windGeo = new THREE.BoxGeometry(0.1, 1.4, 2.5);
    const wind = new THREE.Mesh(windGeo, glassMat);
    wind.position.set(3.76, 2.1, 0);
    busGroup.add(wind);

    // Side Windows
    const sideGlassGeo = new THREE.BoxGeometry(6.4, 1.0, 2.76);
    const sideGlass = new THREE.Mesh(sideGlassGeo, glassMat);
    sideGlass.position.set(-0.2, 2.2, 0);
    busGroup.add(sideGlass);

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.5, 24);
    wheelGeo.rotateX(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const hubMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });

    const wheelPositions = [
      [2.3, 0.65, 1.35],
      [2.3, 0.65, -1.35],
      [-2.3, 0.65, 1.35],
      [-2.3, 0.65, -1.35],
    ];

    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(wx, wy, wz);
      scene.add(wheel); // Wheels stay on ground

      // Hubcap
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.52, 16), hubMat);
      hub.rotateX(Math.PI / 2);
      hub.position.set(wx, wy, wz);
      scene.add(hub);

      // Suspension Springs (Connecting wheel to body)
      const springGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8);
      const springMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6 });
      const spring = new THREE.Mesh(springGeo, springMat);
      spring.position.set(wx, wy + 0.45, wz * 0.8);
      busGroup.add(spring);
    });

    // 5. Mouse Drag Orbit Controls
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;

    const dom = renderer.domElement;
    const onMouseDown = (e: MouseEvent) => { isDragging = true; prevX = e.clientX; prevY = e.clientY; };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      scene.rotation.y += dx * 0.008;
      camera.position.y = Math.max(3, Math.min(14, camera.position.y - dy * 0.03));
      camera.lookAt(0, 1.5, 0);
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onMouseUp = () => { isDragging = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(8, Math.min(26, camera.position.z + e.deltaY * 0.015));
    };

    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    dom.addEventListener("wheel", onWheel, { passive: false });

    // 6. Suspension Physics Animation Loop (Harmonic Damped Spring)
    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Physics Spring Simulation: F = -k*x - c*v
      const k = 42.0; // Spring stiffness
      const c = 3.5;  // Damping coefficient
      const dt = 0.016;

      const springForce = -k * shockDisplacementRef.current - c * shockVelocityRef.current;
      shockVelocityRef.current += springForce * dt;
      shockDisplacementRef.current += shockVelocityRef.current * dt;

      // Pitch tilting when bouncing
      if (busGroupRef.current) {
        busGroupRef.current.position.y = shockDisplacementRef.current;
        busGroupRef.current.rotation.z = -shockDisplacementRef.current * 0.06;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const nw = mountRef.current.clientWidth;
      const nh = mountRef.current.clientHeight || 420;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      dom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      dom.removeEventListener("wheel", onWheel);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      bodyGeo.dispose();
      bodyMat.dispose();
      renderer.dispose();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn select-none"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#090E1A] border border-blue-900/60 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] text-white animate-scaleIn">
        
        {/* Header */}
        <div className="h-14 px-5 border-b border-slate-800 flex items-center justify-between bg-[#0B1222]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-xs">
              <Bus className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white tracking-wide">
                  3D Bus Chassis & Suspension Shock Digital Twin
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {busId}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Real-time 6-axis IMU vertical jerk and chassis spring stress simulation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Simulate Shock Action Button */}
            <button
              onClick={handleSimulateShock}
              disabled={isSimulatingShock}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-md ${
                isSimulatingShock 
                  ? "bg-rose-600 text-white animate-pulse" 
                  : "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30 active:scale-95"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isSimulatingShock ? "SHOCKWAVE ACTIVE (+3.2g)" : "💥 Simulate Pothole Shock (+3.2g)"}</span>
            </button>

            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body: 3D Viewport (8 cols) + Engineering Wear Analytics (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0">
          {/* 3D WebGL Canvas */}
          <div className="lg:col-span-8 relative bg-[#060A14] min-h-[380px] lg:min-h-[480px] flex items-center justify-center">
            <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

            {/* Live Vertical Jerk HUD */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700 text-xs font-mono">
                <span className="text-slate-400">Vertical Jerk (gz): </span>
                <strong className={`font-bold ${verticalJerkGz > 2 ? "text-rose-400" : "text-emerald-400"}`}>
                  +{verticalJerkGz.toFixed(2)}g
                </strong>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700 text-[11px] font-mono text-slate-300">
                <span>Orbit: Drag Mouse | Zoom: Scroll</span>
              </div>
            </div>

            {/* Spring Dampener Status */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">Suspension Coils: </span>
              <span className="text-emerald-400 font-bold">4× Pneumatic Air-Suspension Active</span>
              <span className="text-slate-400">Damping Ratio: 0.65 ζ</span>
            </div>
          </div>

          {/* Right: Fleet Health & Wear Analytics (4 cols) */}
          <div className="lg:col-span-4 p-5 bg-[#0A101F] border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between overflow-y-auto space-y-4">
            <div>
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                Chassis & Axle Telemetry
              </h4>

              <div className="space-y-3">
                {/* Metric 1: Axle Stress */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Axle Stress Index</span>
                    <strong className={`font-mono font-bold ${axleStressPct > 75 ? "text-rose-400" : "text-emerald-400"}`}>
                      {axleStressPct}%
                    </strong>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${axleStressPct > 75 ? "bg-rose-500" : "bg-emerald-500"}`}
                      style={{ width: `${axleStressPct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Peak load: +3.2g shockwave over D40 Pothole
                  </div>
                </div>

                {/* Metric 2: Fuel Penalty */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div className="text-xs">
                    <div className="text-slate-400 flex items-center gap-1.5">
                      <Fuel className="w-3.5 h-3.5 text-amber-500" />
                      <span>Excess Fuel Burned</span>
                    </div>
                    <div className="text-base font-bold text-amber-400 font-mono mt-0.5">+0.42 L / 100km</div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Due to rough drag</span>
                </div>

                {/* Metric 3: Lifespan Depreciation */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-xs flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-rose-400" />
                    <span>Suspension Wear Acceleration</span>
                  </div>
                  <div className="text-base font-bold text-rose-400 font-mono mt-0.5">+18% on NH-334</div>
                  <div className="text-[10.5px] text-slate-500 mt-1">
                    Premature bushing & shock absorber replacement in 45 days
                  </div>
                </div>

                {/* Metric 4: Daily Impact Counter */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div className="text-xs">
                    <div className="text-slate-400">Pothole Impacts Today</div>
                    <div className="text-lg font-extrabold text-white font-mono">{impactCount} Hits</div>
                  </div>
                  <span className="text-[10.5px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                    High Wear Route
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <button
                onClick={handleSimulateShock}
                disabled={isSimulatingShock}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 transition shadow-md shadow-blue-900/30 active:scale-98"
              >
                <Activity className="w-4 h-4" />
                <span>Simulate Dynamic Pothole Impact</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
