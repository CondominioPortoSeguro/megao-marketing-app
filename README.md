# Megão Marketing — aplicativo web instalável

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
