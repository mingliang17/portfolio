// src/components/3d/projects/Mh1.jsx
import React, { forwardRef } from 'react';
import { useGLTF } from '@react-three/drei';

const BASE_URL = import.meta.env.BASE_URL;
const assetPath = (path) => `${BASE_URL}${path}`.replace(/\/+/g, '/');

export const Mh1Model = forwardRef(({
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  debug = false,
  enableShadows = true,
  materialOverrides = {},
  ...props
}, ref) => {
  
  const { nodes, materials } = useGLTF(assetPath('/assets/projects/mh1/models/gltf/mh1_2.gltf'));

  if (debug) {
    console.log('Mh1Model loaded:', {
      materials: Object.keys(materials),
      nodes: Object.keys(nodes),
      scale,
      position
    });
  }

  // Apply material overrides
  React.useEffect(() => {
    Object.entries(materialOverrides).forEach(([materialName, overrideProps]) => {
      if (materials[materialName]) {
        Object.assign(materials[materialName], overrideProps);
        materials[materialName].needsUpdate = true;
      }
    });
  }, [materials, materialOverrides]);
  
  return (
    <group {...props} dispose={null}>
      <group position={[2.3, 0, 0]}>
        <group position={[-18.6, 0, 63.9]}>
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Box.geometry}
            material={materials.Brushed_aluminium_01_3_Extrude}
            position={[0, 5.5, -107]}
            scale={[1, 0.82, 1]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Box2.geometry}
            material={materials.Aluminium_panel_fix_Box2}
            position={[0, 11, -16.81]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Extrude.geometry}
            material={materials.Brushed_aluminium_01_3_Extrude}
            position={[-0.07, 10.99, -107.067]}
            scale={[1, 0.37, 1]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes['Phase_-_Exist'].geometry}
            material={materials['Phase_-_Exist_Phase_-_Exist']}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Aluminum.geometry}
            material={materials.Brushed_aluminium_01_Aluminum}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes['Clad_-_White'].geometry}
            material={materials['Brushed_aluminium_01_2_Clad_-_White']}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Copper.geometry}
            material={materials.Brushed_aluminium_01_Copper}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Plywood__Sheathing.geometry}
            material={materials.Brushed_aluminium_01_2_Plywood__Sheathing}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes['Door_-_Panel'].geometry}
            material={materials['Brushed_aluminium_01_2_Door_-_Panel']}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes['Door_-_Frame'].geometry}
            material={materials['Brushed_aluminium_01_2_Door_-_Frame']}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes['Door_-_Handle'].geometry}
            material={materials['Door_-_Handle_Door_-_Handle']}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes['Door_-_Frame_Mullion'].geometry}
            material={materials['Door_-_Frame_Mullion_Door_-_Frame_Mullion']}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes['Door_-_Architrave'].geometry}
            material={materials['Brushed_aluminium_01_2_Door_-_Architrave']}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Finish_Gilgen_Aluminium.geometry}
            material={materials.Finish_Gilgen_Aluminium_Finish_Gilgen_Aluminium}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Rubber__Natural.geometry}
            material={materials.Rubber__Natural_Rubber__Natural}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Plastic__Opaque_Black.geometry}
            material={materials.Plastic__Opaque_Black_Plastic__Opaque_Black}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes['Metal_-_Aluminum'].geometry}
            material={materials['Metal_-_Aluminum_Metal_-_Aluminum']}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Default.geometry}
            material={materials.Default_Default}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Ceiling_Tile_600_x_1200.geometry}
            material={materials.Ceiling_Tile_600_x_1200_Ceiling_Tile_600_x_1200}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Ceiling_Tile_600_x_1200_1_.geometry}
            material={materials.Aluminium_panels_300x150_Ceiling_Tile_600_x_1200_1_}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Default_Wall.geometry}
            material={materials.Brushed_aluminium_01_3_Default_Wall}
            position={[0, -0.01, 0]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes['Phase_-_Demo'].geometry}
            material={materials['Brushed_aluminium_01_4_Phase_-_Demo']}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.RNT_Material.geometry}
            material={materials['Metal_-_Aluminum_RNT_Material']}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Stair_Railing.geometry}
            material={materials.Stair_Railing_Stair_Railing}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes['Concrete__Cast-in-Place__Gray'].geometry}
            material={materials['Metal_-_Aluminum_Concrete__Cast-in-Place__Gray']}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Glass.geometry}
            material={materials.Reflective_glass_Glass}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes['Site_-_Grass'].geometry}
            material={materials['Site_-_Grass_Site_-_Grass']}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes['Site_-_Earth'].geometry}
            material={materials['Site_-_Earth_Site_-_Earth']}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes['Render_Material_0-0-255'].geometry}
            material={materials['Fine_concrete_01_Render_Material_0-0-255']}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Default_Roof.geometry}
            material={materials.Floor_Tiles_Default_Roof}
          />
        </group>
      </group>
      <group position={[2.3, 0, 0]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Graphics_1.geometry}
          material={materials.Emissive_Black_Graphics}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Graphics_2.geometry}
          material={materials.Matt_White_Graphics}
        />
      </group>
    </group>
  );
});

// Set a display name for debugging
Mh1Model.displayName = 'Mh1Model';

// Preload the GLTF
useGLTF.preload(assetPath('/assets/projects/mh1/models/gltf/mh1_2.gltf'));
