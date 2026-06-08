#!/bin/bash
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

pass() { echo -e "${GREEN}✓${NC} $1"; PASS=$((PASS + 1)); }
fail() { echo -e "${RED}✗${NC} $1"; FAIL=$((FAIL + 1)); }
warn() { echo -e "${YELLOW}⚠${NC} $1"; WARN=$((WARN + 1)); }

echo ""
echo "═══════════════════════════════════════════"
echo "  OrbitX Pre-Deploy Validation"
echo "═══════════════════════════════════════════"
echo ""

# ── 1. TypeScript ──
echo "── TypeScript ──"
if npx tsc --noEmit 2>/dev/null; then
  pass "tsc --noEmit: zero errors"
else
  fail "tsc --noEmit: has errors"
fi

# ── 2. Build ──
echo ""
echo "── Build ──"
if npm run build 2>/dev/null; then
  if [ ! -f "dist/server.cjs" ]; then
    fail "dist/server.cjs missing"
  fi
  BUNDLE_SIZE=$(du -sh dist/ 2>/dev/null | cut -f1)
  pass "Bundle size: $BUNDLE_SIZE"
else
  fail "npm run build: failed"
fi

# ── 3. Security checks ──
echo ""
echo "── Security ──"

# Auth middleware
if grep -q "authMiddleware" server.ts 2>/dev/null; then
  pass "Auth middleware applied in server.ts"
else
  fail "Auth middleware NOT found in server.ts"
fi

# JWT (not base64)
if grep -rq "jwt.sign\|jwt.verify" src/server/ 2>/dev/null; then
  pass "JWT signing/verification in use"
else
  fail "JWT not found — still using base64 tokens?"
fi

# DOMPurify
if grep -q "sanitizeHtml\|DOMPurify" src/components/FullArticleTab.tsx 2>/dev/null; then
  pass "DOMPurify sanitization in FullArticleTab"
else
  fail "XSS protection missing in FullArticleTab"
fi

# No direct fetch outside api.ts/useAuth.ts
DIRECT_FETCH=$(grep -rn "await fetch(" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -v "api.ts" | grep -v "useAuth.ts" | wc -l)
if [ "$DIRECT_FETCH" -eq 0 ]; then
  pass "No direct fetch() calls outside api.ts"
else
  fail "$DIRECT_FETCH direct fetch() calls found outside api.ts"
fi

# Rate limiting
if grep -rq "rateLimit\|rateLimiter" src/server/ server.ts 2>/dev/null; then
  pass "Rate limiting configured"
else
  fail "Rate limiting NOT found"
fi

# Input validation
VALIDATOR_COUNT=$(grep -rn "handleValidation" src/server/routes/ 2>/dev/null | wc -l)
if [ "$VALIDATOR_COUNT" -gt 0 ]; then
  pass "Input validation on $VALIDATOR_COUNT route handlers"
else
  fail "No input validation found on routes"
fi

# ── 4. Environment ──
echo ""
echo "── Environment ──"

if [ -f ".env.example" ]; then
  pass ".env.example exists"
else
  fail ".env.example missing"
fi

if [ -f ".env" ]; then
  REQUIRED_VARS="SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET_NAME R2_PUBLIC_URL ONBOARD_PASSWORD JWT_SECRET"
  for var in $REQUIRED_VARS; do
    if grep -q "^${var}=.\+" .env 2>/dev/null; then
      pass "$var is set"
    else
      fail "$var is missing or empty in .env"
    fi
  done
else
  warn ".env file not found (ok if env vars are set externally)"
fi

# ── 5. Code quality ──
echo ""
echo "── Code Quality ──"

# Debug logs in components
COMPONENT_LOGS=$(grep -rn "console.log" src/components/ 2>/dev/null | wc -l)
if [ "$COMPONENT_LOGS" -eq 0 ]; then
  pass "No console.log in components"
else
  warn "$COMPONENT_LOGS console.log found in components"
fi

# Date.now() for IDs
DATE_NOW_IDS=$(grep -n "Date.now()" server.ts src/server/ -r 2>/dev/null | grep -v "issuedAt\|upload\|file" | wc -l)
if [ "$DATE_NOW_IDS" -eq 0 ]; then
  pass "No Date.now() ID generation"
else
  fail "$DATE_NOW_IDS Date.now() ID patterns found"
fi

# UUID in use
if grep -rq "uuidv4\|uuid" src/server/ids.ts 2>/dev/null; then
  pass "UUID-based ID generation confirmed"
else
  fail "UUID ID generation not found"
fi

# Route modules
ROUTE_COUNT=$(grep -rn "router\.\(get\|post\|put\|delete\)" src/server/routes/ 2>/dev/null | wc -l)
if [ "$ROUTE_COUNT" -gt 30 ]; then
  pass "Route modules: $ROUTE_COUNT endpoints across modular files"
else
  warn "Only $ROUTE_COUNT routes in modules (expected 30+)"
fi

SERVER_LINES=$(wc -l < server.ts 2>/dev/null)
if [ "$SERVER_LINES" -lt 120 ]; then
  pass "server.ts is lean: $SERVER_LINES lines"
else
  warn "server.ts is $SERVER_LINES lines (target: <120)"
fi

# ── 6. Git status ──
echo ""
echo "── Git ──"

if git diff --quiet 2>/dev/null; then
  pass "Working directory clean"
else
  warn "Uncommitted changes in working directory"
fi

# ── Summary ──
echo ""
echo "═══════════════════════════════════════════"
echo -e "  ${GREEN}PASS: $PASS${NC}  ${RED}FAIL: $FAIL${NC}  ${YELLOW}WARN: $WARN${NC}"
if [ "$FAIL" -eq 0 ]; then
  echo -e "  ${GREEN}✓ READY TO DEPLOY${NC}"
else
  echo -e "  ${RED}✗ FIX FAILURES BEFORE DEPLOYING${NC}"
fi
echo "═══════════════════════════════════════════"
echo ""
