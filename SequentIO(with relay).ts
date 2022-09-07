//MEGA-IND
//MEGA-IO
//Sequent4Rel4In
import { logger } from "../logger/Logger";
import { vMaps, valueMap, utils } from "../boards/Constants";
import { setTimeout, clearTimeout } from "timers";
import * as extend from "extend";
import { Buffer } from "buffer";
import { i2cDeviceBase } from "./I2cBus";
import { webApp } from "../web/Server";
import { I2cDevice, DeviceBinding } from "../boards/Controller";
import { isArray } from "util";
import { LatchTimers } from "../devices/AnalogDevices";

export class i2cRelay extends i2cDeviceBase {
    protected static controllerTypes = [
        { name: 'mcp23017', desc: 'MCP23017 Based', options: { idType: 'bit', maxRelays: 16 }},
        { name: 'mcp23008', desc: 'MCP23008 Based', options: { idType: 'bit', maxRelays: 8 } },
        { name: 'pcf8574', desc: 'PCF8574 Based', options: { idType: 'pcf857x', maxRelays: 8 }},
        { name: 'pcf8575', desc: 'PCF8575 Based', options: { idType: 'pcf857x', maxRelays: 16 } },
        { name: 'seeed', desc: 'Seeed Studio', options: { idType: 'bit', maxRelays: 8}},
        { name: 'dockerPi4', desc: 'Docker Pi 4', options: { idType: 'ordinal', maxRelays: 4 } },
        { name: 'sequent4', desc: 'Sequent 4', options: { idType: 'sequent4', maxRelays: 4 }   },
        { name: 'sequent8', desc: 'Sequent 8 v2.x', options: { idType: 'sequent8', maxRelays: 8 } },
        { name: 'sequent8v3', desc: 'Sequent 8 v3.0+', options: {idType: 'sequent8', maxRelays: 8 }},
        { name: 'sequent8IND', desc: 'Sequent 8 IND', options: { idType: 'sequent8', maxRelays: 8 }}
    ]
    protected static commandBytes = {
        mcp23017: {
            read: [0x12, 0x13],
            write: [0x14, 0x15],
            config: [
                { name: 'IODIRA', register: 0x00, desc: 'I/O direction for 1-8' },
                { name: 'IODIRB', register: 0x01, desc: 'I/O direction for 9-16' },
                { name: 'IPOLA', register: 0x02, desc: 'Input polarity for 1-8' },
                { name: 'IPOLB', register: 0x03, desc: 'Input polarity for 9-16' },
                { name: 'GPINTENA', register: 0x04, desc: 'Interrupt on-change for 1-8' },
                { name: 'GPINTENB', register: 0x05, desc: 'Interrupt on-change for 9-16' },
                { name: 'DEFVALA', register: 0x06, desc: 'Default interrupt value for 1-8' },
                { name: 'DEFVALB', register: 0x07, desc: 'Default interrupt value for 9-16' },
                { name: 'INTCONA', register: 0x08, desc: 'Interrupt control register for 1-8.  If 0 then interrupt fired on change else it is fired when matches DEFVAL' },
                { name: 'INTCONB', register: 0x09, desc: 'Interrupt control register for 9-16.  If 0 then interrupt fired on change else it is fired when matches DEFVAL' },
                { name: 'IOCONA', register: 0x0a, desc: 'I/O control 1-8 per mcp23017 datasheet.  This determines whether in byte mode or sequential mode' },
                { name: 'IOCONB', register: 0x0b, desc: 'I/O control 9-16 per mcp23017 datasheet.  This determines whether in byte mode or sequential mode' },
                { name: 'GPPUA', register: 0x0c, desc: 'Pull up resistor for 1-8' },
                { name: 'GPPUB', register: 0x0d, desc: 'Pull up resistor for 9-16' },
                { name: 'INTFA', register: 0x0e, desc: 'Interrupt condition for 1-8' },
                { name: 'INTFB', register: 0x0f, desc: 'Interrupt condition for 9-16' },
                { name: 'INTCAPA', register: 0x10, desc: 'Interrupt capture at the time the interrupt occurred for 1-8' },
                { name: 'INTCAPB', register: 0x11, desc: 'Interrupt capture at the time the interrupt occurred for 9-16' },
                { name: 'OLATA', register: 0x14, desc: 'Output latches for 1-8' },
                { name: 'OLATB', register: 0x15, desc: 'Output latches for 9-16' }
            ]
        },
        mcp23008: {
            read: [0x09],
            write: [0x0a],
            config: [
                { name: 'IODIR', register: 0x00, desc: 'I/O directions for 1-8' },
                { name: 'IOPOL', register: 0x01, desc: 'Input polarity for 1-8' },
                { name: 'GPINTEN', register: 0x02, desc: 'Interrupt on change for 1-8' },
                { name: 'DEFVAL', register: 0x03, desc: 'Default interrupt value for 1-8' },
                { name: 'INTCON', register: 0x04, desc: 'Interrupt control register for 1-8.  If 0 then interrupt fired on change else it is fired when matches DEFVAL' },
                { name: 'IOCON', register: 0x05, desc: 'I/O control per mcp23008 datasheet.  This determines whether in byte mode or sequential mode' },
                { name: 'GPPU', register: 0x06, desc: 'Pull up resistor for 1-8' },
                { name: 'INTF', register: 0x07, desc: 'Interrupt condition for 1-8' },
                { name: 'INTCAP', register: 0x08, desc: 'Interrupt capture at the time the interrupt occurred for 1-8' },
                { name: 'OLAT', register: 0x0a, desc: 'Output latches for 1-8' },
            ]
        },
        sequent4: {
            read: [0x01],
            write: [0x01],
            config: [
                {name:'CFG', register: 0x03, desc: 'Configuration register for the relay'}
            ]
        },
        sequent8: {
            state: [0x01],
            write: [0x01],
            config: [
                { name: 'CFG', register: 0x03, desc: 'Configuration register for the relay' }
            ]
        },
        sequent8v3: {
            state: [0x01],
            write: [0x01],
            config: [
                { name: 'CFG', register: 0x03, desc: 'Configuration register for the relay' }
            ]
        },
        sequent8IND: {
            state: [0x01],
            write: [0x01],
            config: [
                { name: 'CFG', register: 0x03, desc: 'Configuration register for the relay' }
            ]
        },
        pcf8574: {
            read: [], write: [], config: [
                { name: 'P0x', register: 0x00, desc: 'I/O value 1-8' }
            ]
        }, // There are no configuration, read, or write bytes for the PCF series
        pcf8575: {
            read: [], write: [], config: [
                { name: 'P0x', register: 0x00, desc: 'I/O value 1-8' },
                { name: 'P1x', register: 0x00, desc: 'I/O value 9-16' }
            ]
        },
        seeed: { read: [0x06], write: [0x06], config: [] }
    };
    protected _latchTimers = {};
    protected latches = new LatchTimers();
    protected _relayBitmask1 = 0;
    protected _relayBitmask2 = 0;
    public get relays() { return typeof this.values.relays === 'undefined' ? this.values.relays = [] : this.values.relays; }
    public set relays(val) { this.values.relays = val; }
    protected getReadCommandByte(ord: number): number {
        let arr = i2cRelay.commandBytes[this.device.options.controllerType];
        return typeof arr !== 'undefined' && typeof arr.read !== 'undefined' && arr.read.length > ord ? arr.read[ord] : undefined;
    }
    protected getWriteCommandByte(ord: number): number {
        let arr = i2cRelay.commandBytes[this.device.options.controllerType];
        return typeof arr !== 'undefined' && typeof arr.write !== 'undefined' && arr.write.length > ord ? arr.write[ord] : undefined;
    }
    protected async initRegisters() {
        try {
            switch (this.device.options.controllerType) {
                case 'pcf8574':
                case 'pcf8575':
                    // There are no config registers for the is IO extender but we will be pushing these on the interface.
                    let cb = i2cRelay.commandBytes[this.device.options.controllerType] || { state: [], init: [], config: [] };
                    if (typeof this.device.info.registers === 'undefined') this.device.info.registers = [];
                    let regP0 = this.device.info.registers.find(elem => elem.name === 'P0x');
                    if (typeof regP0 === 'undefined') {
                        regP0 = extend({ name: 'P0x', register: 0x00, desc: 'I/0 value 1-8', value: 0x00 }, cb.config.find(elem => elem.name === 'P0x'));
                        this.device.info.registers.push(regP0);
                    }
                    for (let i = 0; i < 8 && i < this.relays.length; i++) {
                        let relay = this.relays[i];
                        if (relay.enabled && relay.state === true) regP0.value |= (1 << (relay.id - 1));
                    }
                    if (this.device.options.controllerType === 'pcf8575') {
                        // There are no configuration registers to initialize for these.
                        let regP1 = this.device.info.registers.find(elem => elem.name === 'P1x');
                        if (typeof regP1 === 'undefined') {
                            regP0 = extend({ name: 'P1x', register: 0x00, desc: 'I/0 value 9-16', value: 0x00 }, cb.config.find(elem => elem.name === 'P1x'));
                            this.device.info.registers.push(regP0);
                        }
                        for (let i = 8; i < 16 && i < this.relays.length; i++) {
                            let relay = this.relays[i];
                            if (relay.enabled && relay.state === true) regP1.value |= (1 << (relay.id - 8));
                        }
                    }
                    break;
                case 'mcp23017':
                    // Set the registers to output for all the relays we have.
                    {
                        // Set byte mode for I/O control.
                        //await this.sendCommand([0x0a, 0x00]);
                        // Bit value of 0 = output (what we need to control a relay) and bit value 1 = input.
                        await this.readConfigRegisters();
                        
                        let regA = this.device.info.registers.find(elem => elem.name === 'IODIRA') || { value: 0x00 };
                        let regB = this.device.info.registers.find(elem => elem.name === 'IODIRB') || { value: 0x00 };
                        if (this.i2c.isMock) { regA.value = 0xFF; regB.value = 0xFF; }
                        for (let i = 0; i < this.relays.length; i++) {
                            let relay = this.relays[i];
                            if (utils.makeBool(relay.enabled)) {
                                // Set the bit to 0 for output.
                                (i < 8) ? regA.value &= ~(1 << i) : regB.value &= ~(1 << (i - 8));
                            }
                        }
                        logger.info(`Setting config register ${regA.name} ${regA.value}`);
                        logger.info(`Setting config register ${regB.name} ${regB.value}`);
                        await this.sendCommand([regA.register, regA.value]);
                        await this.sendCommand([regB.register, regB.value]);
                        if(!this.i2c.isMock) await this.readConfigRegisters();
                    }
                    break;
                case 'mcp23008':
                    await this.readConfigRegisters();
                    {
                        let reg = this.device.info.registers.find(elem => elem.name === 'IODIR') || { value: 0x00 };
                        if (this.i2c.isMock) reg.value = 0xFF;
                        for (let i = 0; i < this.relays.length; i++) {
                            let relay = this.relays[i];
                            if (utils.makeBool(relay.enabled)) {
                                reg.value &= ~(1 << i);
                            }
                        }
                        await this.sendCommand([reg.register, reg.value]);
                        if (!this.i2c.isMock) await this.readConfigRegisters();
                    }
                    break;
                case 'sequent8':
                case 'sequent4':
                case 'sequent8IND':
                case 'sequent8v3':
                    {
                        await this.readConfigRegisters();
                        let reg = this.device.info.registers.find(elem => elem.name === 'CFG') || { value: 0x00 };
                        if (reg.value !== 0) {
                            await this.sendCommand([reg.register, 0]);
                            await this.readConfigRegisters();
                        }
                    }
                    break;
                default:
                    break;
            }
            webApp.emitToClients('i2cDeviceInformation', { bus: this.i2c.busNumber, address: this.device.address, options: { deviceInfo: this.device.info } });

        } catch (err) { logger.error(`Error Initializing ${this.device.name} registers.`); this.hasFault = true; }
    }
    protected async readConfigRegisters() {
        try {
            let cb = i2cRelay.commandBytes[this.device.options.controllerType] || { state: [], init: [] };
            switch (this.device.options.controllerType) {
                default:
                    this.device.info.registers = [];
                    for (let i = 0; i < cb.config.length; i++) {
                        let cfg = cb.config[i];
                        let byte = await this.readCommand(cfg.register);
                        this.device.info.registers.push(extend({}, cfg, { value: byte }));
                    }
                    break;
            }

        } catch (err) { logger.error(`Error Initializing ${this.device.name} registers.`); this.hasFault = true; }

    }
    protected _timerRead: NodeJS.Timeout;
    protected toHexString(bytes: number[]) { return bytes.reduce((output, elem) => (output + '0x' + ('0' + elem.toString(16)).slice(-2)) + ' ', ''); }
    protected async sendCommand(command: number[]): Promise<{ bytesWritten: number, buffer: Buffer }> {
        try {
            let buffer = Buffer.from(command);
            let w = await this.i2c.writeCommand(this.device.address, buffer);
            logger.debug(`Executed send command ${this.toHexString(command)} bytes written:${w}`);
            this.hasFault = false;
            return Promise.resolve(w);
        }
        catch (err) { logger.error(`${this.device.address} ${command}: ${err.message}`); this.hasFault = true; }
    }
    protected async readCommand(command: number): Promise<number> {
        try {
            let r = await this.i2c.readByte(this.device.address, command);
            logger.debug(`${this.device.address} - ${this.device.name} Executed read command ${'0x' + ('0' + command.toString(16)).slice(-2)} byte read:${'0x' + ('0' + r.toString(16)).slice(-2)}`);
            this.hasFault = false;
            return Promise.resolve(r);
        }
        catch (err) {
            logger.error(`${this.device.address} - ${this.device.name} Bus #${this.i2c.busNumber} Read Command: ${ err.message }`); this.hasFault = true; }
    }
    protected async readBuffer(bytes:number): Promise<{ bytesRead: number, buffer: Buffer }> {
        try {
            let r: { bytesRead: number, buffer: Buffer } = await this.i2c.read(this.device.address, bytes);
            logger.debug(`${this.device.address} - ${this.device.name} Executed read buffer 0x${this.device.address.toString(16)} ${r.bytesRead} [${r.buffer.join(',')}]`);
            return r;
        } catch(err) { logger.error(`${this.device.address} - ${this.device.name} Bus #${this.i2c.busNumber} ReadBuffer: ${err.message}`); this.hasFault = true; }
    }
    protected async writeBuffer(bytes: number, buffer: Buffer): Promise<{ bytesWritten: number, buffer: Buffer }> {
        try {
            let r: { bytesWritten: number, buffer: Buffer } = await this.i2c.write(this.device.address, bytes, buffer);
            logger.debug(`${this.device.address} - ${this.device.name} Executed write buffer 0x${this.device.address.toString(16)} ${ r.bytesWritten }[${ r.buffer.join(',') }]`);
            return r;
        } catch (err) { logger.error(`${this.device.address} - ${this.device.name} Bus #${this.i2c.busNumber} ReadBuffer: ${err.message}`); this.hasFault = true; }
    }

