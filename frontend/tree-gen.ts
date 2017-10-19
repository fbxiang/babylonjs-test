import * as Babylon from 'babylonjs';
import { Vector3 } from 'babylonjs';
import * as Random from 'random-js';


export function makeBasicTree(name: string, height: number, scene: Babylon.Scene) {
  const trunk = Babylon.Mesh.CreateCylinder(name, height, 1, 2, 7, 7, scene);
  trunk.convertToFlatShadedMesh();
  trunk.position.y = height / 2;
  const leaves = Babylon.Mesh.CreateSphere('_leaves', 2, 2 * height / 3, scene);
  leaves.parent = trunk;
  leaves.scaling.y = 1.5;
  leaves.position.y = height / 2;
  leaves.convertToFlatShadedMesh();
  return trunk;
}

function lerp(a, b, w) {
  return (1 - w) * a + w * b;
}

export function makeSingleGrass(name: string, points: number, scene: Babylon.Scene, bottom=0.05, top=0.01, height=1) {
  const p1 = [];
  const p2 = [];
  for (let p = 0; p < points; p++) {
    p1.push(new Vector3(lerp(bottom, top, p / (points - 1)), p * height / (points - 1),
                        Math.sqrt(lerp(0, 1, p/(points-1))) ));
    p2.push(new Vector3(-lerp(bottom, top, p / (points - 1)), p * height / (points - 1),
                        Math.sqrt(lerp(0, 1, p/(points-1))) ));
  }
  return Babylon.Mesh.CreateRibbon(name, [p1, p2], false, false, 0, scene, true, Babylon.Mesh.DOUBLESIDE);
}

export function makeGrass(name, points, n=100, scene) {
  for (let i = 0; i < n; i++) {
    const g = makeSingleGrass(`${name}_${i}`, points, scene,
                    0.03 + 0.03 * Math.random(),
                    0.01 * Math.random() + 0.005,
                    Math.random() * 5 + 0.5
                             );
    g.rotate(Vector3.Up(), Math.random() * Math.PI * 2);
    g.position.x = Math.random() * 4 - 2;
    g.position.z = Math.random() * 4 - 2;
  }
}
