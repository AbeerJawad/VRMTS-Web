import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Home, ChevronRight, Maximize2, Eye, EyeOff,
  Layers, BookOpen, MessageSquare, Bookmark, Share2, Flag, Info,
  X, ChevronLeft, Play, FileText, Activity, Brain, List
} from 'lucide-react';
import { StudyAssistant } from '../components/StudyAssistant';

interface AnatomyPart {
  id: number;
  name: string;
  description: string;
  related: string[];
}

interface Layer {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface Section {
  id: number;
  name: string;
  parts: number;
}

interface BookmarkItem {
  name: string;
  rotation: { x: number; y: number };
}

// Track if Three.js scripts are loaded globally (only load once)
let scriptsLoaded = false;
let scriptLoadingPromise: Promise<void> | null = null;

export default function ModuleExploration() {
  const navigate = useNavigate();
  const { id } = useParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // UI State
  const [selectedLayer, setSelectedLayer] = useState<string>('all');
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [selectedPart, setSelectedPart] = useState<AnatomyPart | null>(null);
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<number>(0);
  const [anatomyParts, setAnatomyParts] = useState<AnatomyPart[]>([]);

  // 3D Viewer State
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredPartName, setHoveredPartName] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [groupList, setGroupList] = useState<any[]>([]);
  const [zoomLevel, setZoomLevel] = useState(300);
  const [skinOpacity, setSkinOpacity] = useState(0.5);
  const [activePlanes, setActivePlanes] = useState({ sagittal: false, coronal: false, transverse: false });
  const [explosionAmount, setExplosionAmount] = useState(0);

  const sceneRef = useRef<any>(null);

  const layers: Layer[] = [
    { id: 'all', name: 'All Layers', icon: Layers, color: 'from-cyan-500 to-teal-500' },
    { id: 'skeletal', name: 'Skeletal', icon: Activity, color: 'from-slate-400 to-slate-500' },
    { id: 'muscular', name: 'Muscular', icon: Activity, color: 'from-red-500 to-rose-500' },
    { id: 'nervous', name: 'Nervous', icon: Brain, color: 'from-yellow-500 to-amber-500' },
    { id: 'vascular', name: 'Vascular', icon: Activity, color: 'from-blue-500 to-indigo-500' }
  ];

  const sections: Section[] = [
    { id: 1, name: 'Overview', parts: 12 },
    { id: 2, name: 'Axial Skeleton', parts: 28 },
    { id: 3, name: 'Appendicular Skeleton', parts: 32 },
    { id: 4, name: 'Joints & Articulations', parts: 18 },
    { id: 5, name: 'Bone Structure', parts: 8 }
  ];

  const bookmarks: BookmarkItem[] = [
    { name: 'Anterior View', rotation: { x: 0, y: 0 } },
    { name: 'Posterior View', rotation: { x: 0, y: 180 } },
    { name: 'Lateral View', rotation: { x: 0, y: 90 } }
  ];

  const handlePartClick = (partName: string) => {
    let part = anatomyParts.find(p => p.name === partName);

    if (!part) {
      part = {
        id: anatomyParts.length + 1,
        name: partName,
        description: `Exploring ${partName}. Click "Learn More" for detailed information.`,
        related: []
      };
      setAnatomyParts([...anatomyParts, part]);
    }

    setSelectedPart(part);
  };

  // 3D Viewer Initialization
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let isMounted = true;

    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const loadScriptsOnce = async () => {
      if (scriptsLoaded) return;
      if (scriptLoadingPromise) return scriptLoadingPromise;

      scriptLoadingPromise = (async () => {
        await loadScript('https://cdn.jsdelivr.net/npm/fflate@0.7.4/umd/index.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/FBXLoader.js');
        scriptsLoaded = true;
      })();

      return scriptLoadingPromise;
    };

