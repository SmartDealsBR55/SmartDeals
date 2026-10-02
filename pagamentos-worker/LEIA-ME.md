# Créditos SmartDeals

Administrador (administradores/{uid}.ativo=true) publica sem carteira e sem débito. Afiliados recebem 5 créditos uma vez por conta. Publicação e débito são atômicos e verificados pelas regras Firestore; editar/excluir não consome nem devolve créditos.

Pacotes: 10/R$2 (+5); 25/R$5 (+10); 50/R$10 (+20); 100/R$20 (+50). Bônus somente nas primeiras três recargas aprovadas. Valores e quantidades são definidos no servidor. Reembolso ou contestação estorna créditos concedidos, podendo deixar saldo negativo se já usados. Não reinicia a promoção.

## Instalação no Codespace

Execute `python3 scripts/instalar-creditos.py`. Requer login Cloudflare e Firebase. O script compila primeiro, instala o Worker com compras desabilitadas, publica regras, gera o site e envia ao GitHub. Não apaga produtos existentes. Contas sem saldo deixam de criar produtos; administradores continuam livres.

Para compras reais, configure no Mercado Pago o webhook de produção `https://smartdeals-pagamentos.gabriel-d-blaut.workers.dev/webhooks/mercadopago`, evento Pagamentos (legacy). Execute `python3 scripts/instalar-creditos.py --producao` e informe no terminal o Access Token de produção e a assinatura desse webhook. Não envie esses valores pelo chat nem salve em arquivos versionados. O script valida que a conta não é de teste, identifica o recebedor e mantém os segredos no Cloudflare.

Se necessário autenticar: `npx --yes firebase-tools@14.27.0 login --no-localhost` e `npx --yes wrangler@4.146.0 login --device --browser=false`.

## Validação e limites

- Build Vite passou; seis testes de backend cobrem bônus, duplicação concorrente, assinatura, valor, ambiente/recebedor e estorno.
- Quatorze verificações no emulador Firestore cobrem administrador gratuito, débito obrigatório/atômico, saldo zero, manipulação de saldo e propriedade.
- Nenhum pagamento real ou acesso às credenciais do proprietário foi realizado durante o desenvolvimento. A primeira recarga deve ser conferida de ponta a ponta após configurar produção. O redirecionamento de volta não confirma pagamento; somente o webhook assinado seguido de consulta à API libera saldo.
- Se o provedor não entregar notificações, o saldo não muda; use o painel Mercado Pago para reenviar a notificação e consultar entregas. Não existe reconciliação agendada nesta versão.
- Cancelamento parcial estorna todos os créditos daquele pagamento nesta versão; avaliar a política comercial antes de aplicar reembolsos parciais.
- O instalador não força push. Se main avançar, interrompe e pede sincronização. Se interrompido depois das regras, o site antigo pode impedir publicações de afiliados até concluir a atualização; o administrador continua autorizado.

Referências usadas: https://firebase.google.com/docs/firestore/manage-data/transactions ; https://firebase.google.com/docs/firestore/security/rules-conditions ; https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-pro-preferences/create-preference/post ; https://www.mercadopago.com.br/developers/pt/docs/links-and-debts/additional-content/your-integrations/notifications/webhooks
