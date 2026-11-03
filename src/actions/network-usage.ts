import streamDeck, { action, SingletonAction } from "@elgato/streamdeck";
import type { KeyAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
import { buildNetworkKeyImage } from "../lib/key-image";
import { formatSpeed, readNetworkSpeeds } from "../lib/system-info";

const POLL_INTERVAL_MS = 2000;

interface InstanceState {
	timer?: ReturnType<typeof setInterval>;
	busy: boolean;
}

/**
 * Shows live receive/transmit speed for the default network interface. Unlike the other metric
 * actions, there's no meaningful "too high" for network throughput, so this has no threshold and
 * always renders with a neutral background.
 */
@action({ UUID: "com.lazyadmin22.computer-monitor.network-usage" })
export class NetworkUsageAction extends SingletonAction<JsonObject> {
	readonly #instances = new Map<string, InstanceState>();

	override async onWillAppear(ev: WillAppearEvent<JsonObject>): Promise<void> {
		if (!ev.action.isKey()) {
			return;
		}
		const action = ev.action;
		const id = action.id;

		this.#clear(id);
		this.#instances.set(id, { busy: false });

		await this.#tick(action, id);
		const state = this.#instances.get(id);
		if (state) {
			state.timer = setInterval(() => void this.#tick(action, id), POLL_INTERVAL_MS);
		}
	}

	override onWillDisappear(ev: WillDisappearEvent<JsonObject>): void {
		this.#clear(ev.action.id);
	}

	#clear(id: string): void {
		const existing = this.#instances.get(id);
		if (existing?.timer) {
			clearInterval(existing.timer);
		}
		this.#instances.delete(id);
	}

	async #tick(action: KeyAction<JsonObject>, id: string): Promise<void> {
		const state = this.#instances.get(id);
		if (!state || state.busy) {
			return;
		}
		state.busy = true;
		try {
			const speeds = await readNetworkSpeeds();
			const image = buildNetworkKeyImage({
				rxText: speeds ? formatSpeed(speeds.rx) : "N/A",
				txText: speeds ? formatSpeed(speeds.tx) : "N/A"
			});
			await action.setImage(image);
		} catch (err) {
			streamDeck.logger.error(`[Network] poll failed: ${String(err)}`);
			try {
				await action.setImage(buildNetworkKeyImage({ rxText: "N/A", txText: "N/A" }));
			} catch {
				/* ignore secondary failure */
			}
		} finally {
			state.busy = false;
		}
	}
}
