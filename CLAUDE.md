# CLAUDE.md — Bomrillaz Conferência de Material (1ª CiaBM / 4º PelBM — São Marcos RS)

App interno de checklist de conferência de material de viaturas do Corpo de Bombeiros Militar do RS.
Trabalho em português.

---

## 1. ARQUITETURA

- **Um único `index.html`** (~1560 linhas, ~234 KB). Sem `data.js` separado.
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
    resolve CSS custom properties. Só o cabeçalho de tabela foi ajustado pro vermelho da marca.
  - Brasão do CBMRS e fotos das viaturas — imagens PNG/JPEG embutidas em base64, cor cravada no pixel,
    mantidas como identidade oficial militar (decisão do João, não da marca Bomrillaz).
  - Tela de login (`renderAuth()`) usa `img/banner.jpg` (foto operacional) + `assets/cesar-coin.png`
    (mascote/logo) — **copiados do repo `bomrillaz-estudos`** por pedido explícito do João, não gerados
    do zero. Se o CTSP trocar esses assets, replicar aqui só se pedido.
- Site: https://bomrillaz.github.io/cbmrs-conferencia-de-material/
- Repo: github.com/bomrillaz/cbmrs-conferencia-de-material, branch `main`.
- Firebase: projeto `cbmrs-ti`, RTDB `cbmrs-ti-default-rtdb` — **diferente do `ctsp-estudos`**, não
  compartilha Auth nem banco.
- Firebase Auth carregado via `<script src="...gstatic.com/firebasejs/10.14.1/...">` (compat), não
  JSONP dinâmico.
- Viaturas: `ar797` (AR 797, Ambulância de Resgate), `abt660` (ABT 660), `abt9468` (ABT 9468),
  `atm1209` (ATM 1209, Auto Transporte de Materiais), `sop` (Sala de Operações).
- Export de relatório em Word (`.doc`) e impressão HTML. Histórico FIFO de 10 conferências.
- Painel admin: promoção/revogação de admin, editor de checklist por viatura.

## 2. REGRAS INVIOLÁVEIS

- **As regras do RTDB são o perímetro real**, não `ADMIN_EMAIL`/`userProfile.admin` no cliente
  (usado só como UX). Regras cobrem `usuarios`, `historico`, `checklist_custom` — texto completo e
  confirmado ao vivo no Console em 2026-08-19, ver `_estado.md` do projeto no vault.
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
  Baseline 2026-08-19 (pós-reskin): `esc()=74` · `innerHTML=15` · `initializeApp=1` · `ADMIN_EMAIL=3` ·
  `unsafe-eval=0` · `checkRateLimit=2` · `patchItemStatus=2` · `patchProgress=2`. Divergência =
  investigar antes de seguir.
- **Teste de tela pós-login (home/checklist/admin/resumo) exige login manual do João.** A IA nunca
  digita credencial — abre a aba (navegador embutido do chat) e o João loga; a IA só observa depois.
  Padrão herdado do CTSP: não completar uma conferência de verdade durante o teste, só abrir e conferir
  visual (senão suja o histórico FIFO de 10 conferências reais do pelotão).
- **Registro do Service Worker não valida em `localhost` dentro do ambiente sandboxed do chat** — mesmo
  o `sw.js` do CTSP (já validado em produção) dá o mesmo erro nesse ambiente. Não é bug: confirmar
  funcionamento real só depois de publicado (HTTPS/GitHub Pages), igual ao CTSP.

## 5. INÍCIO E FIM DE SESSÃO

Memória do projeto vive no vault Obsidian, fora do repo:
`Documents\Claude\vault\10-projetos\bomrillaz-conferencia\_estado.md`.

**Início** (sessão que mexe em código ou no banco):
1. Ler `_estado.md` do vault — autoridade do estado atual (pendências, decisões, baseline do verify).
2. Rodar `verify_conferencia.sh` e comparar com as contagens do `_estado.md`.

**Fim — comando `encerrar`:**
1. Atualizar `_estado.md` do vault: o que foi feito, o que ficou aberto, decisões tomadas, commits não
   publicados. Autossuficiente — quem só lê o `_estado.md` deve entender o estado sem abrir mais nada.
2. Se um `PLANO_*.md` foi totalmente executado: apagar (mesmo padrão do CTSP — plano executado é plano
   apagado) e avisar o João. Se ficou parcialmente executado, manter e marcar no `_estado.md` o que falta.
3. Registrar commits pendentes de push e a razão de não ter subido ainda, se for o caso.
