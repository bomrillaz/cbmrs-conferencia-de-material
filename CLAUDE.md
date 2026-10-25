# CLAUDE.md — Bomrillaz Conferência de Material (1ª CiaBM / 4º PelBM — São Marcos RS)

App interno de checklist de conferência de material de viaturas do Corpo de Bombeiros Militar do RS.
Trabalho em português.

---

## 1. ARQUITETURA

- **Um único `index.html`** (~2200 linhas, ~326 KB, medido em 25/10/2026). Sem `data.js` separado.
- **PWA instalável** (b1, 2026-08-19): `manifest.webmanifest` + `sw.js` + `assets/icon-192.png` /
  `icon-512.png` / `icon-maskable-512.png` (gerados a partir do brasão CBMRS já embutido no site).
  `sw.js` segue a MESMA regra de ouro do CTSP: nunca intercepta Firebase dinâmico
  (`firebaseio.com`/`googleapis.com`), só same-origin + SDK estático (`gstatic`/`firebasejs`).
- **Reskin de marca aplicado (b1, 2026-08-19)**: tokens da paleta Bomrillaz tema claro em `:root`
  (bloco `<style>`, topo de `index.html`) — ver `Documents\Claude\vault\30-marca\BOMRILLAZ_DESIGN.md`.
  **Não há sistema de tokens "de fábrica"** — foram criados nesta sessão; qualquer cor nova deve usar
  os tokens existentes, nunca hex solto.
  **Exceções deliberadas, não tocar sem decisão nova com o João:**
  - Array `VH` (cores por-viatura, decorativas, uma por veículo) — paleta própria, não migra pros tokens.
  - `downloadParteDoc()`/`gerarParte()` (documento Word) — usa hex **literal**, não `var()`: o Word não
    resolve CSS custom properties. Só o cabeçalho de tabela foi ajustado pro vermelho da marca
    (`#C92211`, alinhado ao CTSP em 25/10/2026, b12; continua literal).
  - Brasão do CBMRS e fotos das viaturas — imagens PNG/JPEG embutidas em base64, cor cravada no pixel,
    mantidas como identidade oficial militar (decisão do João, não da marca Bomrillaz).
  - Tela de login (`renderAuth()`) usa `img/banner.jpg` (foto operacional) + `assets/cesar-coin.png`
    (mascote/logo) — **copiados do repo `bomrillaz-estudos`** por pedido explícito do João, não gerados
    do zero. Se o CTSP trocar esses assets, replicar aqui só se pedido.
- **Ícones de UI em SVG inline (2026-08-20, auditoria estética)**: objeto `ICONS` + helper `icn(name,
  size)` (perto de `esc()`, `index.html`) substituem os ~50 emojis de botões/labels fixos no código
  (editar, excluir, salvar, mover, confirmar etc.) por SVG outline (stroke `currentColor`, sem fill,
  exceto `grip` que é preenchido). **Exceção deliberada, não migrar sem decisão nova**: `sec.icon` — o
  ícone de cada seção do checklist é campo de texto livre editado pelo admin (emoji digitado à mão,
  gravado no RTDB junto com `checklist_custom`) e **continua emoji**, não SVG; migrar isso exigiria
  virar seletor fixo e migrar dados já salvos, fora de escopo. `alert()`/`confirm()` nativos e o
  documento standalone de `gerarRelatorio()` (HTML separado, aberto em nova aba) também mantêm emoji —
  são texto puro ou documento à parte, SVG não se aplica.
- **Renomear viatura (2026-08-20)**: painel admin, aba Checklist, filtrando por uma viatura específica
  (não "TODAS") mostra botão "Renomear viatura". Grava em `viaturas_custom/{vid}={name}` no RTDB
  (mesmo padrão de leitura/escrita de `checklist_custom`) e sobrescreve `VH[].name` em runtime via
  `loadCustomVeiculos()` (chamada no boot, `onAuthStateChanged`, antes de `loadCustomChecklist()`).
  Só o nome muda — tipo/cor/imagem continuam fixos no array `VH` (`index.html`), fora de escopo.
  Regra do RTDB publicada pelo João em 2026-08-20 (`regras_propostas_com_viaturas.json`).
