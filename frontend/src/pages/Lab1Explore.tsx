import React, { useEffect, useRef, useState } from 'react';
import { Layers, MessageSquare, Info, Brain, Activity, Search, FileText, Maximize2, Eye, EyeOff, X, MousePointer2, Move3D, List } from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import { LabOrientation } from '../components/LabOrientation';
import { StudyAssistant } from '../components/StudyAssistant';

export default function Lab1Explore() {
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
  const [activeModel, setActiveModel] = useState<'saggital' | 'traverse' | 'coronal'>('saggital');
  const [showManual, setShowManual] = useState(false);
  const sceneRef = useRef<any>(null);
  const initRef = useRef(false);

  const [objectives, setObjectives] = useState([
    { id: 'rotate', label: 'Rotate Model', icon: Move3D, description: 'Click and drag in the viewer to rotate the anatomical model.', isComplete: false },
    { id: 'select', label: 'Select Part', icon: MousePointer2, description: 'Click on any part of the model to see its details and highlight it.', isComplete: false },
    { id: 'layer', label: 'Switch Plane', icon: Layers, description: 'Use the anatomical plane buttons to switch between views.', isComplete: false },
    { id: 'manual', label: 'Open Manual', icon: FileText, description: 'Click the "Lab Manual" button to view detailed instructions.', isComplete: false }
  ]);

  const updateObjective = (id: string) => {
    setObjectives(prev => prev.map(m => m.id === id ? { ...m, isComplete: true } : m));
  };

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
        const textureLoader = new THREE.TextureLoader();

        // Load textures
        const textures = {
          body: textureLoader.load('/textures/young_lightskinned_male_diffuse.png'),
          eyes: textureLoader.load('/textures/blue_eye.png'),
          eyebrows: textureLoader.load('/textures/eyebrow001.1.png'),
          eyelashes: textureLoader.load('/textures/eyelashes01.1.png')
        };

        const models = {
          saggital: '/models/Saggittal.fbx',
          traverse: '/models/transverse.fbx',
          coronal: '/models/coronal.fbx'
        };

        let loadedModels: any = {
          saggital: null,
          traverse: null,
          coronal: null
        };
        let originalMaterials = new Map();
        let modelGroups: any = {
          saggital: [],
          traverse: [],
          coronal: []
        };

        console.log('Starting to load models with textures...');

        const loadModel = (modelKey: 'saggital' | 'traverse' | 'coronal', modelPath: string): Promise<any> => {
          return new Promise((resolve, reject) => {
            loader.load(
              modelPath,
              (fbx: any) => {
                console.log(`✅ ${modelKey} model loaded successfully!`);

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
                    const name = child.name.toLowerCase();
                    const isHelper = name.includes('plane') || name.includes('line');

                    let material = new THREE.MeshPhongMaterial({
                      side: THREE.DoubleSide,
                      shininess: 30,
                      color: isHelper ? 0xff0000 : 0xffffff
                    });

                    if (!isHelper) {
                      // Apply textures based on mesh name
                      if (name.includes('body') || name.includes('skin') || name.includes('head') ||
                        name.includes('high_poly') || name.includes('muscle')) {
                        material.map = textures.body;
                      } else if (name.includes('eye')) {
                        material.map = textures.eyes;
                      } else if (name.includes('eyebrow')) {
                        material.map = textures.eyebrows;
                        material.transparent = true;
                        material.alphaTest = 0.5;
                      } else if (name.includes('eyelash')) {
                        material.map = textures.eyelashes;
                        material.transparent = true;
                        material.alphaTest = 0.5;
                      }
                    }

                    material.needsUpdate = true;
                    originalMaterials.set(child.uuid, material.clone());
                    child.material = material;

                    if (isHelper) {
                      child.visible = true;
                    }
                  }
                });

                fbx.children.forEach((child: any) => {
                  // Only show helper planes by default, hide anatomy parts initially
                  const name = child.name.toLowerCase();
                  const isHelper = name.includes('plane') || name.includes('line');
                  child.visible = isHelper;

                  child.traverse((subChild: any) => {
                    subChild.visible = isHelper;
                  });
                });

                // Hide whole model initially (only show active model)
                fbx.visible = (modelKey === activeModel);
                scene.add(fbx);
                loadedModels[modelKey] = fbx;

                const groups: any[] = [];
                fbx.children.forEach((child: any) => {
                  const name = child.name.toLowerCase();
                  if (name.includes('plane') || name.includes('line')) return;

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
                    visible: child.visible,
                    childCount: child.children?.length || 0,
                    meshCount: meshCount,
                    totalVertices: totalVerts,
                    isMesh: child.isMesh
                  });
                });

                modelGroups[modelKey] = groups;
                resolve(fbx);
              },
              (xhr: any) => {
                const percent = xhr.total > 0 ? (xhr.loaded / xhr.total) * 100 : 0;
                setLoadingProgress(Math.round(percent));
              },
              (error: any) => {
                console.error(`❌ Error loading ${modelKey} model:`, error);
                reject(error);
              }
            );
          });
        };

        // Load all three models
        Promise.all([
          loadModel('saggital', models.saggital),
          loadModel('traverse', models.traverse),
          loadModel('coronal', models.coronal)
        ])
          .then(() => {
            console.log('All models loaded successfully with textures!');

            camera.position.set(0, 100, 300);
            camera.lookAt(0, 0, 0);

            // Set initial group list for active model
            setGroupList(modelGroups[activeModel]);

            sceneRef.current = {
              models: loadedModels,
              modelGroups: modelGroups,
              originalMaterials,
              selectedMesh: null,
              camera: camera,
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
                const objCenter = objBox.getCenter(new THREE.Vector3());
                sceneRef.current.boundingCenters.set(key, objCenter);
              }

              if (obj.children && obj.children.length > 0) {
                obj.children.forEach((child: any) => storePositions(child, obj.uuid));
              }
            };

            Object.values(loadedModels).forEach((model: any) => {
              if (model) {
                model.children.forEach((child: any) => {
                  storePositions(child);
                });
              }
            });

            setModelInfo(`${modelGroups[activeModel].length} parts`);
            setIsLoading(false);
          })
          .catch((error: any) => {
            console.error('❌ Error loading models:', error);
            setError(`Failed to load models: ${error.message || 'Unknown error'}`);
            setIsLoading(false);
          });

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
            updateObjective('rotate');
          } else if (loadedModels[activeModel]) {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(loadedModels[activeModel].children, true);

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

        const onMouseLeave = () => {
          setHoveredPart(null);
          if (renderer.domElement) {
            renderer.domElement.style.cursor = 'default';
          }
        };

        const onClick = (e: MouseEvent) => {
          const currentModel = sceneRef.current?.models?.[activeModel];
          if (!currentModel) return;

          const rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(currentModel.children, true);

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

              const highlightMat = (clickedMesh.material as any).clone();
              highlightMat.emissive.setHex(0x14532d);
              highlightMat.color.setHex(0x22c55e);
              clickedMesh.material = highlightMat;
              // Mark lab as interacted for the guided checklist
              localStorage.setItem('vrmts_lab1_interacted', 'true');
              updateObjective('select');
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
          const newZoom = Math.max(50, Math.min(800, camera.position.z + e.deltaY * 0.1));
          camera.position.z = newZoom;
          setZoomLevel(newZoom);
        };

        renderer.domElement.addEventListener('mousedown', onMouseDown);
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('mouseup', onMouseUp);
        renderer.domElement.addEventListener('mouseleave', onMouseLeave);
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
          renderer.domElement.removeEventListener('mouseleave', onMouseLeave);
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

    const currentModel = sceneRef.current.models[activeModel];
    if (!currentModel) return;

    const targetChild = currentModel.children.find((child: any) => child.uuid === uuid);
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

    const currentModel = sceneRef.current.models[activeModel];
    if (!currentModel) return;

    let targetChild = null;

    currentModel.children.forEach((child: any) => {
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

    const currentModel = sceneRef.current.models[activeModel];
    if (!currentModel) return;

    currentModel.children.forEach((child: any) => {
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

    const currentModel = sceneRef.current.models[activeModel];
    if (!currentModel) return;

    currentModel.children.forEach((child: any) => {
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

    const currentModel = sceneRef.current.models[activeModel];
    if (!currentModel) return;

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

    currentModel.children.forEach((child: any) => {
      resetPositions(child, '');
    });

    if (value === 0) return;

    if (selectedGroupForExplosion === 'ALL') {
      const modelCenter = new THREE.Vector3(-4.30, 86.03, -0.71);

      currentModel.children.forEach((child: any) => {
        const originalPos = sceneRef.current.originalPositions.get(child.uuid);
        const boundingCenter = sceneRef.current.boundingCenters.get(child.uuid);

        if (!originalPos || !boundingCenter) return;

        const direction = new THREE.Vector3()
          .subVectors(boundingCenter, modelCenter)
          .normalize();

        if (direction.lengthSq() < 0.0001) {
          direction.set(0, 1, 0);
        }

        const offset = direction.multiplyScalar(value * 0.05);
        child.position.copy(originalPos).add(offset);
      });

    } else {
      const targetGroup = currentModel.children.find((c: any) => c.uuid === selectedGroupForExplosion);

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
          const offset = direction.multiplyScalar(value * 0.025);
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

  const switchModel = (modelKey: 'saggital' | 'traverse' | 'coronal') => {
    if (!sceneRef.current) return;

    // Hide all models
    Object.keys(sceneRef.current.models).forEach((key) => {
      const model = sceneRef.current.models[key];
      if (model) {
        model.visible = false;
      }
    });

    // Show selected model
    const selectedModel = sceneRef.current.models[modelKey];
    if (selectedModel) {
      selectedModel.visible = true;
    }

    // Update active model state
    setActiveModel(modelKey);
    updateObjective('layer');

    // Update group list for the selected model
    if (sceneRef.current.modelGroups && sceneRef.current.modelGroups[modelKey]) {
      setGroupList(sceneRef.current.modelGroups[modelKey]);
      setModelInfo(`${sceneRef.current.modelGroups[modelKey].length} parts`);
    }

    // Reset camera
    if (sceneRef.current.camera && sceneRef.current.defaultCameraPos) {
      sceneRef.current.camera.position.copy(sceneRef.current.defaultCameraPos);
      sceneRef.current.camera.lookAt(sceneRef.current.defaultCameraTarget);
      setZoomLevel(300);
    }

    // Reset explosion
    setExplosionAmount(0);
    setSelectedGroupForExplosion('ALL');
  };

  return (
    <PageLayout
      title="Anatomical Orientation"
      subtitle="Interactive Body Planes & Directions"
      breadcrumbLabel="Lab 1"
      activeNav="modules"
      userType="student"
      isWide={true}
    >
      <LabOrientation 
        objectives={objectives} 
        onComplete={() => {
          // This marks the checklist item in dashboard as well if they finish everything
          localStorage.setItem('vrmts_lab1_interacted', 'true');
        }} 
      />
      <div className="grid grid-cols-10 gap-6">
        {/* Left Sidebar */}
        <div className="col-span-2 space-y-4">
          {/* Plane Switcher */}
          <div className={`bg-neutral-900 border rounded-xl p-4 transition-all duration-500 ${
            !objectives[2].isComplete && objectives[1].isComplete 
              ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
              : 'border-neutral-800'
          }`}>
            <h3 className="font-semibold mb-3 text-sm flex items-center gap-2 text-white">
              <Layers className="w-4 h-4 text-green-500" />
              Anatomical Planes
              {!objectives[2].isComplete && objectives[1].isComplete && (
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {(['saggital', 'traverse', 'coronal'] as const).map((plane) => (
                <button
                  key={plane}
                  onClick={() => switchModel(plane)}
                  className={`w-full py-2 px-3 rounded-lg text-[10px] font-bold transition-all border uppercase tracking-wider ${activeModel === plane
                    ? 'bg-green-500/20 border-green-500/50 text-green-500'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`}
                >
                  {plane} Plane
                </button>
              ))}
            </div>
          </div>

          {/* Model Hierarchy */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 overflow-hidden flex flex-col max-h-[450px]">
            <h3 className="font-semibold mb-3 text-sm flex items-center gap-2 text-white">
              <List className="w-4 h-4 text-green-500" />
              Anatomical Structure
            </h3>
            <div className="space-y-2 mb-3">
              <button
                onClick={showAll}
                className="w-full bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white text-[9px] font-bold py-2 rounded-lg transition-all border border-neutral-800 uppercase tracking-widest"
              >
                RESET VIEW
              </button>
            </div>
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
                        <Maximize2 size={14} />
                      </button>
                      <button
                        onClick={() => toggleVisibility(group.uuid)}
                        className={`p-1 rounded transition-colors ${group.visible ? 'text-green-500 hover:bg-green-500/20' : 'text-red-400 hover:bg-red-500/20'}`}
                      >
                        {group.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center - 3D Viewer */}
        <div className="col-span-5 space-y-4">
          <div className={`bg-neutral-900 border rounded-2xl overflow-hidden relative transition-all duration-500 ${
            !objectives[0].isComplete 
              ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
              : 'border-neutral-800'
          }`}>
            {!objectives[0].isComplete && !isLoading && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-emerald-500 text-neutral-950 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-bounce shadow-lg">
                Drag to Rotate
              </div>
            )}
            {!objectives[1].isComplete && objectives[0].isComplete && !isLoading && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-emerald-500 text-neutral-950 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-bounce shadow-lg">
                Click a Part
              </div>
            )}
            {/* Loading Overlay */}
            {isLoading && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/90 z-20">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-lg font-bold text-white mb-2">Loading models...</p>
                  <p className="text-3xl font-extrabold text-green-500">{loadingProgress}%</p>
                </div>
              </div>
            )}

            {/* Error Overlay */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/90 z-20">
                <div className="text-center px-6">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                    <X className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-white font-bold mb-1">Load Failed</p>
                  <p className="text-xs text-slate-400 max-w-[200px]">{error}</p>
                </div>
              </div>
            )}

            <div ref={containerRef} className="w-full h-[550px]" />

            {/* Zoom Influence */}
            <div className="absolute bottom-4 left-4 right-4 bg-neutral-900 border border-neutral-800 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-500/20 rounded-lg">
                    <Search className="w-3.5 h-3.5 text-green-500" />
                  </div>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Zoom Influence</span>
                </div>
                <span className="text-[10px] font-mono text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">{Math.round((800 - zoomLevel) / 7.5)}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="800"
                value={zoomLevel}
                onChange={(e) => handleZoomChange(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
            </div>
          </div>

        </div>

        {/* Right Sidebar */}
        <div className="col-span-3 space-y-4">
          {/* Laboratory Manual */}
          <div className={`bg-neutral-900 border rounded-xl p-4 overflow-hidden transition-all duration-500 ${
            !objectives[3].isComplete && objectives[2].isComplete 
              ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
              : 'border-neutral-800'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-white">
                <FileText className="w-4 h-4 text-green-500" />
                Laboratory Manual
                {!objectives[3].isComplete && objectives[2].isComplete && (
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                )}
              </h3>
              <button
                onClick={() => {
                  setShowManual(!showManual);
                  updateObjective('manual');
                }}
                className="p-1.5 bg-neutral-950 hover:bg-neutral-800 rounded-lg transition-colors text-slate-500 hover:text-white"
              >
                {showManual ? <X size={14} /> : <Maximize2 size={14} />}
              </button>
            </div>

            <div className={`relative transition-all duration-300 ${showManual ? 'h-[400px]' : 'h-[160px]'}`}>
              <div className="absolute inset-0 bg-neutral-950 rounded-lg border border-neutral-800 overflow-hidden">
                <iframe
                  src="/pdfs/Lab_1.pdf#toolbar=0"
                  className="w-full h-full border-none grayscale-[0.3] contrast-[1.1]"
                  title="Lab Manual"
                />
                {!showManual && (
                  <div className="absolute inset-0 bg-neutral-900/60 flex items-end justify-center pb-4">
                    <button
                      onClick={() => {
                        setShowManual(true);
                        updateObjective('manual');
                      }}
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
                href="/pdfs/Lab_1.pdf"
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
             <StudyAssistant labId={1} compact={true} />
          </div>

          {/* Selected Part Info */}
          {(selectedPart || hoveredPart) && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-3.5 h-3.5 text-green-500" />
                <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Part Info</h4>
              </div>
              <div className="font-bold text-white text-sm leading-tight">
                {selectedPart || hoveredPart}
              </div>
              <div className="mt-2 text-[10px] text-slate-400 font-medium lowercase italic">
                {selectedPart ? 'locked selection' : 'hovering'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Root-Level Tooltip */}
      {hoveredPart && (
        <div
          className="fixed bg-neutral-950 border border-green-500/30 text-white text-[11px] font-bold px-2 py-1.5 rounded-md pointer-events-none z-[9999] shadow-2xl translate-x-4 translate-y-4 transition-transform duration-75"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
            {hoveredPart}
          </div>
        </div>
      )}
    </PageLayout>
  );
}