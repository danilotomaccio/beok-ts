export default class Utils {

    public static calculateCRC = (data: Buffer) => {
        let crc16_tab = [];
        let crc16_constant = 0xA001;

        for (let i = 0; i < 256; i++) {
            let crc = i;
            for (let j = 0; j < 8; j++) {
                if (crc & 0x0001) {
                    crc = (crc >> 1) ^ crc16_constant;
                } else {
                    crc = crc >> 1;
                }
            }
            crc16_tab.push('0x' + (crc).toString(16));
        }

        // calculate the 16-bit CRC of data with predetermined length.
        let crcValue = 0x0ffff;

        for (let b of data) {
            let tmp = crcValue ^ b; //parseInt(b, 16);
            let rotated = crcValue >> 8;
            crcValue = rotated ^ parseInt(crc16_tab[(tmp & 0x00FF)], 0)

        }
        return crcValue;
    }
}