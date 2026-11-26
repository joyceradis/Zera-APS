"""Regressão do modo consulta, com dados exclusivamente sintéticos."""
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect
root = Path(__file__).resolve().parents[1]
errors, external = [], []
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *_args): pass
with ThreadingHTTPServer(("127.0.0.1", 0), partial(Quiet, directory=str(root))) as server, sync_playwright() as p:
    Thread(target=server.serve_forever, daemon=True).start()
    opts = {"headless": True}
    if os.environ.get("CHROMIUM_EXECUTABLE"): opts["executable_path"] = os.environ["CHROMIUM_EXECUTABLE"]
    browser=p.chromium.launch(**opts)
    for width in (1280, 390, 320):
        page=browser.new_page(viewport={"width":width,"height":900})
        page.on("pageerror",lambda e:errors.append(str(e)))
        page.on("request",lambda r:external.append(r.url) if urlsplit(r.url).hostname!="127.0.0.1" else None)
        page.emulate_media(color_scheme="dark")
        page.goto(f"http://127.0.0.1:{server.server_port}/")
        expect(page.locator("#access-main")).to_be_visible()
        assert page.evaluate("getComputedStyle(document.documentElement).colorScheme")=="dark"
        page.locator("#theme-mode").select_option("light")
        assert page.evaluate("document.documentElement.dataset.theme")=="light"
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
        for example, criterion in (("glicada", "C4-E"), ("pes", "C4-F"), ("visita", "C3-J")):
            button = page.locator(f'[data-example="{example}"]')
            button.click()
            expect(button).to_have_attribute("aria-pressed", "true")
            page.locator(f"#{example} a").click()
            expect(page.locator("#detail-content")).to_contain_text(criterion)
            page.locator("#new-visit").click()
            expect(page.locator("#empty")).to_be_visible()
            assert not urlsplit(page.url).query
            page.go_back()
        for line, count in (("cronicos", 6), ("gestacao", 9), ("puerperio", 2), ("mulher", 4)):
            page.locator(f'a[href="consulta.html?linha={line}"]').click()
            assert page.locator("[data-action]").count() == count
            page.go_back()
        if os.environ.get("ZERA_REVIEW_DIR"):
            folder = Path(os.environ["ZERA_REVIEW_DIR"])
            folder.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(folder / f"landing-{width}.png"), full_page=True)
        page.locator("#access-main").click()
        expect(page).to_have_url(__import__("re").compile(r"/consulta\.html$"))
        assert page.evaluate("document.documentElement.dataset.theme")=="light"
        page.locator("#theme-mode").select_option("dark")
        assert page.evaluate("getComputedStyle(document.documentElement).backgroundColor")=="rgb(23, 29, 35)"
        page.locator("#theme-mode").select_option("auto")
        assert page.evaluate("getComputedStyle(document.documentElement).colorScheme")=="dark"
        expect(page.locator("#search")).to_be_visible()
        expect(page.locator("#empty")).to_be_visible()
        page.locator('input[value=has]').check()
        assert page.locator("[data-action]").count()==4
        page.locator('[data-review="C5-B"]').check()
        page.locator('input[value=dm]').check()
        assert page.locator("[data-action]").count()==6
        expect(page.locator('[data-review="C5-B"]')).to_be_checked()
        expect(page.locator('[data-review="C4-B"]')).not_to_be_checked()
        assert page.locator('[data-action="pa"]').count()==1
        page.locator("#search").fill("pés")
        expect(page.locator('[data-action="pes"]')).to_be_visible()
        page.locator('[data-action="pes"] .row-title').click()
        expect(page.locator("#detail-content")).to_contain_text("C4-F")
        expect(page.locator("#detail-content .source").first).to_be_visible()
        page.locator("#search").fill("I10")
        expect(page.locator('[data-action="consulta"]')).to_be_visible()
        assert page.locator("[data-action]").count() == 1
        for query, action in (("0301100039", "pa"), ("03.01.10.003-9", "pa"),
                              ("C4-E", "hba1c"), ("ABEX008", "hba1c"),
                              ("A1c", "hba1c"), ("hemoglobina glicada", "hba1c")):
            page.locator("#search").fill(query)
            expect(page.locator(f'[data-action="{action}"]')).to_be_visible()
        page.locator("#search").fill("não existe 987")
        expect(page.locator("#empty")).to_contain_text("Nenhum")
        page.locator("#search").fill("")
        page.evaluate("""() => {window.copied=[];Object.defineProperty(navigator,'clipboard',{value:{writeText:async v=>window.copied.push(v)}, configurable:true});}""")
        page.locator("#copy-soap").click()
        assert page.evaluate("window.copied.at(-1)")=="S: \nO: \nA: \nP: "
        page.locator("#copy-map").click()
        assert "NÃO COLAR NO PRONTUÁRIO" in page.evaluate("window.copied.at(-1)")
        page.locator('[data-action="pa"] [data-copy]').first.click()
        assert page.evaluate("window.copied.at(-1)")=="03.01.10.003-9"
        page.evaluate("""() => Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('denied')}},configurable:true})""")
        page.locator("#copy-soap").click()
        expect(page.locator("#copy-fallback")).to_be_visible()
        page.locator("#new-visit").click()
        expect(page.locator("#search")).to_be_focused()
        expect(page.locator("#empty")).to_be_visible()
        page.locator("#search").fill("HbA1c")
        expect(page.locator('[data-action="hba1c"]')).to_be_visible()
        page.locator("#search").fill("")
        page.locator('input[value=gestacao]').check()
        assert page.locator("[data-action]").count()==9
        page.locator('input[value=puerperio]').check()
        assert page.locator("[data-action]").count()==2
        expect(page.locator('input[value=gestacao]')).not_to_be_checked()
        page.locator("#new-visit").click()
        page.locator('input[value=mulher]').check()
        assert page.locator("[data-action]").count()==4
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
        assert page.evaluate("localStorage.length + sessionStorage.length")==0
        if os.environ.get("ZERA_REVIEW_DIR"):
            folder=Path(os.environ["ZERA_REVIEW_DIR"]);folder.mkdir(parents=True,exist_ok=True)
            page.screenshot(path=str(folder/f"consulta-{width}.png"),full_page=True)
        page.locator("#theme-mode").select_option("dark")
        page.reload()
        expect(page.locator("#empty")).to_be_visible()
        assert page.evaluate("document.documentElement.dataset.theme")=="dark"
        assert page.evaluate("Object.keys(localStorage).join()")=="zera-aps-theme"
        page.locator("#theme-mode").select_option("auto")
        page.close()
    browser.close()
assert not errors, errors
assert not external, external
print("PASS: consulta, multimorbidade, conferência por critério, busca, fontes, cópia, reset, responsividade e privacidade.")
