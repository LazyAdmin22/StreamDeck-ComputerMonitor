import { action } from "@elgato/streamdeck";
import { MonitorAction, type MetricReading } from "../lib/monitor-action";
import { readSystemDiskUsagePercent } from "../lib/system-info";

@action({ UUID: "com.lazyadmin22.computer-monitor.disk-usage" })
export class DiskUsageAction extends MonitorAction {
	protected readonly label = "DISK";
	protected readonly unit = "%";
	protected readonly defaultThreshold = 85;

	protected async readValue(): Promise<MetricReading> {
		const value = await readSystemDiskUsagePercent();
		return value === null ? { value: null, display: "N/A" } : { value, display: String(value) };
	}
}
