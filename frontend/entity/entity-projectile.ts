import { Vector3, Color4 } from 'babylonjs';
import * as Babylon from 'babylonjs';
import { Game } from '../game';
import { Textures } from '../resources';
import { EntityPhysics, IEntityMesh } from './entity';

export abstract class EntityProjectileBase extends EntityPhysics {
  _particleSystem: Babylon.ParticleSystem;
  constructor(name: string, game: Game, maxLife: number) {
    super(name, game);
    this._life = maxLife;
    this.expirable = true;
  }

  initMesh() {
    // this._mesh = new Babylon.Mesh('mesh_' + this.name, this.game.scene);
    this._mesh = Babylon.Mesh.CreateSphere(`mesh_${this.name}`, 10, 1, this.game.scene, true);
  }

  initPhysics() {
    this.mesh.physicsImpostor = new Babylon.PhysicsImpostor(this.mesh, Babylon.PhysicsImpostor.SphereImpostor, {
      mass: 1, restitution: 0, friction: 0
    }, this.game.scene);
    this.useGravity = false;
    this.mesh.physicsImpostor.physicsBody.collisionResponse = false;
    this.mesh.physicsImpostor.onCollideEvent = (self, other) => {
      if (other.object['parentEntity']) {
        this.onHit(<any>other.object);
      }
    }
  }

  destroy() {
    super.destroy();
    if (this._particleSystem)
      this._particleSystem.dispose();
  }

  update(deltaTime: number) {
    super.update(deltaTime);
  }

  abstract onHit(mesh: Babylon.Mesh & IEntityMesh): void;
}

export class EntityShinyBall extends EntityProjectileBase {

  constructor(name: string, game: Game, maxLife=10) {
    super(name, game, maxLife);
    const particle = this._particleSystem = new Babylon.ParticleSystem(`particle_${name}`, 100, this.game.scene);
    particle.particleTexture = Textures.Get(Textures.FLARE, this.game);
    particle.color1 = new Color4(0.8, 0.3, 0.1, 1.0);
    particle.color2 = new Color4(1.0, 0.5, 0.3, 1.0);
    particle.colorDead = new Color4(0.0, 0.0, 0.1, 0.0);
    particle.emitter = this.mesh;
    particle.minSize = 2.0;
    particle.maxSize = 3.0;
    particle.emitRate = 100;
    particle.direction1 = new Vector3(-0.1, -0.1, -0.1);
    particle.direction2 = new Vector3(0.1, 0.1, 0.1);
    particle.start();
  }

  onHit(mesh: Babylon.Mesh & IEntityMesh) {
    console.log(mesh.parentEntity);
  }

  update(deltaTime: number) {
    super.update(deltaTime);
    if (this._life < 3) {
      this._particleSystem.stop();
      this.velocity = Vector3.Zero();
    }
  }
}
