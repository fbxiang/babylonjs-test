import * as Babylon from 'babylonjs';

const permutation = [151, 160, 137, 91, 90, 15,
  131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
  190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
  88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
  77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
  102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
  135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
  5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
  223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
  129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
  251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
  49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
  138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180]

function hash1(x, y) {
  return x * 101 + y * 97 + 2 + 173;
}

function grad(x: number, y: number) {
  let n = hash1(x, y);
  n = n % permutation.length;
  n = (n + permutation.length) % permutation.length;

  const angle = permutation[n] / 256.0 * 2 * Math.PI;
  return [Math.cos(angle), Math.sin(angle)];
}

function lerp(p1: number, p2: number, w: number) {
  return (1 - w) * p1 + w * p2;
}

function dotGradient(xi: number, yi: number, x: number, y: number, gradient: (x: number, y: number) => number[]) {
  const g = gradient(xi, yi);
  return (x - xi) * g[0] + (y - yi) * g[1];
}

export function perlin(x: number, y: number, gradient=grad, freq=1, amp = 1) {
  x *= freq;
  y *= freq;
  const x0 = Math.floor(x);
  const x1 = x0 + 1;
  const y0 = Math.floor(y);
  const y1 = y0 + 1;

  const dx = x - x0;
  const dy = y - y0;

  const g1 = dotGradient(x0, y0, x, y, gradient);
  const g2 = dotGradient(x1, y0, x, y, gradient);
  const g3 = dotGradient(x0, y1, x, y, gradient);
  const g4 = dotGradient(x1, y1, x, y, gradient);
  return amp * lerp(lerp(g1, g2, dx), lerp(g3, g4, dx), dy);
}


export function createGround (name, width, height, w_subdivisions, h_subdivisions, scene, updatable) {
  let ground = new Babylon.Mesh(name, scene);
  let positions = [];
  let normals = [];
  let uvs = [];
  let indices = [];

  let row, col, i=0;
  for (row = 0; row <= h_subdivisions; row++) {
    for (col = 0; col <= w_subdivisions; col++) {
      const x = col * width / w_subdivisions - width / 2.0;
      const z = row * height / h_subdivisions - height / 2.0;
      const y = perlin(x, z, grad, 0.03, 15);
      positions.push(x, y, z);
    }
  }

  for (row = 0; row < h_subdivisions; row++) {
    for (col = 0; col < w_subdivisions; col++) {
      indices.push(row * (w_subdivisions + 1) + col );
      indices.push(row * (w_subdivisions + 1) + col + 1);
      indices.push((row+1) * (w_subdivisions + 1) + col);

      indices.push(row * (w_subdivisions + 1) + col + 1 );
      indices.push((row+1) * (w_subdivisions + 1) + col + 1);
      indices.push((row+1) * (w_subdivisions + 1) + col);
    }
  }

  Babylon.VertexData.ComputeNormals(positions, indices, normals);

  let vertexData = new Babylon.VertexData();
  vertexData.positions = positions;
  vertexData.indices = indices;
  vertexData.normals = normals;
  vertexData.applyToMesh(ground);
  return ground;
};
