// src/sections/projects/ModelComputerSection.jsx
import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Html, useGLTF } from '@react-three/drei';

const ComputerModel = () => {
  // Use the direct path to your GLB file with base URL
  const baseUrl = import.meta.env.BASE_URL || '';
  const modelPath = `${baseUrl}assets/projects/mh1/models/computer.glb`;
  
  console.log('Loading model from:', modelPath);
  
  // useGLTF automatically handles DRACO compression and all loader setup
  const { scene } = useGLTF(modelPath);
  
  return (
    <primitive 
      object={scene} 
      scale={1.5} 
      position={[0, -1, 0]}
      rotation={[0, 0, 0]}
    />
  );
};

const ModelComputerSection = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [fileStatus, setFileStatus] = useState({ loading: true, exists: false });
  
  const baseUrl = import.meta.env.BASE_URL || '';
  const modelPath = `${baseUrl}assets/projects/mh1/models/computer.glb`;
  const fullUrl = window.location.origin + modelPath;

  // Test if file exists and is accessible
  useEffect(() => {
    const testFileAccess = async () => {
      try {
        console.log('🔍 Testing file access:', modelPath);
        const response = await fetch(modelPath);
        
        const info = {
          requestedPath: modelPath,
          fullUrl: response.url,
          exists: response.ok,
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          baseUrl: baseUrl,
          timestamp: new Date().toISOString()
        };
        
        setDebugInfo(info);
        setFileStatus({ loading: false, exists: response.ok });
        
        console.log('📁 File test result:', info);
        
        if (!response.ok) {
          setHasError(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ File test failed:', error);
        setFileStatus({ loading: false, exists: false });
        setHasError(true);
        setIsLoading(false);
        setDebugInfo({
          requestedPath: modelPath,
          error: error.message,
          baseUrl: baseUrl
        });
      }
    };

    testFileAccess();
  }, [modelPath, baseUrl]);

  const handleModelLoad = () => {
    console.log('✅ Model loaded successfully');
    setIsLoading(false);
    setHasError(false);
  };

  const handleModelError = (error) => {
    console.error('❌ Model loading error:', error);
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">3D Computer Model</h1>
          <p className="text-gray-400 mb-2">Testing GLB model loading with useGLTF</p>
          <p className="text-sm text-green-400">
            ✅ Using <code className="bg-gray-800 px-2 py-1 rounded">useGLTF</code> from @react-three/drei
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Automatically handles DRACO compression, caching, and optimization
          </p>
        </div>
        
        {/* Debug Panel */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">🔧</span> Configuration & Debug
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-sm mb-1">Base URL (from Vite):</p>
                <code className="bg-gray-900 px-3 py-2 rounded block font-mono text-blue-300">
                  {baseUrl || '/'}
                </code>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm mb-1">Model Path:</p>
                <code className="bg-gray-900 px-3 py-2 rounded block font-mono text-green-300">
                  {modelPath}
                </code>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-sm mb-1">Full URL:</p>
                <code className="bg-gray-900 px-3 py-2 rounded block font-mono text-purple-300 truncate">
                  {fullUrl}
                </code>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <p className="text-gray-400 text-sm mb-1">File Status:</p>
                  <div className={`px-3 py-2 rounded font-medium ${
                    fileStatus.loading ? 'bg-yellow-900/50 text-yellow-300' :
                    fileStatus.exists ? 'bg-green-900/50 text-green-300' :
                    'bg-red-900/50 text-red-300'
                  }`}>
                    {fileStatus.loading ? '⏳ Testing...' : 
                     fileStatus.exists ? '✅ Accessible' : '❌ Not Found'}
                  </div>
                </div>
                
                {debugInfo?.status && (
                  <div className="flex-1">
                    <p className="text-gray-400 text-sm mb-1">HTTP Status:</p>
                    <div className="bg-gray-900 px-3 py-2 rounded font-mono">
                      {debugInfo.status} {debugInfo.statusText}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="mt-4 p-4 bg-gray-900/50 rounded-lg">
            <h4 className="font-medium text-gray-300 mb-2">Technical Details:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="text-center p-2 bg-blue-900/30 rounded">
                <div className="font-semibold">Loader</div>
                <div className="text-gray-400">useGLTF</div>
              </div>
              <div className="text-center p-2 bg-purple-900/30 rounded">
                <div className="font-semibold">DRACO</div>
                <div className="text-green-400">Auto-handled</div>
              </div>
              <div className="text-center p-2 bg-green-900/30 rounded">
                <div className="font-semibold">Cache</div>
                <div className="text-gray-400">Auto-cached</div>
              </div>
              <div className="text-center p-2 bg-amber-900/30 rounded">
                <div className="font-semibold">Scale</div>
                <div className="text-gray-400">1.5x</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <button 
              onClick={() => window.open(modelPath, '_blank')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center"
            >
              <span className="mr-2">📂</span>
              Open File Directly
            </button>
            
            <button 
              onClick={() => {
                fetch(modelPath)
                  .then(res => alert(
                    `File Test Results:\n\n` +
                    `Status: ${res.status} ${res.statusText}\n` +
                    `Content-Type: ${res.headers.get('content-type')}\n` +
                    `Size: ${res.headers.get('content-length') || 'Unknown'} bytes\n` +
                    `URL: ${res.url}`
                  ))
                  .catch(err => alert(`Fetch Error:\n${err.message}`));
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors flex items-center"
            >
              <span className="mr-2">🔍</span>
              Test File Fetch
            </button>
            
            <button 
              onClick={() => {
                console.clear();
                console.log('🔄 Manual refresh triggered');
                setFileStatus({ loading: true, exists: false });
                setHasError(false);
                setIsLoading(true);
                
                // Force re-test
                fetch(modelPath)
                  .then(res => {
                    setFileStatus({ loading: false, exists: res.ok });
                    if (!res.ok) setHasError(true);
                  })
                  .catch(() => {
                    setFileStatus({ loading: false, exists: false });
                    setHasError(true);
                  });
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg font-medium transition-colors flex items-center"
            >
              <span className="mr-2">🔄</span>
              Re-test Connection
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {hasError && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <h4 className="font-semibold text-lg">Model Loading Issue</h4>
                <p className="text-gray-300 mt-1">
                  The model file could not be loaded. Check the path and file permissions.
                </p>
                {debugInfo?.error && (
                  <p className="text-sm text-red-300 mt-2 font-mono">{debugInfo.error}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 3D Canvas */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="relative bg-black border-2 border-gray-700 rounded-xl overflow-hidden shadow-2xl" style={{ height: '600px' }}>
          <Canvas shadows>
            <PerspectiveCamera makeDefault position={[0, 1, 5]} fov={50} />
            
            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight 
              position={[5, 5, 5]} 
              intensity={1} 
              castShadow
              shadow-mapSize={[1024, 1024]}
              shadow-camera-far={50}
              shadow-camera-left={-10}
              shadow-camera-right={10}
              shadow-camera-top={10}
              shadow-camera-bottom={-10}
            />
            <pointLight position={[-5, 3, -5]} intensity={0.5} />
            <hemisphereLight groundColor="#080820" intensity={0.2} />
            
            {/* Model */}
            <Suspense fallback={
              <Html center>
                <div className="flex flex-col items-center justify-center p-6 bg-black/70 rounded-2xl backdrop-blur-sm">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-white text-xl font-semibold mb-2">Loading 3D Model</p>
                  <p className="text-gray-300 text-sm">Using useGLTF from @react-three/drei</p>
                  <div className="mt-4 flex space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </Html>
            }>
              <ComputerModel />
            </Suspense>
            
            {/* Controls - only show when model is loaded */}
            {!isLoading && !hasError && (
              <OrbitControls
                enableDamping
                dampingFactor={0.05}
                rotateSpeed={0.8}
                minDistance={2}
                maxDistance={10}
                minPolarAngle={0}
                maxPolarAngle={Math.PI / 1.5}
                enableZoom={true}
                enablePan={true}
                enableRotate={true}
              />
            )}

            {/* Environment */}
            {!hasError && <Environment preset="studio" />}
            
            {/* Grid Helper for reference */}
            <gridHelper args={[10, 10, '#444', '#222']} rotation={[Math.PI / 2, 0, 0]} position={[0, -1, 0]} />
          </Canvas>

          {/* Loading Overlay */}
          {(isLoading || fileStatus.loading) && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10">
              <div className="text-center p-8 bg-gray-900/80 rounded-2xl backdrop-blur-sm max-w-md">
                <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <h3 className="text-2xl font-bold mb-2">Initializing 3D Viewer</h3>
                <p className="text-gray-300 mb-4">Loading model and configuring renderer...</p>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full animate-pulse w-3/4"></div>
                </div>
              </div>
            </div>
          )}

          {/* Status Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex flex-wrap justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${fileStatus.exists ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-sm">
                    {fileStatus.exists ? 'File Accessible' : 'File Not Found'}
                  </span>
                </div>
                <div className="hidden md:block text-sm text-gray-400">
                  <span className="text-green-400">useGLTF</span> • Auto DRACO • Cached
                </div>
              </div>
              
              <div className="text-sm font-mono mt-2 md:mt-0">
                <span className="text-gray-400">Path: </span>
                <span className="text-blue-300 truncate max-w-[200px] inline-block">{modelPath}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Instructions & Info Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Controls Guide */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="mr-2">🎮</span> Controls Guide
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🖱️</span>
                </div>
                <div>
                  <h4 className="font-medium">Rotate View</h4>
                  <p className="text-gray-400 text-sm">Left-click + drag anywhere on the model</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🔍</span>
                </div>
                <div>
                  <h4 className="font-medium">Zoom In/Out</h4>
                  <p className="text-gray-400 text-sm">Scroll wheel or two-finger pinch on trackpad</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-xl">👆</span>
                </div>
                <div>
                  <h4 className="font-medium">Pan View</h4>
                  <p className="text-gray-400 text-sm">Right-click + drag or middle-click + drag</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Technical Information */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="mr-2">⚙️</span> Technical Information
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-300 mb-2">Why useGLTF is Better:</h4>
                <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                  <li>Automatically handles DRACO compressed models</li>
                  <li>Built-in caching for better performance</li>
                  <li>Pre-configured loader with error handling</li>
                  <li>Optimized for React Three Fiber ecosystem</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-300 mb-2">Current Configuration:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-900/50 p-2 rounded">
                    <div className="text-gray-400">Renderer</div>
                    <div className="font-mono">Three.js WebGL</div>
                  </div>
                  <div className="bg-gray-900/50 p-2 rounded">
                    <div className="text-gray-400">Shadows</div>
                    <div className="font-mono text-green-400">Enabled</div>
                  </div>
                  <div className="bg-gray-900/50 p-2 rounded">
                    <div className="text-gray-400">Environment</div>
                    <div className="font-mono">Studio</div>
                  </div>
                  <div className="bg-gray-900/50 p-2 rounded">
                    <div className="text-gray-400">Scale Factor</div>
                    <div className="font-mono">1.5</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Status Footer */}
      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-400 text-sm">
              Powered by <span className="text-blue-400">React Three Fiber</span> +{' '}
              <span className="text-green-400">@react-three/drei</span>
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${fileStatus.exists ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-400">File Access</span>
            </div>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${isLoading ? 'bg-yellow-500' : hasError ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <span className="text-sm text-gray-400">Model Status</span>
            </div>
            <div className="text-sm text-gray-500">
              {debugInfo?.timestamp ? `Tested: ${new Date(debugInfo.timestamp).toLocaleTimeString()}` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Add CSS animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default ModelComputerSection;