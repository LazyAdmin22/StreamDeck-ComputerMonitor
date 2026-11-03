# Computer Monitor

[![Latest release](https://img.shields.io/github/v/release/LazyAdmin22/StreamDeck-ComputerMonitor?label=release)](https://github.com/LazyAdmin22/StreamDeck-ComputerMonitor/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/LazyAdmin22/StreamDeck-ComputerMonitor/total)](https://github.com/LazyAdmin22/StreamDeck-ComputerMonitor/releases)
[![License: MIT](https://img.shields.io/github/license/LazyAdmin22/StreamDeck-ComputerMonitor)](LICENSE)
![Platform](https://img.shields.io/badge/platform-Windows-0078D6)
![Stream Deck SDK](https://img.shields.io/badge/Stream%20Deck%20SDK-3-orange)
![Node](https://img.shields.io/badge/node-%3E%3D24-339933)

A Stream Deck plugin with six keys for monitoring your PC in real time: **CPU Usage**, **Memory Usage**, **Disk Usage**, **CPU Temperature**, **GPU Temperature**, and **Network Usage**.

## Features

- **Live readings** — every key refreshes roughly every 2 seconds.
- **Configurable warning threshold** — CPU/Memory/Disk/CPU Temp/GPU Temp keys each have a per-key threshold (set from the key's Property Inspector). The key turns **red** once the live value reaches the threshold, and **green** while it's below it.
- **Network Usage** — shows live ↓ receive / ↑ transmit speed for the default network interface. There's no "too high" for throughput, so this key has no threshold and stays neutral.
- **Graceful fallback** — if a sensor isn't available (most commonly GPU temperature, which depends on vendor/driver support), the key shows `N/A` instead of erroring or falsely flashing red.

## Requirements

- [Stream Deck](https://www.elgato.com/en/s/welcome-to-stream-deck) software 7.1+
- Windows 10+
- Node.js 24+ (only needed for building from source)

## Install

Grab the latest `.streamDeckPlugin` release and double-click it, or build from source:

```bash
npm install
node scripts/generate-placeholder-icons.mjs
npm run build
npx @elgato/cli link com.lazyadmin22.computer-monitor.sdPlugin
```

Then open the Stream Deck app, find the **Computer Monitor** category, and drag the actions you want onto your keys.

## Development

```bash
npm run watch
```

Rebuilds on save and restarts the plugin inside the Stream Deck app automatically.

```bash
npx @elgato/cli validate com.lazyadmin22.computer-monitor.sdPlugin
```

Validates the manifest/bundle against the Stream Deck SDK schema.

## How it works

CPU/Memory/Disk/CPU Temp/GPU Temp are small TypeScript classes (`src/actions/*.ts`) extending a shared `MonitorAction` base (`src/lib/monitor-action.ts`) that polls on an interval, tracks each key's threshold, and redraws the key via a generated SVG (`src/lib/key-image.ts`). Network Usage (`src/actions/network-usage.ts`) follows the same polling shape without the threshold logic, since throughput has no "too high". All sensor reads go through [`systeminformation`](https://systeminformation.io/) (`src/lib/system-info.ts`).

| Action | Default threshold | Sensor |
|---|---|---|
| CPU Usage | 85% | `si.currentLoad()` |
| Memory Usage | 85% | `si.mem()` |
| Disk Usage | 85% | `si.fsSize()` (system drive) |
| CPU Temperature | 80°C | `si.cpuTemperature()` |
| GPU Temperature | 85°C | `si.graphics()` |
| Network Usage | — | `si.networkStats()` |

Built with the [Elgato Stream Deck SDK](https://docs.elgato.com/sdk) (`@elgato/streamdeck`) and bundled with Rollup.

## Known limitations

GPU temperature support in `systeminformation` is vendor/driver-dependent and is commonly unavailable on Windows without additional vendor tooling. Showing `N/A` is the expected steady state on many systems, not a bug.