    protected async readWord(): Promise<number> {
        try {
            let r = await this.readBuffer(2);
            return r.buffer.readUInt16LE();
        }
        catch (err) { logger.error(`${this.device.address} - ${this.device.name} Bus #${this.i2c.busNumber} ReadWord: ${err.message}`); this.hasFault = true; }
    }
    protected async readByte(): Promise<number> {
        try {
            let r = await this.readBuffer(1);
            return r.buffer.readUInt8();
        }
        catch (err) { logger.error(`${this.device.address} - ${this.device.name} Bus #${this.i2c.busNumber} ReadByte: ${err.message}`); this.hasFault = true; }
    }
    protected async writeWord(word: number): Promise<{ bytesWritten: number, buffer: Buffer }> {
        try {
            let buffer = Buffer.from([word & 0xFF, (word >> 8) & 0xFF]);
            let r = await this.writeBuffer(2, buffer);
            return r;
        }
        catch (err) { logger.error(`${this.device.address} writeWord: ${err.message}`); this.hasFault = true; }
    }
    protected async writeByte(byte: number): Promise<{ bytesWritten: number, buffer: Buffer }> {
        try {
            let buffer = Buffer.from([byte & 0xFF]);
            let r = await this.writeBuffer(1, buffer);
            return r;
        }
        catch (err) { logger.error(`${this.device.address} writeByte: ${err.message}`); this.hasFault = true; }
    }

