import React, { useEffect, useRef, useState } from 'react';

interface ThreeViewerProps {
  modelPath: string;
  onPartClick?: (partName: string) => void;
  onPartHover?: (partName: string | null) => void;
}

// Track if scripts are loaded globally
let scriptsLoaded = false;
let scriptLoadingPromise: Promise<void> | null = null;

export default function ThreeViewer({ modelPath, onPartClick, onPartHover }: ThreeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // Track cleanup resources
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let isMounted = true;
    
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Check if script already exists
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
      
      if (scriptLoadingPromise) {
        return scriptLoadingPromise;
      }
      
      scriptLoadingPromise = (async () => {
        await loadScript('https://cdn.jsdelivr.net/npm/fflate@0.7.4/umd/index.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js');
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

        const renderer = new THREE.WebGLRenderer({ 
          antialias: true,
          preserveDrawingBuffer: false // Better for performance
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio
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

        const gridHelper = new THREE.GridHelper(500, 50, 0x334155, 0x1e293b);
        scene.add(gridHelper);

        // Use appropriate loader based on file extension
        const fileExtension = modelPath.toLowerCase().split('.').pop();
        let loader: any;
        
        if (fileExtension === 'glb' || fileExtension === 'gltf') {
          loader = new (THREE as any).GLTFLoader();
        } else {
          // Default to FBX for other formats
          await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/FBXLoader.js');
          loader = new (THREE as any).FBXLoader();
        }
        
        let loadedModel: any = null;
        let originalMaterials = new Map();

        loader.load(
          modelPath,
          (result: any) => {
            if (!isMounted) return;
            
            // Handle both GLTF and FBX formats
            const scene_model = result.scene || result;
            const box = new THREE.Box3().setFromObject(scene_model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            scene_model.position.sub(center);

            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim > 200) {
              const scale = 200 / maxDim;
              scene_model.scale.setScalar(scale);
            }

            scene_model.traverse((child: any) => {
              if (child.isMesh) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach((mat: any) => {
                  if (mat) {
                    originalMaterials.set(child.uuid, mat.clone());
                    mat.side = THREE.DoubleSide;
                    if (mat.type === 'MeshPhongMaterial' || mat.type === 'MeshStandardMaterial') {
                      mat.needsUpdate = true;
                    }
                  }
                });
              }
            });

            scene.add(scene_model);
            loadedModel = scene_model;
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
              const hoveredMesh = intersects[0].object;
              const partName = hoveredMesh.name || 'Unnamed Part';
              setHoveredPart(partName);
              if (onPartHover) onPartHover(partName);
              renderer.domElement.style.cursor = 'pointer';
            } else {
              setHoveredPart(null);
              if (onPartHover) onPartHover(null);
              renderer.domElement.style.cursor = 'default';
            }
          }
        };

        const onMouseUp = () => {
          isDragging = false;
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
              if (originalMat) {
                selectedMesh.material = originalMat.clone();
              }
            }
            
            if (selectedMesh !== clickedMesh) {
              selectedMesh = clickedMesh;
              if (onPartClick) onPartClick(partName);
              
              const highlightMat = new THREE.MeshPhongMaterial({
                color: 0x06b6d4,
                emissive: 0x0891b2,
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
            }
          } else {
            if (selectedMesh) {
              const originalMat = originalMaterials.get(selectedMesh.uuid);
              if (originalMat) {
                selectedMesh.material = originalMat.clone();
              }
              selectedMesh = null;
            }
          }
        };

        const onWheel = (e: WheelEvent) => {
          e.preventDefault();
          camera.position.z += e.deltaY * 0.1;
          camera.position.z = Math.max(50, Math.min(800, camera.position.z));
        };

        const onTouchStart = (e: TouchEvent) => {
          if (e.touches.length === 1) {
            isDragging = true;
            previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }
        };

        const onTouchMove = (e: TouchEvent) => {
          if (!isMounted) return;
          
          if (isDragging && e.touches.length === 1) {
            e.preventDefault(); // Prevent page scroll while rotating
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
          if (!isMounted) return;
          animationId = requestAnimationFrame(animate);
          scene.rotation.y = rotation.y;
          scene.rotation.x = rotation.x;
          renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
          if (!isMounted) return;
          const width = container.clientWidth;
          const height = container.clientHeight;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        // Store comprehensive cleanup function
        cleanupRef.current = () => {
          isMounted = false;
          
          // Cancel animation
          if (animationId) {
            cancelAnimationFrame(animationId);
          }
          
          // Remove event listeners
          renderer.domElement.removeEventListener('mousedown', onMouseDown);
          renderer.domElement.removeEventListener('mousemove', onMouseMove);
          renderer.domElement.removeEventListener('mouseup', onMouseUp);
          renderer.domElement.removeEventListener('click', onClick);
          renderer.domElement.removeEventListener('wheel', onWheel);
          renderer.domElement.removeEventListener('touchstart', onTouchStart);
          renderer.domElement.removeEventListener('touchmove', onTouchMove);
          renderer.domElement.removeEventListener('touchend', onTouchEnd);
          window.removeEventListener('resize', handleResize);
          
          // Dispose of materials
          originalMaterials.forEach((mat) => {
            if (mat.dispose) mat.dispose();
          });
          originalMaterials.clear();
          
          // Dispose of model
          if (loadedModel) {
            loadedModel.traverse((child: any) => {
              if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                  if (Array.isArray(child.material)) {
                    child.material.forEach((mat: any) => mat.dispose());
                  } else {
                    child.material.dispose();
                  }
                }
              }
            });
            scene.remove(loadedModel);
          }
          
          // Dispose of scene objects
          scene.traverse((object: any) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach((mat: any) => mat.dispose());
              } else {
                object.material.dispose();
              }
            }
          });
          
          // Remove renderer from DOM
          if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
          
          // Dispose renderer and force context loss
          renderer.dispose();
          renderer.forceContextLoss();
          
          // Clear references
          loadedModel = null;
          selectedMesh = null;
        };
        
      } catch (err) {
        if (!isMounted) return;
        setError(`Failed to initialize 3D scene: ${err}`);
        setIsLoading(false);
      }
    };

    initScene();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [modelPath, onPartClick, onPartHover]);

  return (
    <div className="relative w-full h-full">
      {hoveredPart && (
        <div 
          className="absolute bg-slate-900/95 backdrop-blur-sm border border-cyan-400/50 text-white text-sm font-semibold px-3 py-1.5 rounded pointer-events-none z-30"
          style={{
            left: `${mousePos.x + 15}px`,
            top: `${mousePos.y + 15}px`,
          }}
        >
          {hoveredPart}
        </div>
      )}

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
  );
}