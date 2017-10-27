import { Vector3 } from 'babylonjs';
import * as Babylon from 'babylonjs';
import * as Random from 'random-js';
import * as _ from 'lodash';

const seed = 42;

const rand = new Random(Random.engines.mt19937().seed(seed));

function argminBy(arr: any[], fn: (a: any) => number) {
  let minIndex = 0;
  let min = fn(arr[0]);
  arr.forEach((v, i) => {
    const newV = fn(v);
    if (newV < min) {
      min = newV;
      minIndex = i;
    }
  });
  return minIndex;
}

function argmaxBy(arr: any[], fn: (a: any) => number) {
  return argminBy(arr, a => -fn(a));
}

function distSqured(v1: Vector3,  v2: Vector3) {
  const dir = v1.subtract(v2);
  return Vector3.Dot(dir, dir);
}

export class TreeBuilder {
  _killDistance: number;
  _stepLength: number;
  _influenceRadius: number;
  _attractionPoints: Vector3[];
  _startPoint: Vector3;

  _treePoints: Vector3[] = [];
  _nextList: number[][] = [];

  _require(field, name: string) {
    if (!field) {
      throw `${name} required but not given`;
    }
  }

  _buildCheck() {
    this._require(this._killDistance, '[Kill Distance]');
    this._require(this._influenceRadius, '[Influence Radius]');
    this._require(this._attractionPoints, '[Attraction Points]');
    this._require(this._startPoint, '[Start Point]');
    if (this.attractionPoints.length == 0)
      throw 'Attraction points appears to be empty';
  }

  build() {
    this._buildCheck();
    this._build();
  }

  // Kd in paper
  killDistance(d: number) {
    this._killDistance = d;
    return this;
  }

  // D in paper
  influenceRadius(r: number) {
    this._influenceRadius = r;
    return this;
  }

  // d in paper
  stepLength(d: number) {
    this._stepLength = d;
    return this;
  }

  startPoint(p: Vector3) {
    this._startPoint = p;
    this._treePoints = [this._startPoint];
    this._nextList = [[]];
    return this;
  }

  attractionPoints(ps: Vector3[]) {
    this._attractionPoints = ps;
    return this;
  }

  visualize(scene: Babylon.Scene) {
    scene.getMeshesByTags('_vis_', m => { m.dispose() });
    this._attractionPoints.forEach(p => {
      const mesh = Babylon.Mesh.CreateSphere('_vis_', 4, 0.1, scene);
      mesh.position = p;
      Babylon.Tags.AddTagsTo(mesh, '_vis_');
    })

    this._nextList.forEach((next, i) => {
      next.forEach(j => {
        Babylon.Mesh.CreateLines('_vis_', [this._treePoints[i], this._treePoints[j]], scene);
      })
    })

    this._treePoints.forEach(p => {
      const mesh = Babylon.Mesh.CreateBox('_vis_', 0.1, scene);
      mesh.position = p;
      Babylon.Tags.AddTagsTo(mesh, '_vis_');
    })

    return this;
  }

  _build() {
    // run grow several times.
  }

  _getTreePointWithMinDistanceFrom(p: Vector3) {
    return argminBy(this._treePoints, v => {
      const dir = v.subtract(p);
      return Vector3.Dot(dir, dir);
    });
  }

  _getGrowthPointsInfo() {
    const growPointsInfo: {[index: string]: Vector3} = {};
    this._attractionPoints = this._attractionPoints.filter(p => {
      for (let v of this._treePoints) {
        if (distSqured(v, p) < this._killDistance * this._killDistance)
          return false
      }
      return true;
    })
    this._attractionPoints.forEach(v => {
      const idx = this._getTreePointWithMinDistanceFrom(v);
      const direction = v.subtract(this._treePoints[idx]).normalize();
      growPointsInfo[idx] = growPointsInfo[idx] ? growPointsInfo[idx].add(direction) : direction;
    })
    return _.mapValues(growPointsInfo, v => v.normalize());
  }

  grow() {
    const growthPointsInfo = this._getGrowthPointsInfo();
    let newTreePointIndex = this._treePoints.length;
    for (let index in growthPointsInfo) {
      const point = this._treePoints[index];
      const direction = growthPointsInfo[index];
      const nextPoint = point.add(new Vector3(
        this._stepLength * direction.x, this._stepLength * direction.y , this._stepLength * direction.z
      ));
      this._treePoints.push(nextPoint);
      this._nextList.push([]);
      this._nextList[index].push(newTreePointIndex++);
    }
  }

  simplify() {
    const treePoints: {[idx: number]: Vector3} = Object.assign({}, this._treePoints);
    const nextList: {[idx: number]: number[]} = Object.assign({}, this._nextList);

    const q = [0];
    while (q.length) {
      const start = q.pop();
      if (nextList[start].length == 1 && nextList[nextList[start][0]].length == 1 ) {
        const nextIndex = nextList[start][0];
        const nextNextList = nextList[nextIndex][0];
        const dir1 = treePoints[nextIndex].subtract(treePoints[start]);
        const dir2 = treePoints[nextNextList].subtract(treePoints[start]);
        if ( Vector3.Dot(dir1, dir2) / Math.sqrt(Vector3.Dot(dir1, dir1)) / Math.sqrt(Vector3.Dot(dir2, dir2)) > Math.cos(Math.PI / 16) ) {
          nextList[start] = [nextNextList];
          delete nextList[nextIndex];
          delete treePoints[nextIndex];
          q.push(start);
        }
      }
      nextList[start].forEach(i => q.push(i));
    }

    const remainOldIdx = Object.keys(treePoints).sort();
    const newIdxLookup = _.invert(Object.assign({}, remainOldIdx));

    this._treePoints = [];
    remainOldIdx.forEach(idx => this._treePoints.push(treePoints[idx]));

    this._nextList = [];
    remainOldIdx.forEach(oldIdx => this._nextList.push( nextList[oldIdx].map(idx => newIdxLookup[idx])));
  }
}

export class Sampling {

  // TODO: The math is wrong!!!
  static UniformSphere(n: number, r: number, m: Vector3) {
    return _.times(n, () => {
      const yaw = rand.real(-Math.PI, Math.PI);
      const pitch = rand.real(-Math.PI / 2, Math.PI / 2);
      const y = r * Math.sin(pitch);
      const z = r * Math.cos(pitch) * Math.cos(yaw)
      const x = r * Math.cos(pitch) * Math.sin(yaw)
      return m.add(new Vector3(x, y, z));
    });
  }

  static UniformCube(n: number, a: number, m: Vector3) {
    return _.times(n, () => {
      return new Vector3(
        rand.real(m.x - a/2, m.x + a/2),
        rand.real(m.y - a/2, m.y + a/2),
        rand.real(m.z - a/2, m.z + a/2)
      )
    })
  }
}
