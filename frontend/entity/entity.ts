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
        this._forwardMesh = Babylon.Mesh.CreateLines(`${name}: forward`, [Vector3.Zero(), Vector3.Forward()],
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

  get velocity() {
    if (this.mesh.physicsImpostor)
      return this.mesh.physicsImpostor.getLinearVelocity();
    return null;
  }
  set velocity(v: Vector3) {
    if (this.mesh.physicsImpostor)
      this.mesh.physicsImpostor.setLinearVelocity(v);
  }
  constructor(name: string, game: Game) {
    super(name, game);
    this.initPhysics();
  }
  abstract initPhysics(): void;
}

export class EntityPlayer extends EntityPhysics {
  _targetMesh: Babylon.Mesh;
  _targetParticle: Babylon.ParticleSystem;

  grounded = false;
  speed = 4;
  _target: Vector3;

  set target(v: Vector3) {
    this._target = v;
    if (v) {
      this._targetMesh.position = v;
      this._targetParticle.start();
    } else {
      this._targetMesh.isVisible = false;
      this._targetParticle.stop();
    }
  }
  get target() { return this._target; }
  get position() { return this._mesh.position }

  constructor(game: Game) {
    super('player', game);
    this.initTargetMesh();
  }

  move(point: Vector3, mesh: Babylon.AbstractMesh, firstClick=true) {
    if (point) {
      this.target = point;
    }
  }

  activate(point: Vector3, mesh: Babylon.AbstractMesh) {
  }

  update(deltaTime: number) {
    super.update(deltaTime);
    if (this.target) {
      const dx = this.target.x - this.position.x;
      const dz = this.target.z - this.position.z;
      const angle = dz > 0 ? Math.atan(dx / dz) : Math.atan(dx / dz) + Math.PI;
      this.mesh.rotationQuaternion = Babylon.Quaternion.RotationAxis(Babylon.Axis.Y, angle);
      if (Math.abs(dx) >= 0.2 || Math.abs(dz) >= 0.2) {
        const v = new Vector3(dx, 0, dz).normalize().multiplyByFloats(this.speed, 0, this.speed);
        v.y = this.velocity.y;
        this.velocity = v;
      }
      else {
        this.velocity = this.velocity.multiplyByFloats(0, 1, 0);
        this.target = null;
      }
    }
    if (Math.abs(this.velocity.y) >= 1) {
      this.grounded = false;
    }

    if (this.game.Input.keydown(' ') && this.grounded) {
      this.mesh.physicsImpostor.applyImpulse(new Vector3(0, 10, 0), Vector3.Zero());
    }
  }

  initMesh() {
    this._mesh = Babylon.Mesh.CreateCylinder('player', 1, 1, 1, 0, 0, this.game.scene);
    this._mesh.scaling = new Vector3(1, 2, 1);
    this._mesh.position.y = 1;
    this._mesh.isPickable = false;

    const playerMaterial = new Babylon.StandardMaterial('player', this.game.scene);
    playerMaterial.diffuseColor = Babylon.Color3.Green();
    this._mesh.material = playerMaterial;
  }

  initTargetMesh() {
    this._targetMesh = Babylon.Mesh.CreateSphere('player_target', 10, 1, this.game.scene);

    this._targetMesh.isVisible = false;
    this._targetMesh.isPickable = false;

    const targetParticleSystem = new Babylon.ParticleSystem('player_target_particle', 1000, this.game.scene);
    targetParticleSystem.emitter = this._targetMesh;
    targetParticleSystem.particleTexture = new Babylon.Texture(Textures.FLARE, this.game.scene);

    targetParticleSystem.color1 = new Color4(0.7, 0.8, 1, 1);
    targetParticleSystem.color2 = new Color4(0.2, 0.5, 1.0, 1.0);
    targetParticleSystem.minSize = 0.5;
    targetParticleSystem.maxSize = 1.5;
    targetParticleSystem.emitRate = 40;
    targetParticleSystem.direction1 = new Vector3(-2, 16, 2);
    targetParticleSystem.direction2 = new Vector3(2, 16, -2);
    this._targetParticle = targetParticleSystem;
  }

  initPhysics() {
    this.mesh.physicsImpostor = new Babylon.PhysicsImpostor(this.mesh, Babylon.PhysicsImpostor.BoxImpostor, {
      mass: 1, restitution: 0.01, friction: 0
    }, this.game.scene);
    this.mesh.physicsImpostor.executeNativeFunction((world, body) => {
      body.fixedRotation = true;
      body.updateMassProperties();
      body.addEventListener('collide', e => {
        if (e.contact.ri.y < 0) {
          this.grounded = true;
        }
      })
    })
  }
}
