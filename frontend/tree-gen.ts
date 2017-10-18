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
}

function lerp(a, b, w) {
  return (1 - w) * a + w * b;
}

export function makeSingleGrass(name: string, points = 4, scene: Babylon.Scene) {
  const bottom = 0.05;
  const top = 0.01;
  const height = 1;
  const p1 = [];
  const p2 = [];
  for (let p = 0; p < points; p++) {
    p1.push(new Vector3(lerp(bottom, top, p / (points - 1)), p * height / (points - 1),
                        Math.sqrt(lerp(0, 1, p/(points-1))) ));
    p2.push(new Vector3(-lerp(bottom, top, p / (points - 1)), p * height / (points - 1),
                        Math.sqrt(lerp(0, 1, p/(points-1))) ));
  }

  Babylon.Mesh.CreateRibbon(name, [p1, p2], false, false, 0, scene, true, Babylon.Mesh.DOUBLESIDE);
}
