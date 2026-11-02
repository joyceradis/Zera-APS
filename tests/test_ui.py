"""Verificação de uso pelo navegador, sem acesso ao PEC nem requisições externas."""
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect

root = Path(__file__).resolve().parents[1]
capture_dir = os.environ.get("ZERA_REVIEW_DIR")
errors = []
external_requests = []

def visit(browser, width=1280):
    page = browser.new_page(viewport={"width": width, "height": 900})
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.on("request", lambda req: external_requests.append(req.url) if urlsplit(req.url).hostname != "127.0.0.1" else None)
    page.goto(base_url)
    return page

def choose(page, *conditions):
    for condition in conditions:
        page.locator(f'[name="condition"][value="{condition}"]').check()

def screenshot(page, name):
    if capture_dir:
        page.screenshot(path=str(Path(capture_dir) / name), full_page=True)

def no_overflow(page):
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1")

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass

with ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(root))) as server, sync_playwright() as p:
    Thread(target=server.serve_forever, daemon=True).start()
    base_url = f"http://127.0.0.1:{server.server_port}/"
    browser = p.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox"])
    page = visit(browser)
    expect(page.locator("#guide")).to_be_hidden()
    expect(page.locator("#build-guide")).to_be_disabled()
    assert page.locator('[name="condition"]:checked').count() == 0
    screenshot(page, "01-escolher-atendimento.png")

    # Multimorbidade: reunir navegação sem eliminar critérios, caminhos e ressalvas.
    choose(page, "has", "dm")
    page.locator("#build-guide").click()
    expect(page.locator("#guide-heading")).to_have_text("Hipertensão + Diabetes")
    assert page.locator(".action").count() == 6
    assert page.locator(".medical .action").count() == 5
    assert page.locator(".team .action").count() == 1
    pa = page.locator('[data-action="pa"]')
    pa.locator("summary").first.click()
    expect(pa.locator('.criterion[aria-label="C5-B"]')).to_contain_text("Antropometria")
    expect(pa.locator('.criterion[aria-label="C4-B"]')).to_contain_text("Sinais vitais")
    expect(pa).to_contain_text("Não substituir registro estruturado")
    assert pa.locator(".source-link").count() == 4

    # Busca dentro do roteiro, com acentos e referências diagnósticas restauradas.
    page.locator("#search").fill("pressao")
    assert page.locator(".action").count() == 1
    page.locator("#search").fill("I10")
    assert page.locator(".action").count() == 1
    page.locator("#search").fill("gestação")
    expect(page.locator("#no-results")).to_be_visible()
    page.locator("#search").fill("")

    # Marcação manual continua após filtrar; mudança de cenário limpa o estado.
    page.locator('[data-action="pes"] [data-review]').check()
    expect(page.locator("#review-summary")).to_have_text("1 de 6 itens conferidos manualmente")
    page.locator("#search").fill("pés")
    expect(page.locator('[data-action="pes"] [data-review]')).to_be_checked()
    page.locator("#search").fill("")
    screenshot(page, "02-roteiro-hipertensao-diabetes.png")
    page.locator("#edit-visit").click()
    expect(page.locator('[name="condition"][value="dm"]')).to_be_checked()
    page.locator("#build-guide").click()
    expect(page.locator("#review-summary")).to_have_text("0 de 6 itens conferidos manualmente")

    # Clipboard: verificar o texto entregue à API, sem gerar evolução fictícia.
    page.evaluate("""() => {
        window.copiedCodes = [];
        document.execCommand = command => {
            if (command === 'copy') window.copiedCodes.push(document.querySelector('textarea').value);
            return true;
        };
        Object.defineProperty(navigator, 'clipboard', {value: undefined, configurable: true});
    }""")
    pa = page.locator('[data-action="pa"]')
    pa.locator("summary").first.click()
    pa.locator(".codes summary").first.click()
    pa.locator("[data-copy]").first.click()
    assert page.evaluate("window.copiedCodes") == ["03.01.10.003-9"]
    expect(page.locator("#toast")).to_contain_text("O registro é feito no PEC")

    # Nova consulta apaga escolhas, resultados, busca, mensagens e marcações.
    page.locator("#new-visit").click()
    expect(page.locator("#setup")).to_be_visible()
    expect(page.locator("#guide")).to_be_hidden()
    assert page.locator('[name="condition"]:checked').count() == 0
    assert page.locator(".action").count() == 0
    expect(page.locator("#toast")).to_be_hidden()
    expect(page.locator("#build-guide")).to_be_disabled()

    # Fases obstétricas mutuamente exclusivas; nenhuma suposição de elegibilidade.
    choose(page, "prenatal")
    expect(page.locator("#build-guide")).to_be_disabled()
    page.locator('[name="phase"][value="gestacao"]').check()
    page.locator("#build-guide").click()
    expect(page.locator("#guide-heading")).to_have_text("Pré-natal")
    assert page.locator(".action").count() == 9
    assert page.locator('[data-action="consulta-puerperio"]').count() == 0
    expect(page.locator("#guide-context")).to_contain_text("A–H e K")
    expect(page.locator('[data-action="testes-primeiro"]')).to_contain_text("sífilis, HIV e hepatites B e C")
    assert page.locator('[data-action="bucal-gestacao"]').count() == 1
    page.locator("#edit-visit").click()
    page.locator('[name="phase"][value="puerperio"]').check()
    page.locator("#build-guide").click()
    assert page.locator(".action").count() == 2
    assert page.locator(".medical .action").count() == 1
    assert page.locator(".team .action").count() == 1
    expect(page.locator("#guide-heading")).to_have_text("Puerpério")

    # Gestação com HAS mantém critérios distintos, sem deduplicação por título.
    page.locator("#edit-visit").click()
    choose(page, "has")
    page.locator('[name="phase"][value="gestacao"]').check()
    page.locator("#build-guide").click()
    assert page.locator('[data-action="pa"]').count() == 1
    assert page.locator('[data-action="pa-prenatal"]').count() == 1
    numbers = page.locator('.number').all_text_contents()
    assert numbers == [str(n) for n in range(1, len(numbers) + 1)]
    page.reload()
    expect(page.locator('#guide')).to_be_hidden()
    assert page.locator('[name="condition"]:checked').count() == 0
    assert page.locator('[name="phase"]:checked').count() == 0
    expect(page.locator('#build-guide')).to_be_disabled()

    # Layout compacto, teclado e resultados detalhados em duas larguras estreitas.
    phone = visit(browser, 390)
    screenshot(phone, "03-celular-inicio.png")
    no_overflow(phone)
    choose(phone, "mulher")
    phone.locator("#build-guide").click()
    expect(phone.locator("#guide-context")).to_contain_text("não confirma elegibilidade")
    assert phone.locator(".medical .action").count() == 3
    assert phone.locator(".team .action").count() == 1
    phone.locator(".action-details summary").first.click()
    no_overflow(phone)
    screenshot(phone, "04-celular-roteiro.png")
    phone.set_viewport_size({"width": 320, "height": 740})
    no_overflow(phone)
    phone.locator("#new-visit").click()
    phone.locator('[name="condition"][value="has"]').focus()
    phone.keyboard.press("Space")
    expect(phone.locator('[name="condition"][value="has"]')).to_be_checked()
    expect(phone.locator("#build-guide")).to_be_enabled()
    no_overflow(phone)

    assert not errors, errors
    assert not external_requests, external_requests
    browser.close()
    server.shutdown()
    print("PASS: roteiro sem escolha inicial, HAS+DM com critérios preservados, busca, cópia, reset, fases obstétricas, equipes, teclado, 320/390px e zero requisições externas.")