- Site: https://bomrillaz.github.io/cbmrs-conferencia-de-material/
- Repo: github.com/bomrillaz/cbmrs-conferencia-de-material, branch `main`.
- Firebase: projeto `cbmrs-ti`, RTDB `cbmrs-ti-default-rtdb` — **diferente do `ctsp-estudos`**, não
  compartilha Auth nem banco.
- Firebase Auth carregado via `<script src="...gstatic.com/firebasejs/10.14.1/...">` (compat), não
  JSONP dinâmico.
- Viaturas: `ar797` (AR 797, Ambulância de Resgate), `abt660` (ABT 660), `abt9468` (ABT 9468),
  `atm1209` (ATM 1209, Auto Transporte de Materiais), `sop` (Sala de Operações).
- Export de relatório em Word (`.doc`) e impressão HTML. Histórico FIFO de 10 conferências.
- **Histórico (b12, v2026.8.1) — regras que já quebraram:**
  - Grava SÓ ao concluir a última seção (`executarFinalizacao`); o Resumo (`goSummary`) é só
    visualização. Antes, abrir o Resumo gravava conferência, inclusive com 0 item respondido.
  - Conferência sem nenhum item respondido não grava (guarda em `saveToHistory`).
  - `saveToHistory` faz upsert por **id** via `transaction()`, nunca `set()` da lista inteira (outro
    aparelho pode gravar ao mesmo tempo). A marca `localStorage cbm5_conf_id` diz qual entrada é a
    conferência atual; `posConf()`/`confJaSalva()`/`prevConf()` acham a entrada por essa id, nunca
    por posição. "Conferência anterior" (aviso de N/C repetida e Word) = `prevConf()`.
  - O RTDB descarta array vazio: toda leitura trata `rows`/`items`/`ncs`/`subs` ausentes como vazios
    (`_cleanCustomSC`, `(x.ncs||[])`, helper `listaDoNo()`).
  - Admin exclui UMA conferência pelo id (`excluirConferencia`, transaction). A regra do RTDB de
    `historico` libera escrita a qualquer aprovado; o botão só para admin é UX, não perímetro.
- **Postos (`rankOpts`, único ponto da lista):** inclui "Soldado Temporário" (b12). Rank gravado fora
  da lista entra como option selecionada; nunca cai no primeiro item (antes trocava o posto calado).
- **Identidade Bomrillaz (b12):** tokens alinhados ao `:root` do CTSP (`--red #C92211`, `--dur-*`,
  `--ease-*`, `--font-display`, `--white`, `--z-*`), Barlow Condensed **local** (`assets/fonts/`,
  `@font-face`), corpo `-apple-system`. `--green-deep` é token local da Conferência. Tema escuro fora,
  por decisão do João (só claro).
- **Painel admin**: promoção/revogação de admin, editor de checklist livre por viatura (seção/título/
  item/subitem, CRUD completo + drag-and-drop via Pointer Events), toggle de "conta funcional".
- **Checklist custom (`checklist_custom` no RTDB) em dual-write** (v2026.7.0): `rows` (formato novo,
  id estável por linha, títulos e subitens) é a verdade; `items` (tuplas legadas `[nome,qtd]`) é um
  espelho achatado gravado junto, só pra um celular com bundle de cache antigo não cair silenciosamente
  no checklist de fábrica. **Não remover o espelho `items`** até confirmar que todo o efetivo atualizou
  o PWA — normalização fica em `secRows`/`secChecks`/`rowKey` (`index.html`, perto de `getSC()`).
