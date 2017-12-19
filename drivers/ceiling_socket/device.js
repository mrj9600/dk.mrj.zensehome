'use strict';

const Homey = require('homey');
const Bridge = require('../../lib/bridge.js')

class ZensehomeDevice extends Homey.Device {
    onInit() {
        console.log('ZensehomeDevice.onInit');
        this._deviceData = this.getData();
        console.log(`Device (${this._deviceData.id}) - ${this.getSettings().host} - ${this._deviceData.type} - ${this.getName()} initializing..`);

        this.registerCapabilityListener('onoff', () => {
            this.onCapabilityOnoff(this);
        });

        if (this._deviceData.type === 'bridge') {
            Homey.app.addBridge(new Bridge(this));
        }

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
    }

    onAdded() {
        this.log('device added');
    }

    onDeleted() {
        this.log('device deleted');
    }



    triggerOnOffAction(deviceState) {
        let currenOnOffState = this.getCapabilityValue('onoff');
        let turnedOnDeviceTrigger = new Homey.FlowCardTriggerDevice('turned_on').register();
        let turnedOffDeviceTrigger = new Homey.FlowCardTriggerDevice('turned_off').register();
        let device = this;
        let state = {};
        let deviceTurnedOn = deviceState.Power === 'On';

        if (currenOnOffState !== deviceTurnedOn) {

            if (currenOnOffState === false) {
                turnedOnDeviceTrigger.trigger(device, tokens, state);
            }
            else {
                turnedOffDeviceTrigger.trigger(device, tokens, state);
            }

            this.setCapabilityValue('onoff', deviceTurnedOn);
        }

    }

    onCapabilityOnoff(value, opts, callback) {
        let powerGroup = this._deviceData.controlGroup.find(x => x.name === 'Power');
        //let foundHub = Homey.app.getHub(this._deviceData.hubId);

        if (powerGroup !== undefined) {
            let currenOnOffState = this.getCapabilityValue('onoff');
            let powerToggleFunction = powerGroup.function.find(x => x.name === 'PowerToggle');
            let powerOnFunction = powerGroup.function.find(x => x.name === 'PowerOn');
            let powerOffFunction = powerGroup.function.find(x => x.name === 'PowerOff');
            let powerCommand = '';

            if (currenOnOffState) {
                powerCommand = powerOffFunction !== undefined ? powerOffFunction : powerToggleFunction;
            }
            else {
                powerCommand = powerOnFunction !== undefined ? powerOnFunction : powerToggleFunction;
            }

            /*
            hubManager.connectToHub(foundHub.ip, '5222').then((hub) => {
                hub.commandAction(powerCommand).catch((err) => {
                    console.log(err);
                });
            });
            */

            let deviceState = {};
            deviceState.Power = 'Off'
            if (!currenOnOffState) {
                deviceState.Power = 'On';
            }

            this.triggerOnOffAction(deviceState);
        }
    }
}

module.exports = ZensehomeDevice;