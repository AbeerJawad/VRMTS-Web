import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Layers, MessageSquare, Info, Brain, Maximize2, Eye, EyeOff,
  ChevronRight, Home, Search, Filter, Play, List, X, FileText, Sparkles, LogIn
} from 'lucide-react';

export default function GuestLab() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelInfo, setModelInfo] = useState<string>('');
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [groupList, setGroupList] = useState<any[]>([]);
  const [explosionAmount, setExplosionAmount] = useState(0);
  const [selectedGroupForExplosion, setSelectedGroupForExplosion] = useState<string>('ALL');
  const [zoomLevel, setZoomLevel] = useState(300);
  const sceneRef = useRef<any>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;
    if (initRef.current) return;
    initRef.current = true;

    const container = containerRef.current;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const initScene = async () => {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/fflate@0.7.4/umd/index.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/FBXLoader.js');

        const THREE = (window as any).THREE;

        const width = container.clientWidth;
        const height = container.clientHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050505);

        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
        camera.position.set(0, 100, 300);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight1.position.set(100, 100, 100);
        scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight2.position.set(-100, 50, -100);
        scene.add(directionalLight2);

        const gridHelper = new THREE.GridHelper(500, 50, 0x262626, 0x171717);
        scene.add(gridHelper);

        const axesHelper = new THREE.AxesHelper(100);
        scene.add(axesHelper);

        const loader = new (THREE as any).FBXLoader();
        const modelPath = '/models/SkeletalSystem100.fbx';

        let loadedModel: any = null;
        let originalMaterials = new Map();

        loader.load(
          modelPath,
          (fbx: any) => {
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
                  }
                });
              }
            });

            fbx.children.forEach((child: any) => {
              child.visible = false;
              child.traverse((subChild: any) => {
                subChild.visible = false;
              });
            });

            scene.add(fbx);
            loadedModel = fbx;

            const groups: any[] = [];
            fbx.children.forEach((child: any) => {
              let meshCount = 0;
              child.traverse((subChild: any) => { if (subChild.isMesh) meshCount++; });
              groups.push({
                uuid: child.uuid,
                name: child.name || 'Unnamed Group',
                visible: false,
                meshCount: meshCount,
                isMesh: child.isMesh
              });
            });
            setGroupList(groups);

            sceneRef.current = {
              model: fbx,
              originalMaterials,
              selectedMesh: null,
              camera,
              defaultCameraPos: new THREE.Vector3(0, 100, 300),
              defaultCameraTarget: new THREE.Vector3(0, 0, 0),
              originalPositions: new Map(),
              boundingCenters: new Map()
            };

            const storePositions = (obj: any, parentUuid: string = '') => {
              const key = parentUuid ? `${parentUuid}_${obj.uuid}` : obj.uuid;
              sceneRef.current.originalPositions.set(key, obj.position.clone());
              const objBox = new THREE.Box3().setFromObject(obj);
              sceneRef.current.boundingCenters.set(key, objBox.getCenter(new THREE.Vector3()));
              if (obj.children) obj.children.forEach((child: any) => storePositions(child, obj.uuid));
            };
            fbx.children.forEach((child: any) => storePositions(child));

            setIsLoading(false);
          },
          (xhr: any) => {
            const percent = xhr.total > 0 ? (xhr.loaded / xhr.total) * 100 : 0;
            setLoadingProgress(Math.round(percent));
          },
          (error: any) => {
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
              setHoveredPart(intersects[0].object.name || 'Unnamed Part');
              renderer.domElement.style.cursor = 'pointer';
            } else {
              setHoveredPart(null);
              renderer.domElement.style.cursor = 'default';
            }
          }
        };

        const onMouseUp = () => { isDragging = false; };

        const onClick = (e: MouseEvent) => {
          if (!loadedModel) return;
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
              sceneRef.current.selectedMesh = selectedMesh;
              setSelectedPart(partName);
              clickedMesh.material = new THREE.MeshPhongMaterial({ color: 0x10b981, emissive: 0x064e3b, shininess: 100, side: THREE.DoubleSide });
            } else {
              const originalMat = originalMaterials.get(selectedMesh.uuid);
              if (originalMat) selectedMesh.material = originalMat.clone();
              selectedMesh = null;
              sceneRef.current.selectedMesh = null;
              setSelectedPart(null);
            }
          } else if (selectedMesh) {
            const originalMat = originalMaterials.get(selectedMesh.uuid);
            if (originalMat) selectedMesh.material = originalMat.clone();
            selectedMesh = null;
            sceneRef.current.selectedMesh = null;
            setSelectedPart(null);
          }
        };

        const onWheel = (e: WheelEvent) => {
          e.preventDefault();
          const newZoom = Math.max(10, Math.min(800, camera.position.z + e.deltaY * 0.1));
          camera.position.z = newZoom;
          setZoomLevel(newZoom);
        };

        const onTouchStart = (e: TouchEvent) => {
          if (e.touches.length === 1) {
            isDragging = true;
            previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }
        };

        const onTouchMove = (e: TouchEvent) => {
          if (isDragging && e.touches.length === 1) {
            e.preventDefault();
            const deltaX = e.touches[0].clientX - previousMousePosition.x;
            const deltaY = e.touches[0].clientY - previousMousePosition.y;

            rotation.y += deltaX * 0.01;
            rotation.x += deltaY * 0.01;

            previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }
        };

        const onTouchEnd = () => {
          isDragging = false;
        };

        renderer.domElement.addEventListener('mousedown', onMouseDown);
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('mouseup', onMouseUp);
        renderer.domElement.addEventListener('click', onClick);
        renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
        renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
        renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
        renderer.domElement.addEventListener('touchend', onTouchEnd);

        let animationId: number;
        const animate = () => {
          animationId = requestAnimationFrame(animate);
          scene.rotation.y = rotation.y;
          scene.rotation.x = rotation.x;
          renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
          const w = container.clientWidth;
          const h = container.clientHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        return () => {
          cancelAnimationFrame(animationId);
          renderer.domElement.removeEventListener('mousedown', onMouseDown);
          renderer.domElement.removeEventListener('mousemove', onMouseMove);
          renderer.domElement.removeEventListener('mouseup', onMouseUp);
          renderer.domElement.removeEventListener('click', onClick);
          renderer.domElement.removeEventListener('wheel', onWheel);
          renderer.domElement.removeEventListener('touchstart', onTouchStart);
          renderer.domElement.removeEventListener('touchmove', onTouchMove);
          renderer.domElement.removeEventListener('touchend', onTouchEnd);
          window.removeEventListener('resize', handleResize);
          if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
          renderer.dispose();
        };
      } catch (err) {
        setError(`Failed to initialize 3D scene: ${err}`);
        setIsLoading(false);
      }
    };

    initScene();
  }, []);

  const toggleVisibility = (uuid: string) => {
    if (!sceneRef.current) return;
    const targetChild = sceneRef.current.model.children.find((child: any) => child.uuid === uuid);
    if (targetChild) {
      const newVisibility = !targetChild.visible;
      targetChild.visible = newVisibility;
      targetChild.traverse((child: any) => { child.visible = newVisibility; });
      setGroupList(prev => prev.map(g => g.uuid === uuid ? { ...g, visible: newVisibility } : g));
    }
  };

  const showOnlyThis = (uuid: string) => {
    if (!sceneRef.current) return;
    const THREE = (window as any).THREE;
    let targetChild = null;
    sceneRef.current.model.children.forEach((child: any) => {
      const shouldBeVisible = (child.uuid === uuid);
      child.visible = shouldBeVisible;
      if (shouldBeVisible) targetChild = child;
      child.traverse((subChild: any) => { subChild.visible = shouldBeVisible; });
    });

    if (targetChild && sceneRef.current.camera) {
      const box = new THREE.Box3().setFromObject(targetChild);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = sceneRef.current.camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 2.0;
      sceneRef.current.camera.position.set(center.x, center.y, center.z + cameraZ);
      sceneRef.current.camera.lookAt(center);
      setZoomLevel(center.z + cameraZ);
    }
    setGroupList(prev => prev.map(g => ({ ...g, visible: g.uuid === uuid })));
  };

  const showAll = () => {
    if (!sceneRef.current) return;
    sceneRef.current.model.children.forEach((child: any) => {
      child.visible = true;
      child.traverse((subChild: any) => { subChild.visible = true; });
    });
    sceneRef.current.camera.position.copy(sceneRef.current.defaultCameraPos);
    sceneRef.current.camera.lookAt(sceneRef.current.defaultCameraTarget);
    setZoomLevel(300);
    setGroupList(prev => prev.map(g => ({ ...g, visible: true })));
  };

  const handleExplosion = (value: number) => {
    if (!sceneRef.current) return;
    const THREE = (window as any).THREE;
    setExplosionAmount(value);
    const resetPositions = (obj: any, parentUuid: string = '') => {
      const key = parentUuid ? `${parentUuid}_${obj.uuid}` : obj.uuid;
      const originalPos = sceneRef.current.originalPositions.get(key);
      if (originalPos) obj.position.copy(originalPos);
      if (obj.children) obj.children.forEach((child: any) => resetPositions(child, obj.uuid));
    };
    sceneRef.current.model.children.forEach((child: any) => resetPositions(child, ''));
    if (value === 0) return;
    if (selectedGroupForExplosion === 'ALL') {
      const modelCenter = new THREE.Vector3(-4.30, 86.03, -0.71);
      sceneRef.current.model.children.forEach((child: any) => {
        const originalPos = sceneRef.current.originalPositions.get(child.uuid);
        const boundingCenter = sceneRef.current.boundingCenters.get(child.uuid);
        if (!originalPos || !boundingCenter) return;
        const offset = new THREE.Vector3().subVectors(boundingCenter, modelCenter).normalize().multiplyScalar(value * 0.02);
        child.position.copy(originalPos).add(offset);
      });
    } else {
      const targetGroup = sceneRef.current.model.children.find((c: any) => c.uuid === selectedGroupForExplosion);
      if (!targetGroup) return;

      const groupBox = new THREE.Box3().setFromObject(targetGroup);
      const groupCenter = groupBox.getCenter(new THREE.Vector3());

      const meshes: any[] = [];
      targetGroup.traverse((child: any) => {
        if (child.isMesh) {
          meshes.push(child);
        }
      });

      if (meshes.length === 0) return;

      meshes.forEach((mesh: any, index: number) => {
        const meshBox = new THREE.Box3().setFromObject(mesh);
        const meshCenter = meshBox.getCenter(new THREE.Vector3());

        let direction = new THREE.Vector3().subVectors(meshCenter, groupCenter).normalize();

        if (direction.lengthSq() < 0.0001) {
          const phi = Math.acos(-1 + (2 * index) / meshes.length);
          const theta = Math.sqrt(meshes.length * Math.PI) * phi;
          direction.set(
            Math.cos(theta) * Math.sin(phi),
            Math.sin(theta) * Math.sin(phi),
            Math.cos(phi)
          ).normalize();
        }

        let key = mesh.uuid;
        if (mesh.parent) {
          key = `${mesh.parent.uuid}_${mesh.uuid}`;
        }

        const originalPos = sceneRef.current.originalPositions.get(key);

        if (originalPos) {
          const offset = direction.multiplyScalar(value * 0.01);
          mesh.position.copy(originalPos).add(offset);
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <header className="border-b border-neutral-900 bg-neutral-950 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-6">
            <h1 className="text-sm font-bold uppercase tracking-tighter flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <span className="text-emerald-500">VR</span><span className="text-white">MTS</span>
              <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest border border-emerald-500/20">GUEST MODE</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-md transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">LOGIN FOR FULL ACCESS</span>
              <span className="sm:hidden">LOGIN</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <h3 className="font-bold text-xs flex items-center gap-2 mb-4 text-neutral-400 uppercase tracking-widest">
                <Layers className="w-4 h-4 text-emerald-500" />
                Anatomical Tools
              </h3>
              <div className="mb-4 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <label className="block text-[10px] font-bold mb-2 text-amber-500 uppercase tracking-widest">Exploded View</label>
                <select
                  value={selectedGroupForExplosion}
                  onChange={(e) => {
                    setSelectedGroupForExplosion(e.target.value);
                    handleExplosion(explosionAmount);
                  }}
                  className="w-full bg-neutral-900 text-slate-200 text-[10px] py-1.5 px-2 rounded border border-neutral-800 focus:outline-none focus:border-amber-500 mb-2"
                >
                  <option value="ALL">All Parts</option>
                  {groupList.filter(g => !g.isMesh).map((group) => (
                    <option key={group.uuid} value={group.uuid}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <input
                  type="range" min="0" max="100" value={explosionAmount}
                  onChange={(e) => handleExplosion(Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[8px] text-neutral-600 mt-2 font-bold uppercase tracking-tighter">
                  <span>Joined</span>
                  <span>Exploded</span>
                </div>
              </div>
              <button
                onClick={showAll}
                className="w-full py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-[10px] font-bold text-neutral-400 hover:text-white transition-all uppercase tracking-widest"
              >
                Reset Visibility
              </button>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col h-[400px]">
              <h3 className="font-bold text-xs flex items-center gap-2 mb-4 text-neutral-400 uppercase tracking-widest">
                <List className="w-4 h-4 text-emerald-500" />
                Structure Index
              </h3>
              <div className="space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
                {groupList.map(group => (
                  <div key={group.uuid} className="bg-neutral-950/50 p-2 rounded border border-neutral-800/50 flex items-center justify-between group hover:border-neutral-700 transition-colors">
                    <span className="text-[10px] font-bold text-neutral-400 truncate pr-2 uppercase">{group.name}</span>
                    <div className="flex gap-1.5">
                      <button onClick={() => showOnlyThis(group.uuid)} className="p-1 text-neutral-600 hover:text-emerald-500 transition-colors" title="Isolate"><Maximize2 size={12} /></button>
                      <button onClick={() => toggleVisibility(group.uuid)} className={`p-1 transition-colors ${group.visible ? 'text-emerald-500' : 'text-neutral-700'}`} title={group.visible ? "Hide" : "Show"}>
                        {group.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Viewer */}
          <div className="lg:col-span-5 space-y-4 min-w-0 order-first lg:order-none">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden relative shadow-2xl">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/95 z-40">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.1)]"></div>
                    <p className="text-lg font-bold text-white tracking-tight">Initializing Skeleton...</p>
                    <p className="text-4xl font-black text-emerald-500 mt-2">{loadingProgress}%</p>
                  </div>
                </div>
              )}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/90 z-20 p-6 text-center">
                  <div className="max-w-xs">
                    <X className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                    <p className="text-sm font-bold text-white uppercase tracking-widest mb-1">Initialization Failed</p>
                    <p className="text-xs text-neutral-500 font-medium">{error}</p>
                  </div>
                </div>
              )}
              <div ref={containerRef} className="w-full h-[min(55vh,600px)] min-h-[280px] sm:min-h-[400px] lg:h-[600px]" onContextMenu={(e) => e.preventDefault()} />
              <div className="absolute bottom-6 left-6 right-6 bg-neutral-950/80 backdrop-blur-md border border-neutral-800 rounded-xl p-4 z-10 shadow-2xl">
                <div className="flex items-center justify-between mb-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  <div className="flex items-center gap-2"><Search className="w-3.5 h-3.5 text-emerald-500" /> Zoom Level</div>
                  <span className="text-emerald-500">{Math.round(((800 - zoomLevel) / 790) * 100)}%</span>
                </div>
                <input
                  type="range" min="10" max="800" value={zoomLevel} onChange={(e) => {
                    const val = Number(e.target.value);
                    setZoomLevel(val);
                    if (sceneRef.current?.camera) sceneRef.current.camera.position.z = val;
                  }}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-3 space-y-4 min-w-0">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                </div>
                <h3 className="font-bold text-xs text-white uppercase tracking-widest">Full Access Required</h3>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed mb-6">
                You are currently in guest mode. To access laboratory manuals, AI study assistants, and proficiency quizzes, please register a student account.
              </p>
              <Link to="/login" className="w-full py-3 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold text-emerald-500 transition-all uppercase tracking-widest shadow-xl">
                <LogIn size={14} /> Create Student Account
              </Link>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
              <h3 className="font-bold text-xs flex items-center gap-2 mb-4 text-neutral-400 uppercase tracking-widest">
                <Info className="w-3.5 h-3.5 text-emerald-500" />
                Selected Structure
              </h3>
              <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800 min-h-[100px] flex items-center justify-center text-center">
                {selectedPart ? (
                  <div className="animate-in fade-in zoom-in duration-300">
                    <p className="text-xs font-black text-emerald-500 mb-1 uppercase tracking-tighter">{selectedPart}</p>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest leading-relaxed">Structural analysis active in Guest mode.</p>
                  </div>
                ) : (
                  <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest italic">Click any part to inspect</p>
                )}
              </div>
            </div>

            <div className="bg-neutral-900/50 border border-neutral-800 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center opacity-70 grayscale">
              <FileText className="w-8 h-8 text-neutral-700 mb-3" />
              <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Lab Manual Locked</p>
              <p className="text-[9px] text-neutral-700 mt-1 uppercase">Available in Pro version</p>
            </div>
          </div>
        </div>
      </main>

      {hoveredPart && (
        <div
          className="fixed bg-emerald-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-2xl pointer-events-none z-[100] uppercase tracking-tighter border border-emerald-400"
          style={{ left: `${mousePos.x + 15}px`, top: `${mousePos.y + 15}px` }}
        >
          {hoveredPart}
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #262626; border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #404040; }
      `}</style>
    </div>
  );
}
