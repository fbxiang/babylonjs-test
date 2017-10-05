import { Vector3, Color4 } from 'babylonjs';
import * as Babylon from 'babylonjs';
import { Debug } from './debug';
import * as _ from 'lodash';
import { Textures } from './resources';
import { EntityPlayer } from './entity/entity-player';

Debug.forwardVector = true;

export class Game {
  _canvas: HTMLCanvasElement;
  _engine: Babylon.Engine;
  _scene: Babylon.Scene;
  _camera: Babylon.ArcRotateCamera;
  _light: Babylon.Light;
  _player: EntityPlayer;
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
    this._light = new Babylon.DirectionalLight('light_main', new Vector3(1, -1, 0), this._scene);
    this._player = new EntityPlayer(this);
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
    const ground = Babylon.Mesh.CreateGround('ground', 100, 20, 2, this.scene);
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
      const pickResult = this.scene.pick(e.x, e.y);
      switch (e.button) {
      case 0:
        this.keydown['mouseLeft'] = true;
        if (pickResult.hit) {
          this.player.move(pickResult.pickedPoint, pickResult.pickedMesh);
        }
        return;
      case 2:
        this.keydown['mouseRight'] = true;
        if (pickResult.hit) {
          this.player.activate(pickResult.pickedPoint, pickResult.pickedMesh);
        }
        return;
      }
    })

    this._canvas.addEventListener('mouseup', e => {
      switch (e.button) {
      case 0:
        this.keydown['mouseLeft'] = false;
        return;
      case 2:
        this.keydown['mouseRight'] = false;
        return;
      }
    })

    this._canvas.addEventListener('mousemove', e => {
      this.Input.mouse.x = e.x;
      this.Input.mouse.y = e.y;
    })
  }

  initSkybox() {
    const texture = new Babylon.CubeTexture(Textures.SKYBOX, this.scene);
    const skybox = Babylon.MeshBuilder.CreateBox("skybox", { size: 1000.0 }, this.scene);
    skybox.isPickable = false;
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

    if (this.keydown['mouseLeft']) {
      const pickResult = this.scene.pick(this.Input.mouse.x, this.Input.mouse.y);
      if (pickResult.hit) {
        this.player.move(pickResult.pickedPoint, pickResult.pickedMesh, false);
      }
    }

    this.camera.target = this.player.position;
    this.camera.radius = _.clamp(this.camera.radius, 10, 100);
    this.camera.radius
    const deltaTime = this.scene.getLastFrameDuration() / 1000;
    this.player.update(deltaTime);
  }

  start() {
    this.engine.runRenderLoop(() => this.render());
  }
}

