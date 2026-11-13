"""Browser regression checks. Run: python tests/test_ui.py (Playwright + Chromium)."""
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect

root = Path(__file__).resolve().parents[1]
capture_dir = os.environ.get('ZERA_REVIEW_DIR')
errors, external_requests = [], []


def visit(browser, width=1280):
    page = browser.new_page(viewport={'width': width, 'height': 900})
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.on('request', lambda req: external_requests.append(req.url) if urlsplit(req.url).hostname != '127.0.0.1' else None)
    page.goto(base_url)
    return page


def choose(page, *conditions):
    for condition in conditions:
        if condition in ('prenatal', 'mulher') and not page.locator('.secondary-indicators').evaluate('(el) => el.open'):
            page.locator('.secondary-indicators > summary').click()
        page.locator(f'[name="condition"][value="{condition}"]').check()


def capture(page, name):
    if capture_dir:
        Path(capture_dir).mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(Path(capture_dir) / name), full_page=True)


def no_overflow(page):
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1')


def mock_clipboard(page):
    page.evaluate('''() => {
        window.copied = [];
        Object.defineProperty(navigator, 'clipboard', {value: {writeText: async value => window.copied.push(value)}, configurable: true});
    }''')


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


with ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(root))) as server, sync_playwright() as p:
    Thread(target=server.serve_forever, daemon=True).start()
    base_url = f'http://127.0.0.1:{server.server_port}/'
    launch_options = {'headless': True}
    if os.environ.get('CHROMIUM_EXECUTABLE'):
        launch_options['executable_path'] = os.environ['CHROMIUM_EXECUTABLE']
    browser = p.chromium.launch(**launch_options)
    page = visit(browser)
    expect(page.locator('#guide')).to_be_hidden()
    expect(page.locator('#empty-state')).to_be_visible()
    assert page.locator('[name="condition"]:checked').count() == 0
    capture(page, '01-desktop-inicio.png')

    choose(page, 'has', 'dm')
    expect(page.locator('#guide-heading')).to_have_text('Hipertensão + Diabetes')
    assert page.locator('.action').count() == 6
    assert page.locator('#action-list > .action').count() == 5
    assert page.locator('.team-lane .action').count() == 1
    pa = page.locator('[data-action="pa"]')
    pa.locator('.action-details > summary').click()
    expect(pa.locator('.criterion[aria-label="C5-B"]')).to_contain_text('Antropometria')
    expect(pa.locator('.criterion[aria-label="C4-B"]')).to_contain_text('Sinais vitais')
    assert pa.locator('.source-link').count() == 4
    pa.locator('.action-details > summary').click()
    page.locator('[data-action="pes"] [data-review]').check()
    expect(page.locator('#review-summary')).to_have_text('1 de 6 itens conferidos')
    page.locator('#search').fill('pés')
    expect(page.locator('[data-action="pes"] [data-review]')).to_be_checked()
    page.locator('#search').fill('I10')
    assert page.locator('.action').count() == 1
    assert page.locator('[data-action="consulta"]').count() == 1
    page.locator('#search').fill('naoexiste123')
    expect(page.locator('#no-results')).to_be_visible()
    page.locator('#clear-search').click()
    expect(page.locator('#search')).to_be_focused()
    page.locator('#search').fill('domiciliares')
    expect(page.locator('.team-lane .action')).to_be_visible()
    page.locator('#search').fill('')
    page.locator('#search').press('Enter')
    expect(page.locator('#guide')).to_be_visible()
    page.locator('#search').scroll_into_view_if_needed()
    page.evaluate('window.scrollTo(0,0)')
    capture(page, '02-desktop-roteiro.png')

    mock_clipboard(page)
    page.locator('#preview-soap').click()
    expect(page.locator('#soap-dialog')).to_be_visible()
    preview = page.locator('#soap-preview').inner_text()
    assert 'S: [Relato real.]' in preview and 'C4-F' in preview and 'C5-D' in preview
    page.locator('#copy-preview').click()
    expect(page.locator('#dialog-copy-status')).to_have_text('Rascunho copiado.')
    assert page.evaluate('window.copied.at(-1)') == preview
    page.keyboard.press('Escape')
    expect(page.locator('#soap-dialog')).to_be_hidden()
    expect(page.locator('#preview-soap')).to_be_focused()
    page.locator('#copy-soap-checklist').click()
    assert page.evaluate('window.copied.at(-1)') == preview
    pa = page.locator('[data-action="pa"]')
    pa.locator('.action-details > summary').click()
    pa.locator('.codes > summary').first.click()
    pa.locator('[data-copy]').first.click()
    assert page.evaluate('window.copied.at(-1)') == '03.01.10.003-9'

    # Clipboard denial must reveal a usable preview and a visible error in the dialog.
    page.evaluate('''() => {
        Object.defineProperty(navigator, 'clipboard', {value: {writeText: async () => {throw Error('denied')}}, configurable: true});
        document.execCommand = () => false;
    }''')
    page.locator('#copy-soap-checklist').click()
    expect(page.locator('#soap-dialog')).to_be_visible()
    expect(page.locator('#dialog-copy-status')).to_contain_text('Selecione e copie')
    page.keyboard.press('Escape')

    page.locator('#new-visit').click()
    expect(page.locator('#guide')).to_be_hidden()
    expect(page.locator('#empty-state')).to_be_visible()
    assert page.locator('[name="condition"]:checked').count() == 0
    assert page.locator('.action').count() == 0
    expect(page.locator('#toast')).to_be_hidden()
    choose(page, 'prenatal')
    expect(page.locator('#guide')).to_be_hidden()
    expect(page.locator('#empty-heading')).to_have_text('Qual é a fase do acompanhamento?')
    page.locator('[name="phase"][value="gestacao"]').check()
    assert page.locator('.action').count() == 9
    assert page.locator('[data-action="consulta-puerperio"]').count() == 0
    assert page.locator('[data-action="bucal-gestacao"]').count() == 1
    page.locator('[name="phase"][value="puerperio"]').check()
    assert page.locator('.action').count() == 2
    expect(page.locator('#guide-heading')).to_have_text('Puerpério')
    page.locator('[name="phase"][value="gestacao"]').check()
    choose(page, 'has')
    assert page.locator('[data-action="pa"]').count() == 1
    assert page.locator('[data-action="pa-prenatal"]').count() == 1
    numbers = page.locator('.number').all_text_contents()
    assert numbers == [str(n) for n in range(1, len(numbers) + 1)]
    page.locator('[data-review]').first.check()
    choose(page, 'dm')
    expect(page.locator('#review-summary')).to_contain_text('0 de ')
    page.reload()
    expect(page.locator('#guide')).to_be_hidden()
    assert page.locator('[name="condition"]:checked').count() == 0
    assert page.locator('[name="phase"]:checked').count() == 0

    for width in (390, 320, 768):
        phone = visit(browser, width)
        no_overflow(phone)
        if width == 390:
            capture(phone, '03-mobile-inicio.png')
        choose(phone, 'mulher')
        expect(phone.locator('#guide-context')).to_contain_text('não confirma elegibilidade')
        assert phone.locator('#action-list > .action').count() == 3
        assert phone.locator('.team-lane .action').count() == 1
        phone.locator('.action-details > summary').first.click()
        no_overflow(phone)
        if width == 390:
            capture(phone, '04-mobile-roteiro.png')
        phone.locator('#preview-soap').click()
        no_overflow(phone)
        phone.keyboard.press('Escape')
        phone.locator('#new-visit').click()
        phone.locator('[name="condition"][value="has"]').focus()
        phone.keyboard.press('Space')
        expect(phone.locator('[name="condition"][value="has"]')).to_be_checked()
        expect(phone.locator('#guide')).to_be_visible()
        no_overflow(phone)
        assert phone.evaluate('localStorage.length') == 0
        assert phone.evaluate('sessionStorage.length') == 0
        phone.close()
    assert not errors, errors
    assert not external_requests, external_requests
    browser.close()
    server.shutdown()
    print('PASS: seleção, critérios HAS+DM, busca, conferência, cópia/falha, prévia, reset, fases obstétricas, equipes, teclado, 320/390/768px, zero persistência e zero requisições externas.')