    public async emitFeeds() {
        try {
            for (let i = 0; i < this.feeds.length; i++) {
                await this.feeds[i].send(this);
            }
        } catch (err) { logger.error(err); }
    }
    public getValue(prop: string) : any {
        let name = prop.toLowerCase();
        if (name === 'relayvalall') {
            let vals = [];
            for (let i = 0; i < this.relays.length; i++) {
                vals.push(this.relays[i].state);
            }
        }
        else if (name.startsWith('relayval')) {
            let ord = parseInt(name.substring(8), 10);
            if (!isNaN(ord) && this.relays.length > ord) {
                logger.verbose(`Get Relay Value ${this.relays[ord - 1].state}`)
                return this.relays[ord - 1].state;
            }
            else {
                logger.error(`Error getting ${this.device.name} relay value for ${prop}`);
            }
        }
        else if (name.startsWith('relayobj')) {
            let ord = parseInt(name.substring(8), 10);
            if (!isNaN(ord) && this.relays.length > ord) {
                return this.relays[ord - 1];
            }
            else {
                logger.error(`Error getting ${this.device.name} relay object for ${prop}`);
            }
        }
    }
    public async stopReadContinuous() {
        if (typeof this._timerRead !== 'undefined')
            clearTimeout(this._timerRead);
        return Promise.resolve();
    }
    public async readContinuous(): Promise<boolean> {
        try {
            if (this._timerRead) clearTimeout(this._timerRead);
            if (this.device.isActive) await this.readAllRelayStates();
            this._timerRead = setTimeout(() => { this.readContinuous(); }, this.device.options.readInterval || 500);
            return Promise.resolve(true);
        }
        catch (err) { logger.error(err); }
    }
    protected makeStartupBitmasks(orig: number[]) {
        let bytes = [];
        for (let i = 0; i < this.relays.length; i++) {
            let r = this.relays[i];
            let ord = Math.floor((r.id - 1) / 8);
            if (ord + 1 > bytes.length) bytes.push(0);
            let state = false;
            
            let bm = (1 << (((r.id - (ord * 8)) - 1)));
            if (r.initState === 'on') state = true;
            else if (r.initState === 'off') state = false;
            else if (r.initState === 'last') state = utils.makeBool(r.state);
            else {
                if (orig.length > ord) {
                    state = (orig[ord] & bm) > 0;
                    if (r.invert === true) state = !state;
                }
            }
            let target = r.invert === true ? !utils.makeBool(state) : utils.makeBool(state);
            if (target) bytes[ord] |= bm;
        }
        return bytes;
    }
    protected async initRelayStates() {
        this.relays.sort((a, b) => { return a.id - b.id; });
        try {
            let bytes: number[] = [];
            let orig: number[] = [];
            switch (this.options.idType) {
                case 'sequent8':
                    // 8relind-rpi -- sequent8IND
                    //relayMaskRemap = [0x01, 0x04, 0x40, 0x10, 0x20, 0x80, 0x08, 0x02]
                    //relayChRemap = [0, 2, 6, 4, 5, 7, 3, 1]
                    
                    // 8relay-rpi -- sequent8v3
                    //relayMaskRemap = [0x01, 0x04, 0x02, 0x08, 0x40, 0x10, 0x20, 0x80]
                    //relayChRemap = [0, 2, 1, 3, 6, 4, 5, 7]

                    // relay8-rpi -- sequent8 
                    //relayMaskRemap = [0x01, 0x02, 0x04, 0x08, 0x80, 0x40, 0x20, 0x10]
                    //relayChRemap = [0, 1, 2, 3, 7, 6, 5, 4]
                    let map = [0x01, 0x02, 0x04, 0x08, 0x80, 0x40, 0x20, 0x10];
                    switch (this.options.controllerType) {
                        case 'sequent8v3':
                            map = [0x01, 0x04, 0x02, 0x08, 0x40, 0x10, 0x20, 0x80];
                            break;
                        case 'sequent8IND':
                            map = [0x01, 0x04, 0x40, 0x10, 0x20, 0x80, 0x08, 0x02];
                            break;
                    }
                    orig.push(this.decodeSequent(await this.readCommand(0x00), map));
                    bytes = this.makeStartupBitmasks(orig);
                    await this.sendCommand([0x01, this.encodeSequent(bytes[0], map)]);
                    if (this.i2c.isMock) this._relayBitmask1 = this.encodeSequent(bytes[0], map);
                    break;
                case 'sequent4':
                    orig.push(this.decodeSequent(await this.readCommand(0x00), [0x80, 0x40, 0x20, 0x10]));
                    bytes = this.makeStartupBitmasks(orig);
                    await this.sendCommand([0x01, this.encodeSequent(bytes[0], [0x80, 0x40, 0x20, 0x10])]);
                    if (this.i2c.isMock) this._relayBitmask1 = this.encodeSequent(bytes[0], [0x80, 0x40, 0x20, 0x10]);
                    break;
                case 'pcf857x':
                    {
                        this.relays.sort((a, b) => { return a.id - b.id; });
                        let bitmask = 0;
                        if (this.i2c.isMock) {
                            let regP0 = this.device.info.registers.find(elem => elem.name === 'P0x');
                            let regP1 = this.device.info.registers.find(elem => elem.name === 'P1x');
                            if (typeof regP0 !== 'undefined') bitmask = regP0.value;
                            if (typeof regP1 !== 'undefined') bitmask |= (regP1.value << 8);
                        }
                        else
                            bitmask = this.options.controllerType === 'pcf8574' ? await this.readByte() : await this.readWord();
                        orig.push(bitmask & 0xFF);
                        orig.push((bitmask >> 8) & 0xFF);
                        bytes = this.makeStartupBitmasks(orig);
                        if (this.i2c.isMock) {
                            this._relayBitmask1 = bytes[0];
                            if (bytes.length > 1) {
                                this._relayBitmask2 = bytes[1];
                            }
                        }
                        else if (this.options.controllerType === 'pcf8574') {
                            await this.writeByte(bytes[0]);
                        }
                        else {
                            await this.writeWord((bytes[1] << 8) + (bytes[0] & 0xFF));
                        }
                        webApp.emitToClients('i2cDeviceInformation', { bus: this.i2c.busNumber, address: this.device.address, info: { registers: this.device.info.registers } });
                        await this.readAllRelayStates();
                    }
                    break;
                case 'bit':
                    this.relays.sort((a, b) => { return a.id - b.id; });
                    for (let i = 0; i < this.relays.length; i++) {
                        let relay = this.relays[i];
                        // Get the byte map data from the controller.
                        let ord = Math.floor((relay.id - 1) / 8);
                        if (ord + 1 > orig.length) {
                            let cmdByte = this.getReadCommandByte(ord);
                            orig.push(await this.readCommand(cmdByte));
                        }
                    }
                    bytes = this.makeStartupBitmasks(orig);
                    for (let i = 0; i < bytes.length; i++) {
                        await this.sendCommand([this.getWriteCommandByte(i), bytes[i]]);
                        if (this.i2c.isMock) {
                            this[`_relayBitmask${i + 1}`] = bytes[i];
                            await this.readAllRelayStates();
                        }
                    }
                    break;
                default:
                    for (let i = 0; i < this.relays.length; i++) {
                        let r = this.relays[i];
                        let state = false;
                        if (r.initState === 'on') state = true;
                        else if (r.initState === 'off') state = false;
                        else if (r.initState === 'last') state = utils.makeBool(r.state);
                        else {
                            let byte = await this.readCommand(r.id);
                            state = byte > 0
                        }
                        if (r.invert === true) state = !state;
                        await this.sendCommand([r.id, state ? 255 : 0]);
                        if (this.i2c.isMock) r.state = state;
                    }
                    break;
            }
        } catch (err) { logger.error(`Error initializing relay states ${this.device.name}`); }
    }
    public async initAsync(deviceType): Promise<boolean> {
        try {
            let ctype = i2cRelay.controllerTypes.find(elem => this.options.controllerType === elem.name);
            if (typeof ctype !== 'undefined') {
                this.options.maxRelays = ctype.options.maxRelays;
                this.options.idType = ctype.options.idType;
                if (this.relays.length !== this.options.maxRelays) {
                    for (let i = 0; i < this.options.maxRelays; i++) {
                        if (typeof this.relays[i] === 'undefined') this.relays.push({ name: `Relay #${i + 1}`, enabled: false, state: false });
                    }
                    this.relays.length = this.options.maxRelays;
                }
            }
            if (this._timerRead) clearTimeout(this._timerRead);
            if (typeof this.device.options === 'undefined') this.device.options = {};
            // Temporary for now so we can move all the relays from the options object to values.
            if (typeof this.device.options.relays !== 'undefined' &&
                (typeof this.device.values.relays === 'undefined' || this.device.values.relays.length === 0)) {
                this.relays = this.device.options.relays;
                this.device.options.relays = undefined;
            }
            if (typeof this.device.options.name !== 'string' || this.device.options.name.length === 0) this.device.name = this.device.options.name = deviceType.name;
            else this.device.name = this.device.options.name;
            if (typeof this.device.options.idType === 'undefined' || this.device.options.idType.length === 0) this.device.options.idType = 'bit';
            if (this.device.isActive) {
                await this.initRegisters();
                await this.initRelayStates();
            }
            this.readContinuous();
            return Promise.resolve(true);
        }
        catch (err) { logger.error(err); return Promise.resolve(false); }
    }
    public async readAllRelayStates(): Promise<boolean> {
        try {
            switch (this.device.options.idType) {
                case 'sequent4':
                    {
                        let byte = await this.readCommand(0x03);
                        if (byte !== 0) {
                            await this.sendCommand([0x03, 0x00]);
                            await this.sendCommand([0x01, 0x00]);
                        }
                        byte = await this.readCommand(0x00);
                        if (this.i2c.isMock) byte = this._relayBitmask1;
                        byte = this.decodeSequent(byte, [0x80, 0x40, 0x20, 0x10]);
                        this.relays.sort((a, b) => { return a.id - b.id; });
                        for (let i = 0; i < this.relays.length; i++) {
                            let relay = this.relays[i];
                            let state = utils.makeBool(byte & (1 << (relay.id - 1)));
                            if (relay.invert === true) state = !state;
                            if (state !== relay.state) {
                                relay.state = state;
                                webApp.emitToClients('i2cDataValues', { bus: this.i2c.busNumber, address: this.device.address, relayStates: [relay] });
                            }
                        }
                    }
                    break;
                case 'sequent8':
                    {
                        let byte = await this.readCommand(0x03);
                        if (byte !== 0) {
                            await this.sendCommand([0x03, 0x00]);
                            await this.sendCommand([0x01, 0x00]);
                        }
                        byte = await this.readCommand(0x00);
                        let map = [0x01, 0x02, 0x04, 0x08, 0x80, 0x40, 0x20, 0x10];
                        switch (this.options.controllerType) {
                            case 'sequent8v3':
                                map = [0x01, 0x04, 0x02, 0x08, 0x40, 0x10, 0x20, 0x80];
                                break;
                            case 'sequent8IND':
                                map = [0x01, 0x04, 0x40, 0x10, 0x20, 0x80, 0x08, 0x02];
                                break;
                        }

                        if (this.i2c.isMock) byte = this._relayBitmask1;
                        byte = this.decodeSequent(byte, map);
                        this.relays.sort((a, b) => { return a.id - b.id; });
                        for (let i = 0; i < this.relays.length; i++) {
                            let relay = this.relays[i];
                            let state = utils.makeBool(byte & (1 << (relay.id - 1)));
                            if (relay.invert === true) state = !state;
                            if (state !== relay.state) {
                                relay.state = state;
                                webApp.emitToClients('i2cDataValues', { bus: this.i2c.busNumber, address: this.device.address, relayStates: [relay] });
                            }
                        }
                    }
                    break;
                case 'pcf857x':
                    {
                        let bitmask = this.i2c.isMock ? ((this._relayBitmask2 || 0) << 8)  + this._relayBitmask1 : this.options.controllerType === 'pcf8574' ? await this.readByte() : await this.readWord();
                        this.relays.sort((a, b) => { return a.id - b.id; });
                        for (let i = 0; i < this.relays.length; i++) {
                            let relay = this.relays[i];
                            if (!utils.makeBool(relay.enabled)) continue;
                            let state = ((1 << i) & bitmask) > 0;
                            if (relay.invert === true) state = !state;
                            if (state !== relay.state) {
                                relay.state = state;
                                webApp.emitToClients('i2cDataValues', { bus: this.i2c.busNumber, address: this.device.address, relayStates: [relay] });
                            }
                        }
                        let regP0 = this.device.info.registers.find(elem => elem.name === 'P0x') || { value: 0x00 };
                        let regP1 = this.device.info.registers.find(elem => elem.name === 'P1x') || { value: 0x00 };
                        if (regP0.value !== (bitmask & 0xFF) || regP1.value !== (bitmask & 0xFF00) >> 8) {
                            regP0.value = bitmask & 0xFF;
                            regP1.value = (bitmask & 0xFF00) >> 8;
                            webApp.emitToClients('i2cDeviceInformation', { bus: this.i2c.busNumber, address: this.device.address, info: { registers: this.device.info.registers } });
                        }
                    }
                    break;
                case 'bit':
                    let bmVals = [];
                    // Force a sort so that it gets the correct address.
                    this.relays.sort((a, b) => { return a.id - b.id; });
                    for (let i = 0; i < this.relays.length; i++) {
                        let relay = this.relays[i];
                        if (!utils.makeBool(relay.enabled)) continue;
                        // Get the byte map data from the controller.
                        let bmOrd = Math.floor((relay.id - 1) / 8);
                        let cmdByte = this.getReadCommandByte(bmOrd);
                        if (bmOrd + 1 > bmVals.length) {
                            if (this.i2c.isMock) bmVals.push(bmOrd === 0 ? this._relayBitmask1 : this._relayBitmask2);
                            else bmVals.push(await this.readCommand(cmdByte));
                        }
                        let byte = bmVals[bmOrd];
                        let state = utils.makeBool((byte & 1 << ((relay.id - (bmOrd * 8)) - 1)));
                        if (relay.invert === true) state = !state;
                        if (state !== relay.state) {
                            relay.state = state;
                            webApp.emitToClients('i2cDataValues', { bus: this.i2c.busNumber, address: this.device.address, relayStates:[relay] });
                        }
                    }
                    break;
                default:
                    for (let i = 0; i < this.relays.length; i++) {
                        await this.readRelayState(this.relays[i]);
                    }
                    break;
            }
            return Promise.resolve(true);
        }
        catch (err) { return Promise.reject(err); }
    }
    public async readRelayState(relay): Promise<boolean> {
        let byte: number;
        let cmdByte = relay.id;
        try {
            switch (this.options.idType) {
                case 'sequent4':
                    {
                        let byte = await this.readCommand(0x03);
                        if (byte !== 0) {
                            await this.sendCommand([0x03, 0x00]);
                            await this.sendCommand([0x01, 0x00]);
                        }
                        // These come in the high nibble. Shift them to the low nibble.
                        byte = await this.readCommand(0x00);
                        if (this.i2c.isMock) byte = this._relayBitmask1;
                        byte = this.decodeSequent(byte, [0x80, 0x40, 0x20, 0x10]);
                        byte = byte & (1 << (relay.id - 1));
                    }
                    break;
                case 'sequent8':
                    {
                        let map = [0x01, 0x02, 0x04, 0x08, 0x80, 0x40, 0x20, 0x10];
                        switch (this.options.controllerType) {
                            case 'sequent8v3':
                                map = [0x01, 0x04, 0x02, 0x08, 0x40, 0x10, 0x20, 0x80];
                                break;
                            case 'sequent8IND':
                                map = [0x01, 0x04, 0x40, 0x10, 0x20, 0x80, 0x08, 0x02];
                                break;
                        }
                        let byte = await this.readCommand(0x03);
                        if (byte !== 0) {
                            await this.sendCommand([0x03, 0x00]);
                            await this.sendCommand([0x01, 0x00]);
                        }
                        // These come in the high nibble. Shift them to the low nibble.
                        byte = await this.readCommand(0x00);
                        if (this.i2c.isMock) byte = this._relayBitmask1;
                        byte = this.decodeSequent(byte, map);
                        byte = byte & (1 << (relay.id - 1));
                    }
                    break;
                case 'pcf857x':
                    {
                        let bitmask = this.i2c.isMock ? ((this._relayBitmask2 || 0) << 8) + this._relayBitmask1 : this.options.controllerType === 'pcf8574' ? await this.readByte() : await this.readWord();
                        byte = bitmask & (1 << (relay.id - 1));
                        let regP0 = this.device.info.registers.find(elem => elem.name === 'P0x') || { value: 0x00 };
                        let regP1 = this.device.info.registers.find(elem => elem.name === 'P1x') || { value: 0x00 };
                        regP0.value = bitmask & 0xFF;
                        regP1.value = (bitmask & 0xFF00) >> 8;
                        webApp.emitToClients('i2cDeviceInformation', { bus: this.i2c.busNumber, address: this.device.address, info: { registers: this.device.info.registers } });
                    }
                    break;
                case 'bit':
                    let bmOrd = Math.floor((relay.id - 1) / 8);
                    cmdByte = this.getReadCommandByte(bmOrd);
                    byte = await this.readCommand(cmdByte);
                    if (this.i2c.isMock) byte = bmOrd === 0 ? this._relayBitmask1 : this._relayBitmask2;
                    byte = byte & 1 << ((relay.id - (bmOrd * 8) - 1));
                    break;
                default:
                    byte = await this.readCommand(relay.id);
                    break;
            }
            if (typeof byte !== 'undefined') {
                let b = utils.makeBool(byte);
                if (relay.invert === true) b = !b;
                if (relay.state !== b) {
                    relay.state = b;
                    webApp.emitToClients('i2cDataValues', { bus: this.i2c.busNumber, address: this.device.address, relayStates: [relay] });
                }
            }
            return Promise.resolve(true);
        }
        catch (err) { return Promise.reject(err); }
    }
    public async setOptions(opts): Promise<any> {
        try {
            await this.stopReadContinuous();
            if (typeof opts.name !== 'undefined' && this.device.name !== opts.name) this.device.options.name = this.device.name = opts.name;
            if (typeof opts.readInterval === 'number') this.device.options.readInterval = opts.readInterval;
            if (typeof opts.relays !== 'undefined') {
                this.relays = opts.relays;
                await this.initRegisters();
            }
            if (typeof opts.controllerType !== 'undefined') this.device.options.controllerType = opts.controllerType;
            if (typeof opts.idType !== 'undefined') this.device.options.idType = opts.idType;
            this.readContinuous();
            Promise.resolve(this.device.options);
        }
        catch (err) { logger.error(err); Promise.reject(err); }
    }
    public async setValues(vals): Promise<any> {
        try {
            await this.stopReadContinuous();
            if (typeof vals.relays !== 'undefined') {
                this.relays = vals.relays;
                await this.initRegisters();
            }
            this.readContinuous();
            Promise.resolve(this.device.values);
        }
        catch (err) { logger.error(err); Promise.reject(err); }
    }
    public async closeAsync(): Promise<void> {
        try {
            this.initialized = false;
            await this.stopReadContinuous();
            await this.latches.close(true);
            await super.closeAsync();
            return;
        }
        catch (err) { return Promise.reject(err); }
    }
    protected encodeSequent(byte, map) { // To the IO byte
        let val = 0;
        for (let i = 0; i < map.length; i++) {
            if ((byte & (1 << i)) !== 0) val = val + map[i];
        }
        return val;
    }
    protected decodeSequent(byte, map) { // From the IO byte
        let val = 0;
        for (let i = 0; i < map.length; i++) {
            if ((byte & map[i]) !== 0)
                val = val + (1 << i);
        }
        return val;
    }
    public setValue(prop: string, value) {
        switch (prop) {
            case 'relayState':
                this.setRelayState(value);
                break;
        }
    }
    public async setRelayState(opts): Promise<{ id: number, name: string, state: boolean }> {
        try {
            let relay = this.relays.find(elem => { return elem.id === opts.id });
            let oldState = relay.state;
            let command: number[] = [];
            if (typeof relay === 'undefined') {
                return Promise.reject(new Error(`${this.device.name} - Invalid Relay id: ${opts.id}`));
            }
            let newState = utils.makeBool(opts.state);
            // Make the relay command.
            switch (this.options.idType) {
                case 'sequent8':
                    {
                        await this.readAllRelayStates();
                        let byte = 0x00;
                        // Byte is the current data from the relay board and the relays are in the lower 4 bits.
                        for (let i = 0; i < this.relays.length; i++) {
                            let r = this.relays[i];
                            let current = r.invert === true ? !utils.makeBool(r.state) : utils.makeBool(r.state);
                            if (relay.id === r.id) {
                                let target = r.invert === true ? !utils.makeBool(newState) : utils.makeBool(newState);
                                if (target) byte |= (1 << (r.id - 1));
                            }
                            else if (current)
                                byte |= (1 << (r.id - 1));
                        }
                        let map = [0x01, 0x02, 0x04, 0x08, 0x80, 0x40, 0x20, 0x10];
                        switch (this.options.controllerType) {
                            case 'sequent8v3':
                                map = [0x01, 0x04, 0x02, 0x08, 0x40, 0x10, 0x20, 0x80];
                                break;
                            case 'sequent8IND':
                                map = [0x01, 0x04, 0x40, 0x10, 0x20, 0x80, 0x08, 0x02];
                                break;
                        }
                        await this.sendCommand([0x01, this.encodeSequent(byte, map)]);
                        if (this.i2c.isMock) this._relayBitmask1 = this.encodeSequent(byte, map);
                        if (relay.state !== newState) {
                            relay.state = newState;
                            relay.tripTime = new Date().getTime();
                        }
                    }
                    break;
                case 'sequent4':
                    {
                        await this.readAllRelayStates();
                        let byte = 0x00;
                        // Byte is the current data from the relay board and the relays are in the lower 4 bits.
                        for (let i = 0; i < this.relays.length; i++) {
                            let r = this.relays[i];
                            let current = r.invert === true ? !utils.makeBool(r.state) : utils.makeBool(r.state);
                            if (relay.id === r.id) {
                                let target = r.invert === true ? !utils.makeBool(newState) : utils.makeBool(newState);
                                if(target) byte |= (1 << (r.id - 1));
                            }
                            else if (current)
                                byte |= (1 << (r.id - 1));
                        }
                        await this.sendCommand([0x01, this.encodeSequent(byte, [0x80, 0x40, 0x20, 0x10])]);
                        if (this.i2c.isMock) this._relayBitmask1 = this.encodeSequent(byte, [0x80, 0x40, 0x20, 0x10]);
                        if (relay.state !== newState) {
                            relay.state = newState;
                            relay.tripTime = new Date().getTime();
                        }
                    }
                    break;
                case 'pcf857x':
                    {
                        await this.readAllRelayStates();
                        let bitmask = 0x0000;
                        for (let i = 0; i < this.relays.length; i++) {
                            let r = this.relays[i];
                            let current = r.invert === true ? !utils.makeBool(r.state) : utils.makeBool(r.state);
                                if (relay.id === r.id) {
                                    let target = r.invert === true ? !utils.makeBool(newState) : utils.makeBool(newState);
                                    if (target) bitmask |= (1 << (r.id - 1));
                                }
                                else if (current)
                                bitmask |= (1 << (r.id - 1));
                        }
                        if (this.i2c.isMock) {
                            this._relayBitmask1 = bitmask & 0xFF;
                            if (this.options.controllerType !== 'pcf8574') this._relayBitmask2 = (bitmask & 0xFF00) >> 8;

                        }
                        else this.options.controllerType === 'pcf8574' ? await this.writeByte(bitmask) : await this.writeWord(bitmask);
                        if (relay.state !== newState) {
                            relay.state = newState;
                            relay.tripTime = new Date().getTime();
                        }
                    }
                    break;
                case 'bit':
                    // Make sure we have all the relay states up to date.
                    // MCP23017 uses 0x12 for port A (bmOrd 0) and 0x13 for port B (bmOrd 1).
                    // MCP23008 uses 0x09 for port A (bmOrd 0)
                    if (await this.readAllRelayStates()) {
                        let bmOrd = Math.floor((relay.id - 1) / 8);
                        let cmdByte = this.getWriteCommandByte(bmOrd);
                        let byte = 0x00;
                        for (let i = bmOrd * 8; i < this.relays.length && i < (bmOrd * 8) + 8; i++) {
                            let r = this.relays[i];
                            let current = r.invert === true ? !utils.makeBool(r.state) : utils.makeBool(r.state);
                            if (relay.id === r.id) {
                                let target = r.invert === true ? !utils.makeBool(newState) : utils.makeBool(newState);
                                if (target) byte |= (1 << (((r.id - (bmOrd * 8)) - 1)));
                            }
                            else if (current) {
                                byte |= (1 << (((r.id - (bmOrd * 8)) - 1)));
                            }
                        }
                        if (typeof cmdByte !== 'undefined') command.push(cmdByte);
                        command.push(byte);
                        if (this.i2c.isMock) bmOrd === 0 ? this._relayBitmask1 = byte : this._relayBitmask2 = byte;
                    }
                    break;
                default:
                    command.push(relay.id);
                    command.push((relay.invert === true ? !utils.makeBool(opts.state) : utils.makeBool(opts.state)) ? 255 : 0);
                    break;
            }
            if (command.length > 0) {
                await this.sendCommand(command);
                if (relay.state !== newState) {
                    relay.tripTime = new Date().getTime();
                }
                relay.state = newState;
            }
            if (relay.state !== oldState) webApp.emitToClients('i2cDataValues', { bus: this.i2c.busNumber, address: this.device.address, relayStates: [relay] });
            await this.emitFeeds();
            return Promise.resolve(relay);
        }
        catch (err) { return Promise.reject(err) };
    }
    public getDeviceDescriptions(dev) {
        let desc = [];
        let category = typeof dev !== 'undefined' ? dev.category : 'unknown';
        for (let i = 0; i < this.relays.length; i++) {
            let relay = this.relays[i];
            desc.push({ type: 'i2c', isActive: this.device.isActive, name: relay.name, binding: `i2c:${this.i2c.busId}:${this.device.id}:${relay.id}`, category: category });
        }
        return desc;
    }
    public async setDeviceState(binding: string | DeviceBinding, data: any): Promise<any> {
        try {
            
            let bind = (typeof binding === 'string') ? new DeviceBinding(binding) : binding;
            // We need to know what relay we are referring to.
            // i2c:1:24:3
            let relayId = parseInt(bind.params[0], 10);
            if (isNaN(relayId)) return Promise.reject(new Error(`setDeviceState: Invalid relay Id ${bind.params[0]}`));
            let relay = this.relays.find(elem => elem.id === relayId);
            if (typeof relay === 'undefined') return Promise.reject(new Error(`setDeviceState: Could not find relay Id ${bind.params[0]}`));
            if (!relay.enabled) return Promise.reject(new Error(`setDeviceState: Relay [${relay.name}] is not enabled.`));
            let latch = (typeof data.latch !== 'undefined') ? parseInt(data.latch, 10) : -1;
            if (isNaN(latch)) return Promise.reject(new Error(`setDeviceState: Relay [${relay.name}] latch data is invalid ${data.latch}.`));
            this.latches.clearLatch(relayId);
            await this.readRelayState(relay);
            // Now that the relay has been read lets set its state.
            let newState;
            switch (typeof data) {
                case 'boolean':
                    newState = data;
                    break;
                case 'number':
                    newState = data === 1 ? true : data === 0 ? false : relay.state;
                    break;
                case 'string':
                    switch (data.toLowerCase()) {
                        case 'tripped':
                        case 'true':
                        case 'on':
                        case '1':
                            newState = true;
                        case 'untripped':
                        case 'false':
                        case '0':
                        case 'off':
                            newState = false;
                            break;
                    }
                    break;
                case 'object':
                    if (isArray(data) && data.length > 0) {
                        this.stopReadContinuous();
                        let nOffs = 0;
                        let nOns = 0;
                        // This is a sequence.
                        // [{isOn: true, timeout: 1000}, {isOn: false, timeout: 1000}]
                        let onDelay = relay.sequenceOnDelay || 0;
                        let offDelay = relay.sequenceOffDelay || 0;
                        for (let i = 0; i < data.length; i++) {
                            let seq = data[i];
                            let state = utils.makeBool(seq.state || seq.isOn);
                            if (!state) nOffs++;
                            else nOns++;
                            await this.setRelayState({ id: relayId, state: state });
                            //logger.info(`Sequencing relay: ${ relay.name } state: ${ state } delay: ${ seq.timeout + (state ? onDelay : offDelay) }`)
                            if (seq.timeout) await utils.wait(seq.timeout + (state ? onDelay : offDelay));
                            newState = state;
                        }
                        logger.info(`Sent a total of Ons:${nOns} and Offs:${nOffs} to relay`);
                        this.readContinuous();
                    }
                    else {
                        if (typeof data.state !== 'undefined') newState = utils.makeBool(data.state);
                        else if (typeof data.isOn !== 'undefined') newState = utils.makeBool(data.isOn);
                        else if (typeof data.isDiverted !== 'undefined') newState = utils.makeBool(data.isDiverted);
                        else newState = false;
                    }
                    break;
                default:
                    newState = typeof data.state !== 'undefined' ? utils.makeBool(data.state) : typeof data.isOn !== 'undefined' ? utils.makeBool(data.isOn) : false;
                    break;
            }
            let oldState = relay.state;
            if (newState !== oldState) {
                await this.setRelayState({ id: relayId, state: newState });
            }
            if (latch > 0) {
                this.latches.setLatch(relayId, async () => {
                    try {
                        await this.setRelayState({ id: relayId, state: !newState })
                        logger.warn(`Relay Latch timer expired ${relay.name}: ${latch}ms`);
                    } catch (err) { logger.error(`Error processing latch timer`); }
                }, latch);
                //let _lt = this._latchTimers[ordId];
                //if (typeof _lt !== 'undefined') clearTimeout(_lt);
                //this._latchTimers[ordId] = setTimeout(() => {
                //    this.setRelayState({ id: relayId, state: !newState });
                //}, latch);
            }
            return extend(true, {}, relay, { oldState: oldState, latchDuration: new Date().getTime() - relay.tripTime });
        } catch (err) { return Promise.reject(err); }
    }
    public async getDeviceState(binding: string | DeviceBinding): Promise<any> {
        try {
            let bind = (typeof binding === 'string') ? new DeviceBinding(binding) : binding;
            // We need to know what relay we are referring to.
            // i2c:1:24:3
            let relayId = parseInt(bind.params[0], 10);
            if (isNaN(relayId)) return Promise.reject(new Error(`getDeviceState: Invalid relay Id ${bind.params[0]}`));
            let relay = this.relays.find(elem => elem.id === relayId);
            if (typeof relay === 'undefined') return Promise.reject(new Error(`getDeviceState: Could not find relay Id ${bind.params[0]}`));
            if (!relay.enabled) return Promise.reject(new Error(`getDeviceState: Relay [${relay.name}] is not enabled.`));
            await this.readRelayState(relay);
            // Now that the relay has been read lets set its state.
            return relay.state;
        } catch (err) { return Promise.reject(err); }
    }
}
export class i2cRelayMulti extends i2cRelay {

}

