from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
styles=(root/'styles.css').read_text()
data=(root/'data'/'regras.js').read_text()
app=(root/'app.js').read_text()
def mount(page):
    page.set_content(html,wait_until='domcontentloaded')
    page.add_style_tag(content=styles)
    page.add_script_tag(content=data)
    page.add_script_tag(content=app)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1360,'height':960},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda exc:errors.append(str(exc)))
    mount(page)
    assert page.title()=='Zera-APS · Guia de registro na APS'
    assert page.locator('#modules button').count()==5
    assert page.locator('.rule').count()==4
    assert '4 orientações' in page.locator('#panel-summary').inner_text()
    page.locator('.rule-checkbox').first.check()
    assert '1 de 4' in page.locator('#progress-title').inner_text()
    page.locator('#reset').click()
    assert '0 de 4' in page.locator('#progress-title').inner_text()
    page.locator('#search').fill('pressão')
    assert page.locator('.rule').count() >= 3
    assert 'Resultados' in page.locator('#panel-heading').inner_text()
    page.locator('#search').fill('03.01.10.003-9')
    assert page.locator('.code-row').count()>=1
    page.locator('#search').fill('')
    page.locator('[data-module="mental"]').click()
    assert 'Conteúdo ainda não homologado' in page.locator('#rule-list').inner_text()
    page.locator('[data-module="dm"]').click()
    assert page.locator('.rule').count()==6
    page.locator('[data-module="has"]').click()
    page.locator('[data-toggle="C5-B"]').click()
    assert 'Antropometria' in page.locator('[data-rule="C5-B"] .rule-body').inner_text()
    assert not errors,errors
    page.screenshot(path=str(root/'tests'/'preview-desktop.png'),full_page=True)
    phone=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
    mount(phone)
    assert phone.locator('#modules button').count()==5
    over=phone.evaluate('document.documentElement.scrollWidth - window.innerWidth')
    assert over<=2,f'horizontal overflow {over}'
    phone.screenshot(path=str(root/'tests'/'preview-mobile.png'),full_page=True)
    browser.close()
    print('PASS: 5 cards, C5/C4 counts, global search, reset, details, empty module, no JS errors, mobile no overflow')