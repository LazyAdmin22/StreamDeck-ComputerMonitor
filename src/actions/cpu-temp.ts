import { action } from "@elgato/streamdeck";
import { MonitorAction, type MetricReading } from "../lib/monitor-action";
import { readCpuTemperature } from "../lib/system-info";

@action({ UUID: "com.lazyadmin22.computer-monitor.cpu-temp" })
export class CpuTempAction extends MonitorAction {
	protected readonly label = "CPU";
	protected readonly unit = "°C";
	protected readonly defaultThreshold = 80;

	protected async readValue(): Promise<MetricReading> {
		const value = await readCpuTemperature();
		return value === null ? { value: null, display: "N/A" } : { value, display: String(value) };
	}
}
