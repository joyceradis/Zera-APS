"""Smoke test da interface v0.2. Requer playwright e Chromium local.
python3 tests/test_ui.py
Não usa dados de pacientes e não exige serviços externos.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
html = (root / "index.html").read_text(encoding="utf-8")
css = (root / "styles.css").read_text(encoding="utf-8")
data = (root / "data" / "regras.js").read_text(encoding="utf-8")
js = (root / "app.js").read_text(encoding="utf-8")


def mount(page):
    page.set_content(html, wait_until="domcontentloaded")
    page.add_style_tag(content=css)
    page.add_script_tag(content=data)
    page.add_script_tag(content=js)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        headless=True,
        executable_path="/usr/bin/chromium",
        args=["--no-sandbox"],
    )
    page = browser.new_page(viewport={"width": 1440, "height": 960})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    mount(page)

    assert page.title() == "ZERA-APS · Espaço de trabalho"
    assert page.locator("#modules button").count() == 5
    assert page.locator("#rule-list .rule").count() == 4
    assert "Hipertensão" in page.locator("#work-heading").inner_text()
    assert page.locator("#metric-rules").inner_text().strip() == "21"

    page.locator('[data-expand="C5-A"]').click()
    assert page.locator('[data-rule="C5-A"] .rule-detail').count() == 1
    assert "Campo no PEC" in page.locator('[data-rule="C5-A"] .rule-detail').inner_text()

    page.locator('[data-review="C5-A"]').check()
    assert "1 de 4" in page.locator("#progress-title").inner_text()
    page.locator('[data-filter="revisados"]').click()
    assert page.locator("#rule-list .rule").count() == 1
    page.locator("#reset").click()
    assert "0 de 4" in page.locator("#progress-title").inner_text()

    page.locator('[data-module="dm"]').click()
    assert page.locator("#rule-list .rule").count() == 6
    page.locator('[data-module="mental"]').click()
    assert "Conteúdo ainda não homologado" in page.locator("#rule-list").inner_text()
    page.locator('[data-module="has"]').click()

    page.locator("#search-trigger").click()
    page.locator("#global-search").fill("I10")
    assert page.locator('#search-results [data-search-kind="code"]').count() >= 1
    page.locator("#search-close").click()
    assert not page.locator("#search-dialog").evaluate("(d) => d.open")

    page.locator("#all-codes").click()
    assert not page.locator("#view-codigos").is_hidden()
    page.locator("#code-search").fill("I10")
    assert page.locator("#code-library .library-row").count() >= 1

    page.locator('button[data-view="fontes"]').first.click()
    assert "Limitações" in page.locator("#view-fontes").inner_text()
    page.locator('button[data-view="piloto"]').first.click()
    assert "Contas" in page.locator("#view-piloto").inner_text() or "contas" in page.locator("#view-piloto").inner_text()

    assert not errors, errors

    page.locator('button[data-view="trabalho"]').first.click()
    page.screenshot(path=str(root / "tests" / "preview-desktop.png"), full_page=True)

    phone = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    mobile_errors = []
    phone.on("pageerror", lambda error: mobile_errors.append(str(error)))
    mount(phone)
    assert phone.locator("#modules button").count() == 5
    assert not phone.locator(".mobile-nav").is_hidden()
    overflow = phone.evaluate("document.documentElement.scrollWidth - window.innerWidth")
    assert overflow <= 2, f"Horizontal overflow: {overflow}px"
    phone.screenshot(path=str(root / "tests" / "preview-mobile.png"), full_page=True)
    assert not mobile_errors, mobile_errors

    browser.close()
    print("PASS: navigation, 5 modules, 21 rules, contextual details, review filters, code library, global search, mobile without overflow, zero JS errors")
