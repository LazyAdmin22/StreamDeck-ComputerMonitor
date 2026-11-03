export type KeyImageState = "normal" | "warning" | "unavailable";

export interface KeyImageOptions {
	label: string;
	valueText: string;
	unitText: string;
	state: KeyImageState;
}

const COLORS: Record<KeyImageState, { bg: string; fg: string }> = {
	normal: { bg: "#2E8B47", fg: "#FFFFFF" },
	warning: { bg: "#D83A3A", fg: "#FFFFFF" },
	unavailable: { bg: "#3A3A3A", fg: "#CCCCCC" }
};

function escapeXml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

export interface NetworkKeyImageOptions {
	rxText: string;
	txText: string;
}

const NETWORK_BG = "#1E1E1E";
const NETWORK_FG = "#FFFFFF";

/** Builds a 144x144 SVG key face showing receive/transmit speed; no threshold, so always neutral. */
export function buildNetworkKeyImage(opts: NetworkKeyImageOptions): string {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">
	<rect width="144" height="144" rx="18" fill="${NETWORK_BG}"/>
	<text x="72" y="58" font-family="Segoe UI, Arial, sans-serif" font-size="19" font-weight="700" fill="${NETWORK_FG}" text-anchor="middle">&#8595; ${escapeXml(opts.rxText)}</text>
	<text x="72" y="92" font-family="Segoe UI, Arial, sans-serif" font-size="19" font-weight="700" fill="${NETWORK_FG}" text-anchor="middle">&#8593; ${escapeXml(opts.txText)}</text>
	<text x="72" y="122" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="600" letter-spacing="1" fill="${NETWORK_FG}" text-anchor="middle" opacity="0.8">NETWORK</text>
</svg>`;
	return `data:image/svg+xml;base64,${Buffer.from(svg, "utf-8").toString("base64")}`;
}

/** Builds a 144x144 SVG key face and returns it as a data URI accepted by `action.setImage()`. */
export function buildKeyImage(opts: KeyImageOptions): string {
	const { bg, fg } = COLORS[opts.state];
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">
	<rect width="144" height="144" rx="18" fill="${bg}"/>
	<text x="72" y="62" font-family="Segoe UI, Arial, sans-serif" font-size="38" font-weight="700" fill="${fg}" text-anchor="middle">${escapeXml(opts.valueText)}</text>
	<text x="72" y="86" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="${fg}" text-anchor="middle" opacity="0.85">${escapeXml(opts.unitText)}</text>
	<text x="72" y="122" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="600" letter-spacing="1" fill="${fg}" text-anchor="middle" opacity="0.8">${escapeXml(opts.label.toUpperCase())}</text>
</svg>`;
	return `data:image/svg+xml;base64,${Buffer.from(svg, "utf-8").toString("base64")}`;
}
