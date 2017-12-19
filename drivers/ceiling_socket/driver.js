'use strict';

const Homey = require('homey');

class ZensehomeCeilingSocketDriver extends Homey.Driver {
    onInit() {
    }

    onPair(socket) {
        console.info("Pair started");

        let state = {
            bridge: undefined
        };

        socket.on('select_bridge', function (data, callback) {
            let result = [];
            let bridges = Homey.app.getBridges();
            bridges.forEach(function (bridge) {
                result.push({
                    id: bridge.device_id,
                    name: bridge.getName(),
                    icon: bridge.icon
                })
            }, this);

            callback(null, result);
        });

        socket.on('bridge_selected', function (data, callback) {
            state.bridge = Homey.app.getBridge(data.bridge_id);
            console.log(`Bridge selected: ${state.bridge}`);
        });


        socket.on('list_devices', function (data, callback) {
            console.log('List devices started...');
            state.bridge.getConnectedDevices().then((devices) => {
                console.log(devices);
       
                callback(null, devices);
            });

        })
    }
}

module.exports = ZensehomeCeilingSocketDriver;