import * as Babylon from 'babylonjs';
import { EntityLiving } from './entity-living';

export class EntityDebug extends EntityLiving {
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

  onDeath() {
    this.destroying = true;
  }
}
