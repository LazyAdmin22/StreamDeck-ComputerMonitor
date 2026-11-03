import si from "systeminformation";

export async function readCpuLoad(): Promise<number> {
	const load = await si.currentLoad();
	return Math.round(load.currentLoad);
}

export async function readMemoryUsagePercent(): Promise<number> {
	const mem = await si.mem();
	// `available` already accounts for reclaimable cache/buffers, matching
	// Task Manager-style "in use" more closely than raw `used`.
	const used = mem.total - mem.available;
	return Math.round((used / mem.total) * 100);
}

export async function readSystemDiskUsagePercent(): Promise<number | null> {
	const disks = await si.fsSize();
	if (!disks.length) {
		return null;
	}

	const normalize = (mount: string) => mount.replace(/\\$/, "").toLowerCase();
	const systemDisk =
		disks.find((disk) => normalize(disk.mount) === "c:") ??
		disks.slice().sort((a, b) => b.size - a.size)[0];

	if (!systemDisk || !systemDisk.size) {
		return null;
	}

	const usePercent = systemDisk.use ?? (systemDisk.used / systemDisk.size) * 100;
	return Math.round(usePercent);
}

export async function readCpuTemperature(): Promise<number | null> {
	const temp = await si.cpuTemperature();
	if (temp.main === null || temp.main === undefined || temp.main < 0) {
		return null;
	}
	return Math.round(temp.main);
}

export async function readGpuTemperature(): Promise<number | null> {
	const graphics = await si.graphics();
	const controller = graphics.controllers.find(
		(c) => typeof c.temperatureGpu === "number" && c.temperatureGpu > 0
	);
	return controller ? Math.round(controller.temperatureGpu as number) : null;
}

export interface NetworkSpeeds {
	/** Bytes per second received. */
	rx: number;
	/** Bytes per second transmitted. */
	tx: number;
}

export async function readNetworkSpeeds(): Promise<NetworkSpeeds | null> {
	const iface = await si.networkInterfaceDefault();
	if (!iface) {
		return null;
	}
	const [stat] = await si.networkStats(iface);
	if (!stat || typeof stat.rx_sec !== "number" || typeof stat.tx_sec !== "number") {
		// `rx_sec`/`tx_sec` are only computed from the second sample onward.
		return null;
	}
	return { rx: Math.max(0, stat.rx_sec), tx: Math.max(0, stat.tx_sec) };
}

/** Formats a bytes/sec rate as a short human-readable speed, e.g. "340 KB/s" or "1.2 MB/s". */
export function formatSpeed(bytesPerSec: number): string {
	if (!Number.isFinite(bytesPerSec) || bytesPerSec < 0) {
		return "N/A";
	}
	const kb = bytesPerSec / 1024;
	if (kb < 1) {
		return "0 KB/s";
	}
	if (kb < 1024) {
		return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB/s`;
	}
	return `${(kb / 1024).toFixed(1)} MB/s`;
}
