import { action } from "@elgato/streamdeck";
import { MonitorAction, type MetricReading } from "../lib/monitor-action";
import { readGpuTemperature } from "../lib/system-info";

/**
 * GPU temperature support in `systeminformation` is vendor- and driver-dependent and is commonly
 * unavailable on Windows without additional tooling (e.g. vendor monitoring utilities). Showing
 * "N/A" is the expected steady state on many systems, not a bug.
 */
@action({ UUID: "com.lazyadmin22.computer-monitor.gpu-temp" })
export class GpuTempAction extends MonitorAction {
	protected readonly label = "GPU";
	protected readonly unit = "°C";
	protected readonly defaultThreshold = 85;

	protected async readValue(): Promise<MetricReading> {
		const value = await readGpuTemperature();
		return value === null ? { value: null, display: "N/A" } : { value, display: String(value) };
	}
}
