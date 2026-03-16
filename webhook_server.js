const http = require('http');
const url = require('url');

console.log('🚀 Webhook Server Starting...');
console.log('📡 Listening on http://localhost:9000');

// Simple webhook handler
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const params = parsedUrl.query;

    console.log(`📥 ${req.method} ${pathname}`);

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Route: /ping - Test endpoint
    if (pathname === '/ping') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'ok', 
            message: 'pong',
            time: new Date().toISOString()
        }));
        return;
    }

    // Route: /webhook - Receive data from external service
    if (pathname === '/webhook' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                console.log('📦 Received webhook data:', data);
                
                // Here you would process and forward to RedBook
                // Example: sendToRedBook(data);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    received: data 
                }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // Route: /redbook/post - Simulate posting to RedBook
    if (pathname === '/redbook/post') {
        const { content, images } = params;
        console.log('📝 Would post to RedBook:');
        console.log('   Content:', content);
        console.log('   Images:', images);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'simulated',
            message: 'In production, this would post to RedBook API',
            content: content
        }));
        return;
    }

    // 404
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(9000, () => {
    console.log('✅ Server ready!');
    console.log('');
    console.log('📌 Test endpoints:');
    console.log('   GET  /ping              - Test server');
    console.log('   POST /webhook           - Receive webhook data');
    console.log('   GET  /redbook/post?content=xxx - Simulate post');
});
