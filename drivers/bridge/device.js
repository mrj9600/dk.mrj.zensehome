'use strict';

const Homey = require('homey');

class ZensehomeBridge extends Homey.Device {
    onInit() {
        this._deviceData = this.getData();
        console.log(`Device (${this._deviceData.id}) - ${this.getSetting('host')} - ${this._deviceData.type} - ${this.getName()} initializing..`);
        this.device_id = this._deviceData.id;
        this.online = false;
        Homey.app.addBridge(this);

        /*
        let isOnCondition = new Homey.FlowCardCondition('is_on');
        isOnCondition
            .register()
            .registerRunListener((args, state) => {
                let isPowerdOn = args.hub_device.device.power === 'On';
                console.log(`Condition ${isPowerdOn}`);
                return Promise.resolve(isPowerdOn);
            });
        */


        this.doHealthCheck();

        setInterval(function () {
            this.doHealthCheck();
        }.bind(this), 30000);
    }

    onAdded() {
        console.log('ZensehomeBridge added');
    }

    onDeleted() {
        console.log('ZensehomeBridge deleted');
    }

    doHealthCheck() {
        this.getDriver().healthCheckDevice(this);
    }

    onOnline() {
        if (!this.online) {
            this.online = true;
            console.log('ZensehomeBridge online');

            this.setAvailable(this._deviceData);
        }
    }

    onOffline() {
        if (this.online) {
            this.online = false;
            console.log('ZensehomeBridge offline');
            this.setUnavailable(this._deviceData);
        }
    }

    getConnectedDevices() {
        return new Promise((resolve, reject) => {
            resolve(this.getDriver().getConnectedDevices(this.device_id));
        });
    }

}

module.exports = ZensehomeBridge;