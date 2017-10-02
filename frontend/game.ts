import * as Cannon from 'cannon';
import { Vector3 } from 'babylonjs';
import * as Babylon from 'babylonjs';

// Babylon is ridiculous sometimes
window.CANNON = Cannon;

export class Game {
  _canvas: HTMLCanvasElement;
  _engine: Babylon.Engine;
  _scene: Babylon.Scene;
  _camera: Babylon.ArcRotateCamera;
  _light: Babylon.Light;
  _player: Player;
  _key = {};

  get keydown() { return this._key; }
  get scene() { return this._scene; }
  get engine() { return this._engine; }
  get camera() { return this._camera; }
  get light() { return this._light; }
  get player() { return this._player; }

  constructor(canvas?: HTMLCanvasElement, options?) {
    this._canvas = canvas || <HTMLCanvasElement>document.getElementsByTagName('canvas')[0];
    if (!this._canvas) {
      this._canvas = document.createElement('canvas');
      document.body.appendChild(this._canvas);
    }
    this._engine = new Babylon.Engine(this._canvas, true);
    this.initScene();
    this._light = new Babylon.HemisphericLight('light_main', new Vector3(1, 1, 0), this._scene);
    this._player = new Player(this);
    this.initCamera();
    this.initKeys();
    window.addEventListener('resize', () => this.engine.resize());
  }

  private initScene() {
    this._scene = new Babylon.Scene(this._engine);
    const gravity = new Vector3(0, -9.81, 0);
    this._scene.enablePhysics(gravity, new Babylon.CannonJSPlugin());

    const ground = Babylon.Mesh.CreateGround('ground', 100, 20, 2);
    ground.physicsImpostor = new Babylon.PhysicsImpostor(ground, Babylon.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, this._scene);
  }

  private initCamera() {
    this._camera = new Babylon.ArcRotateCamera('camera_main', 0, 0, 10, Babylon.Vector3.Zero(), this._scene);
    this._camera.setPosition(new Vector3(8, 16, 0));
    this._camera.attachControl(this._canvas, true);
    this._camera.parent = this.player._mesh;
  }

  private initKeys() {
    const actionManager = this._scene.actionManager = new Babylon.ActionManager(this._scene);
    actionManager.registerAction(new Babylon.ExecuteCodeAction(Babylon.ActionManager.OnKeyDownTrigger, e => {
      this._key[e.sourceEvent.key] = e.sourceEvent.type == 'keydown';
    }));

    actionManager.registerAction(new Babylon.ExecuteCodeAction(Babylon.ActionManager.OnKeyUpTrigger, e => {
      this._key[e.sourceEvent.key] = e.sourceEvent.type == 'keydown';
    }));

    this._canvas.addEventListener('click', e => {
      const pickResult = this.scene.pick(e.x, e.y);
      if (pickResult.hit) {
        this.player.target = pickResult.pickedPoint;
      }
    })
  }

  Input = {
    keydown: (key: string) => {
      return this.keydown[key];
    }
  }

  render() {
    this.scene.render();
    const deltaTime = this.scene.getLastFrameDuration() / 1000;
    this.player.update(deltaTime);
  }

  start() {
    this.engine.runRenderLoop(() => this.render());
  }
}


class Player {
  _mesh: Babylon.Mesh;
  _targetMesh: Babylon.Mesh;
  _targetParticle: Babylon.ParticleSystem;

  speed = 2;
  _target: Vector3;

  set target(v: Vector3) {
    this._target = v;
    if (v) {
      this._targetMesh.visibility = 1;
      this._targetMesh.position = v;
      this._targetParticle.start();
    } else {
      this._targetMesh.visibility = 0;
    }
  }
  get target() { return this._target; }
  get mesh() { return this._mesh; }
  get position() { return this._mesh.position }
  get forward() {
    return new Vector3(Math.sin(this._mesh.rotation.y), 0, Math.cos(this._mesh.rotation.y));
  }

  update(deltaTime: number) {
    if (this.target) {
      const dx = this.target.x - this.position.x;
      const dz = this.target.z - this.position.z;
      if (Math.abs(dx) >= 0.1 || Math.abs(dz) >= 0.1)
        this.mesh.physicsImpostor.setLinearVelocity(new Vector3(dx, 0, dz).normalize().multiplyByFloats(this.speed, this.speed, this.speed));
      else {
        this.mesh.physicsImpostor.setLinearVelocity(Vector3.Zero());
        this.target = null;
      }
    }
  }

  constructor(private game: Game) {
    this._mesh = Babylon.Mesh.CreateBox('player', 1, game.scene);
    this._mesh.position.y += 10;
    this._mesh.checkCollisions = true;
    this._mesh.ellipsoid = new Vector3(1, 1, 1);

    const playerMaterial = new Babylon.StandardMaterial('player', game.scene);
    playerMaterial.diffuseColor = Babylon.Color3.Green();
    this._mesh.material = playerMaterial;

    this.initTargetMesh();

    this.initPhysics();
  }

  // TODO: Make the particle system work!!!
  initTargetMesh() {
    this._targetMesh = Babylon.Mesh.CreateSphere('player_target', 10, 1, this.game.scene);
    this._targetMesh.visibility = 0;
    const targetParticleSystem = new Babylon.ParticleSystem('player_target_particle', 200, this.game.scene);
    targetParticleSystem.color1 = new Babylon.Color4(0.7, 0.8, 1, 1);
    targetParticleSystem.color2 = new Babylon.Color4(0.2, 0.5, 1.0, 1.0);
    targetParticleSystem.minSize = 0.1;
    targetParticleSystem.maxSize = 0.3;
    targetParticleSystem.direction1 = new Vector3(-7, 8, 3);
    targetParticleSystem.direction1 = new Vector3(7, 8, -3);
    targetParticleSystem.targetStopDuration = 3;
    this._targetParticle = targetParticleSystem;
  }

  initPhysics() {
    this.mesh.physicsImpostor = new Babylon.PhysicsImpostor(this._mesh, Babylon.PhysicsImpostor.BoxImpostor, {
      mass: 10, restitution: 0.01, friction: 0
    }, this.game.scene);
    this.mesh.physicsImpostor.executeNativeFunction((world, body) => {
      body.fixedRotation = true;
      body.updateMassProperties();
    })
  }
}
