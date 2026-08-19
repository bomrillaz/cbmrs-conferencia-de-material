#!/bin/bash
# ============================================================
# verify_conferencia.sh — Verificação leve (Bomrillaz Conferência de Material)
# Layout: index.html único, dados embutidos.
# Uso: bash verify_conferencia.sh [dir_ou_index]
# ============================================================
set -u
ARG="${1:-.}"
if [ -d "$ARG" ]; then DIR="$ARG"; else DIR="$(dirname "$ARG")"; fi
W="$DIR/.tmp/verify_conferencia"
mkdir -p "$W"; cp "$DIR/index.html" "$W/index.html"
cd "$W"

echo "=== ARQUIVO ==="
echo "index.html: bytes=$(wc -c < index.html) linhas=$(wc -l < index.html)"

echo "=== SEGURANCA (baseline 2026-08-19: unsafe-eval=0, initializeApp=1, ADMIN_EMAIL=3, esc()>=51, checkRateLimit=0*) ==="
for t in "unsafe-eval" "initializeApp" "ADMIN_EMAIL" "esc(" "checkRateLimit" "innerHTML"; do
echo "$t=$(grep -oF "$t" index.html | wc -l)"
done
echo "* checkRateLimit=0 e ausencia de CSP sao pendencias conhecidas de paridade tecnica, nao bug novo"

echo "=== VIATURAS (esperado: as 5 presentes) ==="
for v in "ar797" "abt660" "abt9468" "atm1209" "'sop'"; do
N=$(grep -o "$v" index.html | wc -l)
echo "$v=$N"
done

echo "=== PATCH ANTI-PISCADA (nao pode sumir de novo) ==="
echo "patchItemStatus=$(grep -o 'patchItemStatus' index.html | wc -l)"
echo "patchProgress=$(grep -o 'patchProgress' index.html | wc -l)"

echo "=== SINTAXE ==="
python -c "
import re
html = open('index.html', encoding='utf-8').read()
s = re.findall(r'<script(?![^>]*src)[^>]*>(.*?)</script>', html, re.DOTALL)
open('main.js','w',encoding='utf-8').write(max(s, key=len))
"
node --check main.js && echo "index_script=OK" || echo "index_script=FALHOU"

echo "=== FIM - comparar com o CLAUDE.md / _estado.md do projeto ==="
