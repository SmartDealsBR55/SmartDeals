from pathlib import Path
from datetime import datetime
import re, shutil, subprocess

root = Path.cwd()
names = ['index.source.html', 'pages/login.source.html', 'pages/admin.source.html', 'assets/js/auth.js']
data = {n: Path(n).read_text() for n in names}
stamp = datetime.now().strftime('%Y%m%d-%H%M%S')
backup = Path('/tmp') / ('smartdeals-backup-' + stamp)
for n in names + ['service-worker.js']:
    p = Path(n)
    if p.exists():
        target = backup / n
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(p, target)

plans = ''.join(f'<article class="sd-plan"><span>{n} anúncios</span><strong>R$ {v}</strong><small>+ {b} de bônus</small></article>' for n, b, v in [(10,5,'2,00'),(25,10,'5,00'),(50,20,'10,00'),(100,50,'20,00')])
offer = '<section class="sd-offer" aria-label="Programa de afiliados"><div class="sd-intro"><span class="sd-label">SMARTDEALS / AFILIADOS</span><h2>Suas ofertas.<br><em>Mais oportunidades.</em></h2><p>Comece com 5 anúncios grátis no cadastro.</p><a class="sd-cta" href="pages/login.html">Entrar ou criar conta <span>→</span></a></div><div class="sd-price"><p class="sd-label">R$ 0,20 POR ANÚNCIO PAGO</p><div class="sd-grid">' + plans + '</div><p class="sd-note">Bônus nas 3 primeiras recargas aprovadas por conta. A partir da 4ª, vale a quantidade comprada.</p><p class="sd-status">Em breve: compra de créditos. Pagamentos ainda indisponíveis.</p></div></section>'
css = '''
.sd-offer{box-sizing:border-box;display:grid;grid-template-columns:1fr 1fr;gap:32px;width:min(1100px,calc(100% - 36px));margin:32px auto;padding:32px;border:1px solid #61522f;border-radius:24px;background:radial-gradient(ellipse at top left,#423619 0,transparent 60%),#131410;box-shadow:0 20px 50px #0004;color:#f5f2e8;font-family:Arial,sans-serif}
.sd-offer *{box-sizing:border-box}.sd-offer .sd-label{display:block;margin:0 0 16px;color:#d9bd73;font-size:11px;font-weight:700;letter-spacing:1.8px;line-height:1.6}.sd-offer h2{margin:0 0 16px;font-size:clamp(26px,4vw,42px);line-height:1.12;letter-spacing:-1px}.sd-offer h2:after{display:none}.sd-offer h2 em{color:#e5c977;font-style:normal}.sd-offer p{display:block;margin:0 0 20px;color:#ccc9bd;font-size:15px;line-height:1.6}.sd-offer .sd-cta{display:flex;align-items:center;justify-content:space-between;gap:20px;width:fit-content;padding:14px 20px;border-radius:12px;background:linear-gradient(120deg,#d8b442,#f2dd93);color:#211b0d;text-decoration:none;font-size:14px;font-weight:700}.sd-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.sd-plan{display:grid;gap:8px;padding:18px;border:1px solid #ffffff20;border-radius:14px;background:#ffffff06}.sd-plan>span{font-size:13px;color:#dedbd2}.sd-plan>strong{font-size:25px;line-height:1.2;color:#fff}.sd-plan>small{font-size:12px;color:#e5c977}.sd-offer .sd-note{font-size:12px;margin:14px 0 0}.sd-offer .sd-status{font-size:12px;color:#a7a497;margin:10px 0 0}
.login-page .login-container{width:min(920px,100%);margin:0 auto;padding:24px 16px}.login-page .login-card{width:100%;max-width:520px;margin:auto;padding:28px 22px}.login-page #form-login>button:not([type=submit]){background:transparent;border:1px solid #6d6040;color:#ead59d;box-shadow:none;min-height:44px;margin-top:8px}.login-page #recuperar-senha{border:0!important;text-decoration:underline}.login-page #form-login input{font-size:16px;min-height:48px}.login-page .sd-offer{grid-template-columns:1fr;width:100%;margin:24px 0 0;padding:22px;gap:16px}.login-page .sd-offer h2{font-size:25px}.login-page .sd-cta{display:none}.login-page .sd-plan{padding:14px}.login-page .sd-plan>strong{font-size:23px}.admin-container>.sd-offer{grid-template-columns:1fr;width:100%;margin:0 0 24px}.admin-container>.sd-offer .sd-intro{display:none}
@media(max-width:700px){.sd-offer{grid-template-columns:1fr;padding:24px;gap:24px;margin:24px auto}.sd-offer .sd-cta{width:100%}.sd-offer h2{font-size:32px}.sd-plan{padding:14px}.sd-plan>strong{font-size:24px}}
'''
for name, s in data.items():
    if name.endswith('.html'):
        s = re.sub(r'<section\b[^>]*class="[^"]*(?:cartaz-afiliados|login-planos|afiliado-saldo|sd-offer)[^"]*"[^>]*>.*?</section>', '', s, flags=re.S)
        s = re.sub(r'<div\b[^>]*class="afiliado-chamada"[^>]*>.*?</div>', '', s, flags=re.S)
        s = re.sub(r'(<a\b[^>]*href=")[^"]*("[^>]*>\s*Sou afiliado\s*</a>)', r'\1pages/login.html\2', s)
        s = re.sub(r'<style id="sd-visual-v2">.*?</style>', '', s, flags=re.S)
        s = s.replace('</head>', '<style id="sd-visual-v2">' + css + '</style>\n</head>')
        if name == 'index.source.html':
            assert '<!-- HERO -->' in s or '<main>' in s, 'Estrutura da página inicial diferente.'
            s = s.replace('<main>', '<main>\n' + offer, 1)
        elif 'login' in name:
            assert '</form>' in s, 'Formulário de login não encontrado.'
            s = s.replace('</form>', '</form>\n' + offer.replace('href="pages/login.html"', 'href="login.html"'), 1)
        else:
            assert '<main class="admin-container">' in s, 'Painel diferente do esperado.'
            s = s.replace('<main class="admin-container">', '<main class="admin-container">' + offer.replace('href="pages/login.html"', 'href="login.html"'), 1)
    else:
        # Remover apenas o observador que redirecionava a sessão salva.
        s, count = re.subn(r'onAuthStateChanged\(auth,\s*(?:user|usuario)\s*=>\s*\{.*?\}\);', '', s, flags=re.S)
        assert count or 'onAuthStateChanged(auth,' not in s, 'Revisar observador do login.'
        assert 'await signInWithEmailAndPassword' in s and 'await createUserWithEmailAndPassword' in s
    data[name] = s

for name, s in data.items():
    Path(name).write_text(s)
subprocess.run(['npm', 'run', 'build'], check=True)
for p in Path('dist').rglob('*.html'):
    target = Path(str(p.relative_to('dist')).replace('.source.html', '.html'))
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(p, target)
shutil.copytree('dist/assets', 'assets', dirs_exist_ok=True)
p = Path('service-worker.js')
if p.exists():
    s = p.read_text()
    s = re.sub(r'const CACHE\s*=\s*["\'][^"\']+["\']', 'const CACHE = "smartdeals-visual-' + stamp + '"', s)
    p.write_text(s)
assert 'sd-offer' in Path('index.html').read_text()
assert 'sd-offer' in Path('pages/login.html').read_text()
print('PRONTO: visual e login compilados. Backup:', backup)
print('Ainda falta enviar estes arquivos ao GitHub. Cobranças não foram ativadas.')
