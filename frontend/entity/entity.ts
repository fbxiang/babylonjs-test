import * as Babylon from 'babylonjs';
import { Vector3, Color4 } from 'babylonjs';
import { Game } from '../game';
import { Debug } from '../debug';
import { Textures } from '../resources';

export interface IEntityMesh { parentEntity?: EntityBase; }

export abstract class EntityBase {
  protected _mesh: Babylon.Mesh & IEntityMesh;
  _life: number;
  expirable = true;
  destroying = false;

  get position() {
    if (this.mesh)
      return this.mesh.position;
    return null;
  }

  set position(p: Vector3) {
    if (this.mesh)
      this.mesh.position = p;
  }

  get mesh() { return this._mesh; }
  private _forwardMesh: Babylon.Mesh;
  constructor(public name: string, protected game: Game) {
    this.initMesh()
    if (this._mesh)
      this._mesh.parentEntity = this;
  }

  update(deltaTime: number) {
    if (this.expirable)
      this._life -= deltaTime;
    if (this._life < 0) {
      this.destroying = true;
    }

    if (Debug.forwardVector) {
      if (!this._forwardMesh) {
        this._forwardMesh = Babylon.Mesh.CreateLines(`${name}_forward`, [Vector3.Zero(), Vector3.Forward()],
          this.game.scene, false);
        this._forwardMesh.parent = this._mesh;
        this._forwardMesh.isPickable = false;
      }
    } else {
      this._forwardMesh = null;
    }
  }

  destroy() {
    if (this._mesh) {
      this._mesh.parentEntity = null;
      if (this._mesh.physicsImpostor) {
        this._mesh.physicsImpostor.dispose();
        this._mesh.physicsImpostor = null;
      }
      this._mesh.dispose();
    }
    this._mesh = null;
  }

  abstract initMesh(): void;
}

export abstract class EntityPhysics extends EntityBase {
  useGravity = true;
  expirable = false;

  get velocity() {
    return this.mesh.physicsImpostor.getLinearVelocity();
  }
  set velocity(v: Vector3) {
    this.mesh.physicsImpostor.setLinearVelocity(v);
  }

  constructor(name: string, game: Game) {
    super(name, game);
    this.initPhysics();
    if (this.mesh.physicsImpostor && !this.useGravity) {
      this.mesh.physicsImpostor.registerBeforePhysicsStep(imposter => {
        imposter.executeNativeFunction((world, body) => {
          body.force.y += 9.81; // TODO: change this trick
        })
      })
    }
  }
  abstract initPhysics(): void;
}


export class EntityDebug extends EntityPhysics {
  constructor(name, game) {
    super(name, game);
    this.expirable = false;
  }

  initMesh() {
    this._mesh = Babylon.Mesh.CreateBox(`mesh_${this.name}`, 3, this.game.scene, true);
  }

  initPhysics() {
    this.mesh.physicsImpostor = new Babylon.PhysicsImpostor(this.mesh, Babylon.PhysicsImpostor.BoxImpostor);
  }
}
