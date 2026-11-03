import streamDeck from "@elgato/streamdeck";

import { CpuTempAction } from "./actions/cpu-temp";
import { CpuUsageAction } from "./actions/cpu-usage";
import { DiskUsageAction } from "./actions/disk-usage";
import { GpuTempAction } from "./actions/gpu-temp";
import { MemoryUsageAction } from "./actions/memory-usage";
import { NetworkUsageAction } from "./actions/network-usage";

streamDeck.logger.setLevel("info");

streamDeck.actions.registerAction(new CpuUsageAction());
streamDeck.actions.registerAction(new MemoryUsageAction());
streamDeck.actions.registerAction(new DiskUsageAction());
streamDeck.actions.registerAction(new CpuTempAction());
streamDeck.actions.registerAction(new GpuTempAction());
streamDeck.actions.registerAction(new NetworkUsageAction());

streamDeck.connect();