- **Login funcional** (v2026.7.0): conta marcada com `usuarios/{uid}.funcional=true` mostra uma tela
  de escolha de "responsável" (lista vem do nó `efetivo/{uid}`, espelho de `usuarios` legível por
  não-admin) em vez do perfil fixo. Decisão de segurança confirmada com o João: a conta funcional
  **nunca** é admin no banco — quem precisa do painel faz re-login individual (`signInWithEmailAndPassword`
  num overlay dedicado). Gate real sempre por `isAdminUI()` (deriva de `userProfile.admin`, nunca do
  responsável selecionado). Ver `PLANO_editor_livre_e_login_funcional.md` (se ainda existir em
  `materiais/entregas/planos/`) e `_estado.md` do vault pro histórico da decisão.

## 2. REGRAS INVIOLÁVEIS

- **As regras do RTDB são o perímetro real**, não `ADMIN_EMAIL`/`userProfile.admin` no cliente
  (usado só como UX). Regras cobrem `usuarios`, `historico`, `checklist_custom`, `efetivo`,
  `viaturas_custom` — texto completo em `materiais/referencia/regras-rtdb/` (gitignorado) e em
  `_regras_rtdb.md` do vault. Nó
  `efetivo` publicado em 2026-08-19 (leitura: qualquer aprovado · escrita: só admin), necessário pro
  login funcional listar o efetivo sem a conta funcional precisar ser admin.
- **`firebase.initializeApp` 1x só.**
- Toda saída de dado de banco que vai pro `innerHTML` passa por `esc()` antes.
- **Rate limit no login** (`checkRateLimit()`, b1 2026-08-19): 5 tentativas / 5 min via `localStorage`,
  chave `rl_login`. Testado localmente (bloqueia na 6ª tentativa). Não remover nem afrouxar sem pedido.
- **CSP ativa** (b1 2026-08-19, `index.html` `<head>`): mesma política já validada em produção no CTSP
  (sem `unsafe-eval`). O diagnóstico antigo ("Firebase requer JSONP") era equivocado — testado localmente
  sem erro. Não remover sem investigar de novo antes.
- **Patch cirúrgico de DOM** (`patchItemStatus`/`patchProgress`, evita "piscada" ao marcar item) **já
  regrediu uma vez** (voltou a re-renderizar a página inteira numa versão e sumiu a otimização). Ao
  mexer no fluxo de marcação de item, confirmar que esse patch continua presente. Duplica estilo do
  textarea global (`input,textarea,select{...}` no `<style>`) — se aquele seletor mudar, espelhar
  manualmente em `patchItemStatus` (linha ~1339), a duplicação não é automática.

## 3. GIT

- **`git push` só com confirmação explícita do João antes**, mesmo com commit local pronto.
- Nunca `git reset --hard`, `git checkout .` nem force-push sem pedido explícito.

## 4. MODO DE TRABALHO

- Site **em produção, uso real em campo** — qualquer mudança visual/técnica: mapear todos os pontos de
  entrada antes de editar, testar localmente antes de cogitar push.
- Padrão visual a aplicar (reskin pendente): `Documents\Claude\vault\30-marca\BOMRILLAZ_DESIGN.md`.
- Memória do projeto: `Documents\Claude\vault\10-projetos\bomrillaz-conferencia\_estado.md`.
- **Subagente só quando compensa** — frente independente ou verificação de alto risco, nunca no
  trivial. Sonnet é o padrão; Opus só na fase de decisão de mudança estrutural.
- Verificação leve: `bash verify_conferencia.sh` (contagens de `esc()`/`innerHTML`, viaturas presentes,
  sintaxe balanceada). Rodar antes de qualquer commit que toque `index.html`.
  Baseline 2026-10-25 (b12, v2026.8.1): `esc()=99` · `innerHTML=21` · `initializeApp=1` ·
  `ADMIN_EMAIL=4` · `unsafe-eval=0` · `checkRateLimit=2` · `patchItemStatus=2` · `patchProgress=2`.
  Divergência = investigar antes de seguir. (`ADMIN_EMAIL` 3→4 na b11: filtro do admin master no
  `loadEfetivo`; `esc()` 97→99 na b12: o rank fora da lista entra escapado no select de graduação.)
  (`innerHTML` subiu 18→21: 3 pontos que trocaram `.textContent` por `.innerHTML` pra caber ícone SVG —
  botão salvar checklist (2x) e botão Próxima/Concluir do patch anti-piscada, todos com texto fixo do
  código, não dado de usuário — não precisam de `esc()`.)
