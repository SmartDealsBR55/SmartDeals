"""Run in Codespace. Secrets are entered privately, never written to the repository."""
from pathlib import Path
import subprocess, json, sys, shutil, getpass, urllib.request, urllib.error, re
from datetime import datetime
ROOT=Path(__file__).resolve().parents[1]
import os
os.chdir(ROOT)
def run(args, **kw):
    subprocess.run(args,check=True,**kw)
config_path=Path('pagamentos-worker/wrangler.jsonc')
config=json.loads(config_path.read_text())
try:
    # Compile before any remote changes.
    run(['npm','install'])
    run(['node','pagamentos-worker/test.mjs'])
    run(['npm','run','build'])
    # Check Firebase login before making remote changes.
    run(['npx','--yes','firebase-tools@14.27.0','projects:list'])
    production='--producao' in sys.argv
    if production:
        print('Use as credenciais de PRODUÇÃO da mesma aplicação Mercado Pago do SmartDeals.')
        print('Configure o webhook de PRODUÇÃO para: '+config['vars']['WORKER_URL']+'/webhooks/mercadopago')
        print('Evento: Pagamentos (legacy). Cole abaixo a assinatura secreta dessa configuração.')
        token=getpass.getpass('Access Token de produção (fica oculto): ').strip()
        secret=getpass.getpass('Assinatura secreta do webhook de produção (fica oculta): ').strip()
        if not token or not secret: raise RuntimeError('Credenciais não informadas. Nenhuma ativação foi feita.')
        request=urllib.request.Request('https://api.mercadopago.com/users/me',headers={'Authorization':'Bearer '+token})
        try:
            with urllib.request.urlopen(request,timeout=25) as response: seller=json.load(response)
        except urllib.error.HTTPError: raise RuntimeError('Access Token inválido ou sem acesso à conta. Confira no Mercado Pago.')
        if 'test_user' in seller.get('tags',[]): raise RuntimeError('Essa conta é de teste. Use a conta vendedora real.')
        config['vars']['MP_COLLECTOR_ID']=str(seller['id'])
        run(['npx','--yes','wrangler@4.146.0','secret','put','MP_ACCESS_TOKEN','--name','smartdeals-pagamentos'],input=token+'\n',text=True)
        run(['npx','--yes','wrangler@4.146.0','secret','put','MP_WEBHOOK_SECRET','--name','smartdeals-pagamentos'],input=secret+'\n',text=True)
        del token,secret
    # Never accept payments before the rules and application have been installed.
    config['vars']['PAYMENTS_ENABLED']='false'
    config_path.write_text(json.dumps(config,indent=2)+'\n')
    run(['npx','--yes','wrangler@4.146.0','deploy','--config',str(config_path)])
    run(['npx','--yes','firebase-tools@14.27.0','deploy','--only','firestore:rules','--project','smartdeals-e942e'])
    for page in Path('dist').rglob('*.html'):
        target=Path(str(page.relative_to('dist')).replace('.source.html','.html'))
        target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(page,target)
    shutil.copytree('dist/assets','assets',dirs_exist_ok=True)
    sw=Path('service-worker.js')
    if sw.exists(): sw.write_text(re.sub(r"const CACHE\s*=\s*['\"][^'\"]+['\"]", "const CACHE = 'smartdeals-creditos-"+datetime.now().strftime('%Y%m%d%H%M%S')+"'",sw.read_text(),count=1))
    run(['git','add','.gitignore','index.html','index.source.html','pages','assets','service-worker.js','firestore.rules','pagamentos-worker','scripts/instalar-creditos.py','tests/creditos-rules.mjs'])
    staged=subprocess.run(['git','diff','--cached','--quiet']).returncode
    if staged:run(['git','commit','-m','Publicar painel com créditos e administrador gratuito'])
    run(['git','push','origin','HEAD:main'])
    if production:
        config['vars']['PAYMENTS_ENABLED']='true';config_path.write_text(json.dumps(config,indent=2)+'\n')
        run(['npx','--yes','wrangler@4.146.0','deploy','--config',str(config_path)])
        run(['git','add',str(config_path)]);run(['git','commit','-m','Configurar pagamentos de produção'])
        run(['git','push','origin','HEAD:main'])
    print('PUBLICADO. Administrador não gasta créditos.')
    print('Compras de produção ativadas; valide uma recarga e a entrega do saldo.' if production else 'Compras ainda desativadas. Para configurar produção: python3 scripts/instalar-creditos.py --producao')
except (subprocess.CalledProcessError,RuntimeError,urllib.error.URLError) as e:
    print('Instalação interrompida. Não repita comandos de pagamento avulsos.')
    print(str(e))
    print('Se o Firebase pediu login: npx --yes firebase-tools@14.27.0 login --no-localhost')
    print('Se o Cloudflare pediu login: npx --yes wrangler@4.146.0 login --device --browser=false')
    sys.exit(1)
