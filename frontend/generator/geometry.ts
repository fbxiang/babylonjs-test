import * as Babylon from 'babylonjs';
import { Vector3, Quaternion } from 'babylonjs';
import * as _ from 'lodash';

export function createCirclePath(segments = 10, noise: number[] = []) {
  // TODO add noise
  return _.times(segments, i => {
    const angle = i * 2 * Math.PI / segments
    return new Vector3(Math.cos(angle), Math.sin(angle), 0);
  })
}

export function createTube(name: string, path: Vector3[], scene: Babylon.Scene) {
  Babylon.MeshBuilder.ExtrudeShape(name, {
    shape: createCirclePath(),
    path: path,
  }, scene)
}