- **Teste de tela pós-login (home/checklist/admin/resumo) exige login manual do João.** A IA nunca
  digita credencial — abre a aba (navegador embutido do chat) e o João loga; a IA só observa depois.
  Padrão herdado do CTSP: não completar uma conferência de verdade durante o teste, só abrir e conferir
  visual (senão suja o histórico FIFO de 10 conferências reais do pelotão).
- **Registro do Service Worker não valida em `localhost` dentro do ambiente sandboxed do chat** — mesmo
  o `sw.js` do CTSP (já validado em produção) dá o mesmo erro nesse ambiente. Não é bug: confirmar
  funcionamento real só depois de publicado (HTTPS/GitHub Pages), igual ao CTSP.

## 5. MATERIAL DE REFERÊNCIA

`materiais/` é **gitignorada** (mesmo padrão do CTSP) — nunca commitar. Subpastas:
- `entregas/planos/` — `PLANO_*.md` de trabalho em andamento. Plano executado é plano apagado
  (avisar o João e apagar no mesmo bloco ao terminar, mesma regra do CTSP).
- `historico/` — os 3 docx do histórico real do projeto (`Bombeiros-Site #1/#2/#3`), mantidos como
  registro do que já foi feito antes deste repo virar git-versionado.
- `referencia/` — material de apoio (PDF do formulário de conferência, docs de mangueiras/partes).
- `marca/` — imagens de referência visual (prompts de IA de viaturas/cenário) usadas como inspiração
  pro reskin; não são assets do site publicado (esses ficam em `assets/`/`img/`, versionados).

**Arquivo novo:** ao criar, colocar direto na subpasta certa pelo assunto — não deixar solto na raiz.

## 6. INÍCIO E FIM DE SESSÃO

Memória do projeto vive no vault Obsidian, fora do repo:
`Documents\Claude\vault\10-projetos\bomrillaz-conferencia\_estado.md`.

**Padrão da empresa (desde 25/10/2026):** `iniciar` e `encerrar` seguem a metodologia Bomrillaz, nascida no
CTSP: `Documents\Claude\vault\20-processo\protocolo-iniciar-e-encerrar-padrao-bomrillaz.md` (resumo no
`CLAUDE.md` global). Aqui ficam só os passos próprios deste projeto.

**`iniciar`** (sessão que mexe em código ou no banco):
1. Ler `_estado.md` do vault: autoridade do estado atual (pendências, baseline do verify).
2. Ler só as notas de `licoes/`/`decisoes/` linkadas nas pendências que a sessão vai tocar.
3. Rodar `verify_conferencia.sh` e comparar com a baseline; divergência = investigar antes de alterar.
4. `git status` limpo antes de editar.

**`encerrar`:**
1. Bullet da sessão (`bNN`) no topo de `_diario.md`: feito, decisões, commits não publicados e por quê.
2. `_estado.md`: bloco "Estado atual" (versão, cache, HEAD, verify) e "Pendências abertas". Nunca ✅:
   o que fechou sai para `fechado/AAAA-MM.md` com o carimbo da sessão; pendência nova entra no bullet e na
   seção, com o ponto exato e o que reconferir. Autossuficiente, teto de 15.000 caracteres.
3. Nota atômica em `licoes/` ou `decisoes/` (técnica reaproveitável vai para `25-tecnica/`).
4. Relato completo na pasta `historico` do vault (nome `historico_bNN_Titulo_data`).
5. `PLANO_*.md` totalmente executado: apagar e avisar o João; parcial: manter e marcar no `_estado.md` o que falta.
6. `python ~/Documents/Claude/ferramentas/vault_lint.py` com 0 link quebrado.
7. Push só com OK do João, dizendo o que sobe e o que fica.

Em sessão orquestrada, só o orquestrador roda o `encerrar`.
