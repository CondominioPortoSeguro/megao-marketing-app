# Vinnyzau — aplicativo web instalável

Aplicativo **PWA** para gerir estabelecimentos, calendário, posts, criativos e métricas. O projeto é separado dos demais aplicativos. Repositório: `CondominioPortoSeguro/megao-marketing-app`.

## Publicação na Vercel

1. Abra https://vercel.com/new e entre na conta desejada.
2. Em Import Git Repository, escolha somente `CondominioPortoSeguro/megao-marketing-app`. Se não estiver disponível, ajuste o acesso da integração GitHub da Vercel a esse repositório.
3. Selecione Framework Preset **Other**, Root Directory **./**, Build Command vazio e Output Directory padrão. Clique Deploy.
4. Após READY, abra a URL HTTPS fornecida pela Vercel no Chrome Android ou Safari iPhone.

A integração Git/Vercel atualiza a publicação a cada push em `main`.

## Instalar

- **Android/Chrome**: botão **Instalar aplicativo** na tela inicial, ou menu ⋮ > **Instalar aplicativo** / **Adicionar à tela inicial**.
- **iPhone/Safari**: Compartilhar > Adicionar à Tela de Início.

## Desenvolver e validar

`npm test` testa sintaxe do JavaScript, manifesto, ícones, SW, botão de instalação e salvamento local de posts. O GitHub executa esses testes a cada push.

## Limitações

Os dados são locais neste navegador (`localStorage`); não sincronizam entre dispositivos. Limpar dados do navegador pode apagá-los. Não há publicação automática nas redes sociais e as métricas são manuais. Não é um APK nem precisa da Play Store.

## Agenda e organização (versão atual)
- Início: acompanhe próximos compromissos de todas as empresas.
- Ao abrir uma empresa, veja as publicações de hoje, futuras, stories e tarefas em atraso, com hora e legenda.
- Calendário: visão do mês inteiro com identificação por cores; toque em uma data para criar tarefa, post ou story.
- Criativos: guarde fotos e vídeos e até três versões de texto/legenda por material; use o material salvo para criar posts.
- Relatórios: indicadores que você cadastrou manualmente + estatísticas de posts do próprio aplicativo e dicas de organização.

### Armazenamento e privacidade
As informações da agenda e os textos ficam neste navegador (localStorage). Fotos e vídeos novos são armazenados localmente pelo IndexedDB, sujeitos ao espaço disponível no aparelho. **Não há sincronização entre celulares**, aviso por notificação nem publicação automática em redes sociais. Antes de limpar dados do navegador ou trocar de celular, lembre que os registros atuais não são transferidos automaticamente.

## Refinamento da interface
- Cabeçalho com sua foto de perfil; toque nela para editar nome, função e foto.
- Painel inicial com resumo das tarefas de hoje, próximas tarefas e número de empresas.
- Atalho **Criar** e botão + do cabeçalho para adicionar rapidamente tarefas, posts ou criativos.
- Navegação com alvos de toque maiores, componentes reorganizados e animações leves.
- Foto e dados do perfil ficam no armazenamento local deste navegador; não há conta online ou sincronização de perfil.

## Correção de empresas em lote no calendário
- Abra **Calendário → Corrigir empresa em lote**.
- Filtre pela empresa cadastrada por engano, escolha **Este mês** ou **Todas as datas**, marque os compromissos e selecione a nova empresa.
- Revise e confirme a operação. Apenas a empresa é modificada; datas, horários, status, legendas e anexos permanecem intactos.
- A alteração é salva somente no navegador atual, junto aos demais registros locais.

## Eventos sinalizados no calendário
Cada dia agora mostra um traço colorido para cada evento da empresa correspondente, com até quatro traços visíveis e indicador **+N** para os demais. O número informa a quantidade exata de eventos do dia; os filtros por empresa continuam funcionando.
