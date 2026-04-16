import React, { useEffect, useRef, useState } from 'react';

export default function ModelTestPage() {
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
        scene.background = new THREE.Color(0x2a2a2a);
        
        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
        camera.position.set(0, 100, 300);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
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

        const gridHelper = new THREE.GridHelper(500, 50, 0x444444, 0x666666);
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

            console.log('TOP LEVEL - Found groups:', groups);

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
            console.error('❌ Error loading model:', error);
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
                color: 0x00ff00,
                emissive: 0x00aa00,
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
          camera.position.z += e.deltaY * 0.1;
          camera.position.z = Math.max(50, Math.min(800, camera.position.z));
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
        g.uuid === uuid ? {...g, visible: newVisibility} : g
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
    }
    
    setGroupList(prev => prev.map(g => ({...g, visible: g.uuid === uuid})));
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
    }
    
    setGroupList(prev => prev.map(g => ({...g, visible: true})));
  };

  const selectMesh = (uuid: string) => {
    if (!sceneRef.current) return;
    const THREE = (window as any).THREE;

    if (sceneRef.current.selectedMesh) {
      const originalMat = sceneRef.current.originalMaterials.get(sceneRef.current.selectedMesh.uuid);
      if (originalMat) {
        sceneRef.current.selectedMesh.material = originalMat.clone();
      }
    }

    sceneRef.current.model.traverse((child: any) => {
      if (child.uuid === uuid && child.isMesh) {
        sceneRef.current.selectedMesh = child;
        setSelectedPart(child.name || 'Unnamed Mesh');
        
        const highlightMat = new THREE.MeshPhongMaterial({
          color: 0x00ff00,
          emissive: 0x00aa00,
          shininess: 100,
          side: THREE.DoubleSide
        });
        child.material = highlightMat;
      }
    });
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
    //handle explosion
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
        
        const offset = direction.multiplyScalar(value * 0.05);
        child.position.copy(originalPos).add(offset);
      });

    } else {
      const targetGroup = sceneRef.current.model.children.find((c: any) => c.uuid === selectedGroupForExplosion);
      
      if (!targetGroup) {
        console.error('Target group not found');
        return;
      }
      
      const groupBox = new THREE.Box3().setFromObject(targetGroup);
      const groupCenter = groupBox.getCenter(new THREE.Vector3());
      
      const meshes: any[] = [];
      targetGroup.traverse((child: any) => {
        if (child.isMesh) {
          meshes.push(child);
        }
      });
      
      if (meshes.length === 0) return;
      
      //spherical distribution
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

  return (
    <div className="w-screen h-screen bg-gray-800 relative flex">
      <div className="w-96 bg-gray-900 border-r border-gray-700 flex flex-col overflow-hidden text-white">
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-gray-400">Loading model...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center text-red-400">
              <p className="font-bold mb-2">Error Loading</p>
              <p className="text-xs text-gray-400">{error}</p>
            </div>
          </div>
        )}
        
        {!isLoading && !error && (
          <>
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-xl font-bold mb-2">Model Hierarchy</h2>
            <div className="text-sm text-gray-400 mb-3">{modelInfo}</div>
            
            <div className="mb-4 bg-gray-800 p-3 rounded">
              <label className="block text-sm font-semibold mb-2 text-cyan-400">
                🎆 Exploded View: {explosionAmount}
              </label>
              
              <select
                value={selectedGroupForExplosion}
                onChange={(e) => {
                  setSelectedGroupForExplosion(e.target.value);
                  handleExplosion(explosionAmount);
                }}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded mb-3 text-sm"
              >
                <option value="ALL">🌐 All Groups</option>
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
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Together</span>
                <span>Apart</span>
              </div>
            </div>
            
            <button
              onClick={showAll}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
            >
              SHOW ALL PARTS
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">All parts start hidden. Click SHOW to reveal them.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {groupList.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-yellow-400 mb-2">
                  Model Parts ({groupList.length})
                </h3>
                {groupList.map((group) => (
                  <div
                    key={group.uuid}
                    className="bg-gray-800 p-3 rounded mb-2 hover:bg-gray-750"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{group.name}</div>
                        <div className="text-xs text-gray-400">
                          Type: {group.type} • Children: {group.childCount}
                        </div>
                        <div className="text-xs text-gray-500">
                          Contains {group.meshCount} meshes • {group.totalVertices.toLocaleString()} verts
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            showOnlyThis(group.uuid);
                          }}
                          className="px-2 py-1 rounded text-xs bg-purple-600 hover:bg-purple-700"
                        >
                          ONLY
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVisibility(group.uuid);
                          }}
                          className={`px-3 py-1 rounded text-xs ${
                            group.visible 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          {group.visible ? 'HIDE' : 'SHOW'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {groupList.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No parts found
              </div>
            )}
          </div>
          </>
        )}
      </div>

      <div className="flex-1 relative">
        <div className="absolute top-4 right-4 bg-black/80 text-white p-4 rounded-lg z-10 max-w-sm">
          <h1 className="text-xl font-bold mb-2">3D Skeleton Viewer</h1>
          <div className="text-sm space-y-1">
            <p>🖱️ <strong>Drag</strong> to rotate</p>
            <p>🖱️ <strong>Scroll</strong> to zoom</p>
            <p>👆 <strong>Click mesh</strong> in list to select</p>
            <p>👁️ <strong>Toggle</strong> visibility buttons</p>
            <p>💥 <strong>Use slider</strong> for exploded view</p>
            {selectedPart && (
              <p className="mt-2 text-green-400">✨ Selected: {selectedPart}</p>
            )}
          </div>
        </div>

        {hoveredPart && (
          <div 
            className="absolute bg-blue-900 text-white text-sm font-semibold px-3 py-1.5 rounded pointer-events-none z-30"
            style={{
              left: `${mousePos.x + 15}px`,
              top: `${mousePos.y + 15}px`,
            }}
          >
            {hoveredPart}
          </div>
        )}

        {isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/95 z-20">
            <div className="text-center text-white">
              <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-xl font-bold mb-2">Loading 3D Model</p>
              <p className="text-4xl font-bold text-blue-400">{loadingProgress}%</p>
              <div className="w-64 h-3 bg-gray-800 rounded-full mt-4 overflow-hidden mx-auto">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/95 z-20">
            <div className="text-center text-white max-w-md px-6">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-xl font-bold mb-2">Failed to Load Model</p>
              <p className="text-sm text-gray-300">{error}</p>
            </div>
          </div>
        )}

        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}0