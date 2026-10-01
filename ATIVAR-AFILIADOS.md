# SmartDeals — afiliados v11

Pacote preparado a partir da versão local do SmartDeals de 21/09/2026.
Se o repositório recebeu outras alterações depois disso, compare os arquivos antes de substituir.
Faça uma cópia das regras atuais e um commit dos arquivos atuais antes da instalação.

## O que muda
Cadastro com nome, e-mail e senha; entrar, sair e recuperar senha.
Cada conta vê e gerencia seus produtos. O catálogo público reúne todas as ofertas.
O administrador vê e gerencia também os produtos antigos, sem proprietário.
Cada afiliado usa seu próprio link. Não há cobrança, repasse ou divisão automática de comissão.
As fotos continuam no Firestore, com a compressão e o limite de 4 fotos existentes.
Esta versão não acrescenta armazenamento ilimitado, moderação prévia ou um serviço de cobrança.
A remoção por prazo existente continua ocorrendo quando o painel do proprietário ou administrador carrega.

## 1. Preparar o Firebase ANTES de divulgar o cadastro
Abra https://console.firebase.google.com/project/smartdeals-e942e/authentication/users
Em Authentication, confirme que E-mail/senha está habilitado.
Localize SUA conta administrativa já existente e copie o UID. Não use o e-mail como ID.

Em Firestore Database > Dados:
- Crie a coleção `administradores`.
- Crie um documento com o UID da SUA conta como identificador.
- Adicione o campo `ativo`, tipo booleano, valor true.
Não crie esse documento para afiliados comuns. Nenhum usuário pode criar administradores pelo aplicativo.

Em Firestore Database > Regras:
- Salve uma cópia das regras antigas.
- Cole o conteúdo de `firestore.rules` deste pacote e publique.
Estas regras cobrem produtos e administradores; outras coleções ficam bloqueadas.
Se usa outros aplicativos nesse mesmo banco, revise essas coleções antes de publicar.
Os produtos antigos não são apagados nem atribuídos à primeira pessoa que se cadastrar.

## 2. Publicar o site
Envie o ZIP para /workspaces/SmartDeals no Codespaces.
Execute, uma linha por vez, parando se aparecer erro:

```bash
cd /workspaces/SmartDeals
git pull --ff-only
unzip -o SmartDeals-afiliados-v11.zip
git add assets pages index.html index.source.html service-worker.js firestore.rules firebase.json ATIVAR-AFILIADOS.md
git commit -m "Adicionar cadastro e painel dos afiliados"
git push
```
O pacote inclui arquivos prontos: não é necessário executar npm build para instalar.
Se voltar a compilar no futuro, é necessário copiar os HTML de dist de *.source.html para *.html, conforme o processo usado neste projeto.

## 3. Conferir antes de convidar pessoas
Abra https://smartdealsbr55.github.io/SmartDeals/pages/login.html
Entre com SUA conta: deve aparecer Administrador e a lista de produtos antigos.
Saia e crie duas contas de teste, com e-mails seus.
Publique uma oferta de teste com cada uma e confirme que cada painel lista somente os próprios produtos.
Abra o catálogo sem login: as ofertas devem carregar.
Teste edição, exclusão, recuperar senha e sair; exclua as ofertas de teste no final.
O topo deve mostrar Painel v11. Se aparecer v10, a publicação/atualização ainda não entrou.

Link para convidar afiliados, depois dessas verificações:
https://smartdealsbr55.github.io/SmartDeals/pages/login.html?cadastro=1

## Segurança e validação
A separação de contas é aplicada pelas regras do Firestore, além do filtro do painel.
Afiliados não podem trocar o proprietário nem alterar produtos antigos sem proprietário.
O cadastro de contas continua disponível no Firebase mesmo se o link público não for divulgado;
por isso as regras precisam ser publicadas antes de liberar esta versão.
A publicação do ZIP no GitHub NÃO publica as regras automaticamente.
A compilação e 17 cenários de acesso foram validados localmente no emulador Firestore (duas contas, administrador e visitante). O funcionamento com a conta Firebase real exige os passos acima.
