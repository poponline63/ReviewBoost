const http = require('http');
const fs = require('fs');
const path = require('path');
http.createServer((req, res) => {
  let filePath = path.join('dist/public', req.url === '/' ? 'index.html' : req.url);
  try {
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css'};
    res.writeHead(200, {'Content-Type': types[ext] || 'application/octet-stream'});
    res.end(data);
  } catch {
    const data = fs.readFileSync('dist/public/index.html');
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(data);
  }
}).listen(4173, () => console.log('preview ready on 4173'));
