const express = require('express');
const servers = require('./data/servers');
const { queryServer } = require('./services/query');

const app = express();
const PORT = 3000;

// Middleware para JSON
app.use(express.json());

// Função auxiliar para parsear IP:PORTA
function parseIpPort(ipPort) {
    const [ip, port] = ipPort.split(':');
    return { ip, port: parseInt(port) };
}

// Rota GET /servers - Retorna lista de servidores com status
app.get('/servers', async (req, res) => {
    try {
        const results = [];

        // Para cada servidor, fazer query
        for (const server of servers) {
            const { ip, port } = parseIpPort(server.ip);

            // Promise para query
            const queryPromise = new Promise((resolve) => {
                queryServer(ip, port, (data) => {
                    if (data) {
                        resolve({
                            nome: data.hostname || server.nome,
                            ip: server.ip,
                            ...data
                        });
                    } else {
                        resolve({
                            nome: data.hostname || server.nome,
                            ip: server.ip,
                            players: 0,
                            maxPlayers: 0,
                            ping: 0,
                            status: 'offline'
                        });
                    }
                });
            });

            results.push(await queryPromise);
        }

        res.json(results);
    } catch (error) {
        console.error('Erro na rota /servers:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota GET /server/:ip - Consulta um servidor específico
app.get('/server/:ip', (req, res) => {
    try {
        const ipPort = req.params.ip;
        const { ip, port } = parseIpPort(ipPort);

        // Encontrar o servidor na lista (opcional, mas para nome)
        const server = servers.find(s => s.ip === ipPort);

        queryServer(ip, port, (data) => {
            if (data) {
                res.json({
                    nome: server ? server.nome : 'Desconhecido',
                    ip: ipPort,
                    ...data
                });
            } else {
                res.json({
                    nome: server ? server.nome : 'Desconhecido',
                    ip: ipPort,
                    players: 0,
                    maxPlayers: 0,
                    ping: 0,
                    status: 'offline'
                });
            }
        });
    } catch (error) {
        console.error('Erro na rota /server/:ip:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`API rodando na porta ${PORT}`);
});
