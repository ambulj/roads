import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Camera, Gauge, Cpu, Activity, ShieldAlert, Play, Pause } from 'lucide-react';
import { FleetNode } from '../../types';

interface ThreeCockpitProps {
  fleet: FleetNode[];
  selectedBusId?: string;
  onSelectBus?: (busId: string) => void;
}

export const ThreeCockpit: React.FC<ThreeCockpitProps> = ({
  fleet,
  selectedBusId = 'BUS-TN01-1042',
  onSelectBus
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeBusId, setActiveBusId] = useState<string>(selectedBusId);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const activeBus = fleet.find((b) => b.id === activeBusId) || fleet[0];

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 380;

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);
    scene.fog = new THREE.FogExp2(0x030712, 0.035);

    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 3.5); // Bus driver windshield eye level
    camera.rotation.x = -0.05;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(5, 12, 5);
    scene.add(dirLight);

    // Asphalt Road Plane
    const roadGeo = new THREE.PlaneGeometry(12, 80);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.85,
      metalness: 0.1
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    scene.add(road);

    // Curbs & Sidewalks
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const leftCurb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 80), curbMat);
    leftCurb.position.set(-6.4, 0.2, 0);
    scene.add(leftCurb);

    const rightCurb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 80), curbMat);
    rightCurb.position.set(6.4, 0.2, 0);
    scene.add(rightCurb);

    // Lane Dividers (Dashed Center Lines)
    const laneLines: THREE.Mesh[] = [];
    const lineGeo = new THREE.PlaneGeometry(0.2, 2.5);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = -35; i < 35; i += 5) {
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, 0.01, i);
      scene.add(line);
      laneLines.push(line);
    }

    // 3D Approaching Hazard (Pothole with glowing bounding box)
    const potholeGroup = new THREE.Group();
    const potholeMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.6, 0.05, 16),
      new THREE.MeshBasicMaterial({ color: 0x020617 })
    );
    potholeGroup.add(potholeMesh);

    // Wireframe Bounding Box
    const bboxGeo = new THREE.BoxGeometry(1.6, 0.8, 1.6);
    const bboxWire = new THREE.WireframeGeometry(bboxGeo);
    const bboxLine = new THREE.LineSegments(
      bboxWire,
      new THREE.LineBasicMaterial({ color: 0xf43f5e, linewidth: 2 })
    );
    bboxLine.position.y = 0.4;
    potholeGroup.add(bboxLine);

    potholeGroup.position.set(1.4, 0.02, -15);
    scene.add(potholeGroup);

    // 3D Approaching Car / Traffic (Passing in opposite lane)
    const carGroup = new THREE.Group();
    const carBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.2, 3.8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
    );
    carBody.position.y = 0.6;
    carGroup.add(carBody);

    // Headlights
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.1), headlightMat);
    hl1.position.set(-0.6, 0.5, 1.9);
    const hl2 = hl1.clone();
    hl2.position.set(0.6, 0.5, 1.9);
    carGroup.add(hl1, hl2);

    carGroup.position.set(-2.8, 0, -30);
    scene.add(carGroup);

    // Animation Loop with calibrated realistic speed & delta-time
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const dt = Math.min(0.064, Math.max(0.001, (time - lastTime) / 1000));
      lastTime = time;

      if (!isPaused) {
        // Calibrated realistic speed: 30 km/h approx 8.3 m/s in 3D world coordinates
        const speedUnits = 8.3 * dt;

        // Scroll dashed lane lines
        laneLines.forEach((line) => {
          line.position.z += speedUnits;
          if (line.position.z > 15) {
            line.position.z = -45;
          }
        });

        // Move Pothole hazard closer at realistic speed
        potholeGroup.position.z += speedUnits;
        if (potholeGroup.position.z > 5) {
          potholeGroup.position.z = -40;
          potholeGroup.position.x = (Math.random() - 0.5) * 4.0;
        }

        // Move passing traffic
        carGroup.position.z += speedUnits * 1.3;
        if (carGroup.position.z > 10) {
          carGroup.position.z = -60;
        }
      }

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m: THREE.Material) => m.dispose());
        }
      });
      renderer.forceContextLoss();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [activeBusId, isPaused]);

  return (
    <div className="relative w-full h-[420px] rounded-2xl overflow-hidden border border-slate-800 bg-[#030712] shadow-2xl">
      <div ref={mountRef} className="w-full h-full" />

      {/* Top Cockpit Telemetry HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-white font-mono text-xs shadow-lg pointer-events-auto">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-200">3D COCKPIT:</span>
          <span className="text-emerald-400">{activeBus.id}</span>
          <span className="text-slate-500">|</span>
          <span className="text-amber-400 font-bold">{activeBus.speed_kmh || 35} km/h</span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIsPaused(p => !p)}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition flex items-center gap-1.5 shadow-lg ${
              isPaused 
                ? 'bg-amber-600 border-amber-500 text-white' 
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'RESUME' : 'FREEZE'}</span>
          </button>
        </div>
      </div>

      {/* Bottom Center Crosshair & Target HUD */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none text-xs font-mono text-slate-400">
        <div className="bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
          EDGE NPU: Hailo-8 (26 TOPS) • LATENCY: 24ms
        </div>

        <div className="bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-rose-400 font-bold flex items-center gap-1.5 animate-pulse">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>APPROACHING POTHOLE D40 (3.2s)</span>
        </div>
      </div>
    </div>
  );
};
