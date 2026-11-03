import streamDeck, { SingletonAction } from "@elgato/streamdeck";
import type { DidReceiveSettingsEvent, KeyAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
import { buildKeyImage, type KeyImageState } from "./key-image";

const POLL_INTERVAL_MS = 2000;

export interface MonitorSettings extends JsonObject {
	threshold?: number;
}

export interface MetricReading {
	/** Numeric value, or `null` when the sensor is unavailable on this system. */
	value: number | null;
	/** Pre-formatted display text, e.g. "47" or "N/A". */
	display: string;
}

interface InstanceState {
	timer?: ReturnType<typeof setInterval>;
	threshold: number;
	busy: boolean;
}

/**
 * Shared base for every metric key: polls `readValue()` on an interval, renders the result via
 * `buildKeyImage()`, and turns the key red once the value reaches the (per-instance,
 * user-configurable) threshold. Per-instance timers/thresholds are keyed by `action.id` so two
 * visible keys of the same action type (e.g. two CPU Usage keys with different thresholds) are
 * tracked independently.
 */
export abstract class MonitorAction<T extends MonitorSettings = MonitorSettings> extends SingletonAction<T> {
	protected abstract readonly label: string;
	protected abstract readonly unit: string;
	protected abstract readonly defaultThreshold: number;
	protected abstract readValue(): Promise<MetricReading>;

	readonly #instances = new Map<string, InstanceState>();

	override async onWillAppear(ev: WillAppearEvent<T>): Promise<void> {
		if (!ev.action.isKey()) {
			return;
		}
		const action = ev.action;
		const id = action.id;
		const settings = ev.payload.settings;
		const threshold = settings.threshold ?? this.defaultThreshold;

		if (settings.threshold === undefined) {
			// Persist the default so the Property Inspector has a value to show immediately.
			await action.setSettings({ ...settings, threshold: this.defaultThreshold } as T);
		}

		this.#clear(id);
		const state: InstanceState = { threshold, busy: false };
		this.#instances.set(id, state);

		await this.#tick(action, id);
		state.timer = setInterval(() => void this.#tick(action, id), POLL_INTERVAL_MS);
	}

	override onWillDisappear(ev: WillDisappearEvent<T>): void {
		this.#clear(ev.action.id);
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<T>): Promise<void> {
		if (!ev.action.isKey()) {
			return;
		}
		const id = ev.action.id;
		const existing = this.#instances.get(id);
		if (!existing) {
			return;
		}
		existing.threshold = ev.payload.settings.threshold ?? this.defaultThreshold;
		// Re-render immediately so a threshold change is reflected without waiting for the next poll.
		await this.#tick(ev.action, id);
	}

	#clear(id: string): void {
		const existing = this.#instances.get(id);
		if (existing?.timer) {
			clearInterval(existing.timer);
		}
		this.#instances.delete(id);
	}

	async #tick(action: KeyAction<T>, id: string): Promise<void> {
		const state = this.#instances.get(id);
		if (!state || state.busy) {
			// Guards against overlapping polls if a sensor read takes longer than the interval.
			return;
		}
		state.busy = true;
		try {
			const reading = await this.readValue();

			let imageState: KeyImageState;
			if (reading.value === null) {
				imageState = "unavailable";
			} else if (reading.value >= state.threshold) {
				imageState = "warning";
			} else {
				imageState = "normal";
			}

			const image = buildKeyImage({
				label: this.label,
				valueText: reading.display,
				unitText: reading.value === null ? "" : this.unit,
				state: imageState
			});
			await action.setImage(image);
		} catch (err) {
			streamDeck.logger.error(`[${this.label}] poll failed: ${String(err)}`);
			try {
				await action.setImage(
					buildKeyImage({ label: this.label, valueText: "N/A", unitText: "", state: "unavailable" })
				);
			} catch {
				/* ignore secondary failure */
			}
		} finally {
			state.busy = false;
		}
	}
}
