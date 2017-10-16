import * as Babylon from 'babylonjs';
import { Game } from './game';

export class Textures {
  static SKYBOX = 'assets/textures/skybox/miramar';
  static FLARE = 'https://d33wubrfki0l68.cloudfront.net/2e1f167031edb2d710f5af42e795afe3203fb2bc/aee48/img/tutorials/particles/flare.png';
  static SMOKE = 'https://commons.wikimedia.org/wiki/File:Blender3D_CuttingThroughSteel_Smoke.jpg';
  static LASER = 'https://i.stack.imgur.com/3YvXH.png';
  static BEACH = 'http://2.bp.blogspot.com/-5-o_YvyOllY/UmpL75E48NI/AAAAAAAAEnQ/sIMpws_339g/s1600/Seamless+beach+sand.jpg';

  static Get(url: string, game: Game): Babylon.Texture {
      return new Babylon.Texture(url, game.scene);
  }

  static GetSkyBox(url: string, game: Game): Babylon.CubeTexture {
    return new Babylon.CubeTexture(url, game.scene);
  }
}
