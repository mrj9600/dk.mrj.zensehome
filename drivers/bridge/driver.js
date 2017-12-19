'use strict';

const Homey = require('homey');
const net = require("net");


class ZensehomeBridgeDriver extends Homey.Driver {
    onInit() {
        console.info("ZensehomeBridgeDriver initializing");
        this.clientResponses = [];
        this.clients = [];
    }

    onPair(socket) {
        console.info("Pair started");

        socket.on('configure_bridge', function (device_data, callback) {
            let result = [];
            console.info("Configuring bridge");
            this.connectDevice(device_data.data.id, device_data.settings, function (client) {
                if (client) {
                    client.destroy();
                    this.clientOffline(device_data.data.id);
                    callback(null, device_data);
                } else {
                    callback('Connection could not be established', device_data);
                }
            }.bind(this), null, null);
        }.bind(this));
    }

    connectDevice(device_id, device_settings, callback) {
        var connClient = new net.Socket();

        var timeout = setTimeout(function () {
            console.error(`${device_id}: connectDevice - timeout`)
            connClient.destroy();
            callback(null);
        }.bind(this), 5000);

        connClient.on('error', function (err) {
            console.log(`${device_id}: Client error received ${err}`);
            this.clientOffline(device_id);
        }.bind(this));

        connClient.on('data', function (data) {
            this.appendClientResponse(device_id, data);
        }.bind(this));

        var bridge_id = device_settings.bridge_id;
        connClient.connect(device_settings.tcp_port, device_settings.host, function () {
            console.log(`${device_id}: Connected on tcp level`);
            var client = connClient;
            clearTimeout(timeout);

            this.requestData(device_id, connClient, 'Login ' + bridge_id, function (data) {
                if (data.indexOf('>>Login Ok<<', 0) === 0) {
                    console.log(`${device_id}: connectDevice - connected`);
                    this.clientOnline(device_id, client);
                    callback(client);
                } else {
                    console.error(`${device_id}: Did not receive expected result`);
                    callback(null);
                }
            }.bind(this));
        }.bind(this));
    }

    healthCheckDevice(device) {
        var device_id = device.device_id;
        if (this.clients[device_id] === undefined) {
            console.log(`${device_id}: healthCheckDevice not already connected`)
            this.connectDevice(device_id, device.getSettings(), function(client) {});
        } else {
            this.requestData(device_id, this.clients[device_id], 'Version', function (data) {
                console.log(`${device_id}: Received: ${data}`);
            }.bind(this));
        }
    }

    resetClientResponse(device_id) {
        this.clientResponses[device_id] = '';
    }

    appendClientResponse(device_id, data) {
        this.clientResponses[device_id] += data;
        if (this.clientResponses[device_id].indexOf('<<', 0) > 0) {
            this.emit(`data-response-${device_id}`, this.clientResponses[device_id]);

            this.clientResponses[device_id] = '';
        }
    }

    requestData(device_id, client, request, callback) {
        var timeout = setTimeout(function () {
            console.error(`${device_id}: requestData - timeout`)
            this.clientOffline(device_id);
        }.bind(this), 5000);

        this.once(`data-response-${device_id}`, function (data) {
            clearTimeout(timeout);
            callback(data);
        }.bind(this));

        this.resetClientResponse(device_id);
        console.log(`${device_id}: Sending request: ${request}`);
        client.write(`>>${request}<<`);
    }

    clientOffline(device_id) {
        if (this.clients[device_id]) {
            this.clients[device_id].destroy();
            this.clients[device_id] = undefined;
        }

        var device = Homey.app.getBridge(device_id);
        if (device) {
            device.onOffline();
        }
    }

    clientOnline(device_id, client) {
        this.clients[device_id] = client;

        var device = Homey.app.getBridge(device_id);
        if (device) {
            device.onOnline();
        }
    }

    /**
     * Query which devices are connected via the bridge with device_id
     * @param {*} device_id 
     */
    getConnectedDevices(device_id) {
        var devices = [];

        return new Promise((resolve, reject) => {
            var online = (this.clients[device_id] !== undefined);
            console.log("Will query all devices if online: " + online);
            if (online) {

                this.requestData(device_id, this.clients[device_id], 'Get Devices', function (response) {
                    console.log('Response: ' + response);

                    var deviceIds = response.substring(14, response.length-4);
                    console.log(`deviceIds: ${deviceIds}`);
                    var deviceIdArr = deviceIds.split(',');
                    deviceIdArr.forEach(function(deviceId) {
                        devices.push(deviceId.trim());
                    });

                    resolve(devices);
                }.bind(this));


                /*
                var foundDevice = {
                    name: device.label,
                    icon: iconPath,
                    data: {
                        id: device.id,
                        bridgeId: hubId,
                        controlGroup: device.controlGroup
                    }
                };
                devices.push(foundDevice);
                */
            } else {
                resolve(devices);
            }
        });
    }
}

module.exports = ZensehomeBridgeDriver;