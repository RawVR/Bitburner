/** @param {NS} ns */
export async function main(ns) {
	const args = ns.flags([["help", false]]);
	if (args.help || args._.length < 2) {
		ns.tprint("This script deploys a script on all available servers with as many threads as possible.");
		ns.tprint(`Usage: run ${ns.getScriptName()} DEEP_LEVEL SCRIPT SCRIPT_ARGS `);
		ns.tprint("Example:");
		ns.tprint(`> run ${ns.getScriptName()} 3 hackMoney.js n00dles`);
		return;
	}
	const deep_level = args._[0];
	const script = args._[1];
	const script_args = args._.slice(2);
	
	let serversWithAccessRoot = [];

	if (!ns.ls(ns.getHostname()).find(f => f === script)) {
		ns.tprint(`Script '${script}' does not exist.`);
		return;
	}

	for (let inx = 0; inx < deep_level; inx++) { // This for loop searches for all servers with root access.
		let current_deep_servers = [];
		if (inx == 0) {
			let servers = ns.scan(ns.getHostname());
			serversWithAccessRoot.push(getRootedServers(servers));
		} else {
			let servers = serversWithAccessRoot[inx - 1];
			servers.forEach(hostname => { // This foreach loop scans the servers of the current depth.
				let subServers = ns.scan(hostname);
				subServers.splice(hostname, 1); // Important to remove the parent server or we will generate an infinite loop!
				if (subServers.length > 0) {
					subServers.forEach(hostname => {
						current_deep_servers.push(hostname);
					});
				}
			});
			serversWithAccessRoot.push(getRootedServers(current_deep_servers));
		}
	}

	ns.tprint(`Deploying the script on the available servers...`);
	let servers_deployed = 0;
	let current_server = 0;
	let servers_count = 0;
	for (let inx = 0; inx < serversWithAccessRoot.length; inx++) { // This for loop counts all servers with root access to the array serversWithAccessRoot.
		servers_count += serversWithAccessRoot[inx].length;
	}
	serversWithAccessRoot.forEach(servers => { // This forEach loop goes layer by layer of the server depths (n00dles is deep 1, CSEC is deep 2).
		servers.forEach(hostname => { // This forEach loop installs the script on each server with the maximum possible number of threads.
			current_server++;
			const threads = Math.floor((ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname)) / ns.getScriptRam(script)); // The number of threads the server can run for the script.
			if (threads > 0) {
				if (threads == 1) {
					ns.tprint(`[${current_server}/${servers_count}] ${hostname}: One thread.`); // [1/x] n00dles: one thread.
				} else {
					ns.tprint(`[${current_server}/${servers_count}] ${hostname}: ${threads} threads.`); // [2/x] foodnstuff: 6 threads.
				}
				ns.scp(script, hostname, ns.getHostname());
				ns.exec(script, hostname, threads, ...script_args);
				servers_deployed++;
			} else { // If the server does not have memory to execute the script...
				ns.tprint(`[${current_server}/${servers_count}] ${hostname}: Not enough RAM available!`);
			}
		});
	});
	if (servers_deployed > 0) {
		ns.tprint(`Script successfully deployed in ${servers_deployed} servers.`);
	} else {
		ns.tprint(`Script could not be deployed on any server!`);
	}

	// This function checks from a list given by arguments which servers have root access and returns them.
	function getRootedServers(servers) {
		let nukedServers = []
		servers.forEach(hostname => {
			if (ns.hasRootAccess(hostname) == true) {
				nukedServers.push(hostname);
			}
		})
		return nukedServers;
	}
}
