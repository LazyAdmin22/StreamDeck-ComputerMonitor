// Generates PLACEHOLDER icon assets for the plugin using only Node's built-in `zlib` module
// (no image library dependency). Run once after `npm install`; re-run any time an icon file is
// missing. Replace these flat placeholders with real artwork before publishing to the Marketplace.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SD_PLUGIN = path.join(__dirname, "..", "com.lazyadmin22.computer-monitor.sdPlugin");

const CRC_TABLE = (() => {
	const table = new Uint32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) {
			c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		}
		table[n] = c;
	}
	return table;
})();

function crc32(buf) {
	let c = 0xffffffff;
	for (let i = 0; i < buf.length; i++) {
		c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
	}
	return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
	const typeBuf = Buffer.from(type, "ascii");
	const len = Buffer.alloc(4);
	len.writeUInt32BE(data.length, 0);
	const crcBuf = Buffer.alloc(4);
	crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
	return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/** Writes an 8-bit RGBA PNG to `filePath` from a width*height*4 pixel buffer. */
function writePng(filePath, width, height, rgba) {
	const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(width, 0);
	ihdr.writeUInt32BE(height, 4);
	ihdr[8] = 8; // bit depth
	ihdr[9] = 6; // color type: RGBA
	ihdr[10] = 0; // compression method
	ihdr[11] = 0; // filter method
	ihdr[12] = 0; // interlace method

	const stride = width * 4;
	const raw = Buffer.alloc((stride + 1) * height);
	for (let y = 0; y < height; y++) {
		raw[y * (stride + 1)] = 0; // per-row filter type: none
		rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
	}
	const idat = zlib.deflateSync(raw);

	const png = Buffer.concat([signature, pngChunk("IHDR", ihdr), pngChunk("IDAT", idat), pngChunk("IEND", Buffer.alloc(0))]);

	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, png);
}

function makeSolid(width, height, [r, g, b, a]) {
	const buf = Buffer.alloc(width * height * 4);
	for (let i = 0; i < width * height; i++) {
		buf[i * 4] = r;
		buf[i * 4 + 1] = g;
		buf[i * 4 + 2] = b;
		buf[i * 4 + 3] = a;
	}
	return buf;
}

/** Simple filled circle, for white-on-transparent monochrome action icons. */
function makeCircle(width, height, fg, bg) {
	const buf = Buffer.alloc(width * height * 4);
	const cx = width / 2;
	const cy = height / 2;
	const r = (Math.min(width, height) / 2) * 0.8;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const dx = x + 0.5 - cx;
			const dy = y + 0.5 - cy;
			const color = dx * dx + dy * dy <= r * r ? fg : bg;
			const idx = (y * width + x) * 4;
			buf[idx] = color[0];
			buf[idx + 1] = color[1];
			buf[idx + 2] = color[2];
			buf[idx + 3] = color[3];
		}
	}
	return buf;
}

/** Simple desktop-monitor glyph (screen + neck + base) for the plugin's category/marketplace icons. */
function makeMonitorIcon(width, height, fg, bg) {
	const buf = Buffer.alloc(width * height * 4);
	for (let i = 0; i < width * height; i++) {
		buf[i * 4] = bg[0];
		buf[i * 4 + 1] = bg[1];
		buf[i * 4 + 2] = bg[2];
		buf[i * 4 + 3] = bg[3];
	}

	const fillRect = (x0, y0, x1, y1) => {
		const xa = Math.round(x0);
		const xb = Math.round(x1);
		const ya = Math.round(y0);
		const yb = Math.round(y1);
		for (let y = Math.max(0, ya); y < Math.min(height, yb); y++) {
			for (let x = Math.max(0, xa); x < Math.min(width, xb); x++) {
				const idx = (y * width + x) * 4;
				buf[idx] = fg[0];
				buf[idx + 1] = fg[1];
				buf[idx + 2] = fg[2];
				buf[idx + 3] = fg[3];
			}
		}
	};

	fillRect(width * 0.12, height * 0.1, width * 0.88, height * 0.62); // screen
	fillRect(width * 0.42, height * 0.62, width * 0.58, height * 0.74); // neck
	fillRect(width * 0.22, height * 0.74, width * 0.78, height * 0.84); // base

	return buf;
}

const WHITE = [255, 255, 255, 255];
const TRANSPARENT = [0, 0, 0, 0];
const BRAND = [0x2d, 0x8c, 0xff, 255];
const KEY_GRAY = [0x2a, 0x2a, 0x2a, 255];

function sdPath(...parts) {
	return path.join(SD_PLUGIN, ...parts);
}

writePng(sdPath("imgs", "plugin-icon.png"), 256, 256, makeMonitorIcon(256, 256, WHITE, BRAND));
writePng(sdPath("imgs", "plugin-icon@2x.png"), 512, 512, makeMonitorIcon(512, 512, WHITE, BRAND));
writePng(sdPath("imgs", "category-icon.png"), 28, 28, makeMonitorIcon(28, 28, WHITE, TRANSPARENT));
writePng(sdPath("imgs", "category-icon@2x.png"), 56, 56, makeMonitorIcon(56, 56, WHITE, TRANSPARENT));

const actionSlugs = ["cpu-usage", "memory-usage", "disk-usage", "cpu-temp", "gpu-temp", "network-usage"];
for (const slug of actionSlugs) {
	writePng(sdPath("imgs", "actions", slug, "icon.png"), 20, 20, makeCircle(20, 20, WHITE, TRANSPARENT));
	writePng(sdPath("imgs", "actions", slug, "icon@2x.png"), 40, 40, makeCircle(40, 40, WHITE, TRANSPARENT));
	writePng(sdPath("imgs", "actions", slug, "key.png"), 72, 72, makeSolid(72, 72, KEY_GRAY));
	writePng(sdPath("imgs", "actions", slug, "key@2x.png"), 144, 144, makeSolid(144, 144, KEY_GRAY));
}

console.log("Generated PLACEHOLDER icons under imgs/. Replace these with real artwork before publishing to the Marketplace.");
