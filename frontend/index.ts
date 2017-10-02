import './style.css';
import * as Cannon from 'cannon';
import * as Babylon from 'babylonjs';
import { Game } from './game';

// Babylon is ridiculous sometimes
window.CANNON = Cannon;

const canvas = <HTMLCanvasElement>document.getElementById('render_canvas');
const game = new Game(canvas);
game.start();
