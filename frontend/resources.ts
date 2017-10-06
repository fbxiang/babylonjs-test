import * as Babylon from 'babylonjs';
import { Game } from './game';

export class Textures {
  static SKYBOX = 'assets/textures/skybox/miramar';
  static FLARE = 'assets/textures/flare.png';

  static Get(url: string, game: Game): Babylon.Texture {
      return new Babylon.Texture(url, game.scene);
  }

  static GetSkyBox(url: string, game: Game): Babylon.CubeTexture {
    return new Babylon.CubeTexture(url, game.scene);
  }
}
