import { action } from "@elgato/streamdeck";
import { MonitorAction, type MetricReading } from "../lib/monitor-action";
import { readMemoryUsagePercent } from "../lib/system-info";

@action({ UUID: "com.lazyadmin22.computer-monitor.memory-usage" })
export class MemoryUsageAction extends MonitorAction {
	protected readonly label = "RAM";
	protected readonly unit = "%";
	protected readonly defaultThreshold = 85;

	protected async readValue(): Promise<MetricReading> {
		const value = await readMemoryUsagePercent();
		return { value, display: String(value) };
	}
}
