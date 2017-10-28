import * as BABYLON from 'babylonjs';
import { Vector3 } from 'babylonjs';
import { TreeBuilder, Sampling } from './generator/space-colonization';

const canvas = <HTMLCanvasElement>document.getElementById('test');
console.log(canvas);

const engine = new BABYLON.Engine(canvas);
const createScene = function () {
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    // This creates and positions a free camera (non-mesh)
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);

    // This targets the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    // Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
    var ground = BABYLON.Mesh.CreateGround("ground1", 6, 6, 2, scene);

    return scene;
};
const scene = createScene();

const builder = new TreeBuilder()
  .killDistance(0.5)
  .stepLength(0.3)
  .influenceRadius(10)
  .startPoint(Vector3.Zero())
  .attractionPoints(Sampling.UniformCube(1000, 5, new Vector3(0, 5, 0)))
// .attractionPoints(Sampling.UniformSphere(1000, 2.5, new Vector3(0, 5, 0)))


builder.build().build(scene);

// builder.visualize(scene);

engine.runRenderLoop(() => {
  scene.render();
})

