import { Vector3, Color4 } from 'babylonjs';
import * as Babylon from 'babylonjs';
import { Debug } from './debug';
import * as _ from 'lodash';
import { Textures } from './resources';
import { EntityPlayer } from './entity/entity-player';
import { EntityBase } from './entity/entity';
import { EntityDebug } from './entity/entity-debug';

import { createGround } from './terrain-gen';
import 'babylonjs-materials';
import 'babylonjs-procedural-textures';

import * as tree from './tree-gen';

Debug.forwardVector = true;

export class Game {
  _canvas: HTMLCanvasElement;
  _engine: Babylon.Engine;
  _scene: Babylon.Scene;
  _light: Babylon.IShadowLight;
  _shadow: Babylon.ShadowGenerator;
  _player: EntityPlayer;
  _keydown = {};
  keypress = {};
  _entities: Set<EntityBase> = new Set();

  get keydown() { return this._keydown; }
  get scene() { return this._scene; }
  get engine() { return this._engine; }
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
    this.initLight();
    this._player = new EntityPlayer(this);
    this.spawn(this._player);
    this.initInputs();
    this.initSkybox();
    this.initLevel();
    window.addEventListener('resize', () => this.engine.resize());
  }

  private initScene() {
    this._scene = new Babylon.Scene(this._engine);
    const gravity = new Vector3(0, -9.81, 0);
    this._scene.enablePhysics(gravity, new Babylon.CannonJSPlugin());
  }

  private initLight() {
    this._light = new Babylon.DirectionalLight('light_main', new Vector3(-1, -2, -1), this._scene);
    this._light.position = new Vector3(100, 200, 100);
    this._shadow = new Babylon.ShadowGenerator(1024, this._light);
    this._shadow.getShadowMap().refreshRate = 1;
    this._shadow.setTransparencyShadow(true);
    this._shadow.useBlurVarianceShadowMap = true;
    this._shadow.blurBoxOffset = 1.0;
    this._shadow.blurScale = 1.0;
    this._shadow.bias = 0.01;
  }

  private initLevel() {
    const ground = createGround('ground', 400, 400, 40, 40, this.scene, true);
    ground.receiveShadows = true;
    const texture = Textures.Get(Textures.BEACH, this);
    const material = new Babylon.StandardMaterial('material_ground', this.scene);
    material.specularColor = Babylon.Color3.Black();
    material.diffuseTexture = texture;
    ground.material = material;
    ground.physicsImpostor = new Babylon.PhysicsImpostor(ground, Babylon.PhysicsImpostor.HeightmapImpostor, {
      mass: 0, restitution: 0
    }, this._scene);
    ground.convertToFlatShadedMesh();

    const targetEntity = new EntityDebug('debug1', this);
    this.spawn(targetEntity);
    targetEntity.position = new Vector3(-6, 2, 0);

    // tree.makeBasicTree('tree', 10, this.scene);
    tree.makeSingleGrass('grass', 4, this.scene);
  }

  private initInputs() {
    const actionManager = this._scene.actionManager = new Babylon.ActionManager(this._scene);
    actionManager.registerAction(new Babylon.ExecuteCodeAction(Babylon.ActionManager.OnKeyDownTrigger, e => {
      this._keydown[e.sourceEvent.key] = e.sourceEvent.type == 'keydown';
      this.keypress[e.sourceEvent.key] = e.sourceEvent.type == 'keydown';
    }));

    actionManager.registerAction(new Babylon.ExecuteCodeAction(Babylon.ActionManager.OnKeyUpTrigger, e => {
      this._keydown[e.sourceEvent.key] = e.sourceEvent.type == 'keydown';
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
      this.Input.mouse.dx += e.movementX;
      this.Input.mouse.dy += e.movementY;
    })
  }

  initSkybox() {
    const texture = Textures.GetSkyBox(Textures.SKYBOX, this);
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
    keypress: (key: string) => {
      const value = this.keypress[key];
      return value;
    },
    mouse: { x: -1, y: -1, dx: 0, dy: 0 }
  }

  spawn(entity: EntityBase) {
    this._entities.add(entity);
  }

  render() {
    this.scene.render();

    if (this.keydown['mouseLeft']) {
      const pickResult = this.scene.pick(this.Input.mouse.x, this.Input.mouse.y);
      if (pickResult.hit) {
        this.player.move(pickResult.pickedPoint, pickResult.pickedMesh, false);
      }
    }

    const deltaTime = this.scene.getLastFrameDuration() / 100;

    const destroyList: EntityBase[] = [];
    this._entities.forEach(entity => {
      entity.update(deltaTime);
      if (entity.destroying) {
        destroyList.push(entity);
      }
    })
    destroyList.forEach(entity => {
      entity.destroy()
      this._entities.delete(entity);
    })
    this.Input.mouse.dx = 0;
    this.Input.mouse.dy = 0;
    this.keypress = {};
  }

  start() {
    this.engine.runRenderLoop(() => this.render());
  }
}
