import http.server
import socketserver

PORT = 8000

Handler = http.server.SimpleHTTPRequestHandler
# Расширяем класс для поддержки .js как application/javascript
Handler.extensions_map['.js'] = 'application/javascript'
Handler.extensions_map['.mjs'] = 'application/javascript'

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("Сервер запущен на порту", PORT)
    httpd.serve_forever()