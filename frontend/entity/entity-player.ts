import { Textures } from '../resources';
import { Game } from '../game';
import { Vector3, Color4, Quaternion } from 'babylonjs';
import * as Babylon from 'babylonjs';
import { EntityPhysics } from './entity';
import { EntityShinyBall } from './entity-projectile';

export class EntityPlayer extends EntityPhysics {
  _targetMesh: Babylon.Mesh;
  _targetParticle: Babylon.ParticleSystem;

  grounded = true;
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
  get position() { return this._mesh.position; }
  set position(p: Vector3) { this._mesh.position = p; }

  set rotation(v: Vector3) {
    const {x, y, z} = v;
    if (x == 0 && y == 0 && z == 0) return;
    let yaw, pitch, roll = 0;
    if (x == 0 && z == 0) {
      yaw = 0;
      pitch = y > 0 ? Math.PI : -Math.PI;
    } else {
      yaw = z > 0 ? Math.atan(x/z) : Math.atan(x/z) + Math.PI;
      const xz = Math.sqrt(x*x + z*z);
      pitch = Math.atan(y/xz);
    }
    this.mesh.rotationQuaternion = Quaternion.FromRotationMatrix(
      Babylon.Matrix.RotationYawPitchRoll(yaw, pitch, roll)
    );
  }

  get forward() {
    const matrix = Babylon.Matrix.Identity();
    this.mesh.rotationQuaternion.toRotationMatrix(matrix);
    return Vector3.TransformNormal(Vector3.Forward(), matrix);
  }

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
    const dx = point.x - this.position.x;
    const dz = point.z - this.position.z;
    this.rotation = new Vector3(dx, 0, dz);
    const ball = new EntityShinyBall('shinny', this.game);
    const forward = this.forward;
    ball.mesh.position = this.position.add(new Vector3(0, 1, 0)).add(forward.multiplyByFloats(2,2,2));
    ball.velocity = forward.multiplyByFloats(10, 10, 10);
    console.log(ball.velocity);
  }

  update(deltaTime: number) {
    super.update(deltaTime);
    if (this.target) {
      const dx = this.target.x - this.position.x;
      const dz = this.target.z - this.position.z;
      this.rotation = new Vector3(dx, 0, dz);

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
    if (this.velocity.y >= 1) {
      this.grounded = false;
    }

    if (this.game.Input.keydown(' ') && this.grounded) {
      this.velocity = this.velocity.multiplyByFloats(1, 0, 1);
      this.mesh.physicsImpostor.applyImpulse(new Vector3(0, 10, 0), Vector3.Zero());
    }
  }

  initMesh() {
    this._mesh = Babylon.Mesh.CreateCylinder('mesh_player', 1, 1, 1, 0, 0, this.game.scene);
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