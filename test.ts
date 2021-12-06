import test, { ExecutionContext } from 'ava';
import { Device } from './src/Device';
import Utils from './src/Utils';

test('UTILS - calculateCRC', (t: ExecutionContext) => {

    const inputPayload = Buffer.from([1, 6, 0, 1, 0, 40]);
    const crc = Utils.calculateCRC(inputPayload);

    t.is(crc, 5336);
});

test('DEVICE - createSendPacket', (t: ExecutionContext) => {

    const payload = Buffer.from([0, 0, 0, 0, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 84, 101, 115, 116, 32, 32, 49, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,]);
    const command = 101;

    const device = new Device(Buffer.from([94, 38, 212, 119, 15, 120]), 'HVAC', 20141, { address: '192.168.0.123', port: 80 });

    (device as any).count = 30805;
    const packet = (device as any).createSendPacket(command, payload);


    compareBuffers(t, packet, Buffer.from([
        90, 165, 170, 85, 90, 165, 170, 85, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 93, 239, 0, 0, 173, 78, 101, 0, 86, 120, 94, 38, 212, 119, 15, 120, 0, 0, 0, 0, 161, 195, 0, 0, 69, 52, 82, 231, 249, 46, 218, 149, 131, 68, 147, 8, 53, 239, 154, 109, 251, 105, 45, 195, 112, 185, 4, 67, 172, 92, 214, 63, 187, 83, 173, 250, 8, 129, 76, 167, 248, 207, 65, 113, 0, 50, 142, 87, 12, 59, 134, 201, 77, 5, 112, 132, 73, 163, 137, 226, 154, 225, 4, 84, 54, 160, 91, 221, 220, 2, 193, 97, 175, 19, 37, 232, 126, 25, 176, 247, 209, 206, 6, 141,]));
});

test('DEVICE - createRequestPayload', (t: ExecutionContext) => {

    const inPayload = Buffer.from([1, 6, 0, 1, 0, 40]);
    const device = new Device(Buffer.from([94, 38, 212, 119, 15, 120]), 'HVAC', 20141, { address: '192.168.0.123', port: 80 });

    const reqPayload = (device as any).createRequestPayload(inPayload);

    t.deepEqual(reqPayload, [8, 0, 1, 6, 0, 1, 0, 40, 216, 20]);
});



function compareBuffers(t: ExecutionContext, b1: Buffer, b2: Buffer) {

    const b1Data = b1.toJSON().data;
    const b2Data = b2.toJSON().data;

    if (b1Data.length !== b2Data.length) {
        t.deepEqual(b1Data, b2Data, `Different length: ${b1Data.length} - ${b2Data.length}`)
    }

    for (let i = 0; i < b1Data.length; i++) {
        t.is(b1Data[i], b2Data[i], `Element ${i}:`);
    }

}