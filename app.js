'use strict';

const Homey = require('homey');
const events = require('events');

const eventEmitter = new events.EventEmitter();

class MyApp extends Homey.App {

	onInit() {
		console.log(`${Homey.manifest.id} initializing...`);

		this._bridges = [];
	}

	addBridge(bridge) {
		bridge.icon = `/app/bridge/assets/icon.svg`;
		this._bridges.push(bridge);
		console.log(`added ${bridge.device_id}`);

		eventEmitter.emit('bridgeAdded', bridge);
	}

	getBridge(bridgeId) {
		var foundBridge = this._bridges.find(x => x.device_id === bridgeId);
		if (foundBridge) {
			console.log(`Found bridge with id ${foundBridge.device_id}`)
		} else {
			console.log(`Could not find bridge with id ${bridgeId}`)
		}
		return foundBridge;
	}

	getBridges() {
		return this._bridges;
	}

}

module.exports = MyApp;