import { Vector3, Color4 } from 'babylonjs';
import * as Babylon from 'babylonjs';
import { Debug } from './debug';
import * as _ from 'lodash';

Debug.forwardVector = true;

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
    this.initInputs();
    this.initSkybox();
    this.initGround();
    window.addEventListener('resize', () => this.engine.resize());
  }

  private initScene() {
    this._scene = new Babylon.Scene(this._engine);
    const gravity = new Vector3(0, -9.81, 0);
    this._scene.enablePhysics(gravity, new Babylon.CannonJSPlugin());

  }

  private initCamera() {
    const camera = this._camera = new Babylon.ArcRotateCamera('camera_main', 0, 0, 10, Babylon.Vector3.Zero(), this._scene);
    camera.setPosition(new Vector3(8, 16, 0));
    this._camera.attachControl(this._canvas);
    this._camera.panningSensibility = 0;
    const mouse = <Babylon.ArcRotateCameraPointersInput>this.camera.inputs.attached.pointers;
    mouse.buttons = [1];
  }

  private initGround() {
    const ground = Babylon.Mesh.CreateGround('ground', 100, 20, 2);
    ground.material = new Babylon.StandardMaterial('material_ground', this.scene);
    ground.material.alpha = 0.5;

    ground.physicsImpostor = new Babylon.PhysicsImpostor(ground, Babylon.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, this._scene);
  }

  private initInputs() {
    const actionManager = this._scene.actionManager = new Babylon.ActionManager(this._scene);
    actionManager.registerAction(new Babylon.ExecuteCodeAction(Babylon.ActionManager.OnKeyDownTrigger, e => {
      this._key[e.sourceEvent.key] = e.sourceEvent.type == 'keydown';
    }));

    actionManager.registerAction(new Babylon.ExecuteCodeAction(Babylon.ActionManager.OnKeyUpTrigger, e => {
      this._key[e.sourceEvent.key] = e.sourceEvent.type == 'keydown';
    }));

    this._canvas.addEventListener('contextmenu', e => {
      e.preventDefault();
    })

    this._canvas.addEventListener('mousedown', e => {
      this.keydown['mouse'] = true;
      const pickResult = this.scene.pick(e.x, e.y);
      if (pickResult.hit) {
        this.player.target = pickResult.pickedPoint;
      }
    })

    this._canvas.addEventListener('mouseup', e => {
      this.keydown['mouse'] = false;
    })

    this._canvas.addEventListener('mousemove', e => {
      this.Input.mouse.x = e.x;
      this.Input.mouse.y = e.y;
    })
  }

  initSkybox() {
    const texture = new Babylon.CubeTexture('assets/textures/skybox/miramar', this.scene);
    const skybox = Babylon.MeshBuilder.CreateBox("skybox", {size:1000.0}, this.scene);
    const skyboxMaterial = new Babylon.StandardMaterial("skybox", this.scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = texture;
    skyboxMaterial.reflectionTexture.coordinatesMode = Babylon.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new Babylon.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new Babylon.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;
  }

  Input = {
    keydown: (key: string) => {
      return this.keydown[key];
    },
    mouse: { x: -1, y: -1 }
  }

  render() {
    this.scene.render();

    if (this.keydown['mouse']) {
      const pickResult = this.scene.pick(this.Input.mouse.x, this.Input.mouse.y);
      if (pickResult.hit) {
        this.player.target = pickResult.pickedPoint;
      }
    }

    this.camera.target = this.player.position;
    this.camera.radius = _.clamp(this.camera.radius, 10, 30);
    this.camera.radius
    const deltaTime = this.scene.getLastFrameDuration() / 1000;
    this.player.update(deltaTime);
  }

  start() {
    this.engine.runRenderLoop(() => this.render());
  }
}

class Entity {
  _mesh: Babylon.Mesh;
  private _forwardMesh: Babylon.Mesh;
  constructor(public name: string, protected game: Game) {
  };

  update(deltaTime: number) {
    if (Debug.forwardVector) {
      if (!this._forwardMesh) {
        this._forwardMesh = Babylon.Mesh.CreateLines(`${name}: forward`, [Vector3.Zero(), Vector3.Forward()],
          this.game.scene, false);
        this._forwardMesh.parent = this._mesh;
      }
    } else {
      this._forwardMesh = null;
    }
  }
}

class Player extends Entity {
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
  get mesh() { return this._mesh; }
  get target() { return this._target; }
  get position() { return this._mesh.position }

  constructor(game: Game) {
    super('player', game);
    this._mesh = Babylon.Mesh.CreateBox('player', 1, game.scene);
    this._mesh.position.y = 1;

    const playerMaterial = new Babylon.StandardMaterial('player', game.scene);
    playerMaterial.diffuseColor = Babylon.Color3.Green();
    this._mesh.material = playerMaterial;

    this.initTargetMesh();

    this.initPhysics();
  }


  update(deltaTime: number) {
    super.update(deltaTime);
    if (this.target) {
      const dx = this.target.x - this.position.x;
      const dz = this.target.z - this.position.z;

      const angle = dz > 0 ? Math.atan(dx / dz) : Math.atan(dx / dz) + Math.PI;

      this.mesh.rotationQuaternion = Babylon.Quaternion.RotationAxis(
        Babylon.Axis.Y, angle);

      if (Math.abs(dx) >= 0.1 || Math.abs(dz) >= 0.1)
        this.mesh.physicsImpostor.setLinearVelocity(new Vector3(dx, 0, dz).normalize().multiplyByFloats(this.speed, this.speed, this.speed));
      else {
        this.mesh.physicsImpostor.setLinearVelocity(Vector3.Zero());
        this.target = null;
      }
    }
  }

  // TODO: Make the particle system work!!!
  initTargetMesh() {
    this._targetMesh = Babylon.Mesh.CreateSphere('player_target', 10, 1, this.game.scene);

    this._targetMesh.visibility = 0;
    this._targetMesh.isPickable = false;

    const targetParticleSystem = new Babylon.ParticleSystem('player_target_particle', 200, this.game.scene);
    targetParticleSystem.color1 = new Color4(0.7, 0.8, 1, 1);
    targetParticleSystem.color2 = new Color4(0.2, 0.5, 1.0, 1.0);
    targetParticleSystem.minSize = 0.1;
    targetParticleSystem.maxSize = 0.3;
    targetParticleSystem.direction1 = new Vector3(-7, 8, 3);
    targetParticleSystem.direction1 = new Vector3(7, 8, -3);
    targetParticleSystem.targetStopDuration = 3;
    this._targetParticle = targetParticleSystem;
  }

  initPhysics() {
    this.mesh.physicsImpostor = new Babylon.PhysicsImpostor(this.mesh, Babylon.PhysicsImpostor.BoxImpostor, {
      mass: 10, restitution: 0.01, friction: 0
    }, this.game.scene);
    this.mesh.physicsImpostor.executeNativeFunction((world, body) => {
      body.fixedRotation = true;
      body.updateMassProperties();
    })
  }
}
