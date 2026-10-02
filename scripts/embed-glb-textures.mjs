// Packs a glTF binary's external images (e.g. Kenney's shared Textures/colormap.png)
// into the GLB itself, so the standalone build can content-hash the model file alone.
//
//   node scripts/embed-glb-textures.mjs <in.glb> <out.glb>
import fs from 'node:fs';
import path from 'node:path';

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('usage: embed-glb-textures.mjs <in.glb> <out.glb>');
const glb = fs.readFileSync(input);
if (glb.readUInt32LE(0) !== 0x46546c67) throw new Error('not a GLB');
const jsonLen = glb.readUInt32LE(12);
const json = JSON.parse(glb.subarray(20, 20 + jsonLen).toString('utf8'));
let bin = Buffer.alloc(0);
const binAt = 20 + jsonLen;
if (binAt < glb.length) bin = glb.subarray(binAt + 8, binAt + 8 + glb.readUInt32LE(binAt));
const pad4 = (b, fill = 0) => (b.length % 4 ? Buffer.concat([b, Buffer.alloc(4 - (b.length % 4), fill)]) : b);
for (const image of json.images ?? []) {
  if (!image.uri || image.uri.startsWith('data:')) continue;
  const bytes = fs.readFileSync(path.join(path.dirname(input), decodeURI(image.uri)));
  bin = pad4(bin);
  json.bufferViews.push({ buffer: 0, byteOffset: bin.length, byteLength: bytes.length });
  bin = Buffer.concat([bin, bytes]);
  image.bufferView = json.bufferViews.length - 1;
  image.mimeType = image.uri.endsWith('.png') ? 'image/png' : 'image/jpeg';
  delete image.uri;
}
bin = pad4(bin);
json.buffers = [{ byteLength: bin.length }];
const jsonBuf = pad4(Buffer.from(JSON.stringify(json), 'utf8'), 0x20);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + jsonBuf.length + 8 + bin.length, 8);
const chunk = (type, data) => {
  const h = Buffer.alloc(8);
  h.writeUInt32LE(data.length, 0);
  h.writeUInt32LE(type, 4);
  return Buffer.concat([h, data]);
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, Buffer.concat([header, chunk(0x4e4f534a, jsonBuf), chunk(0x004e4942, bin)]));
console.log(`${output}: ${(fs.statSync(output).size / 1024).toFixed(1)} KB`);
