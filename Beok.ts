import Device from "./Device";
import dgram = require('dgram');

export default class Beok {
    private static cs = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    public static devices = new Array<Device>();

    public static discover = (timeout: number): Promise<Array<Device>> => {

        let address = ("255.255.255.255").split('.');

        Beok.cs.on('listening', function () {
            Beok.cs.setBroadcast(true);

            var port = Beok.cs.address().port;
            var packet = Buffer.alloc(0x30, 0);

            packet[0x18] = parseInt(address[0]);
            packet[0x19] = parseInt(address[1]);
            packet[0x1a] = parseInt(address[2]);
            packet[0x1b] = parseInt(address[3]);
            packet[0x1c] = port & 0xff;
            packet[0x1d] = port >> 8;
            packet[0x26] = 6;
            var checksum = 0xbeaf;

            for (var i = 0; i < packet.length; i++) {
                checksum += packet[i];
            }
            checksum = checksum & 0xffff;
            packet[0x20] = checksum & 0xff;
            packet[0x21] = checksum >> 8;

            Beok.cs.send(packet, 0, packet.length, 80, '255.255.255.255');

        });


        Beok.cs.on("message", async (msg, rinfo) => {
            let host = rinfo;
            let mac = Buffer.alloc(6, 0);
            mac = msg.slice(0x3a, 0x40);
            let devtype = msg[0x34] | msg[0x35] << 8;

            let name = (msg.toString('utf8', 64, 69));

            Beok.devices.push(new Device(mac, name, devtype, host));
        });

        Beok.cs.bind();


        return new Promise((resolve) =>
            setTimeout(() => {
                Beok.cs.close();
                resolve(Beok.devices);
            }, timeout * 1000));
    }

}