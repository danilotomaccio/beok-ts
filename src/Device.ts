import * as dgram from 'dgram';
import { IHost } from './types';
import * as aesjs from "aes-js";
import Utils from "./Utils";

export class Device {
    constructor(private mac: Buffer, private name: string, private devtype: number, private host: IHost) {
        this.mac = mac;
        this.name = name;
        this.devtype = devtype;
        this.host = host;
    }

    private id = Buffer.alloc(4);
    private count = (Math.random() * 100000) & 0xffff;
    private key: Uint8Array = new Uint8Array([0x09, 0x76, 0x28, 0x34, 0x3f, 0xe9, 0x9e, 0x23, 0x76, 0x5c, 0x15, 0x13, 0xac, 0xcf, 0x8b, 0x02]);
    private readonly iv = [0x56, 0x2e, 0x17, 0x99, 0x6d, 0x09, 0x3d, 0x28, 0xdd, 0xb3, 0xba, 0x69, 0x5a, 0x2e, 0x6f, 0x58];


    private connectionSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    private sendRequest = async (inputPayload: Buffer) => {
        let requestPayload = this.createRequestPayload(inputPayload);
        return await this.sendPacket(0x6a, Buffer.from(requestPayload));
    }

    private createRequestPayload = (inputPayload: Buffer): number[] => {
        let crc = Utils.calculateCRC(inputPayload);

        let requestPayload = [inputPayload.length + 2, 0x00];
        let d = inputPayload.toJSON().data;
        requestPayload = requestPayload.concat(d);

        requestPayload.push(crc & 0xFF);
        requestPayload.push((crc >> 8) & 0xFF);

        return requestPayload;
    }


    /**
     * Send the packet and wait for the first answer
     * 
     */
    sendPacket = (command: number, payload: Buffer): Promise<Buffer> => {
        const packet = this.createSendPacket(command, payload);

        return new Promise(
            (resolve, reject) => {
                this.connectionSocket.send(packet, 0, packet.length, this.host.port, this.host.address, (err) => {
                    if (err) {
                        return reject(err);
                    }
                });
                this.connectionSocket.once("message", (msg, remoteInfo) => resolve(msg));
            }
        );

    }


    createSendPacket = (command: number, payload: Buffer): Buffer => {
        this.count = (this.count + 1) & 0xffff;

        let packet = Buffer.alloc(0x38, 0);
        packet[0x00] = 0x5a;
        packet[0x01] = 0xa5;
        packet[0x02] = 0xaa;
        packet[0x03] = 0x55;
        packet[0x04] = 0x5a;
        packet[0x05] = 0xa5;
        packet[0x06] = 0xaa;
        packet[0x07] = 0x55;
        packet[0x24] = 173;
        packet[0x25] = 78;
        packet[0x26] = command;
        packet[0x28] = this.count & 0xff;
        packet[0x29] = this.count >> 8;
        packet[0x2a] = this.mac[0];
        packet[0x2b] = this.mac[1];
        packet[0x2c] = this.mac[2];
        packet[0x2d] = this.mac[3];
        packet[0x2e] = this.mac[4];
        packet[0x2f] = this.mac[5];
        packet[0x30] = this.id[0];
        packet[0x31] = this.id[1];
        packet[0x32] = this.id[2];
        packet[0x33] = this.id[3];

        let padding = (16 - payload.length) % 16;
        if (padding > 0) {
            payload = Buffer.concat([payload, Buffer.alloc(padding)]);
        }

        let checksum = payload.toJSON().data.reduce((a, b) => a + b, 0xbeaf);

        packet[0x34] = checksum & 0xff;
        packet[0x35] = checksum >> 8;

        const aesCbc = new aesjs.ModeOfOperation.cbc(this.key, this.iv);
        let encrPayload: Uint8Array = aesCbc.encrypt(payload);

        packet = Buffer.concat([packet, encrPayload]);

        checksum = packet.toJSON().data.reduce((a, b) => a + b, 0xbeaf) & 0xffff;
        packet[0x20] = checksum & 0xff;
        packet[0x21] = checksum >> 8;

        return packet;
    }


    auth = async () => {
        let payload = Buffer.alloc(0x50);
        payload[0x04] = 0x31;
        payload[0x05] = 0x31;
        payload[0x06] = 0x31;
        payload[0x07] = 0x31;
        payload[0x08] = 0x31;
        payload[0x09] = 0x31;
        payload[0x0a] = 0x31;
        payload[0x0b] = 0x31;
        payload[0x0c] = 0x31;
        payload[0x0d] = 0x31;
        payload[0x0e] = 0x31;
        payload[0x0f] = 0x31;
        payload[0x10] = 0x31;
        payload[0x11] = 0x31;
        payload[0x12] = 0x31;
        payload[0x1e] = 0x01;
        payload[0x2d] = 0x01;
        payload[0x30] = ('T').charCodeAt(0);
        payload[0x31] = ('e').charCodeAt(0);
        payload[0x32] = ('s').charCodeAt(0);
        payload[0x33] = ('t').charCodeAt(0);
        payload[0x34] = (' ').charCodeAt(0);
        payload[0x35] = (' ').charCodeAt(0);
        payload[0x36] = ('1').charCodeAt(0);

        let response = await this.sendPacket(0x65, payload);
        // TODO - check error

        const aesCbc = new aesjs.ModeOfOperation.cbc(this.key, this.iv);

        const subA = response.slice(0x38, response.length).toJSON().data;
        let decrRes = aesCbc.decrypt(subA);

        this.key = decrRes.slice(0x04, 0x14);
        if (this.key.length % 16 != 0) {
            return false;
        }

        this.id = payload.slice(0, 4).reverse();
        return true;
    }

    setTemp = async (temp: number) => {
        return this.sendRequest(Buffer.from([0x01, 0x06, 0x00, 0x01, 0x00, temp * 2]))
    }

    // TODO - Add other methods (e.g. getTemp)

}


