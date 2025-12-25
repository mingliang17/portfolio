// src/components/TestModelSimple.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

const SimpleModel = () => {
  // Get the base URL from Vite
  const baseUrl = import.meta.env.BASE_URL || '';
  
  // Build the correct path with base URL
  const modelUrl = `${baseUrl}assets/projects/mh1/models/Mh1.glb`;
  
  console.log('SimpleModel loading from:', modelUrl);
  console.log('Base URL:', baseUrl);
  
  // Create a custom GLTFLoader with DRACOLoader
  const gltfLoader = useMemo(() => {
    const loader = new GLTFLoader();
    
    // Set up DRACOLoader for compressed models
    const dracoLoader = new DRACOLoader();
    
    // Set the path to the Draco decoder files
    // These files are included in three.js package
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
    // Or use a local path: dracoLoader.setDecoderPath('/draco/');
    
    loader.setDRACOLoader(dracoLoader);
    return loader;
  }, []);
  
  const gltf = useLoader(GLTFLoader, modelUrl, (loader) => {
    // Configure the loader for this specific load
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
    loader.setDRACOLoader(dracoLoader);
  });
  
  return (
    <primitive 
      object={gltf.scene} 
      scale={1.5}
      position={[0, -1, 0]}
    />
  );
};

export default function TestModelSimple() {
  const [fileStatus, setFileStatus] = useState({ loading: true, exists: false, status: null });
  const [isModelVisible, setIsModelVisible] = useState(false);
  const [error, setError] = useState(null);
  const [dracoLoaded, setDracoLoaded] = useState(false);

  // Get base URL
  const baseUrl = import.meta.env.BASE_URL || '';
  const modelUrl = `${baseUrl}assets/projects/mh1/models/Mh1.glb`;

  // Load Draco decoder first
  useEffect(() => {
    const loadDraco = async () => {
      try {
        console.log('🔄 Loading Draco decoder...');
        // This is handled by the DRACOLoader automatically
        setDracoLoaded(true);
      } catch (err) {
        console.error('❌ Failed to load Draco decoder:', err);
        setError('DRACO decoder failed to load. Model may be compressed.');
      }
    };
    
    loadDraco();
  }, []);

  // Test if file exists
  useEffect(() => {
    const testFile = async () => {
      try {
        console.log('🔍 Testing file access with base URL:', baseUrl);
        console.log('🔍 Full model URL:', modelUrl);
        
        const response = await fetch(modelUrl);
        
        setFileStatus({
          loading: false,
          exists: response.ok,
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          baseUrl: baseUrl
        });
        
        if (response.ok) {
          console.log('✅ File exists and is accessible');
          setTimeout(() => setIsModelVisible(true), 500);
        } else {
          console.error('❌ File not accessible:', response.status, response.statusText);
          setError(`File not found: ${response.status} ${response.statusText}`);
        }
      } catch (err) {
        console.error('❌ Error testing file:', err);
        setFileStatus({ 
          loading: false, 
          exists: false, 
          status: null, 
          error: err.message,
          baseUrl: baseUrl 
        });
        setError(err.message);
      }
    };

    testFile();
  }, [modelUrl, baseUrl]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🧪 3D Model Test Component</h1>
          <p className="text-gray-300">
            Base URL: <code className="bg-gray-800 px-2 py-1 rounded">{baseUrl}</code>
          </p>
          <p className="text-sm text-yellow-400 mt-2">
            ⚠️ This model uses Draco compression. Make sure DRACOLoader is configured.
          </p>
        </div>

        {/* Draco Status */}
        <div className="mb-4 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${dracoLoaded ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
            <div>
              <h3 className="font-semibold">DRACO Decoder Status</h3>
              <p className="text-sm text-gray-300">
                {dracoLoaded ? '✅ DRACO decoder ready' : '⏳ Loading DRACO decoder...'}
              </p>
            </div>
          </div>
        </div>

        {/* Debug Panel */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">🔍</span> Debug Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-32 text-gray-400">Requested URL:</span>
                <code className="ml-2 bg-gray-900 px-3 py-1 rounded text-blue-300 truncate">{modelUrl}</code>
              </div>
              <div className="flex items-center">
                <span className="w-32 text-gray-400">Full URL:</span>
                <code className="ml-2 bg-gray-900 px-3 py-1 rounded text-blue-300 truncate">
                  {window.location.origin + modelUrl}
                </code>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-32 text-gray-400">File Status:</span>
                <span className={`ml-2 px-3 py-1 rounded font-medium ${
                  fileStatus.loading ? 'bg-yellow-900 text-yellow-300' :
                  fileStatus.exists ? 'bg-green-900 text-green-300' :
                  'bg-red-900 text-red-300'
                }`}>
                  {fileStatus.loading ? '⏳ Testing...' : 
                   fileStatus.exists ? '✅ Found' : '❌ Not Found'}
                </span>
              </div>
              
              {fileStatus.status && (
                <div className="flex items-center">
                  <span className="w-32 text-gray-400">HTTP Status:</span>
                  <span className="ml-2 px-3 py-1 rounded bg-gray-900 font-mono">
                    {fileStatus.status} {fileStatus.statusText}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => window.open(modelUrl, '_blank')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              📂 Open File in New Tab
            </button>
            
            <button 
              onClick={() => {
                fetch(modelUrl)
                  .then(res => alert(`Status: ${res.status} ${res.statusText}\nContent-Type: ${res.headers.get('content-type')}`))
                  .catch(err => alert(`Error: ${err.message}`));
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
            >
              🔄 Test Fetch Request
            </button>
            
            <button 
              onClick={() => {
                setIsModelVisible(!isModelVisible);
                console.log('Model visibility toggled:', !isModelVisible);
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
            >
              {isModelVisible ? '👁️ Hide Model' : '👁️ Show Model'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-3">⚠️</span>
              <h3 className="text-lg font-semibold">Error Loading Model</h3>
            </div>
            <p className="text-red-200 mb-2">{error}</p>
            <p className="text-sm text-gray-400">Check browser console for detailed error messages.</p>
          </div>
        )}

        {/* 3D Canvas Container */}
        <div className="relative bg-black border-2 border-gray-700 rounded-xl overflow-hidden shadow-2xl" style={{ height: '500px' }}>
          {/* Loading Overlay */}
          {(!dracoLoaded || fileStatus.loading) && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-xl">
                {!dracoLoaded ? 'Loading DRACO decoder...' : 'Testing file accessibility...'}
              </p>
              <p className="text-gray-400 mt-2">{!dracoLoaded ? 'Required for compressed models' : 'Checking: ' + modelUrl}</p>
            </div>
          )}

          {/* Canvas */}
          <Canvas shadows>
            <PerspectiveCamera makeDefault position={[0, 2, 5]} fov={50} />
            
            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight 
              position={[5, 5, 5]} 
              intensity={1} 
              castShadow
              shadow-mapSize={[1024, 1024]}
            />
            <pointLight position={[-5, 3, -5]} intensity={0.5} />
            <hemisphereLight groundColor="#080820" intensity={0.2} />

            {/* Model - Only show if file exists and visibility is true */}
            {fileStatus.exists && isModelVisible && dracoLoaded && (
              <Suspense fallback={
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color="gray" wireframe />
                </mesh>
              }>
                <SimpleModel />
              </Suspense>
            )}

            {/* Fallback if model not visible */}
            {(!fileStatus.exists || !isModelVisible || !dracoLoaded) && (
              <mesh position={[0, 0, 0]} scale={2}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial 
                  color={fileStatus.exists ? "#4ade80" : "#ef4444"} 
                  wireframe 
                />
                <meshStandardMaterial 
                  color={fileStatus.exists ? "#4ade80" : "#ef4444"} 
                  transparent 
                  opacity={0.2} 
                />
              </mesh>
            )}

            {/* Controls */}
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              rotateSpeed={0.8}
              minDistance={2}
              maxDistance={10}
            />
          </Canvas>

          {/* Canvas Status Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-3 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  fileStatus.exists ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}></div>
                <span className="text-sm">
                  {fileStatus.exists ? 'File Found' : 'File Not Found'}
                </span>
              </div>
              
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  dracoLoaded ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
                <span className="text-sm">
                  {dracoLoaded ? 'DRACO Ready' : 'DRACO Loading'}
                </span>
              </div>
              
              <div className="text-sm text-gray-400 hidden md:block">
                Drag: Rotate • Scroll: Zoom • Right-drag: Pan
              </div>
            </div>
            
            <div className="text-sm font-mono hidden md:block">
              Scale: 1.5x • Position: [0, -1, 0]
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg border ${
            fileStatus.exists 
              ? 'bg-green-900/20 border-green-700' 
              : 'bg-red-900/20 border-red-700'
          }`}>
            <div className="flex items-center mb-2">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                fileStatus.exists ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <h4 className="font-semibold">File Accessibility</h4>
            </div>
            <p className="text-sm text-gray-300">
              {fileStatus.exists 
                ? 'GLB file is accessible via HTTP' 
                : 'Cannot access the GLB file'}
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-700">
            <div className="flex items-center mb-2">
              <div className={`w-3 h-3 rounded-full mr-3 ${dracoLoaded ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <h4 className="font-semibold">DRACO Compression</h4>
            </div>
            <p className="text-sm text-gray-300">
              {dracoLoaded ? 'Decoder loaded' : 'Decoder required'}
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-700">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 rounded-full bg-purple-500 mr-3 animate-pulse"></div>
              <h4 className="font-semibold">Live Preview</h4>
            </div>
            <p className="text-sm text-gray-300">
              Model visible: <span className="font-bold">{isModelVisible ? 'YES' : 'NO'}</span>
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-700">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 rounded-full bg-amber-500 mr-3"></div>
              <h4 className="font-semibold">Base Path</h4>
            </div>
            <p className="text-sm text-gray-300 truncate">
              <code>{baseUrl || '/'}</code>
            </p>
          </div>
        </div>

        {/* DRACO Decoder Info */}
        <div className="mt-8 p-4 bg-amber-900/20 border border-amber-700 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <span className="mr-2">⚙️</span> DRACO Compression Info
          </h3>
          <p className="text-gray-300 mb-3">
            Your GLB file uses Draco compression for smaller file size. This requires the DRACO decoder to be loaded.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-sm">
              <p className="font-medium mb-1">Decoder URL:</p>
              <code className="bg-amber-900/50 px-2 py-1 rounded block truncate">
                https://www.gstatic.com/draco/versioned/decoders/1.5.5/
              </code>
            </div>
            <div className="text-sm">
              <p className="font-medium mb-1">Alternative Solutions:</p>
              <ul className="list-disc list-inside text-gray-400">
                <li>Re-export without compression</li>
                <li>Use local Draco files</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Regular style tag without jsx attribute */}
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
}