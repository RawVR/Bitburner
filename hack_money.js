/** @param {NS} ns */
export async function main(ns) {
	const args = ns.flags([['help', false]]);
	const hostname = args._.join("");
	const securityThresh = ns.getServerMinSecurityLevel(hostname) + 5;
	let moneyThresh = ns.getServerMaxMoney(hostname) * 0.75;

	if (args.help || !hostname) {
		ns.tprint("This script hacks and collects money from the target server.");
		ns.tprint(`Usage: run ${ns.getScriptName()} SERVER_NAME`);
		ns.tprint("Example:");
		ns.tprint(`> run ${ns.getScriptName()} n00dles`);
		return;
	}

	while (true) {
		if (ns.getServerSecurityLevel(hostname) >= securityThresh) {
			await ns.weaken(hostname);
		} else if (ns.getServerMoneyAvailable(hostname) <= moneyThresh) {
			await ns.grow(hostname);
		} else {
			await ns.hack(hostname);
		}
	}
}
