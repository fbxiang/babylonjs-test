import { Game } from '../game';
import { Vector3 } from 'babylonjs';
import { EntityBase } from './entity';

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
