import { Vector3, Quaternion } from 'babylonjs';
import * as Babylon from 'babylonjs';

function rotateVector3(v: Vector3, q: Quaternion) {
  let m = Babylon.Matrix.Identity();
  Babylon.Matrix.FromQuaternionToRef(q, m);
  return Vector3.TransformNormal(v, m);
}

class Turtle {
  rotation = Quaternion.RotationAxis(Vector3.Right(), -Math.PI / 2)
  position = Vector3.Zero();
  stepLength = 1;
  lengthScale = 0.5;
  thickness = 1;
  thicknessScale = 0.5;
  defaultAngle = Math.PI / 9;

  states = [];

  get forward() {
    return rotateVector3(Vector3.Forward(), this.rotation);
  }

  get left() {
    return rotateVector3(Vector3.Left(), this.rotation);
  }

  get up() {
    return rotateVector3(Vector3.Up(), this.rotation);
  }

  moveForward(length=this.stepLength) {
    this.position.addInPlace(this.forward.multiplyByFloats(length, length, length));
  }

  turnRight(angle=this.defaultAngle) {
    this.rotation.multiplyInPlace(Quaternion.RotationAxis(Vector3.Up(), angle));
  }

  turnLeft(angle=this.defaultAngle) { this.turnRight(-angle); }

  rollRight(angle=this.defaultAngle) {
    this.rotation.multiplyInPlace(Quaternion.RotationAxis(Vector3.Forward(), -angle));
  }

  rollLeft(angle=this.defaultAngle) { this.rollRight(-angle); }


  pitchUp(angle=this.defaultAngle) {
    this.rotation.multiplyInPlace(Quaternion.RotationAxis(Vector3.Right(), -angle));
  }

  pitchDown(angle=this.defaultAngle) { this.pitchUp(-angle); }


  pushState() {
    this.states.push([this.position, this.rotation, this.stepLength, this.thickness]);
  }

  popState() {
    if (this.states.length) {
      [this.position, this.rotation, this.stepLength, this.thickness] = this.states.pop();
    }
  }

  moveForwardAndDrawLine(length=this.stepLength) {
    // TODO
    this.moveForward(length);
  }
}

const turtle = new Turtle();
