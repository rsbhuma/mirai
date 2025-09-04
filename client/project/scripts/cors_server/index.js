const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

app.use('/', createProxyMiddleware({
    target: 'http://localhost:8899',
    changeOrigin: true,
    on: {
        proxyReq: (proxyReq, req, res) => {
            /* handle proxyReq */
            // console.log("HHH EESS ", res, req);
        },
        proxyRes: (proxyRes, req, res) => {
            /* handle proxyRes */
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Headers'] = '*';
            // console.log("HHH ", res, req);
        },
        error: (err, req, res) => {
            /* handle error */
            console.log("EERR ", err);
        },
    },
    // onProxyRes(proxyRes, req, res) {
    //     proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    //     proxyRes.headers['Access-Control-Allow-Headers'] = '*';
    // }
}));

// app.get('/health', async (req, res) => {
//     try {
//         console.log("HHH");
//         const response = await fetch('http://localhost:8899/health');
//         const text = await response.text();
//         res.setHeader('Access-Control-Allow-Origin', '*');
//         res.send(text);
//     } catch (err) {
//         console.log("ERROR", err);
//         res.status(500).send('unhealthy');
//     }
// });

app.listen(2000, () => {
    console.log('CORS proxy listening on port 2000');
});