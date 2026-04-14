const dgram = require('dgram');

// Função para consultar o status de um servidor SA-MP
function queryServer(ip, port, callback) {
    const client = dgram.createSocket('udp4');
    const startTime = Date.now();

    const ipParts = ip.split('.').map(Number);
    const portNum = parseInt(port);

    // 👇 AGORA COM O 'i' NO FINAL
    const buffer = Buffer.alloc(11 + 1);
    buffer.write('SAMP', 0, 4, 'ascii');
    buffer.writeUInt8(ipParts[0], 4);
    buffer.writeUInt8(ipParts[1], 5);
    buffer.writeUInt8(ipParts[2], 6);
    buffer.writeUInt8(ipParts[3], 7);
    buffer.writeUInt16BE(portNum, 8);
    buffer.write('i', 10); // 🔥 ESSENCIAL

    const timeout = setTimeout(() => {
        client.close();
        callback(null);
    }, 2000);

    client.on('message', (msg) => {
        clearTimeout(timeout);
        client.close();

        const ping = Date.now() - startTime;

        if (msg.length < 11 || msg.toString('ascii', 0, 4) !== 'SAMP') {
            callback(null);
            return;
        }

        let offset = 11;

        const password = msg.readUInt8(offset);
        offset += 1;

        const players = msg.readUInt16LE(offset);
        offset += 2;

        const maxPlayers = msg.readUInt16LE(offset);
        offset += 2;

        const hostnameLen = msg.readUInt32LE(offset);
        offset += 4;

        const hostname = msg.toString('utf8', offset, offset + hostnameLen);
        offset += hostnameLen;

        callback({
            hostname: hostname, // 🔥 AGORA VEM O NOME REAL
            players: players,
            maxPlayers: maxPlayers,
            ping: ping,
            status: 'online'
        });
    });

    client.on('error', () => {
        clearTimeout(timeout);
        client.close();
        callback(null);
    });

    client.send(buffer, 0, buffer.length, portNum, ip, (err) => {
        if (err) {
            clearTimeout(timeout);
            client.close();
            callback(null);
        }
    });
}

module.exports = { queryServer };