    const initScene = async () => {
      try {
        await loadScriptsOnce();

        if (!isMounted) return;

        const THREE = (window as any).THREE;
        const width = container.clientWidth;
        const height = container.clientHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0f172a);

        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
        camera.position.set(0, 100, 300);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.localClippingEnabled = true;
        container.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight1.position.set(100, 100, 100);
        scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight2.position.set(-100, 50, -100);
        scene.add(directionalLight2);

        const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.3);
        directionalLight3.position.set(0, -50, 0);
        scene.add(directionalLight3);

        const loader = new (THREE as any).FBXLoader();
        let loadedModel: any = null;
        let originalMaterials = new Map();

        const clippingPlanes: any[] = [];
        const updateClippingPlanes = () => {
          clippingPlanes.length = 0;
          const THREE = (window as any).THREE;
          if (activePlanes.sagittal) clippingPlanes.push(new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0));
          if (activePlanes.coronal) clippingPlanes.push(new THREE.Plane(new THREE.Vector3(0, 0, -1), 0));
          if (activePlanes.transverse) clippingPlanes.push(new THREE.Plane(new THREE.Vector3(0, -1, 0), 85));

          if (loadedModel) {
            loadedModel.traverse((child: any) => {
              if (child.isMesh && child.name.toLowerCase().includes('muscle')) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach((m: any) => {
                  if (m) {
                    m.clippingPlanes = clippingPlanes;
                    m.clipShadows = true;
                    m.needsUpdate = true;
                  }
                });
              }
            });
          }
        };

        const modelPath = id === '1' ? '/models/AnatomyModel_Mesh.fbx' : '/models/SkeletalSystem100.fbx';

        loader.load(
          modelPath,
          (fbx: any) => {
            if (!isMounted) return;

            const box = new THREE.Box3().setFromObject(fbx);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            fbx.position.set(-center.x, -center.y, -center.z);

            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim > 200) {
              const scale = 200 / maxDim;
              fbx.scale.setScalar(scale);
            }

            fbx.traverse((child: any) => {
              if (child.isMesh) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach((mat: any) => {
                  if (mat) {
                    originalMaterials.set(child.uuid, mat.clone());
                    mat.side = THREE.DoubleSide;
                    mat.transparent = true;
                    if (mat.type === 'MeshPhongMaterial') {
                      mat.shininess = 30;
                      mat.needsUpdate = true;
                    }
                  }
                });
                if (child.name.toLowerCase().includes('high_poly') || child.name.toLowerCase().includes('skin')) {
                  const mats = Array.isArray(child.material) ? child.material : [child.material];
                  mats.forEach((m: any) => { if (m) m.opacity = skinOpacity; });
                }
              }
            });

            fbx.children.forEach((child: any) => {
              child.visible = true;
              child.traverse((sub: any) => { sub.visible = true; });
            });

            scene.add(fbx);
            loadedModel = fbx;

            const groups: any[] = [];
            fbx.children.forEach((child: any) => {
              let meshCount = 0;
              let totalVerts = 0;
              child.traverse((subChild: any) => {
                if (subChild.isMesh) {
                  meshCount++;
                  totalVerts += subChild.geometry?.attributes?.position?.count || 0;
                }
              });
              groups.push({
                uuid: child.uuid,
                name: child.name || 'Unnamed Group',
                visible: true,
                meshCount,
                totalVertices: totalVerts
              });
            });

            setGroupList(groups);

            sceneRef.current = {
              model: fbx,
              originalMaterials,
              camera,
              renderer,
              scene,
              updatePlanes: updateClippingPlanes,
              defaultCameraPos: new THREE.Vector3(0, 100, 300),
              defaultCameraTarget: new THREE.Vector3(0, 0, 0),
              originalPositions: new Map(),
              boundingCenters: new Map()
            };

            const storePositions = (obj: any, parentUuid: string = '') => {
              const key = parentUuid ? `${parentUuid}_${obj.uuid}` : obj.uuid;
              sceneRef.current.originalPositions.set(key, obj.position.clone());
              if (obj.isMesh || obj.isGroup) {
                const objBox = new THREE.Box3().setFromObject(obj);
                sceneRef.current.boundingCenters.set(key, objBox.getCenter(new THREE.Vector3()));
              }
              if (obj.children) obj.children.forEach((c: any) => storePositions(c, obj.uuid));
            };
            fbx.children.forEach((child: any) => storePositions(child));

            updateClippingPlanes();
            setIsLoading(false);
          },
          (xhr: any) => {
            if (!isMounted) return;
            const percent = xhr.total > 0 ? (xhr.loaded / xhr.total) * 100 : 0;
            setLoadingProgress(Math.round(percent));
          },
          (error: any) => {
            if (!isMounted) return;
            setError(`Failed to load model: ${error.message || 'Unknown error'}`);
            setIsLoading(false);
          }
        );

        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        let rotation = { x: 0, y: 0 };

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let selectedMesh: any = null;

        const onMouseDown = (e: MouseEvent) => {
          isDragging = true;
          previousMousePosition = { x: e.clientX, y: e.clientY };
        };

        const onMouseMove = (e: MouseEvent) => {
          if (!isMounted) return;

          setMousePos({ x: e.clientX, y: e.clientY });

          if (isDragging) {
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            rotation.y += deltaX * 0.01;
            rotation.x += deltaY * 0.01;

            previousMousePosition = { x: e.clientX, y: e.clientY };
          } else if (loadedModel) {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(loadedModel.children, true);
            if (intersects.length > 0) {
              setHoveredPartName(intersects[0].object.name || 'Unnamed Part');
              renderer.domElement.style.cursor = 'pointer';
            } else {
              setHoveredPartName(null);
              renderer.domElement.style.cursor = 'default';
            }
          }
        };

        const onClick = (e: MouseEvent) => {
          if (!loadedModel || !isMounted) return;
          const rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(loadedModel.children, true);
          if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            const partName = clickedMesh.name || 'Unnamed Part';
            if (selectedMesh && selectedMesh !== clickedMesh) {
              const originalMat = originalMaterials.get(selectedMesh.uuid);
              if (originalMat) selectedMesh.material = originalMat.clone();
            }
            if (selectedMesh !== clickedMesh) {
              selectedMesh = clickedMesh;
              handlePartClick(partName);
              clickedMesh.material = new THREE.MeshPhongMaterial({ color: 0x06b6d4, emissive: 0x0891b2, shininess: 100, side: THREE.DoubleSide });
            } else {
              const originalMat = originalMaterials.get(selectedMesh.uuid);
              if (originalMat) selectedMesh.material = originalMat.clone();
              selectedMesh = null;
            }
          } else if (selectedMesh) {
            const originalMat = originalMaterials.get(selectedMesh.uuid);
            if (originalMat) selectedMesh.material = originalMat.clone();
            selectedMesh = null;
          }
        };

        const onWheel = (e: WheelEvent) => {
          e.preventDefault();
          const newZoom = Math.max(50, Math.min(800, camera.position.z + e.deltaY * 0.1));
          camera.position.z = newZoom;
          setZoomLevel(newZoom);
        };

        renderer.domElement.addEventListener('mousedown', onMouseDown);
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('mouseup', () => { isDragging = false; });
        renderer.domElement.addEventListener('click', onClick);
        renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

        let animationId: number;
        const animate = () => {
          if (!isMounted) return;
          animationId = requestAnimationFrame(animate);
          scene.rotation.y = rotation.y;
          scene.rotation.x = rotation.x;
          renderer.render(scene, camera);
        };
        animate();

        cleanupRef.current = () => {
          isMounted = false;
          if (animationId) cancelAnimationFrame(animationId);
          window.removeEventListener('resize', handleResize);
          if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
          renderer.dispose();
        };

        const handleResize = () => {
          if (!isMounted) return;
          const w = container.clientWidth;
          const h = container.clientHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

      } catch (err) {
        if (!isMounted) return;
        setError(`Failed to initialize 3D scene: ${err}`);
        setIsLoading(false);
      }
    };

    initScene();

  }, [id]);

  // Handle Clipping Planes Updates
  useEffect(() => {
    if (sceneRef.current?.updatePlanes) {
      sceneRef.current.updatePlanes();
    }
  }, [activePlanes]);

  // Handle Skin Opacity Updates
  useEffect(() => {
    if (!sceneRef.current?.model) return;
    sceneRef.current.model.traverse((child: any) => {
      if (child.isMesh && (child.name.toLowerCase().includes('high_poly') || child.name.toLowerCase().includes('skin'))) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m: any) => { if (m) m.opacity = skinOpacity; });
      }
    });
  }, [skinOpacity]);

  const handleZoomChange = (value: number) => {
    if (!sceneRef.current?.camera) return;
    setZoomLevel(value);
    sceneRef.current.camera.position.z = value;
  };

  const togglePlane = (plane: 'sagittal' | 'coronal' | 'transverse') => {
    setActivePlanes(prev => ({ ...prev, [plane]: !prev[plane] }));
  };

  const toggleVisibility = (uuid: string) => {
    if (!sceneRef.current?.model) return;
    const model = sceneRef.current.model;
    const targetChild = model.children.find((child: any) => child.uuid === uuid);
    if (targetChild) {
      const newVisibility = !targetChild.visible;
      targetChild.visible = newVisibility;
      targetChild.traverse((child: any) => {
        child.visible = newVisibility;
      });
      setGroupList(prev => prev.map(g => g.uuid === uuid ? { ...g, visible: newVisibility } : g));
    }
  };

  const isolatePart = (uuid: string) => {
    if (!sceneRef.current?.model) return;
    const model = sceneRef.current.model;
    model.children.forEach((child: any) => {
      const isTarget = child.uuid === uuid;
      child.visible = isTarget;
      child.traverse((sub: any) => {
        sub.visible = isTarget;
      });
    });
    setGroupList(prev => prev.map(g => ({ ...g, visible: g.uuid === uuid })));
  };

  const showAllParts = () => {
    if (!sceneRef.current?.model) return;
    sceneRef.current.model.children.forEach((child: any) => {
      child.visible = true;
      child.traverse((sub: any) => {
        sub.visible = true;
      });
    });
    setGroupList(prev => prev.map(g => ({ ...g, visible: true })));
  };

  const handleExplosion = (value: number) => {
    if (!sceneRef.current?.model) return;
    const THREE = (window as any).THREE;
    setExplosionAmount(value);

    const model = sceneRef.current.model;
    const modelCenter = new THREE.Vector3(0, 85, 0); // Approx hub

    model.children.forEach((child: any) => {
      const originalPos = sceneRef.current.originalPositions.get(child.uuid);
      const boundingCenter = sceneRef.current.boundingCenters.get(child.uuid);

      if (!originalPos || !boundingCenter) return;

      const direction = new THREE.Vector3().subVectors(boundingCenter, modelCenter).normalize();
      if (direction.lengthSq() < 0.0001) direction.set(0, 1, 0);

      const offset = direction.multiplyScalar(value * 0.5);
      child.position.copy(originalPos).add(offset);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/modules')}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold">
                <span className="text-white">VRMTS</span>
              </h1>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Home className="w-4 h-4 cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => navigate('/studentdashboard')} />
                <ChevronRight className="w-4 h-4" />
                <span>Modules</span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-cyan-400">Skeletal System</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-800/50 rounded-lg px-4 py-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <span className="text-sm">Progress: 0%</span>
              </div>
              <button
                onClick={() => navigate('/quizselection')}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg font-medium text-sm hover:from-cyan-400 hover:to-teal-400 transition-all flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Take Quiz
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Skeletal System</h2>
              <p className="text-slate-400 text-sm">Explore the human skeleton in 3D</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-white/5 rounded-lg transition-colors" title="Bookmark">
                <Bookmark className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-white/5 rounded-lg transition-colors" title="Share">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-white/5 rounded-lg transition-colors" title="Report Issue">
                <Flag className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <div className="col-span-3 space-y-4">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Anatomical Tools
              </h3>

              {/* Orientation Planes */}
              <div className="space-y-2 mb-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Reference Planes</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => togglePlane('sagittal')}
                    className={`text-[10px] py-2 rounded-lg border transition-all ${activePlanes.sagittal ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-slate-800/50 border-white/5 text-slate-400'}`}
                  >
                    SAGITTAL
                  </button>
                  <button
                    onClick={() => togglePlane('coronal')}
                    className={`text-[10px] py-2 rounded-lg border transition-all ${activePlanes.coronal ? 'bg-teal-500/20 border-teal-500 text-teal-400' : 'bg-slate-800/50 border-white/5 text-slate-400'}`}
                  >
                    CORONAL
                  </button>
                  <button
                    onClick={() => togglePlane('transverse')}
                    className={`text-[10px] py-2 rounded-lg border transition-all ${activePlanes.transverse ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-800/50 border-white/5 text-slate-400'}`}
                  >
                    TRANSVERSE
                  </button>
                </div>
              </div>

              {/* Skin Transparency */}
              {id !== '2' && (
                <div className="mb-4 bg-slate-800/30 p-3 rounded-lg border border-white/5">
                  <label className="block text-[10px] font-bold mb-2 text-cyan-400 uppercase tracking-wider">
                    Skin Transparency
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={skinOpacity}
                    onChange={(e) => setSkinOpacity(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-[8px] text-slate-500 mt-1">
                    <span>MUSCLE</span>
                    <span>SKIN</span>
                  </div>
                </div>
              )}

              {/* Explosion */}
              {id !== '1' && (
                <div className="mb-4 bg-slate-800/30 p-3 rounded-lg border border-white/5">
                  <label className="block text-[10px] font-bold mb-2 text-amber-400 uppercase tracking-wider">
                    Exploded View
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={explosionAmount}
                    onChange={(e) => handleExplosion(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              )}

              <div className="pt-2 border-t border-white/5">
                <button
                  onClick={showAllParts}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] py-2 rounded-lg transition-all"
                >
                  RESET VISIBILITY
                </button>
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-4 overflow-hidden flex flex-col max-h-[400px]">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <List className="w-4 h-4 text-cyan-400" />
                Anatomical Structure
              </h3>
              <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                {groupList.map(group => (
                  <div key={group.uuid} className="bg-slate-800/40 p-2 rounded border border-white/5 group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium truncate max-w-[120px]">{group.name}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => isolatePart(group.uuid)} className="p-1 hover:bg-purple-500/20 rounded text-purple-400"><Maximize2 size={16} /></button>
                        <button onClick={() => toggleVisibility(group.uuid)} className={`p-1 rounded ${group.visible ? 'text-cyan-400 hover:bg-cyan-500/20' : 'text-red-400 hover:bg-red-500/20'}`}>
                          {group.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center - 3D Viewer */}
          <div className="col-span-7 space-y-4">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
              <div className="relative aspect-[16/10] bg-gradient-to-br from-slate-900 to-slate-950">
                {/* Hover Tooltip */}
                {hoveredPartName && (
                  <div
                    className="absolute bg-slate-900/95 backdrop-blur-sm border border-cyan-400/50 text-white text-sm font-semibold px-3 py-1.5 rounded pointer-events-none z-30"
                    style={{
                      left: `${mousePos.x + 15}px`,
                      top: `${mousePos.y + 15}px`,
                    }}
                  >
                    {hoveredPartName}
                  </div>
                )}

                {/* Loading Overlay */}
                {isLoading && !error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/95 z-20">
                    <div className="text-center text-white">
                      <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-lg font-bold mb-2">Loading 3D Model</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">{loadingProgress}%</p>
                      <div className="w-64 h-2 bg-slate-800 rounded-full mt-4 overflow-hidden mx-auto">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-300"
                          style={{ width: `${loadingProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Overlay */}
                {error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/95 z-20">
                    <div className="text-center text-white max-w-md px-6">
                      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <p className="text-lg font-bold mb-2">Failed to Load Model</p>
                      <p className="text-sm text-slate-300">{error}</p>
                    </div>
                  </div>
                )}

                <div ref={containerRef} className="w-full h-full" />
              </div>

              {/* Control Panel */}
              <div className="border-t border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <Maximize2 size={12} className="text-cyan-400" />
                      <input
                        type="range" min="50" max="800" value={zoomLevel}
                        onChange={(e) => handleZoomChange(Number(e.target.value))}
                        className="w-32 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                    </div>
                    <span>Drag to rotate • Scroll to zoom • Click to select</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowLabels(!showLabels)}
                      className={`p-2 rounded-lg transition-colors ${showLabels ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/5'
                        }`}
                      title="Toggle Labels"
                    >
                      {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                      title="Fullscreen"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowNotes(!showNotes)}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                      title="Notes"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Layer Selection */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400 font-medium whitespace-nowrap">View Presets:</span>
              {layers.map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => setSelectedLayer(layer.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${selectedLayer === layer.id
                    ? `bg-gradient-to-r ${layer.color} text-white shadow-lg`
                    : 'bg-slate-800/50 hover:bg-slate-800 text-slate-300'
                    }`}
                >
                  <layer.icon className="w-4 h-4" />
                  <span className="text-sm font-medium whitespace-nowrap">{layer.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="col-span-3 space-y-4">
            <div className="bg-slate-900/50 border border-white/10 rounded-xl">
              <StudyAssistant labId={id === '1' ? 1 : id === '2' ? 2 : undefined} compact={true} />
            </div>

            {/* Selected Part Info */}
            {selectedPart ? (
              <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-4 animate-in fade-in">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Info className="w-4 h-4 text-cyan-400" />
                    {selectedPart.name}
                  </h3>
                  <button onClick={() => setSelectedPart(null)} className="p-1 hover:bg-white/5 rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-sm text-slate-300 mb-4">{selectedPart.description}</p>

                {selectedPart.related.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-slate-400 mb-2">Related Structures</h4>
                    <div className="space-y-1">
                      {selectedPart.related.map((rel, idx) => (
                        <button key={idx} className="w-full text-left px-2 py-1 rounded text-xs hover:bg-white/5 transition-colors text-cyan-400">
                          → {rel}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button className="w-full py-2 px-3 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg text-sm font-medium hover:from-cyan-400 hover:to-teal-400 transition-all">
                  Learn More
                </button>
              </div>
            ) : (
              <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  Information
                </h3>
                <p className="text-sm text-slate-400">
                  {hoveredPartName
                    ? `Hovering over: ${hoveredPartName}`
                    : 'Click on any part of the model to learn more about it.'}
                </p>
              </div>
            )}

            {/* Explored Parts */}
            {anatomyParts.length > 0 && (
              <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <h3 className="font-semibold mb-3 text-sm">Explored Parts</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {anatomyParts.map((part) => (
                    <button
                      key={part.id}
                      onClick={() => setSelectedPart(part)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedPart?.id === part.id
                        ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400'
                        : 'hover:bg-white/5 text-slate-300'
                        }`}
                    >
                      {part.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Study Tips */}
            <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-xl p-4">
              <h3 className="font-semibold mb-2 text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                Study Tip
              </h3>
              <p className="text-xs text-slate-300">
                Try rotating the model to view from different angles. Understanding spatial relationships is key to mastering anatomy!
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Notes Modal */}
      {showNotes && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">My Notes</h3>
              <button onClick={() => setShowNotes(false)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              className="w-full h-64 bg-slate-950 border border-white/10 rounded-xl p-4 text-sm resize-none focus:outline-none focus:border-cyan-400/50"
              placeholder="Take notes about this module..."
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowNotes(false)} className="px-4 py-2 hover:bg-white/5 rounded-lg transition-colors">
                Cancel
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg font-medium hover:from-cyan-400 hover:to-teal-400 transition-all">
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}