export class SequentIO extends i2cDeviceBase {
    protected regs = {
        rs485Settings: 65,
        hwVersion: 120,  // 120 & 121 = major.(minor/100)
        fwVersion: 122,  // 122 & 123 = major.(minor/100)
        cpuTemp: 114,
        sourceVolts: 115,
        raspiVolts: 117,
        calStatus: 171,
        calValue: 60,
        calChannel: 62,
        calKey: 63
    };
    protected _timerRead: NodeJS.Timeout;
    protected _infoRead: NodeJS.Timeout;
    protected _suspendPolling: number = 0;
    protected _pollInformationInterval = 3000;
    protected logError(err, msg?: string) { logger.error(`${this.device.name} ${typeof msg !== 'undefined' ? msg + ' ' : ''}${typeof err !== 'undefined' ? err.message : ''}`); }
    protected createError(byte, command): Error {
        let err: Error;
        switch (byte) {
            case 255:
                err = new Error(`${this.device.address} ${command} No I2c data to send`);
                break;
            case 254:
                err = new Error(`${this.device.address} ${command} Still processing not ready`);
                break;
            case 2:
                err = new Error(`${this.device.address} ${command} Syntax error`);
                break;
        }
        return err;
    }
    protected escapeName(name: string): string { return name.substring(0, 15).replace(/\s+/g, '_'); }
    protected get version(): number { return typeof this.device !== 'undefined' && this.options !== 'undefined' && typeof this.device.info !== 'undefined' ? parseFloat(this.device.info.firmware) : 0 }
    protected processing = 0;
    protected _tries = 0;
    protected checkDiff(source, target) {
        if (typeof source !== typeof target) return true;
        if (Array.isArray(source)) {
            if (!Array.isArray(target)) return true;
            if (source.length !== target.length) return true;
            for (let i = 0; i < source.length; i++) {
                if (this.checkDiff(source[i], target[i])) return true;
            }
        }
        switch ((typeof source).toLowerCase()) {
            case 'bigint':
            case 'null':
            case 'symbol':
            case 'number':
            case 'string':
                return source !== target;
            case 'boolean':
                return utils.makeBool(source) != utils.makeBool(target);
            case 'object':
                for (let s in source) {
                    let val = source[s];
                    let tval = target[s];
                    if (typeof val === 'undefined') return true;
                    if (this.checkDiff(val, tval)) return true;
                }
                return false;
        }
    }
    protected ensureIOChannels(label, type, arr, count) {
        try {
            for (let i = 1; i <= count; i++) {
                if (typeof arr.find(elem => elem.id === i) === 'undefined') arr.push({ id: i, name: `${label} #${i}`, type: type, enabled: false });
            }
            arr.sort((a, b) => { return a.id - b.id });
            arr.length = count;
        } catch (err) { logger.error(`${this.device.name} error setting up I/O channels`) }
    }
    protected async readIOChannels(arr, fn) {
        try {
            for (let i = 0; i < arr.length; i++) {
                try {
                    if (arr[i].enabled !== true) continue; // Don't read inactive channels.
                    await fn.call(this, arr[i].id);
                } catch (err) { }
            }
        } catch (err) { }
    }
    public get relays() { return typeof this.values.relays === 'undefined' ? this.values.relays = [] : this.values.relays; }
    public set relays(val) { this.values.relays = val; }
    public get inputs(): any { return typeof this.values.inputs === 'undefined' ? this.values.inputs = {} : this.values.inputs; }
    public get outputs(): any { return typeof this.values.outputs === 'undefined' ? this.values.outputs = {} : this.values.outputs; }
    public get rs485() { return typeof this.options.rs485 === 'undefined' ? this.options.rs485 = { mode: 0, baud: 1200, stopBits: 1, parity: 0, address: 0 } : this.options.rs485; }
    public get in4_20(): any[] { return typeof this.inputs.in4_20 === 'undefined' ? this.inputs.in4_20 = [] : this.inputs.in4_20; }
    public get in0_10(): any[] { return typeof this.inputs.in0_10 === 'undefined' ? this.inputs.in0_10 = [] : this.inputs.in0_10; }
    public get inDigital(): any[] { return typeof this.inputs.inDigital === 'undefined' ? this.inputs.inDigital = [] : this.inputs.inDigital; }
    public get out4_20(): any[] { return typeof this.outputs.out4_20 === 'undefined' ? this.outputs.out4_20 = [] : this.outputs.out4_20; }
    public get out0_10(): any[] { return typeof this.outputs.out0_10 === 'undefined' ? this.outputs.out0_10 = [] : this.outputs.out0_10; }
    public get outDrain(): any[] { return typeof this.outputs.outDrain === 'undefined' ? this.outputs.outDrain = [] : this.outputs.outDrain; }
    public get calibration(): any { return typeof this.calibration === 'undefined' ? this.info.calibration = {} : this.info.calibration; }
    protected packRS485Port(port): Buffer {
        let buffer = Buffer.from([0, 0, 0, 0, 0]);
        buffer.writeUInt16LE(port.baud & 0x00FFFF, 0);
        buffer.writeUInt8((port.baud & 0xFF00000) >> 24, 2);
        buffer.writeUInt8(((port.stopBits & 0x0F) << 6) + ((port.parity & 0x0F) << 4) + (port.mode & 0xFF), 3);
        buffer.writeUInt8(port.address, 4);
        return buffer
    }
    protected async getRS485Port() {
        try {
            let ret: { bytesRead: number, buffer: Buffer } = this.i2c.isMock ?
                { bytesRead: 5, buffer: this.packRS485Port(extend(true, { mode: 0, baud: 38400, stopBits: 1, parity: 0, address: 1 }, this.rs485)) } : await this.i2c.readI2cBlock(this.device.address, this.regs.rs485Settings, 5);
            //{ bytesRead: 5, buffer: <Buffer 00 96 00 41 01 > }
            // [0, 150, 0, 65, 1]
            // This should be
            // mode: 1
            // baud: 38400
            // stopBits: 1
            // parity: 0
            // address: 1
            // It is returned from the buffer in packed bits.
            // Sequent folks are braindead here in that they bit encoded
            // this on uneven boundaries.
            //typedef struct
            //__attribute__((packed))
            //{
            //    unsigned int mbBaud: 24;
            //    unsigned int mbType: 4;
            //    unsigned int mbParity: 2;
            //    unsigned int mbStopB: 2;
            //    unsigned int add: 8;
            //} ModbusSetingsType;
            this.rs485.baud = ret.buffer.readUInt16LE(0) + (ret.buffer.readUInt8(2) << 24);
            let byte = ret.buffer.readUInt8(3);
            this.rs485.mode = byte & 0x0F;
            this.rs485.parity = (byte & 0x30) >> 4;
            this.rs485.stopBits = (byte & 0xC0) >> 6;
            this.rs485.address = ret.buffer.readUInt8(4);
        } catch (err) { logger.error(`${this.device.name} error getting RS485 port settings: ${err.message}`); }
    }
    protected async setRS485Port(port) {
        try {
            let p = extend(true, { mode: 1, baud: 38400, parity: 0, stopBits: 1, address: 1 }, this.rs485, port);
            if (p.baud > 920600 || p.baud < 1200) {
                logger.error(`${this.device.name} cannot set rs485 port baud rate to ${p.baud} [1200, 920600]`); return;
            }
            if (p.stopBits < 1 || p.stopBits > 2) {
                logger.error(`${this.device.name} cannot set rs485 port stop bits to ${p.stopBits} [1,2]`); return;
            }
            if (p.parity > 2 || p.parity < 0) {
                logger.error(`${this.device.name} cannot set rs485 port parity to ${p.stopBits} [0=none,1=even,2=odd]`); return;
            }
            if (p.address < 1 || p.address > 255) {
                logger.error(`${this.device.name} cannot set MODBUS address to ${p.address} [1,255]`); return;
            }
            if (p.mode > 1 || p.mode < 0) {
                logger.error(`${this.device.name} cannot set rs485 port mode to ${p.mode} [0 = pass thru, 1 = MODBUS RTU (slave)]`); return;
            }
            // Now we have to put together a buffer.  Just use brute force packing no need for a library.
            let buffer = this.packRS485Port(p);
            if (!this.i2c.isMock) await this.i2c.writeI2cBlock(this.device.address, this.regs.rs485Settings, 5, buffer);
            this.rs485.mode = p.mode;
            this.rs485.baud = p.baud;
            this.rs485.stopBits = p.stopBits;
            this.rs485.parity = p.parity;
            this.rs485.address = p.address;
        } catch (err) { logger.error(`${this.device.name} error setting RS485 port: ${err.message}`); }
    }
    protected async getHwFwVer() {
        try {
            if (this.i2c.isMock) {
                this.info.fwVersion = `1.0 Mock`;
                this.info.hwVersion = `0.1 Mock`
            }
            else {
                let hwBuf = await this.i2c.readI2cBlock(this.device.address, this.regs.hwVersion, 2);
                let fwBuf = await this.i2c.readI2cBlock(this.device.address, this.regs.fwVersion, 2);
                let hw = hwBuf.buffer.toJSON().data;
                let fw = fwBuf.buffer.toJSON().data;
                this.info.hwVersion = `${hw[0] + (hw[1] > 0 ? hw[1] / 100.0 : '.00')}`;
                this.info.fwVersion = `${fw[0] + (fw[1] > 0 ? fw[1] / 100.0 : '.00')}`;
            }
        } catch (err) { logger.error(`${this.device.name} error getting firmware version: ${err.message}`); }
    }
    protected async getCpuTemp() {
        try {
            this.info.cpuTemp = (this.i2c.isMock) ? Math.round(19.0 + Math.random()) : await this.i2c.readByte(this.device.address, this.regs.cpuTemp);
        } catch (err) { logger.error(`${this.device.name} error getting cpu temp: ${err.message}`); }
    }
    protected async getSourceVolts() {
        try {
            this.info.volts = (this.i2c.isMock) ? 24.0 + Math.random() : await this.i2c.readWord(this.device.address, this.regs.sourceVolts) / 1000;
        } catch (err) { logger.error(`${this.device.name} error getting source voltage: ${err.message}`); }
    }
    protected async getRaspVolts() {
        try {
            this.info.raspiVolts = (this.i2c.isMock) ? 5.0 + Math.random() : await this.i2c.readWord(this.device.address, this.regs.raspiVolts) / 1000;
        } catch (err) { logger.error(`${this.device.name} error getting Raspberry Pi voltage: ${err.message}`); }
    }
    protected async getCalibrationStatus(): Promise<number> {
        try {
            this.suspendPolling = true;
            // Sequent is really dissapointing with this.  They made this about a million times harder to determine which registers
            // map to which value.  Unless I decided to rebuild their repo and dump the values, I have to decipher there header file... booo!
            //CALIBRATION_KEY = 0xAA = 170
            //RESET_CALIBRATION_KEY = 0x55 = 85
            //60w: I2C_MEM_CALIB_VALUE = 60,
            //62w: I2C_MEM_CALIB_CHANNEL = I2C_MEM_CALIB_VALUE + 2, //0-10V out [1,4]; 0-10V in [5, 12]; R 1K in [13, 20]; R 10K in [21, 28]
            //63b: I2C_MEM_CALIB_KEY, //set calib point 0xaa; reset calibration on the channel 0x55
            //64b: I2C_MEM_CALIB_STATUS,
            let val = (this.i2c.isMock) ? (typeof this.calibration.status !== 'undefined' ? this.calibration.status.val : 1) : this.i2c.readByte(this.device.address, this.regs.calStatus);
            switch (val) {
                case 0:
                    this.calibration.status = { val: val, name: 'cal', desc: 'Calibration in progress' };
                    break;
                case 1:
                    this.calibration.status = { val: val, name: 'complete', desc: 'Calibration complete' };
                    break;
                case 2:
                    this.calibration.status = { val: val, name: 'error', desc: 'Calibration Error' };
                    break;
                default:
                    this.calibration.status = { val: val, name: 'unknown', desc: 'Unknown calibration status' };
                    break;
            }
            return val;
        } catch (err) { return Promise.reject(new Error(`${this.device.name} error getting calibration status: ${err.message}`)); }
        finally { this.suspendPolling = false; }
    }
    protected pollDeviceInformation() {
        try {
            if (this._infoRead) clearTimeout(this._infoRead);
            this._infoRead = null;
            if (!this.suspendPolling && this.device.isActive) {
                this.getDeviceInformation();
            }
        }
        catch (err) { this.logError(err, 'Error Polling Device Information'); }
        finally { this._infoRead = setTimeout(() => { this.pollDeviceInformation(); }, this._pollInformationInterval); }
    }
    protected async takeReadings(): Promise<boolean> { return true; }
    protected pollReadings() {
        try {
            if (this._timerRead) clearTimeout(this._timerRead);
            this._timerRead == null;
            if (!this.suspendPolling && this.device.isActive) {
                (async () => {
                    await this.takeReadings().catch(err => { logger.error(err); });
                })();
            }
        }
        catch (err) { this.logError(err, 'Error Polling Device Values'); }
        finally { this._timerRead = setTimeout(async () => { await this.pollReadings(); }, this.options.readInterval) }
    }
    public get suspendPolling(): boolean { if (this._suspendPolling > 0) logger.warn(`${this.device.name} Suspend Polling ${this._suspendPolling}`); return this._suspendPolling > 0; }
    public set suspendPolling(val: boolean) {
        //if(!val) logger.warn(`${this.device.name} Cancel Suspend Start ${this._suspendPolling} - End ${Math.max(0, this._suspendPolling + (val ? 1 : -1))}`);
        this._suspendPolling = Math.max(0, this._suspendPolling + (val ? 1 : -1));
    }
    public stopPolling() {
        this.suspendPolling = true;
        if (this._timerRead) clearTimeout(this._timerRead);
        if (this._infoRead) clearTimeout(this._infoRead);
        this._timerRead = this._infoRead = null;
        this._suspendPolling = 0;
    }
    public async getStatus(): Promise<boolean> {
        try {
            // Not sure what we wanto to poll here but I assume wdt and rtc when we get around to it.
            return Promise.resolve(true);
        }
        catch (err) { this.logError(err, `Error getting device status:`); return Promise.reject(err); }
        finally { this.suspendPolling = false; }
    }
    public async getDeviceInformation(): Promise<boolean> {
        try {
            this.suspendPolling = true;
            await this.getStatus();
            webApp.emitToClients('i2cDeviceInformation', { bus: this.i2c.busNumber, address: this.device.address, info: this.device.info });
        }
        catch (err) { logger.error(`Error retrieving device status: ${typeof err !== 'undefined' ? err.message : ''}`); return Promise.reject(err); }
        finally { this.suspendPolling = false; }
    }
    public async closeAsync(): Promise<void> {
        try {
            await this.stopPolling();
            await super.closeAsync();
            return Promise.resolve();
        }
        catch (err) { return this.logError(err); }
    }
    public async readWord(register: number): Promise<number> {
        try {
            let ret: { bytesRead: number, buffer: Buffer } = this.i2c.isMock ? {
                bytesRead: 2,
                buffer: Buffer.from([Math.round(256 * Math.random()), Math.round(256 * Math.random())])
            } : await this.i2c.readI2cBlock(this.device.address, register, 2);
            if (ret.bytesRead !== 2) return Promise.reject(new Error(`${this.device.name} error reading word from register ${register} bytes: ${ret.bytesRead}`));
            return ret.buffer.readUInt8(0) + (256 * ret.buffer.readUInt8(1));
        } catch (err) { }
    }
    public async readByte(register: number): Promise<number> {
        try {
            let ret: { bytesRead: number, buffer: Buffer } = this.i2c.isMock ? {
                bytesRead: 1,
                buffer: Buffer.from([Math.round(256 * Math.random())])
            } : await this.i2c.readI2cBlock(this.device.address, register, 1);
            if (ret.bytesRead !== 1) return Promise.reject(new Error(`${this.device.name} error reading byte from register ${register} bytes: ${ret.bytesRead}`));
            return ret.buffer.readUInt8(0);
        } catch (err) { logger.error(`Error reading ${this.device.name} register ${register}: ${err.message}`); }
    }
    public async writeWord(register: number, value: number) {
        try {
            let buff = Buffer.from([Math.floor(value % 256), Math.floor(value / 256)]);
            let ret: { bytesWritten: number, buffer: Buffer } = this.i2c.isMock ? {
                bytesWritten: 2,
                buffer: buff
            } : await this.i2c.writeI2cBlock(this.device.address, register, 2, buff);
        } catch (err) { }
    }
    protected async setIOChannelOptions(arr, target) {
        try {
            for (let i = 0; i < arr.length; i++) {
                let t = target.find(elem => elem.id == arr[i].id);
                if (typeof t !== 'undefined') {
                    utils.setObjectProperties(arr[i], t);
                }
            }
        } catch (err) { return Promise.reject(err); }
    }
    public calcMedian(prop: string, values: any[]) {
        let p = prop.toLowerCase();
        switch (p) {
            case 'cputempc':
            case 'cputempf':
            case 'cputempk':
            case 'inputvoltage':
            case 'pivoltage':
                return super.calcMedian(prop, values);
            case 'fwversion':
                return this.info.fwVersion;
            default:
                // Determine whether this is an object.
                if (p.startsWith('in') || p.startsWith('out')) {
                    if (values.length > 0 && typeof values[0] === 'object') {
                        let io = this.getValue(prop);
                        if (typeof io !== 'undefined') {
                            let vals = [];
                            for (let i = 0; i < values.length; i++) vals.push(values[i].value);
                            return extend(true, {}, io, { value: super.calcMedian(prop, vals) })
                        }
                    }
                    else return super.calcMedian(prop, values);
                }
                else logger.error(`${this.device.name} error calculating median value for ${prop}.`);
        }
    }
    protected async set4_20Output(ord, value) { logger.error(`${this.device.name} 4-20mA output not supported for channel ${ord}`); }
    protected async set0_10Output(ord, value) { logger.error(`${this.device.name} 0-10v output not supported for channel ${ord}`); }
    protected async setDrainOutput(ord, value) { logger.error(`${this.device.name} Open Drain output not supported for channel ${ord}`); }
    public setValue(prop: string, value) {
        let p = prop.toLowerCase();
        switch (p) {
            default:
                let sord = p[p.length - 1];
                let ord = parseInt(sord, 10);
                if (isNaN(ord) || ord <= 0 || ord >= 4) {
                    logger.error(`${this.device.name} error setting I/O ${prop} channel ${sord} out of range.`);
                    return;
                }
                if (p.startsWith('out4_20')) this.set4_20Output(ord, value);
                else if (p.startsWith('out0_10')) this.set0_10Output(ord, value);
                else if (p.startsWith('outDrain')) this.setDrainOutput(ord, value);
                else logger.error(`${this.device.name} error setting I/O channel ${prop} invalid I/O type.`);
                break;
        }
    }
    public async getDeviceState(binding: string | DeviceBinding): Promise<any> {
        try {
            let bind = (typeof binding === 'string') ? new DeviceBinding(binding) : binding;
            // We need to know what value we are referring to.
            if (typeof bind.params[0] === 'string') return this.getValue(bind.params[0]);
            return this.values;
        } catch (err) { return Promise.reject(err); }
    }
}
export class SequentMegaIND extends SequentIO {
    protected calDefinitions = {
        in0_10: { name: '0-10v input', idOffset: 9 },
        out0_10: { name: '0-10v output', idOffset: 1 },
        in4_20: { name: '4-20mA input', idOffset: 17 },
        out4_20: { name: '4-20mA output', idOffset: 5 },
        in0_10pm: { name: '+- 10v input', idOffset: 13 }
    }
    public async initAsync(deviceType): Promise<boolean> {
        try {
            this.stopPolling();
            if (typeof this.options.readInterval === 'undefined') this.options.readInterval = 3000;
            this.options.readInterval = Math.max(500, this.options.readInterval);
            if (typeof this.device.options.name !== 'string' || this.device.options.name.length === 0) this.device.name = this.device.options.name = deviceType.name;
            else this.device.name = this.device.options.name;
            if (this.device.isActive) {
                await this.getHwFwVer();
                await this.getStatus();
            }
            // Set up all the I/O channels.  We want to create a values data structure for all potential inputs and outputs.
            this.ensureIOChannels('IN 0-10', 'AIN', this.in0_10, 4);
            this.ensureIOChannels('OUT 0-10', 'AOUT', this.out0_10, 4);
            this.ensureIOChannels('IN 4-20', '420IN', this.in4_20, 4);
            this.ensureIOChannels('OUT 4-20', '420OUT', this.out4_20, 4);
            this.ensureIOChannels('IN Digital', 'DIN', this.inDigital, 4);
            this.ensureIOChannels('OUT Open Drain', 'ODOUT', this.outDrain, 4);
            if (this.device.isActive) await this.getRS485Port();
            return Promise.resolve(true);
        }
        catch (err) { this.logError(err); return Promise.resolve(false); }
        finally {
            setTimeout(() => { this.pollDeviceInformation(); }, 2000);
            setTimeout(() => { this.pollReadings(); }, 5000);
        }
    }
    public async getStatus(): Promise<boolean> {
        try {
            this.suspendPolling = true;
            await this.getSourceVolts();
            await this.getRaspVolts();
            await this.getCpuTemp();
            return true;
        }
        catch (err) { logger.error(`Error getting info ${typeof err !== 'undefined' ? err.message : ''}`); return Promise.reject(err); }
        finally { this.suspendPolling = false; }
    }
    public async takeReadings(): Promise<boolean> {
        try {
            // Read all the active inputs and outputs.
            await this.readDigitalInput();
            await this.readIOChannels(this.in0_10, this.get0_10Input);
            await this.readIOChannels(this.out0_10, this.get0_10Output);
            await this.readIOChannels(this.in4_20, this.get4_20Input);
            await this.readIOChannels(this.out4_20, this.get4_20Output);
            await this.readIOChannels(this.outDrain, this.getDrainOutput);
            // Read all the digital inputs.
            this.emitFeeds();
            return true;
        }
        catch (err) { this.logError(err, 'Error taking device readings'); }
    }
    protected async resetCal0_10Input(id) {
        try {
            this.suspendPolling = true;
            let io = this.in0_10[id - 1];
            await this.resetCalibration(io, io.plusMinus === true ? this.calDefinitions.in0_10pm : this.calDefinitions.in0_10);
        } catch (err) { logger.error(`${this.device.name} error resetting calibration 0-10v input: ${err.message}`); }
        finally { this.suspendPolling = false; }
    }
    protected async resetCal0_10Output(id) {
        try {
            this.suspendPolling = true;
            await this.resetCalibration(this.out0_10[id - 1], this.calDefinitions.out0_10);
        } catch (err) { logger.error(`${this.device.name} error resetting calibration 0-10v input: ${err.message}`); }
        finally { this.suspendPolling = false; }
    }
    protected async resetCal4_20Input(id) {
        try {
            this.suspendPolling = true;
            await this.resetCalibration(this.in4_20[id - 1], this.calDefinitions.in4_20);
        } catch (err) { logger.error(`${this.device.name} error resetting calibration 4-20mA input: ${err.message}`); }
        finally { this.suspendPolling = false; }
    }
    protected async resetCal4_20Output(id) {
        try {
            this.suspendPolling = true;
            await this.resetCalibration(this.out4_20[id - 1], this.calDefinitions.out4_20);
        } catch (err) { logger.error(`${this.device.name} error resetting calibration 4-20mA output: ${err.message}`); }
        finally { this.suspendPolling = false; }
    }
    protected async calibrate0_10Output(id, val) {
        try {
            this.suspendPolling = true;
            await this.calibrateChannel(this.out0_10[id - 1], this.calDefinitions.out0_10, val);
        } catch (err) { logger.error(`${this.device.name} error calibrating 0-10v output: ${err.message}`); }
        finally { this.suspendPolling = false; }
    }
    protected async calibrate0_10Input(id, val) {
        try {
            this.suspendPolling = true;
            let io = this.in0_10[id - 1];
            await this.calibrateChannel(io, io.plusMinus === true ? this.calDefinitions.in0_10pm : this.calDefinitions.in0_10, val);
        } catch (err) { logger.error(`${this.device.name} error calibrating 0-10v input: ${err.message}`); }
        finally { this.suspendPolling = false; }
    }
    protected async calibrate4_20Input(id, val) {
        try {
            this.suspendPolling = true;
            await this.calibrateChannel(this.in4_20[id - 1], this.calDefinitions.in4_20, val);
        } catch (err) { logger.error(`${this.device.name} error calibrating 4-20mA input: ${err.message}`); }
        finally { this.suspendPolling = false; }
    }
    protected async calibrate4_20Output(id, val) {
        try {
            this.suspendPolling = true;
            await this.calibrateChannel(this.out4_20[id - 1], this.calDefinitions.out4_20, val);
        } catch (err) { logger.error(`${this.device.name} error calibrating 4-20mA input: ${err.message}`); }
        finally { this.suspendPolling = false; }
    }
    protected async calibrateChannel(channel, cal, val) {
        try {
            this.suspendPolling = true;
            let v = Math.ceil(cal * 1000);
            let buff = Buffer.from([Math.floor(v / 256), cal - Math.floor(v / 256), channel.id + cal.idOffset, 170]);
            await this.i2c.writeI2cBlock(this.device.address, 60, buff, 4);
            await utils.wait(100); // Wait for 100ms to let our write take effect.
            await this.getCalibrationStatus();
        } catch (err) { logger.error(`${this.device.name} error calibrating ${cal.name}: ${err.message}`); }
        finally { this.suspendPolling = false; }
    }
    protected async resetCalibration(channel, cal) {
        try {
            this.suspendPolling = true;
            let buff = Buffer.from([0, 0, channel.id + cal.idOffset, 85]);
            await this.i2c.writeI2cBlock(this.device.address, 60, buff, 4);
            await utils.wait(100); // Wait for 100ms to let our write take effect.
            await this.getCalibrationStatus();
        } catch (err) { logger.error(`${this.device.name} error resetting calibration ${cal.name}: ${err.message}`); }
        finally { this.suspendPolling = false; }

    }
    protected async readDigitalInput() {
        try {
            // These are a bitmask so the should be read in one shot.
            let val = (this.i2c.isMock) ? 255 * Math.random() : await this.i2c.readByte(this.device.address, 3);
            // Set all the state values
            let chan = this.inDigital;
            for (let i = 0; i < chan.length; i++) {
                let ch = chan[i];
                let v = ((1 << (ch.id - 1)) & val) > 0 ? 1 : 0;
                if (ch.value !== v) {
                    ch.value = v;
                    webApp.emitToClients('i2cDataValues', { bus: this.i2c.busNumber, address: this.device.address, values: { inputs: { inDigital: [ch] } } });
                }
            }
        } catch (err) { logger.error(`${this.device.name} error getting digital inputs: ${err.message}`); }
    }
    protected async get0_10Input(id) {
        try {
            // 0-10v
            // Ch1: 28
            // Ch2: 30
            // Ch3: 32
            // Ch4: 34
            // +-10v
            // Ch1: 36
            // Ch2: 38
            // Ch3: 40
            // Ch4: 42
            let io = this.in0_10[id - 1];
            let val = (this.i2c.isMock) ? 10 * Math.random() : await this.readWord(((io.plusMinus === true) ? 28 : 36) + (2 * (id - 1))) / 1000;
            if (io.plusMinus === true) val -= 10;
            if (io.value !== val) {
                io.value = val;
                webApp.emitToClients('i2cDataValues', { bus: this.i2c.busNumber, address: this.device.address, values: { inputs: { in0_10: [io] } } });
            }
        } catch (err) { logger.error(`${this.device.name} error getting 0-10 input ${id}: ${err.message}`); }
    }
    protected async get0_10Output(id) {
        try {
            let val = (this.i2c.isMock) ? this.out0_10[id - 1].value || 0 : await this.i2c.readWord(this.device.address, 4 + (2 * (id - 1))) / 1000;
            let io = this.out0_10[id - 1];
            if (io.value !== val) {
                io.value = val;
                webApp.emitToClients('i2cDataValues', { bus: this.i2c.busNumber, address: this.device.address, values: { outputs: { out0_10: [io] } } });
            }
        } catch (err) { logger.error(`${this.device.name} error getting 0-10 output ${id}: ${err.message}`); }
    }
    protected async getDrainOutput(id) {
        try {
            // Ch1: 20
            // Ch2: 22
            // Ch3: 24
            // Ch4: 26
            let val = this.i2c.isMock ? this.outDrain[id - 1].value || 0 : await this.readWord(20 + (2 * (id - 1))) / 100;
            let io = this.outDrain[id - 1];
            if (io.value !== val) {
                io.value = val;
                webApp.emitToClients('i2cDataValues', { bus: this.i2c.busNumber, address: this.device.address, values: { outputs: { outDrain: [io] } } });
            }
        } catch (err) { logger.error(`${this.device.name} error getting open drain output ${id}: ${err.message}`); }
    }
    protected async setDrainOutput(id, val) {
        try {
            // Ch1: 20
            // Ch2: 22
            // Ch3: 24
            // Ch4: 26
            if (val < 0 || val > 100) throw new Error('Value must be between 0 and 100');
            if (!this.i2c.isMock) await this.writeWord(20 + (2 * (id - 1)), Math.round(val * 100));
            else { this.outDrain[id - 1].value = val; }
        } catch (err) { logger.error(`${this.device.name} error writing Open Drain output ${id}: ${err.message}`); }

    }
    protected async set0_10Output(id, val) {
        try {
            // Ch1: 4
            // Ch2: 6
            // Ch3: 8
            // Ch4: 10
            if (val < 0 || val > 10) throw new Error(`Value must be between 0 and 10`);
            if (!this.i2c.isMock) await this.writeWord(4 + (2 * (id - 1)), Math.round(val * 1000));
            this.out0_10[id - 1].value = val;
            let io = this.out0_10[id - 1];
            if (io.value !== val) {
                io.value = val;
                webApp.emitToClients('i2cDataValues', { bus: this.i2c.busNumber, address: this.device.address, values: { outputs: { out0_10: [io] } } });
            }
        } catch (err) { logger.error(`${this.device.name} error setting 0-10 output ${id}: ${err.message}`); }
    }
    protected async get4_20Input(id) {
        try {
            // Ch1: 44
            // Ch2: 46
            // Ch3: 48
            // Ch4: 50
            let val = await this.readWord(44 + (2 * (id - 1))) / 1000;
            let io = this.in4_20[id - 1];
            if (io.value !== val) {
                io.value = val;
                webApp.emitToClients('i2cDataValues', { bus: this.i2c.busNumber, address: this.device.address, values: { inputs: { in4_20: [io] } } });
            }

        } catch (err) { logger.error(`${this.device.name} error getting 4-20 input ${id}: ${err.message}`); }
    }
    protected async get4_20Output(id) {
        try {
            // Ch1: 12
            // Ch2: 14
            // Ch3: 16
            // Ch4: 18
            let val = this.i2c.isMock ? this.out4_20[id - 1].value || 4 : await this.readWord(12 + (2 * (id - 1))) / 1000;
            let io = this.out4_20[id - 1];
            if (io.value !== val) {
                io.value = val;
                webApp.emitToClients('i2cDataValues', { bus: this.i2c.busNumber, address: this.device.address, values: { outputs: { out4_20: [io] } } });
            }
        } catch (err) { logger.error(`${this.device.name} error getting 4-20 output ${id}: ${err.message}`); }
    }
    protected async set4_20Input(id, val) {
        try {
            if (val < 4 || val > 20) throw new Error(`Value must be between 4 and 20`);
            if (!this.i2c.isMock) await this.writeWord(44 + (2 * (id - 1)), val * 1000);
            this.in4_20[id - 1].value = val;
            let io = this.in4_20[id - 1];
            if (io.value !== val) {
                io.value = val;
                webApp.emitToClients('i2cDataValues', { bus: this.i2c.busNumber, address: this.device.address, values: { inputs: { in4_20: [io] } } });
            }
        } catch (err) { logger.error(`${this.device.name} error setting 4-20 input ${id}: ${err.message}`); }
    }
    protected async set4_20Output(id, val) {
        try {
            if (val < 4 || val > 20) throw new Error(`Value must be between 4 and 20`);
            if (!this.i2c.isMock) await this.writeWord(12 + (2 * (id - 1)), val * 1000);
            let io = this.out4_20[id - 1];
            if (io.value !== val) {
                io.value = val;
                webApp.emitToClients('i2cDataValues', { bus: this.i2c.busNumber, address: this.device.address, values: { outputs: { out4_20: [io] } } });
            }
        } catch (err) { logger.error(`${this.device.name} error setting 4-20 input ${id}: ${err.message}`); }
    }
    public async setOptions(opts): Promise<any> {
        try {
            this.suspendPolling = true;
            if (typeof opts.name !== 'undefined' && this.device.name !== opts.name) this.options.name = this.device.name = opts.name;
            if (typeof opts.rs485 !== 'undefined' && this.checkDiff(this.rs485, opts.rs485)) this.setRS485Port(opts.rs485);
            return Promise.resolve(this.options);
        }
        catch (err) { this.logError(err); Promise.reject(err); }
        finally { this.suspendPolling = false; }
    }
    public async setIOChannels(data): Promise<any> {
        try {
            if (typeof data.values !== 'undefined') {
                return await this.setValues(data.values);
            }
        }
        catch (err) { this.logError(err); Promise.reject(err); }
    }
    public async setValues(vals): Promise<any> {
        try {
            this.suspendPolling = true;
            if (typeof vals.inputs !== 'undefined') {
                if (typeof vals.inputs.in0_10 !== 'undefined') await this.setIOChannelOptions(vals.inputs.in0_10, this.in0_10);
                if (typeof vals.inputs.in4_20 !== 'undefined') await this.setIOChannelOptions(vals.inputs.in4_20, this.in4_20);
                if (typeof vals.inputs.inDigital !== 'undefined') await this.setIOChannelOptions(vals.inputs.inDigital, this.inDigital);
            }
            if (typeof vals.outputs !== 'undefined') {
                if (typeof vals.outputs.out0_10 !== 'undefined') {
                    await this.setIOChannelOptions(vals.outputs.out0_10, this.out0_10);
                    for (let i = 0; i < vals.outputs.out0_10.length; i++) {
                        let ch = vals.outputs.out0_10[i];
                        if (ch.enabled) await this.set0_10Output(ch.id, ch.value || 0);
                    }
                }
                if (typeof vals.outputs.out4_20 !== 'undefined') {
                    await this.setIOChannelOptions(vals.outputs.out4_20, this.out4_20);
                    for (let i = 0; i < vals.outputs.out4_20.length; i++) {
                        let ch = vals.outputs.out4_20[i];
                        if (ch.enabled) await this.set4_20Output(ch.id, ch.value || 4);
                    }
                }
                if (typeof vals.outputs.outDrain !== 'undefined') {
                    await this.setIOChannelOptions(vals.outputs.outDrain, this.outDrain);
                    for (let i = 0; i < vals.outputs.outDrain.length; i++) {
                        let ch = vals.outputs.outDrain[i];
                        if (ch.enabled) await this.setDrainOutput(ch.id, ch.value || 0);
                    }
                }
            }
            return Promise.resolve(this.values);
        }
        catch (err) { this.logError(err); Promise.reject(err); }
        finally { this.suspendPolling = false; }
    }
    public getDeviceDescriptions(dev) {
        let desc = [];
        let category = typeof dev !== 'undefined' ? dev.category : 'unknown';
        category = 'Digital Input';
        for (let i = 0; i < this.inDigital.length; i++) {
            let chan = this.inDigital[i];
            if (chan.enabled) desc.push({ type: 'i2c', isActive: this.device.isActive, name: chan.name, binding: `i2c:${this.i2c.busId}:${this.device.id}:inDigital.${i+1}`, category: category });
        }
        category = '0-10v Analog Input';
        for (let i = 0; i < this.in0_10.length; i++) {
            let chan = this.in0_10[i];
            if (chan.enabled) desc.push({ type: 'i2c', isActive: this.device.isActive, name: chan.name, binding: `i2c:${this.i2c.busId}:${this.device.id}:in0_10.${i+1}`, category: category });
        }
        category = '4-20mA Input';
        for (let i = 0; i < this.in4_20.length; i++) {
            let chan = this.in4_20[i];
            if (chan.enabled) desc.push({ type: 'i2c', isActive: this.device.isActive, name: chan.name, binding: `i2c:${this.i2c.busId}:${this.device.id}:in4_20.${i+1}`, category: category });
        }
        category = 'Open Drain Output';
        for (let i = 0; i < this.outDrain.length; i++) {
            let chan = this.outDrain[i];
            if (chan.enabled) desc.push({ type: 'i2c', isActive: this.device.isActive, name: chan.name, binding: `i2c:${this.i2c.busId}:${this.device.id}:outDrain.${i+1}`, category: category });
        }
        category = '0-10v Output';
        for (let i = 0; i < this.out0_10.length; i++) {
            let chan = this.out0_10[i];
            if (chan.enabled) desc.push({ type: 'i2c', isActive: this.device.isActive, name: chan.name, binding: `i2c:${this.i2c.busId}:${this.device.id}:out0_10.${i+1}`, category: category });
        }
        category = '4-20mA Output';
        for (let i = 0; i < this.out4_20.length; i++) {
            let chan = this.out4_20[i];
            if (chan.enabled) desc.push({ type: 'i2c', isActive: this.device.isActive, name: chan.name, binding: `i2c:${this.i2c.busId}:${this.device.id}:out4_20.${i+1}`, category: category });
        }
        return desc;
    }
    public getValue(prop: string) {
        // Steps to getting to our value.
        // 1. Determine whether input or output.
        // 2. Determine which array we are coming from.
        // 3. Map the IO number to the value.
        let p = prop.toLowerCase();
        switch (p) {
            case 'cputempc':
                return this.info.cpuTemp;
            case 'cputempf':
                return utils.convert.temperature.convertUnits(this.info.cpuTemp, 'C', 'F');
            case 'cputempk':
                return utils.convert.temperature.convertUnits(this.info.cpuTemp, 'C', 'K');
            case 'inputvoltage':
                return this.info.volts;
            case 'pivoltage':
                return this.info.rapsiVolts;
            case 'fwversion':
                return this.info.fwVersion;
            default:
                let iarr;
                if (p.startsWith('out4_20')) iarr = this.out4_20;
                else if (p.startsWith('in4_20')) iarr = this.in4_20;
                else if (p.startsWith('out0_10')) iarr = this.out0_10;
                else if (p.startsWith('in0_10')) iarr = this.in0_10;
                else if (p.startsWith('indigital')) iarr = this.inDigital;
                else if (p.startsWith('outdrain')) iarr = this.outDrain;
                if (typeof iarr === 'undefined') {
                    logger.error(`${this.device.name} error getting I/O channel ${prop}`);
                    return;
                }
                if (p.includes('4_20.') || p.includes('0_10.') || p.includes('digital.') || p.includes('drain.')){p=p.replace('.', '');} // If the prop gets sent in as in0_10.x convert back to in0_108 format.
                let parr = p.split('.');
                let sord = p[parr[0].length - 1];
                let ord = parseInt(sord, 10);
                if (isNaN(ord) || ord <= 0 || ord >= 5) {
                    logger.error(`${this.device.name} error getting I/O ${prop} channel ${sord} out of range.`);
                    return;
                }
                let chan = iarr[ord - 1];
                return (parr.length > 1) ? super.getValue(parr[1], chan) : chan;
        }
    }
}
export class SequentMegaBAS extends SequentIO {
    protected calDefinitions = {
        in0_10: { name: '0-10v input', idOffset: 9 },
        out0_10: { name: '0-10v output', idOffset: 1 },
        in4_20: { name: '4-20mA input', idOffset: 17 },
        out4_20: { name: '4-20mA output', idOffset: 5 },
        in0_10pm: { name: '+- 10v input', idOffset: 13 }
    }
    public async initAsync(deviceType): Promise<boolean> {
        try {
            // The Sequent cards pick registers at random between cards.  Not ideal but we simply override
            // these for the sequent card we are dealing with.
            // this.regs.hwVersion = 128;
            // this.regs.fwVersion = 129;
            this.stopPolling();
            if (typeof this.options.readInterval === 'undefined') this.options.readInterval = 3000;
            this.options.readInterval = Math.max(500, this.options.readInterval);
            if (typeof this.device.options.name !== 'string' || this.device.options.name.length === 0) this.device.name = this.device.options.name = deviceType.name;
            else this.device.name = this.device.options.name;
            if (this.device.isActive) {
                await this.getHwFwVer();
                await this.getStatus();
            }
            // Set up all the I/O channels.  We want to create a values data structure for all potential inputs and outputs.
            this.ensureIOChannels('IN 0-10', 'AIN', this.in0_10, 8);
            this.ensureIOChannels('OUT 0-10', 'AOUT', this.out0_10, 4);
            if (this.device.isActive) await this.getRS485Port();
            return Promise.resolve(true);
        }
        catch (err) { this.logError(err); return Promise.resolve(false); }
        finally {
            setTimeout(() => { this.pollDeviceInformation(); }, 2000);
            setTimeout(() => { this.pollReadings(); }, 5000);
        }
    }
    public async getStatus(): Promise<boolean> {
        try {
            this.suspendPolling = true;
            await this.getSourceVolts();
            await this.getRaspVolts();
            await this.getCpuTemp();
            return true;
        }
        catch (err) { logger.error(`Error getting info ${typeof err !== 'undefined' ? err.message : ''}`); return Promise.reject(err); }
        finally { this.suspendPolling = false; }
    }
    protected async readDryContact() {
        try {
            let val = (this.i2c.isMock) ? 255 * Math.random() : await this.readByte(3);
            for (let i = 0; i < this.in0_10.length; i++) {
                let ch = this.in0_10[i];
                if (ch.type === 'DIN') {
                    let v = ((1 << (ch.id - 1)) & val) > 0 ? 1 : 0;
                    if (ch.value !== v || ch.ioType !== 'digital') {
                        ch.ioType = 'digital';
                        ch.value = v;
                        webApp.emitToClients('i2cDataValues', { bus: this.i2c.busNumber, address: this.device.address, values: { inputs: { in0_10: [ch] } } });
                    }
                }
            }
        }
        catch (err) { logger.error(`${this.device.name} error getting dry contact inputs: ${err.message}`); }
    }
    protected async get0_10Input(id) {
        try {
            let io = this.in0_10[id - 1];
            // AIN = 12 - Start address for the 0-10v AIN.
            // T1k = 28 - Start address for the 1k temp probe.
            // T10k = 44 - Start address for the 10k temp probes.
            let baseReg = 12;
            if (io.type === 'T1k') {
                baseReg = 28;
                io.units = 'kohm';
            }
            else if (io.type === 'T10k') {
                baseReg = 44;
                io.units = 'kohm';
            }
            else if (io.type === 'DIN') {
                // We already got this by reading the digital inputs.
                return;
            }
            else io.units = 'volts';
            let val = (this.i2c.isMock) ? 10 * Math.random() : await this.readWord(baseReg + (2 * (id - 1))) / 1000;
            if (io.plusMinus === true) val -= 10;

            if (io.value !== val || io.ioType !== 'analog') {
                io.ioType = 'analog';
                io.value = val;
                webApp.emitToClients('i2cDataValues', { bus: this.i2c.busNumber, address: this.device.address, values: { inputs: { in0_10: [io] } } });
            }
        } catch (err) { logger.error(`${this.device.name} error getting analog input ${id}: ${err.message}`); }
    }
    protected async get0_10Output(id) {
        try {
            let val = (this.i2c.isMock) ? this.out0_10[id - 1].value || 0 : await this.i2c.readWord(this.device.address, 4 + (2 * (id - 1))) / 1000;
            let io = this.out0_10[id - 1];
            if (io.value !== val) {
                io.value = val;
                webApp.emitToClients('i2cDataValues', { bus: this.i2c.busNumber, address: this.device.address, values: { outputs: { out0_10: [io] } } });
            }
        } catch (err) { logger.error(`${this.device.name} error getting 0-10 output ${id}: ${err.message}`); }
    }
    protected async set0_10Output(id, val) {
        try {
            // Ch1: 4
            // Ch2: 6
            // Ch3: 8
            // Ch4: 10
            if (val < 0 || val > 10) throw new Error(`Value must be between 0 and 10`);
            if (!this.i2c.isMock) await this.writeWord(4 + (2 * (id - 1)), Math.round(val * 1000));
            let io = this.out0_10[id - 1];
            if (io.value !== val) {
                io.value = val;
                webApp.emitToClients('i2cDataValues', { bus: this.i2c.busNumber, address: this.device.address, values: { outputs: { out0_10: [io] } } });
            }
        } catch (err) { logger.error(`${this.device.name} error setting 0-10 output ${id}: ${err.message}`); }
    }

