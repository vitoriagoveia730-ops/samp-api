const dgram = require('dgram');

// Função para consultar o status de um servidor SA-MP
function queryServer(ip, port, callback) {
    const client = dgram.createSocket('udp4');
    const startTime = Date.now();

    // Preparar o pacote de query
    const ipParts = ip.split('.').map(Number);
    const portNum = parseInt(port);

    // Buffer: 'SAMP' (4 bytes) + IP (4 bytes) + Porta (2 bytes)
    const buffer = Buffer.alloc(11);
    buffer.write('SAMP', 0, 4, 'ascii');
    buffer.writeUInt8(ipParts[0], 4);
    buffer.writeUInt8(ipParts[1], 5);
    buffer.writeUInt8(ipParts[2], 6);
    buffer.writeUInt8(ipParts[3], 7);
    buffer.writeUInt16BE(portNum, 8);

    // Timeout de 2 segundos
    const timeout = setTimeout(() => {
        client.close();
        callback(null); // Offline
    }, 2000);

    client.on('message', (msg, rinfo) => {
        clearTimeout(timeout);
        client.close();

        const ping = Date.now() - startTime;

        // Verificar se a resposta começa com 'SAMP'
        if (msg.length < 11 || msg.toString('ascii', 0, 4) !== 'SAMP') {
            callback(null);
            return;
        }

        // Pular 'SAMP' + IP + Porta (11 bytes)
        let offset = 11;

        // Password (1 byte)
        const password = msg.readUInt8(offset);
        offset += 1;

        // Players (2 bytes)
        const players = msg.readUInt16LE(offset);
        offset += 2;

        // Max Players (2 bytes)
        const maxPlayers = msg.readUInt16LE(offset);
        offset += 2;

        // Hostname length (4 bytes)
        const hostnameLen = msg.readUInt32LE(offset);
        offset += 4;

        // Hostname
        const hostname = msg.toString('utf8', offset, offset + hostnameLen);
        offset += hostnameLen;

        // Outros campos não necessários para esta API

        callback({
            players: players,
            maxPlayers: maxPlayers,
            ping: ping,
            status: 'online'
        });
    });

    client.on('error', (err) => {
        clearTimeout(timeout);
        client.close();
        callback(null);
    });

    // Enviar o pacote
    client.send(buffer, 0, buffer.length, portNum, ip, (err) => {
        if (err) {
            clearTimeout(timeout);
            client.close();
            callback(null);
        }
    });
}

module.exports = { queryServer };
