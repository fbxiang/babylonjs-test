import { Textures } from '../resources';
import { Game } from '../game';
import { Vector3, Color4, Quaternion } from 'babylonjs';
import * as Babylon from 'babylonjs';
import { EntityLiving } from './entity-living';
import { EntityShinyBall } from './entity-projectile';
import * as _ from 'lodash';

export class EntityPlayer extends EntityLiving {
  _targetMesh: Babylon.Mesh;
  _targetParticle: Babylon.ParticleSystem;
  _camera3rd: Babylon.ArcRotateCamera;
  _camera1st: Babylon.Camera;
  _cameraPoint: Babylon.Mesh;

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
    const { x, y, z } = v;
    if (x == 0 && y == 0 && z == 0) return;
    let yaw, pitch, roll = 0;
    if (x == 0 && z == 0) {
      yaw = 0;
      pitch = y > 0 ? Math.PI : -Math.PI;
    } else {
      yaw = z > 0 ? Math.atan(x / z) : Math.atan(x / z) + Math.PI;
      const xz = Math.sqrt(x * x + z * z);
      pitch = Math.atan(y / xz);
    }
    this.mesh.rotationQuaternion = Quaternion.FromRotationMatrix(
      Babylon.Matrix.RotationYawPitchRoll(yaw, pitch, roll)
    );
  }

  get firstPerson() {
    return this._camera1st == this.game.scene.activeCamera;
  }

  set firstPerson(first: boolean) {
    this.game.scene.activeCamera = first ? this._camera1st : this._camera3rd;
  }

  get forward() {
    return this.localToGlobal(Vector3.Forward());
  }

  get left() {
    return this.localToGlobal(Vector3.Left());
  }

  localToGlobal(v: Vector3) {
    const matrix = Babylon.Matrix.Identity();
    this.mesh.rotationQuaternion.toRotationMatrix(matrix);
    return Vector3.TransformNormal(v, matrix);
  }

  constructor(game: Game) {
    super('player', game);
    this.initTargetMesh();
    this.initCamera();
  }

  move(point: Vector3, mesh: Babylon.AbstractMesh, firstClick = true) {
    if (point) {
      this.target = point;
    }
  }

  counter = 0;
  activate(point: Vector3, mesh: Babylon.AbstractMesh) {
    const dx = point.x - this.position.x;
    const dz = point.z - this.position.z;
    this.rotation = new Vector3(dx, 0, dz);
    const ball1 = new EntityShinyBall(`shiny${this.counter++}`, this.game);
    const ball2 = new EntityShinyBall(`shiny${this.counter++}`, this.game);
    const ball3 = new EntityShinyBall(`shiny${this.counter++}`, this.game);
    this.game.spawn(ball1);
    this.game.spawn(ball2);
    this.game.spawn(ball3);

    const forward = this.forward;
    const lf = new Vector3(-0.3, 0, 1).normalize();
    const rf = new Vector3(0.3, 0, 1).normalize();

    ball1.mesh.position = this.position.add(new Vector3(0, 1, 0)).add(forward.multiplyByFloats(2, 2, 2));
    ball2.mesh.position = this.position.add(new Vector3(0, 1, 0)).add(forward.multiplyByFloats(2, 2, 2));
    ball3.mesh.position = this.position.add(new Vector3(0, 1, 0)).add(forward.multiplyByFloats(2, 2, 2));
    const speed = 10;
    ball1.velocity = forward.multiplyByFloats(speed, speed, speed);
    ball2.velocity = this.localToGlobal(lf).multiplyByFloats(speed, speed, speed);
    ball3.velocity = this.localToGlobal(rf).multiplyByFloats(speed, speed, speed);
  }

  update(deltaTime: number) {
    this._camera3rd.target = this.position;
    this._camera3rd.radius = _.clamp(this._camera3rd.radius, 10, 100);

    super.update(deltaTime);
    if (this.firstPerson) {
      this.target = null;
    }
    if (this.game.Input.keypress('z')) {
      this.firstPerson = !this.firstPerson;
    }
    let velocity = new Vector3(0, this.velocity.y, 0);
    if (this.game.Input.keydown('w')) {
      this.target = null;
      const v = this.forward.multiplyByFloats(this.speed, 0, this.speed);
      velocity.x = v.x; velocity.z = v.z;
    } else if (this.game.Input.keydown('s')) {
      this.target = null;
      const v = this.forward.multiplyByFloats(-this.speed / 2, 0, -this.speed / 2);
      velocity.x = v.x; velocity.z = v.z;
    }
    if (this.game.Input.keydown('a')) {
      const v = this.left.multiplyByFloats(this.speed / 2, 0, this.speed / 2);
      velocity.x = velocity.x + v.x;
      velocity.z = velocity.z + v.z;
    } else if (this.game.Input.keydown('d')) {
      const v = this.left.multiplyByFloats(-this.speed / 2, 0, -this.speed / 2);
      velocity.x = velocity.x + v.x;
      velocity.z = velocity.z + v.z;
    }

    if (this.target) {
      const dx = this.target.x - this.position.x;
      const dz = this.target.z - this.position.z;
      this.rotation = new Vector3(dx, 0, dz);

      if (Math.abs(dx) >= 0.2 || Math.abs(dz) >= 0.2) {
        const v = new Vector3(dx, 0, dz).normalize().multiplyByFloats(this.speed, 0, this.speed);
        velocity.x = v.x; velocity.z = v.z;
      }
      else {
        velocity.x = 0; velocity.z = 0;
        this.target = null;
      }
    }
    this.velocity = velocity;

    if (this.firstPerson) {
      this.mesh.rotate(Vector3.Up(), this.game.Input.mouse.dx / 200);
      const rotation = Quaternion.Zero();
      // this.game._cameraPoint.getWorldMatrix().decompose(Vector3.Zero(), rotation, Vector3.Zero());
      const pitch = -this._cameraPoint.rotationQuaternion.toEulerAngles().x;
      let dp = -this.game.Input.mouse.dy / 200;
      let np = _.clamp(pitch + dp, -Math.PI / 2.1, Math.PI / 2.1);
      dp = np - pitch

      this._cameraPoint.rotate(Vector3.Left(), dp);
    }

    if (this.game.Input.keydown(' ') && this.grounded) {
      this.velocity = this.velocity.multiplyByFloats(1, 0, 1);
      this.mesh.physicsImpostor.applyImpulse(new Vector3(0, 15, 0), Vector3.Zero());
      this.grounded = false;
    }
  }

  initMesh() {
    this._mesh = Babylon.Mesh.CreateCylinder('mesh_player', 2, 1, 1, 6, 6, this.game.scene);
    this._mesh.convertToFlatShadedMesh();
    this._mesh.scaling = new Vector3(1, 1, 1);
    this._mesh.position.y = 5;
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
    this.game._shadow.getShadowMap().renderList.push(this._mesh);
  }

  initCamera() {
    this._camera3rd = new Babylon.ArcRotateCamera('camera_3rd', 0, 0, 10, Babylon.Vector3.Zero(), this.game.scene);
    this._camera3rd.setPosition(new Vector3(8, 16, 0));
    this._camera3rd.attachControl(this.game._canvas);
    this._camera3rd.panningSensibility = 0;
    const mouse = <Babylon.ArcRotateCameraPointersInput>this._camera3rd.inputs.attached.pointers;
    mouse.buttons = [1];

    this._camera1st = new Babylon.Camera('camera_1st', new Vector3(0, 0, 0), this.game.scene);
    this._camera1st.parent = this.mesh;

    this._cameraPoint = new Babylon.Mesh('camera_point', this.game.scene);
    this._cameraPoint.parent = this.mesh;
    this._cameraPoint.position.y += 1;
    this._cameraPoint.rotationQuaternion = new Babylon.Quaternion(0, 0, 0, 1);
    this._camera1st.parent = this._cameraPoint;
  }

  initPhysics() {
    this.mesh.physicsImpostor = new Babylon.PhysicsImpostor(this.mesh, Babylon.PhysicsImpostor.BoxImpostor, {
      mass: 1, restitution: 0, friction: 0.1
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

  onDeath() {
    console.log('You are so dead');
  }
}