    public async takeReadings(): Promise<boolean> {
        try {
            await this.readDryContact();
            // Read all the active inputs and outputs.
            await this.readIOChannels(this.in0_10, this.get0_10Input);
            await this.readIOChannels(this.out0_10, this.get0_10Output);
            // Read all the digital inputs.
            this.emitFeeds();
            return true;
        }
        catch (err) { this.logError(err, 'Error taking device readings'); }
    }
    public async setOptions(opts): Promise<any> {
        try {
            this.suspendPolling = true;
            if (typeof opts.name !== 'undefined' && this.device.name !== opts.name) this.options.name = this.device.name = opts.name;
            if (typeof opts.rs485 !== 'undefined' && this.checkDiff(this.rs485, opts.rs485)) this.setRS485Port(opts.rs485);
            return Promise.resolve(this.options);
        }
        catch (err) { this.logError(err); Promise.reject(err); }
        finally { this.suspendPolling = false; }
    }
    public async setIOChannels(data): Promise<any> {
        try {
            if (typeof data.values !== 'undefined') {
                return await this.setValues(data.values);
            }
        }
        catch (err) { this.logError(err); Promise.reject(err); }
    }
    public async setValues(vals): Promise<any> {
        try {
            this.suspendPolling = true;
            if (typeof vals.inputs !== 'undefined') {
                if (typeof vals.inputs.in0_10 !== 'undefined') await this.setIOChannelOptions(vals.inputs.in0_10, this.in0_10);
                if (typeof vals.inputs.in4_20 !== 'undefined') await this.setIOChannelOptions(vals.inputs.in4_20, this.in4_20);
                if (typeof vals.inputs.inDigital !== 'undefined') await this.setIOChannelOptions(vals.inputs.inDigital, this.inDigital);
            }
            if (typeof vals.outputs !== 'undefined') {
                if (typeof vals.outputs.out0_10 !== 'undefined') {
                    await this.setIOChannelOptions(vals.outputs.out0_10, this.out0_10);
                    for (let i = 0; i < vals.outputs.out0_10.length; i++) {
                        let ch = vals.outputs.out0_10[i];
                        if (ch.enabled) await this.set0_10Output(ch.id, ch.value || 0);
                    }
                }
                if (typeof vals.outputs.out4_20 !== 'undefined') {
                    await this.setIOChannelOptions(vals.outputs.out4_20, this.out4_20);
                    for (let i = 0; i < vals.outputs.out4_20.length; i++) {
                        let ch = vals.outputs.out4_20[i];
                        if (ch.enabled) await this.set4_20Output(ch.id, ch.value || 4);
                    }
                }
                if (typeof vals.outputs.outDrain !== 'undefined') {
                    await this.setIOChannelOptions(vals.outputs.outDrain, this.outDrain);
                    for (let i = 0; i < vals.outputs.outDrain.length; i++) {
                        let ch = vals.outputs.outDrain[i];
                        if (ch.enabled) await this.setDrainOutput(ch.id, ch.value || 0);
                    }
                }
            }
            return Promise.resolve(this.options);
        }
        catch (err) { this.logError(err); Promise.reject(err); }
        finally { this.suspendPolling = false; }
    }
    public getDeviceDescriptions(dev) {
        let desc = [];
        let category = typeof dev !== 'undefined' ? dev.category : 'unknown';
        category = '0-10v Input';
        for (let i = 0; i < this.in0_10.length; i++) {
            let chan = this.in0_10[i];
            switch (chan.type) {
                case 'T10k':
                    category = '10k Thermistor';
                    break;
                case 'T1k':
                    category = '1k Thermistor';
                    break;
                case 'DIN':
                    category = 'Dry Contact';
                    break;
                default:
                    category = '0-10v Input';
                    break;
            }
            if (chan.enabled) desc.push({ type: 'i2c', isActive: this.device.isActive, name: chan.name, binding: `i2c:${this.i2c.busId}:${this.device.id}:in0_10.${i+1}`, category: category });
        }
        category = '0-10v Output';
        for (let i = 0; i < this.out0_10.length; i++) {
            let chan = this.out0_10[i];
            if (chan.enabled) desc.push({ type: 'i2c', isActive: this.device.isActive, name: chan.name, binding: `i2c:${this.i2c.busId}:${this.device.id}:out0_10.${i+1}`, category: category });
        }
        return desc;
    }
    public getValue(prop: string) {
        // Steps to getting to our value.
        // 1. Determine whether input or output.
        // 2. Determine which array we are coming from.
        // 3. Map the IO number to the value.
        let p = prop.toLowerCase();
        switch (p) {
            case 'cputempc':
                return this.info.cpuTemp;
            case 'cputempf':
                return utils.convert.temperature.convertUnits(this.info.cpuTemp, 'C', 'F');
            case 'cputempk':
                return utils.convert.temperature.convertUnits(this.info.cpuTemp, 'C', 'K');
            case 'inputvoltage':
                return this.info.volts;
            case 'pivoltage':
                return this.info.rapsiVolts;
            case 'fwversion':
                return this.info.fwVersion;
            default:
                let iarr;
                if (p.startsWith('out4_20')) iarr = this.out4_20;
                else if (p.startsWith('in4_20')) iarr = this.in4_20;
                else if (p.startsWith('out0_10')) iarr = this.out0_10;
                else if (p.startsWith('in0_10')) iarr = this.in0_10;
                if (typeof iarr === 'undefined') {
                    logger.error(`${this.device.name} error getting I/O channel ${prop}`);
                    return;
                }
                if (p.includes('4_20.') || p.includes('0_10.')){p=p.replace('.', '');} // If the prop gets sent in as in0_10.x convert back to in0_108 format.
                let parr = p.split('.');

                let sord = p[parr[0].length - 1];
                let ord = parseInt(sord, 10);
                if (isNaN(ord) || (p.startsWith('in') && (ord <= 0 || ord >= 9)) || (p.startsWith('out') && (ord <= 0 || ord >= 5))) {
                    logger.error(`${this.device.name} error getting I/O ${prop} channel ${sord} out of range.`);
                    return;
                }
                let chan = iarr[ord - 1];
                return (parr.length > 1) ? super.getValue(parr[1], chan) : chan;
        }
    }
}
export class Sequent4Rel4In extends SequentIO {
    protected calDefinitions = {
        in0_10: { name: '0-10v input', idOffset: 9 },
        out0_10: { name: '0-10v output', idOffset: 1 },
        in4_20: { name: '4-20mA input', idOffset: 17 },
        out4_20: { name: '4-20mA output', idOffset: 5 },
        in0_10pm: { name: '+- 10v input', idOffset: 13 }
    }
    public async initAsync(deviceType): Promise<boolean> {
        try {
            // The Sequent cards pick registers at random between cards.  Not ideal but we simply override
            // these for the sequent card we are dealing with.
            // this.regs.hwVersion = 128;
            // this.regs.fwVersion = 129;
            this.stopPolling();
            if (typeof this.options.readInterval === 'undefined') this.options.readInterval = 3000;
            this.options.readInterval = Math.max(500, this.options.readInterval);
            if (typeof this.device.options.name !== 'string' || this.device.options.name.length === 0) this.device.name = this.device.options.name = deviceType.name;
            else this.device.name = this.device.options.name;
            if (this.device.isActive) {
                await this.getHwFwVer();
                await this.getStatus();
            }
            // Set up all the I/O channels.  We want to create a values data structure for all potential inputs and outputs.
            this.ensureIOChannels('IN 0-10', 'AIN', this.in0_10, 8);
            this.ensureIOChannels('OUT 0-10', 'AOUT', this.out0_10, 4);
            if (this.device.isActive) await this.getRS485Port();
            return Promise.resolve(true);
        }
        catch (err) { this.logError(err); return Promise.resolve(false); }
        finally {
            setTimeout(() => { this.pollDeviceInformation(); }, 2000);
            setTimeout(() => { this.pollReadings(); }, 5000);
        }
    }
    public async getStatus(): Promise<boolean> {
        try {
            this.suspendPolling = true;
            await this.getSourceVolts();
            await this.getRaspVolts();
            await this.getCpuTemp();
            return true;
        }
        catch (err) { logger.error(`Error getting info ${typeof err !== 'undefined' ? err.message : ''}`); return Promise.reject(err); }
        finally { this.suspendPolling = false; }
    }
    protected async readDryContact() {
        try {
            let val = (this.i2c.isMock) ? 255 * Math.random() : await this.readByte(3);
            for (let i = 0; i < this.in0_10.length; i++) {
                let ch = this.in0_10[i];
                if (ch.type === 'DIN') {
                    let v = ((1 << (ch.id - 1)) & val) > 0 ? 1 : 0;
                    if (ch.value !== v || ch.ioType !== 'digital') {
                        ch.ioType = 'digital';
                        ch.value = v;
                        webApp.emitToClients('i2cDataValues', { bus: this.i2c.busNumber, address: this.device.address, values: { inputs: { in0_10: [ch] } } });
                    }
                }
            }
        }
        catch (err) { logger.error(`${this.device.name} error getting dry contact inputs: ${err.message}`); }
    }
    protected async get0_10Input(id) {
        try {
            let io = this.in0_10[id - 1];
            // AIN = 12 - Start address for the 0-10v AIN.
            // T1k = 28 - Start address for the 1k temp probe.
            // T10k = 44 - Start address for the 10k temp probes.
            let baseReg = 12;
            if (io.type === 'T1k') {
                baseReg = 28;
                io.units = 'kohm';
            }
            else if (io.type === 'T10k') {
                baseReg = 44;
                io.units = 'kohm';
            }
            else if (io.type === 'DIN') {
                // We already got this by reading the digital inputs.
                return;
            }
            else io.units = 'volts';
            let val = (this.i2c.isMock) ? 10 * Math.random() : await this.readWord(baseReg + (2 * (id - 1))) / 1000;
            if (io.plusMinus === true) val -= 10;

            if (io.value !== val || io.ioType !== 'analog') {
                io.ioType = 'analog';
                io.value = val;
                webApp.emitToClients('i2cDataValues', { bus: this.i2c.busNumber, address: this.device.address, values: { inputs: { in0_10: [io] } } });
            }
        } catch (err) { logger.error(`${this.device.name} error getting analog input ${id}: ${err.message}`); }
    }
    protected async get0_10Output(id) {
        try {
            let val = (this.i2c.isMock) ? this.out0_10[id - 1].value || 0 : await this.i2c.readWord(this.device.address, 4 + (2 * (id - 1))) / 1000;
            let io = this.out0_10[id - 1];
            if (io.value !== val) {
                io.value = val;
                webApp.emitToClients('i2cDataValues', { bus: this.i2c.busNumber, address: this.device.address, values: { outputs: { out0_10: [io] } } });
            }
        } catch (err) { logger.error(`${this.device.name} error getting 0-10 output ${id}: ${err.message}`); }
    }
    protected async set0_10Output(id, val) {
        try {
            // Ch1: 4
            // Ch2: 6
            // Ch3: 8
            // Ch4: 10
            if (val < 0 || val > 10) throw new Error(`Value must be between 0 and 10`);
            if (!this.i2c.isMock) await this.writeWord(4 + (2 * (id - 1)), Math.round(val * 1000));
            let io = this.out0_10[id - 1];
            if (io.value !== val) {
                io.value = val;
                webApp.emitToClients('i2cDataValues', { bus: this.i2c.busNumber, address: this.device.address, values: { outputs: { out0_10: [io] } } });
            }
        } catch (err) { logger.error(`${this.device.name} error setting 0-10 output ${id}: ${err.message}`); }
    }

