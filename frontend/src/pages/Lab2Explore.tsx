import React, { useEffect, useRef, useState } from 'react';
import {
  Layers, MessageSquare, Info, Brain, Maximize2, Eye, EyeOff,
  ChevronRight, Home, Search, Filter, Play, List, X, FileText
} from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { StudyAssistant } from '@/components/StudyAssistant';

export default function Lab2Explore() {
  const containerRef = useRef<HTMLDivElement>(null);
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
  const [showManual, setShowManual] = useState(false);
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

        const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.3);
        directionalLight3.position.set(0, -50, 0);
        scene.add(directionalLight3);

        const gridHelper = new THREE.GridHelper(500, 50, 0x262626, 0x171717);
        scene.add(gridHelper);

        const axesHelper = new THREE.AxesHelper(100);
        scene.add(axesHelper);

        const loader = new (THREE as any).FBXLoader();
        const modelPath = '/models/SkeletalSystem100.fbx';

        let loadedModel: any = null;
        let originalMaterials = new Map();

        console.log('Starting to load model from:', modelPath);

        loader.load(
          modelPath,
          (fbx: any) => {
            console.log('✅ Model loaded successfully!');
            console.log('Model:', fbx);
            console.log('Children count:', fbx.children.length);

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
                    if (mat.type === 'MeshPhongMaterial') {
                      mat.shininess = 30;
                      mat.needsUpdate = true;
                    }
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

            camera.position.set(0, 100, 300);
            camera.lookAt(0, 0, 0);

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
                type: child.type,
                visible: false,
                childCount: child.children?.length || 0,
                meshCount: meshCount,
                totalVertices: totalVerts,
                isMesh: child.isMesh
              });
            });

            setGroupList(groups);

            sceneRef.current = {
              model: fbx,
              originalMaterials,
              selectedMesh: null,
              camera: camera,
              defaultCameraPos: new THREE.Vector3(0, 100, 300),
              defaultCameraTarget: new THREE.Vector3(0, 0, 0),
              originalPositions: new Map(),
              boundingCenters: new Map(),
              childOriginalPositions: new Map(),
              childBoundingCenters: new Map()
            };

            const storePositions = (obj: any, parentUuid: string = '') => {
              const key = parentUuid ? `${parentUuid}_${obj.uuid}` : obj.uuid;
              sceneRef.current.originalPositions.set(key, obj.position.clone());

              if (obj.isMesh || obj.isGroup) {
                const objBox = new THREE.Box3().setFromObject(obj);
                const objCenter = objBox.getCenter(new THREE.Vector3());
                sceneRef.current.boundingCenters.set(key, objCenter);
              }

              if (obj.children && obj.children.length > 0) {
                obj.children.forEach((child: any) => {
                  storePositions(child, obj.uuid);
                });
              }
            };

            fbx.children.forEach((child: any) => {
              storePositions(child);
            });

            setModelInfo(`${groups.length} top-level parts`);
            setIsLoading(false);
          },
          (xhr: any) => {
            const percent = xhr.total > 0 ? (xhr.loaded / xhr.total) * 100 : 0;
            setLoadingProgress(Math.round(percent));
          },
          (error: any) => {
            console.error(' Error loading model:', error);
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
              const hoveredMesh = intersects[0].object;
              const partName = hoveredMesh.name || 'Unnamed Part';
              setHoveredPart(partName);
              renderer.domElement.style.cursor = 'pointer';
            } else {
              setHoveredPart(null);
              renderer.domElement.style.cursor = 'default';
            }
          }
        };

        const onMouseUp = () => {
          isDragging = false;
        };

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
              if (originalMat) {
                selectedMesh.material = originalMat.clone();
              }
            }

            if (selectedMesh !== clickedMesh) {
              selectedMesh = clickedMesh;
              sceneRef.current.selectedMesh = selectedMesh;
              setSelectedPart(partName);

              const highlightMat = new THREE.MeshPhongMaterial({
                color: 0x22c55e,
                emissive: 0x14532d,
                shininess: 100,
                side: THREE.DoubleSide
              });
              clickedMesh.material = highlightMat;
            } else {
              const originalMat = originalMaterials.get(selectedMesh.uuid);
              if (originalMat) {
                selectedMesh.material = originalMat.clone();
              }
              selectedMesh = null;
              sceneRef.current.selectedMesh = null;
              setSelectedPart(null);
            }
          } else {
            if (selectedMesh) {
              const originalMat = originalMaterials.get(selectedMesh.uuid);
              if (originalMat) {
                selectedMesh.material = originalMat.clone();
              }
              selectedMesh = null;
              sceneRef.current.selectedMesh = null;
              setSelectedPart(null);
            }
          }
        };

        const onWheel = (e: WheelEvent) => {
          e.preventDefault();
          const newZoom = Math.max(10, Math.min(800, camera.position.z + e.deltaY * 0.1));
          camera.position.z = newZoom;
          setZoomLevel(newZoom);
        };

        renderer.domElement.addEventListener('mousedown', onMouseDown);
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('mouseup', onMouseUp);
        renderer.domElement.addEventListener('click', onClick);
        renderer.domElement.addEventListener('wheel', onWheel);

        let animationId: number;
        const animate = () => {
          animationId = requestAnimationFrame(animate);
          scene.rotation.y = rotation.y;
          scene.rotation.x = rotation.x;
          renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
          const width = container.clientWidth;
          const height = container.clientHeight;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        return () => {
          cancelAnimationFrame(animationId);
          renderer.domElement.removeEventListener('mousedown', onMouseDown);
          renderer.domElement.removeEventListener('mousemove', onMouseMove);
          renderer.domElement.removeEventListener('mouseup', onMouseUp);
          renderer.domElement.removeEventListener('click', onClick);
          renderer.domElement.removeEventListener('wheel', onWheel);
          window.removeEventListener('resize', handleResize);
          if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
          renderer.dispose();
        };
      } catch (err) {
        console.error('Error initializing scene:', err);
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

      targetChild.traverse((child: any) => {
        child.visible = newVisibility;
      });

      setGroupList(prev => prev.map(g =>
        g.uuid === uuid ? { ...g, visible: newVisibility } : g
      ));
    }
  };

  const showOnlyThis = (uuid: string) => {
    if (!sceneRef.current) return;
    const THREE = (window as any).THREE;

    let targetChild = null;

    sceneRef.current.model.children.forEach((child: any) => {
      const shouldBeVisible = (child.uuid === uuid);
      child.visible = shouldBeVisible;

      if (shouldBeVisible) {
        targetChild = child;
      }

      child.traverse((subChild: any) => {
        subChild.visible = shouldBeVisible;
      });
    });

    if (targetChild && sceneRef.current.camera) {
      const box = new THREE.Box3().setFromObject(targetChild);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = sceneRef.current.camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 2.0;

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

      child.traverse((subChild: any) => {
        subChild.visible = true;
      });
    });

    if (sceneRef.current.camera && sceneRef.current.defaultCameraPos) {
      sceneRef.current.camera.position.copy(sceneRef.current.defaultCameraPos);
      sceneRef.current.camera.lookAt(sceneRef.current.defaultCameraTarget);
      setZoomLevel(300);
    }

    setGroupList(prev => prev.map(g => ({ ...g, visible: true })));
  };

  const hideAll = () => {
    if (!sceneRef.current) return;

    sceneRef.current.model.children.forEach((child: any) => {
      child.visible = false;

      child.traverse((subChild: any) => {
        subChild.visible = false;
      });
    });

    setGroupList(prev => prev.map(g => ({ ...g, visible: false })));
  };

  const handleExplosion = (value: number) => {
    if (!sceneRef.current) return;
    const THREE = (window as any).THREE;

    setExplosionAmount(value);

    const resetPositions = (obj: any, parentUuid: string = '') => {
      const key = parentUuid ? `${parentUuid}_${obj.uuid}` : obj.uuid;

      const originalPos = sceneRef.current.originalPositions.get(key);
      if (originalPos) {
        obj.position.copy(originalPos);
      }

      if (obj.children) {
        obj.children.forEach((child: any) => resetPositions(child, obj.uuid));
      }
    };

    sceneRef.current.model.children.forEach((child: any) => {
      resetPositions(child, '');
    });

    if (value === 0) return;

    if (selectedGroupForExplosion === 'ALL') {
      const modelCenter = new THREE.Vector3(-4.30, 86.03, -0.71);

      sceneRef.current.model.children.forEach((child: any) => {
        const originalPos = sceneRef.current.originalPositions.get(child.uuid);
        const boundingCenter = sceneRef.current.boundingCenters.get(child.uuid);

        if (!originalPos || !boundingCenter) return;

        const direction = new THREE.Vector3()
          .subVectors(boundingCenter, modelCenter)
          .normalize();

        if (direction.lengthSq() < 0.0001) {
          direction.set(0, 1, 0);
        }

        const offset = direction.multiplyScalar(value * 0.02);
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

        let direction = new THREE.Vector3()
          .subVectors(meshCenter, groupCenter)
          .normalize();

        if (direction.lengthSq() < 0.0001) { //fibosphere
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

  const handleZoomChange = (value: number) => {
    if (!sceneRef.current?.camera) return;
    setZoomLevel(value);
    sceneRef.current.camera.position.z = value;
  };

  return (
    <PageLayout
      title="Skeletal System"
      subtitle="Interactive 3D Bone Exploration"
      breadcrumbLabel="Lab 2"
      activeNav="modules"
      userType="student"
      isWide={true}
    >
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-2 space-y-4 min-w-0">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-green-500" />
              Anatomical Tools
            </h3>

            {/* Explosion Control */}
            <div className="mb-4 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
              <label className="block text-[10px] font-bold mb-2 text-amber-500 uppercase tracking-wider">
                Exploded View
              </label>
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
                type="range"
                min="0"
                max="100"
                value={explosionAmount}
                onChange={(e) => handleExplosion(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[8px] text-slate-500 mt-1">
                <span>TOGETHER</span>
                <span>APART</span>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-800">
              <button
                onClick={showAll}
                className="w-full bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white text-[10px] font-bold py-2 rounded-lg transition-all border border-neutral-800 uppercase tracking-widest"
              >
                RESET VISIBILITY
              </button>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 overflow-hidden flex flex-col max-h-[450px]">
            <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
              <List className="w-4 h-4 text-green-500" />
              Anatomical Structure
            </h3>
            <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
              {groupList.map(group => (
                <div key={group.uuid} className="bg-neutral-950 p-2 rounded border border-neutral-800 group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium truncate max-w-[150px]">{group.name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => showOnlyThis(group.uuid)}
                        className="p-1 hover:bg-purple-500/20 rounded text-purple-400 transition-colors"
                        title="Isolate Part"
                      >
                        <Maximize2 size={16} />
                      </button>
                      <button
                        onClick={() => toggleVisibility(group.uuid)}
                        className={`p-1 rounded transition-colors ${group.visible ? 'text-green-500 hover:bg-green-500/20' : 'text-red-400 hover:bg-red-500/20'}`}
                        title={group.visible ? "Hide Part" : "Show Part"}
                      >
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
        <div className="lg:col-span-5 space-y-4 min-w-0 order-first lg:order-none">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden relative">
            {/* Hover Tooltip moved out to avoid backdrop-blur repositioning */}

            {/* Loading Overlay */}
            {isLoading && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/90 z-20">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-lg font-bold text-white mb-2">Loading skeletal model...</p>
                  <p className="text-3xl font-extrabold text-green-500">{loadingProgress}%</p>
                </div>
              </div>
            )}

            {/* Error Overlay */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/90 z-20 p-6">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-lg font-bold text-white mb-2">Failed to Load Model</p>
                  <p className="text-sm text-slate-400">{error}</p>
                </div>
              </div>
            )}

            <div ref={containerRef} className="w-full h-[min(52vh,600px)] min-h-[260px] sm:min-h-[400px] lg:h-[600px]" />

            {/* Zoom Control Slider Overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-neutral-900 border border-neutral-800 rounded-xl p-3 z-10 mx-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
                  <Search className="w-3.5 h-3.5" />
                  Zoom Influence
                </label>
                <span className="text-[10px] font-bold text-green-500">{Math.round(((800 - zoomLevel) / 790) * 100)}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="800"
                value={zoomLevel}
                onChange={(e) => handleZoomChange(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-3 space-y-4 min-w-0">
          {/* Laboratory Manual */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-white">
                <FileText className="w-4 h-4 text-green-500" />
                Laboratory Manual
              </h3>
              <button
                onClick={() => setShowManual(!showManual)}
                className="p-1.5 bg-neutral-950 hover:bg-neutral-800 rounded-lg transition-colors text-slate-500 hover:text-white"
              >
                {showManual ? <X size={14} /> : <Maximize2 size={14} />}
              </button>
            </div>

            <div className={`relative transition-all duration-300 ${showManual ? 'h-[400px]' : 'h-[160px]'}`}>
              <div className="absolute inset-0 bg-neutral-950 rounded-lg border border-neutral-800 overflow-hidden">
                <iframe
                  src="/pdfs/Lab_2.pdf#toolbar=0"
                  className="w-full h-full border-none grayscale-[0.3] contrast-[1.1]"
                  title="Lab Manual"
                />
                {!showManual && (
                  <div className="absolute inset-0 bg-neutral-900/60 flex items-end justify-center pb-4">
                    <button
                      onClick={() => setShowManual(true)}
                      className="px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-full text-[10px] font-bold text-white hover:bg-neutral-800 transition-all flex items-center gap-2"
                    >
                      <Eye size={12} />
                      PREVIEW MANUAL
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3">
              <a
                href="/pdfs/Lab_2.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold text-green-500 transition-all uppercase tracking-widest"
              >
                <FileText size={14} />
                OPEN FULLSCREEN MANUAL
              </a>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl">
            <StudyAssistant labId={2} compact={true} />
          </div>

          {/* Part Info */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
            <h3 className="font-semibold mb-2 text-xs flex items-center gap-2 text-white">
              <Info className="w-3.5 h-3.5 text-green-500" />
              Selected Bone Info
            </h3>
            <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center justify-center text-center">
              {selectedPart ? (
                <div>
                  <p className="text-[10px] font-bold text-green-500 mb-0.5 uppercase tracking-wider">{selectedPart}</p>
                  <p className="text-[9px] text-slate-400 leading-relaxed">
                    Anatomical data for {selectedPart.toLowerCase()} retrieved.
                  </p>
                </div>
              ) : (
                <p className="text-[9px] text-slate-500 italic">Click on a bone for details.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {hoveredPart && (
        <div
          className="fixed bg-neutral-950 border border-green-500/30 text-white text-[11px] font-semibold px-2 py-1 rounded pointer-events-none z-[60] shadow-xl translate-x-1 translate-y-1"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
          }}
        >
          {hoveredPart}
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(23, 23, 23, 0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(64, 64, 64, 0.5); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(82, 82, 82, 0.8); }
        
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1.5s linear infinite; }
      `}</style>
    </PageLayout >
  );
}




