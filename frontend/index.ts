import './style.css';
import * as Babylon from 'babylonjs';
import { Game } from './game';

const canvas = <HTMLCanvasElement>document.getElementById('render_canvas');

const game = new Game(canvas);
game.start();



// Babylon.Mesh.CreateSphere('shpere', 16, 2).position.y += 1;