    public async takeReadings(): Promise<boolean> {
        try {
            await this.readDryContact();
            // Read all the active inputs and outputs.
            await this.readIOChannels(this.in0_10, this.get0_10Input);
            await this.readIOChannels(this.out0_10, this.get0_10Output);
            // Read all the digital inputs.
            this.emitFeeds();
            return true;
        }
        catch (err) { this.logError(err, 'Error taking device readings'); }
    }
    public async setOptions(opts): Promise<any> {
        try {
            this.suspendPolling = true;
            if (typeof opts.name !== 'undefined' && this.device.name !== opts.name) this.options.name = this.device.name = opts.name;
            if (typeof opts.rs485 !== 'undefined' && this.checkDiff(this.rs485, opts.rs485)) this.setRS485Port(opts.rs485);
            return Promise.resolve(this.options);
        }
        catch (err) { this.logError(err); Promise.reject(err); }
        finally { this.suspendPolling = false; }
    }
    public async setIOChannels(data): Promise<any> {
        try {
            if (typeof data.values !== 'undefined') {
                return await this.setValues(data.values);
            }
        }
        catch (err) { this.logError(err); Promise.reject(err); }
    }
    public async setValues(vals): Promise<any> {
        try {
            this.suspendPolling = true;
            if (typeof vals.inputs !== 'undefined') {
                if (typeof vals.inputs.in0_10 !== 'undefined') await this.setIOChannelOptions(vals.inputs.in0_10, this.in0_10);
                if (typeof vals.inputs.in4_20 !== 'undefined') await this.setIOChannelOptions(vals.inputs.in4_20, this.in4_20);
                if (typeof vals.inputs.inDigital !== 'undefined') await this.setIOChannelOptions(vals.inputs.inDigital, this.inDigital);
            }
            if (typeof vals.outputs !== 'undefined') {
                if (typeof vals.outputs.out0_10 !== 'undefined') {
                    await this.setIOChannelOptions(vals.outputs.out0_10, this.out0_10);
                    for (let i = 0; i < vals.outputs.out0_10.length; i++) {
                        let ch = vals.outputs.out0_10[i];
                        if (ch.enabled) await this.set0_10Output(ch.id, ch.value || 0);
                    }
                }
                if (typeof vals.outputs.out4_20 !== 'undefined') {
                    await this.setIOChannelOptions(vals.outputs.out4_20, this.out4_20);
                    for (let i = 0; i < vals.outputs.out4_20.length; i++) {
                        let ch = vals.outputs.out4_20[i];
                        if (ch.enabled) await this.set4_20Output(ch.id, ch.value || 4);
                    }
                }
                if (typeof vals.outputs.outDrain !== 'undefined') {
                    await this.setIOChannelOptions(vals.outputs.outDrain, this.outDrain);
                    for (let i = 0; i < vals.outputs.outDrain.length; i++) {
                        let ch = vals.outputs.outDrain[i];
                        if (ch.enabled) await this.setDrainOutput(ch.id, ch.value || 0);
                    }
                }
            }
            return Promise.resolve(this.options);
        }
        catch (err) { this.logError(err); Promise.reject(err); }
        finally { this.suspendPolling = false; }
    }
    public getDeviceDescriptions(dev) {
        let desc = [];
        let category = typeof dev !== 'undefined' ? dev.category : 'unknown';
        category = '0-10v Input';
        for (let i = 0; i < this.in0_10.length; i++) {
            let chan = this.in0_10[i];
            switch (chan.type) {
                case 'T10k':
                    category = '10k Thermistor';
                    break;
                case 'T1k':
                    category = '1k Thermistor';
                    break;
                case 'DIN':
                    category = 'Dry Contact';
                    break;
                default:
                    category = '0-10v Input';
                    break;
            }
            if (chan.enabled) desc.push({ type: 'i2c', isActive: this.device.isActive, name: chan.name, binding: `i2c:${this.i2c.busId}:${this.device.id}:in0_10.${i+1}`, category: category });
        }
        category = '0-10v Output';
        for (let i = 0; i < this.out0_10.length; i++) {
            let chan = this.out0_10[i];
            if (chan.enabled) desc.push({ type: 'i2c', isActive: this.device.isActive, name: chan.name, binding: `i2c:${this.i2c.busId}:${this.device.id}:out0_10.${i+1}`, category: category });
        }
        return desc;
    }
    public getValue(prop: string) {
        // Steps to getting to our value.
        // 1. Determine whether input or output.
        // 2. Determine which array we are coming from.
        // 3. Map the IO number to the value.
        let p = prop.toLowerCase();
        switch (p) {
            case 'cputempc':
                return this.info.cpuTemp;
            case 'cputempf':
                return utils.convert.temperature.convertUnits(this.info.cpuTemp, 'C', 'F');
            case 'cputempk':
                return utils.convert.temperature.convertUnits(this.info.cpuTemp, 'C', 'K');
            case 'inputvoltage':
                return this.info.volts;
            case 'pivoltage':
                return this.info.rapsiVolts;
            case 'fwversion':
                return this.info.fwVersion;
            default:
                let iarr;
                if (p.startsWith('out4_20')) iarr = this.out4_20;
                else if (p.startsWith('in4_20')) iarr = this.in4_20;
                else if (p.startsWith('out0_10')) iarr = this.out0_10;
                else if (p.startsWith('in0_10')) iarr = this.in0_10;
                if (typeof iarr === 'undefined') {
                    logger.error(`${this.device.name} error getting I/O channel ${prop}`);
                    return;
                }
                if (p.includes('4_20.') || p.includes('0_10.')){p=p.replace('.', '');} // If the prop gets sent in as in0_10.x convert back to in0_108 format.
                let parr = p.split('.');

                let sord = p[parr[0].length - 1];
                let ord = parseInt(sord, 10);
                if (isNaN(ord) || (p.startsWith('in') && (ord <= 0 || ord >= 9)) || (p.startsWith('out') && (ord <= 0 || ord >= 5))) {
                    logger.error(`${this.device.name} error getting I/O ${prop} channel ${sord} out of range.`);
                    return;
                }
                let chan = iarr[ord - 1];
                return (parr.length > 1) ? super.getValue(parr[1], chan) : chan;
        }
    }
}
