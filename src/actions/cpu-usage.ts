import { action } from "@elgato/streamdeck";
import { MonitorAction, type MetricReading } from "../lib/monitor-action";
import { readCpuLoad } from "../lib/system-info";

@action({ UUID: "com.lazyadmin22.computer-monitor.cpu-usage" })
export class CpuUsageAction extends MonitorAction {
	protected readonly label = "CPU";
	protected readonly unit = "%";
	protected readonly defaultThreshold = 85;

	protected async readValue(): Promise<MetricReading> {
		const value = await readCpuLoad();
		return { value, display: String(value) };
	}
}
