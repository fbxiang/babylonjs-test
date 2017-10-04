import { EntityPhysics, IEntityMesh } from './entity';
import { Game } from '../game';
import * as Babylon from 'babylonjs';
import { Vector3 } from 'babylonjs';

export abstract class EntityProjectileBase extends EntityPhysics {
  _particleSystem: Babylon.ParticleSystem;
  constructor(name: string, game: Game, velocity: Vector3) {
    super(name, game)
  }

  initMesh() {
    this._mesh = new Babylon.Mesh('mesh_' + this.name, this.game.scene);
  }

  initPhysics() {
    this._mesh.physicsImpostor = new Babylon.PhysicsImpostor(this.mesh, Babylon.PhysicsImpostor.SphereImpostor, {
      mass: 0, restitution: 0, friction: 0
    }, this.game.scene);
  }

  abstract onHit(mesh: Babylon.Mesh & IEntityMesh): void;
}
