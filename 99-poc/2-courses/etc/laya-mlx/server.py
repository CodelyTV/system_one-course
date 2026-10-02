# /// script
# requires-python = ">=3.11,<3.14"
# dependencies = ["laya-mlx==0.2.0"]
# ///
import json
import os
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from laya_mlx import Router

HOST = os.environ.get("LAYA_MLX_HOST", "127.0.0.1")
PORT = int(os.environ.get("LAYA_MLX_PORT", "58001"))
API_KEY = os.environ.get("LAYA_MLX_API_KEY", "courses-laya-mlx")
MODELS = ["english", "multilingual"]

router = Router(max_loaded=len(MODELS))
router.preload(MODELS)
inference_lock = threading.Lock()


class SystemOneHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def do_GET(self):
        if self.path != "/health":
            self.respond(404, {"detail": "not found"})
            return

        self.respond(200, {"status": "ok", "loaded": router.loaded})

    def do_POST(self):
        if self.path != "/v1/systemone":
            self.respond(404, {"detail": "not found"})
            return

        if self.headers.get("Authorization") != f"Bearer {API_KEY}":
            self.respond(401, {"detail": "invalid api key"})
            return

        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))

        try:
            with inference_lock:
                started_at = time.perf_counter()
                result = router.predict(body.get("state"), body["questions"])
                inference_ms = (time.perf_counter() - started_at) * 1000
        except ValueError as error:
            self.respond(422, {"detail": str(error)})
            return

        self.respond(200, result, {"X-Inference-Time-Ms": f"{inference_ms:.2f}"})

    def respond(self, status, payload, headers=None):
        content = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(content)))
        for name, value in (headers or {}).items():
            self.send_header(name, value)
        self.end_headers()
        self.wfile.write(content)

    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    print(f"Laya MLX listening on http://{HOST}:{PORT}/v1/systemone with {router.loaded}", flush=True)
    ThreadingHTTPServer((HOST, PORT), SystemOneHandler).serve_forever()
