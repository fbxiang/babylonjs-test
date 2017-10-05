import * as Babylon from 'babylonjs';
import { Vector3, Color4 } from 'babylonjs';
import { Game } from '../game';
import { Debug } from '../debug';
import { Textures } from '../resources';

export interface IEntityMesh { parentEntity?: EntityBase; }

export abstract class EntityBase {
  protected _mesh: Babylon.Mesh & IEntityMesh;
  get mesh() { return this._mesh; }
  private _forwardMesh: Babylon.Mesh;
  constructor(public name: string, protected game: Game) {
    this.initMesh()
    if (this._mesh)
      this._mesh.parentEntity = this;
  }

  update(deltaTime: number) {
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

  abstract initMesh(): void;
}

export abstract class EntityPhysics extends EntityBase {

  useGravity = true;

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

