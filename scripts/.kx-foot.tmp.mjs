import { NodeIO } from '@gltf-transform/core';
const io = new NodeIO();
const [file, y0, y1] = process.argv.slice(2);
const doc = await io.read(file);
const pos = doc.getRoot().listMeshes()[0].listPrimitives()[0].getAttribute('POSITION').getArray();
const pts = []; for (let i = 0; i < pos.length; i += 3) if (pos[i + 1] >= +y0 && pos[i + 1] <= +y1) pts.push([pos[i], pos[i + 2]]);
// grid clusters 0.1
const cells = new Map(); for (const [x, z] of pts) { const k = Math.round(x * 10) + ',' + Math.round(z * 10); cells.set(k, (cells.get(k) ?? 0) + 1); }
const xs = pts.map(p => p[0]), zs = pts.map(p => p[1]);
console.log('n', pts.length, 'x', Math.min(...xs).toFixed(3), Math.max(...xs).toFixed(3), 'z', Math.min(...zs).toFixed(3), Math.max(...zs).toFixed(3));
// print occupancy map
const X0 = Math.round(Math.min(...xs) * 10), X1 = Math.round(Math.max(...xs) * 10), Z0 = Math.round(Math.min(...zs) * 10), Z1 = Math.round(Math.max(...zs) * 10);
for (let z = Z0; z <= Z1; z++) { let s = ''; for (let x = X0; x <= X1; x++) s += cells.has(x + ',' + z) ? '#' : '.'; console.log(String(z / 10).padStart(5), s); }
