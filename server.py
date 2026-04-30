"""
PulseraInnova — Servidor proxy para NVIDIA NIM API
Resuelve el bloqueo de CORS al hacer las llamadas desde el navegador.
También sirve los archivos estáticos (index.html).
Ejecutar: python server.py
Acceder: http://localhost:8080
"""
import http.server
import json
import urllib.request
import urllib.error
import ssl

PORT = 8080
NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"

class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        """Manejar preflight CORS"""
        self.send_response(200)
        self._cors_headers()
        self.end_headers()

    def do_POST(self):
        """Proxy para la API de NVIDIA"""
        if self.path == "/api/nvidia":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)

            # Obtener API key del header del cliente
            api_key = self.headers.get("X-Nvidia-Key", "")

            req = urllib.request.Request(
                NVIDIA_API_URL,
                data=json.dumps(data).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                },
                method="POST",
            )

            # Desactivar verificación SSL para evitar errores en algunos entornos
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE

            try:
                with urllib.request.urlopen(req, timeout=15, context=ctx) as resp:
                    result = resp.read()
                    self.send_response(200)
                    self._cors_headers()
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(result)
            except urllib.error.HTTPError as e:
                error_body = e.read().decode("utf-8", errors="replace")
                self.send_response(e.code)
                self._cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(error_body.encode("utf-8"))
            except Exception as e:
                self.send_response(502)
                self._cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": {"message": str(e)}}).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Nvidia-Key")

    def log_message(self, format, *args):
        # Log más limpio
        print(f"[{self.log_date_time_string()}] {format % args}")

if __name__ == "__main__":
    print(f"[OK] PulseraInnova server en http://localhost:{PORT}")
    print(f"   Proxy NVIDIA: POST /api/nvidia")
    print(f"   Archivos estaticos: /index.html")
    server = http.server.HTTPServer(("", PORT), ProxyHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[STOP] Servidor detenido")
