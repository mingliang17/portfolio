// src/sections/ModelSection.jsx
import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Html } from '@react-three/drei';
import ModelLoader from '../../components/3d/projects/ModelLoader.jsx';

const ModelSection = ({ 
  modelUrl,
  modelType = 'glb',
  modelScale = 1.0,
  modelPosition = [0, -1, 0],
  modelRotation = [0, 0, 0],
  cameraPosition = [0, 2, 6],
  cameraFov = 45,
  title = '3D Model',
  showControls = true,
  environment = 'studio',
  backgroundColor = '#000000'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  const canvasRef = useRef(null);
  
  // Get base URL for path resolution
  const baseUrl = import.meta.env.BASE_URL || '';
  
  // Build the correct URL with base path
  const fullModelUrl = useCallback(() => {
    if (!modelUrl) return '';
    
    // If URL already has http or is absolute path with base, use as is
    if (modelUrl.startsWith('http') || modelUrl.startsWith('//')) {
      return modelUrl;
    }
    
    // If URL starts with /, remove it and add baseUrl
    if (modelUrl.startsWith('/')) {
      return `${baseUrl}${modelUrl.substring(1)}`;
    }
    
    // Otherwise, just prepend baseUrl
    return `${baseUrl}${modelUrl}`;
  }, [modelUrl, baseUrl]);

  const resolvedUrl = fullModelUrl();
  
  // Test file accessibility ONCE when component mounts or URL changes
  useEffect(() => {
    if (!resolvedUrl) return;
    
    const testFileAccess = async () => {
      try {
        console.log('📁 ModelSection testing file:', resolvedUrl);
        const response = await fetch(resolvedUrl);
        
        const info = {
          requestedUrl: modelUrl,
          resolvedUrl: response.url,
          exists: response.ok,
          status: response.status,
          statusText: response.statusText,
          baseUrl: baseUrl,
          testedAt: new Date().toISOString()
        };
        
        setDebugInfo(info);
        console.log('📁 File test result:', info);
        
        if (!response.ok) {
          setHasError(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('📁 File test failed:', error);
        setDebugInfo({ 
          requestedUrl: modelUrl, 
          error: error.message,
          baseUrl: baseUrl 
        });
        setHasError(true);
        setIsLoading(false);
      }
    };

    testFileAccess();
    
    // Reset states
    setIsLoading(true);
    setHasError(false);
  }, [resolvedUrl, modelUrl, baseUrl]); // Only run when URL changes
  
  const handleModelLoad = useCallback((model) => {
    console.log('✅ Model loaded successfully in ModelSection');
    setIsLoading(false);
    setHasError(false);
  }, []);
  
  const handleModelError = useCallback((error) => {
    console.error('❌ Model loading error in ModelSection:', error);
    setHasError(true);
    setIsLoading(false);
  }, []);

  return (
    <div className="w-full">
      {/* Debug Header - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-300 mb-1">Path Debug</h4>
          <div className="text-xs font-mono space-y-1">
            <div>Base URL: <span className="text-green-300">{baseUrl}</span></div>
            <div>Requested: <span className="text-yellow-300">{modelUrl}</span></div>
            <div>Resolved: <span className="text-green-300">{resolvedUrl}</span></div>
            <div>Full: <span className="text-blue-300">{window.location.origin + resolvedUrl}</span></div>
            {debugInfo.status && (
              <div>Status: <span className={debugInfo.exists ? 'text-green-400' : 'text-red-400'}>
                {debugInfo.status} {debugInfo.statusText}
              </span></div>
            )}
          </div>
        </div>
      )}

      {/* Title */}
      {title && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
          {hasError && (
            <div className="bg-red-900/30 border border-red-700 text-red-200 p-3 rounded-lg">
              <div className="flex items-center">
                <span className="text-xl mr-2">⚠️</span>
                <div>
                  <p className="font-medium">Model failed to load</p>
                  <p className="text-sm mt-1">Check the file path and console for details.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Canvas Container */}
      <div className="relative" ref={canvasRef}>
        {hasError ? (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold mb-3 text-white">Unable to load 3D model</h3>
              <div className="text-left space-y-2 mb-6 text-sm">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                  <span>Path: <code className="bg-gray-800 px-2 py-1 rounded ml-1">{modelUrl}</code></span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                  <span>Resolved: <code className="bg-gray-800 px-2 py-1 rounded ml-1">{resolvedUrl}</code></span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                  <span>Type: <code className="bg-gray-800 px-2 py-1 rounded ml-1">{modelType}</code></span>
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <button 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                  onClick={() => window.open(window.location.origin + resolvedUrl, '_blank')}
                >
                  Test File URL
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-gray-700 bg-black" style={{ minHeight: '500px' }}>
            <Canvas
              shadows
              gl={{ 
                antialias: true,
                alpha: false,
                powerPreference: "high-performance"
              }}
              camera={{ position: cameraPosition, fov: cameraFov }}
            >
              <PerspectiveCamera makeDefault position={cameraPosition} fov={cameraFov} />
              
              <ambientLight intensity={0.4} />
              <directionalLight 
                position={[5, 5, 5]} 
                intensity={1} 
                castShadow
                shadow-mapSize={[1024, 1024]}
              />
              <pointLight position={[-5, 3, -5]} intensity={0.5} />
              <hemisphereLight groundColor="#080820" intensity={0.2} />

              <Suspense fallback={
                <Html center>
                  <div className="bg-black/70 backdrop-blur-sm p-6 rounded-2xl">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-white text-lg font-semibold mb-1">Loading 3D Model</p>
                      <p className="text-gray-300 text-sm">Path: {modelUrl}</p>
                    </div>
                  </div>
                </Html>
              }>
                <ModelLoader
                  url={resolvedUrl}
                  type={modelType}
                  scale={modelScale}
                  position={modelPosition}
                  rotation={modelRotation}
                  onLoad={handleModelLoad}
                  onError={handleModelError}
                />
              </Suspense>

              {showControls && !isLoading && !hasError && (
                <OrbitControls
                  enableDamping
                  dampingFactor={0.05}
                  rotateSpeed={0.5}
                  minDistance={2}
                  maxDistance={20}
                  minPolarAngle={0}
                  maxPolarAngle={Math.PI / 1.5}
                />
              )}

              {environment && !hasError && <Environment preset={environment} />}
              <color attach="background" args={[backgroundColor]} />
            </Canvas>

            {/* Loading overlay */}
            {isLoading && !hasError && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-gray-900/80 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-white">Loading model...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom status bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${hasError ? 'bg-red-500' : isLoading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <span className="text-gray-300">
                    {hasError ? 'Error' : isLoading ? 'Loading' : 'Ready'}
                  </span>
                </div>
                <div className="text-gray-500">
                  Scale: {modelScale}x • Type: {modelType}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!hasError && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-center">
              <span className="text-2xl mr-3">🖱️</span>
              <div>
                <div className="font-medium text-white">Drag to Rotate</div>
                <div className="text-gray-400 text-sm">Left-click and drag</div>
              </div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-center">
              <span className="text-2xl mr-3">🔍</span>
              <div>
                <div className="font-medium text-white">Scroll to Zoom</div>
                <div className="text-gray-400 text-sm">Mouse wheel or pinch</div>
              </div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-center">
              <span className="text-2xl mr-3">👆</span>
              <div>
                <div className="font-medium text-white">Pan View</div>
                <div className="text-gray-400 text-sm">Right-click and drag</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add CSS animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ModelSection;