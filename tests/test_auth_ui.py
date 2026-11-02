"""End-to-end do login, convites, favoritos e isolamento, somente com contas fictícias.
Requisitos: Node.js >=22.13; Python playwright; Chromium.
Executar: python3 tests/test_auth_ui.py
Este arquivo NÃO foi executado em navegador real pela sessão de desenvolvimento.
"""
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.request import Request, urlopen
from urllib.error import URLError
import os
import re
import socket
import subprocess
import time
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
ADMIN_EMAIL = "admin-ui@example.test"
DOCTOR_EMAIL = "medico-ui@example.test"
ADMIN_PASS = "forte-senha-exclusiva-admin-2026"
DOCTOR_PASS = "forte-senha-exclusiva-medico-2026"

def find_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]

with TemporaryDirectory(prefix="zera-ui-") as temporary:
    port = find_port()
    origin = f"http://127.0.0.1:{port}"
    env = os.environ.copy()
    env.update({"PORT": str(port), "APP_ORIGIN": origin, "HOST": "127.0.0.1",
                "ZERA_DB_PATH": str(Path(temporary) / "pilot.sqlite"),
                "ZERA_MAX_DOCTORS": "2", "NODE_ENV": "test"})
    bootstrap = subprocess.run(
        ["node", "server/cli.mjs", "bootstrap-admin", ADMIN_EMAIL],
        cwd=ROOT, env=env, capture_output=True, text=True, check=True
    )
    # Não imprimir o convite confidencial.
    admin_link = next(line.strip() for line in bootstrap.stdout.splitlines()
                      if line.startswith(origin + "/login#convite="))
    server = subprocess.Popen(["node", "server/launch.mjs"],
        cwd=ROOT, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(100):
            if server.poll() is not None:
                raise RuntimeError("Servidor terminou antes do teste")
            try:
                with urlopen(Request(origin + "/healthz"), timeout=1) as response:
                    if response.status == 200:
                        break
            except (OSError, URLError):
                time.sleep(.1)
        else:
            raise RuntimeError("Servidor local não ficou pronto")
        with sync_playwright() as p:
            options = {"headless": True}
            if Path("/usr/bin/chromium").exists():
                options.update({"executable_path": "/usr/bin/chromium",
                                "args": ["--no-sandbox"]})
            browser = p.chromium.launch(**options)
            admin_context = browser.new_context(viewport={"width": 1440, "height": 900})
            admin = admin_context.new_page()
            errors = []
            admin.on("pageerror", lambda error: errors.append(str(error)))
            admin.goto(admin_link)
            admin.locator("#email").fill(ADMIN_EMAIL)
            admin.locator("#password").fill(ADMIN_PASS)
            admin.locator("#submit").click()
            admin.wait_for_url(origin + "/")
            admin.wait_for_function("() => !!window.ZERA_AUTH?.openAccount")
            admin.locator("#profile-button").click()
            dialog = admin.locator(".account-dialog")
            assert dialog.is_visible()
            dialog.locator("form input[type=email]").fill(DOCTOR_EMAIL)
            dialog.locator("form select").select_option("doctor")
            dialog.locator("form button[type=submit]").click()
            expect(dialog.locator("form input[readonly]")).to_have_value(re.compile(r"/login#convite="))
            link = dialog.locator("form input[readonly]").input_value()
            assert "/login#convite=" in link
            dialog.get_by_text("Fechar").click()
            doctor_context = browser.new_context(viewport={"width": 1360, "height": 900})
            doctor = doctor_context.new_page()
            doctor.goto(link)
            doctor.locator("#email").fill(DOCTOR_EMAIL)
            doctor.locator("#password").fill(DOCTOR_PASS)
            doctor.locator("#submit").click()
            doctor.wait_for_url(origin + "/")
            doctor.wait_for_function("() => !!window.ZERA_AUTH?.toggleBookmark")
            doctor.locator('[data-bookmark="C5-A"]').click()
            expect(doctor.locator('[data-bookmark="C5-A"]')).to_have_attribute("aria-pressed", "true")
            doctor.reload()
            expect(doctor.locator('[data-bookmark="C5-A"]')).to_have_attribute("aria-pressed", "true")
            assert doctor_context.request.get(origin + "/api/team").status == 403
            doctor.locator("#profile-button").click()
            assert DOCTOR_EMAIL in doctor.locator(".account-dialog").inner_text()
            doctor.locator(".account-dialog").get_by_text("Encerrar sessão").click()
            doctor.wait_for_url(origin + "/login")
            doctor_context.close()
            assert not errors, errors
            admin_context.close()
            browser.close()
        print("PASS: convite, login administrador, criação de médico, isolamento de contas, favoritos persistentes e logout.")
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()
            server.wait()
