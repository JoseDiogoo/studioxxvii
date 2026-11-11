# Deploy — Studio XXVII (VPS + nginx + systemd + PostgreSQL)

Guia para pôr a `webapp/` a correr num servidor real, com disco persistente
(a app e o PostgreSQL correm ambos na mesma VPS).

## 1. Servidor

Um plano de webhosting partilhado (tipo o Hetzner Webhosting S a ~2€/mês) **não
serve** — só tem PHP, sem Node.js nem SSH nos planos mais baratos. É preciso uma
VPS com acesso root, por exemplo um **Hetzner Cloud CX23** (2 vCPU / 4GB RAM / 40GB
NVMe, Ubuntu 22.04/24.04). Os preços e a disponibilidade mudaram em 2026:
confirma na página da Hetzner antes de escolher o plano.

```bash
# como root, na VPS nova
apt update && apt upgrade -y
apt install -y nginx certbot python3-certbot-nginx git ufw postgresql
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

useradd -m -s /bin/bash studioxxvii
mkdir -p /srv/studioxxvii
chown studioxxvii:studioxxvii /srv/studioxxvii
```

### PostgreSQL — criar o role e a base de dados da app

```bash
sudo -u postgres psql -c "CREATE ROLE studioxxvii WITH LOGIN PASSWORD 'ESCOLHE_UMA_PASSWORD_FORTE';"
sudo -u postgres psql -c "CREATE DATABASE studioxxvii OWNER studioxxvii;"
```

Por omissão, o PostgreSQL só aceita ligações locais (`localhost`) — é assim que
deve ficar em produção (a app corre na mesma VPS). Se precisares de ligar o
DBeaver **de fora** à BD de produção (não é preciso no dia a dia, a equipa usa
sempre a app via browser), a forma segura é um túnel SSH:

```bash
ssh -L 5433:localhost:5432 studioxxvii@<IP-da-VPS>
# no DBeaver: host localhost, porta 5433, mesma base/utilizador/password
```

Não é recomendável abrir a porta 5432 diretamente ao exterior no `ufw`/firewall
da VPS.

## 2. DNS (fazer no painel do domínio)

Dois registos **A**, ambos a apontar para o IP público da VPS:

| Tipo | Nome | Valor          |
|------|------|----------------|
| A    | @    | `<IP da VPS>`  |
| A    | www  | `<IP da VPS>`  |

TTL baixo (300s) enquanto testas; sobe depois de confirmado.

## 3. Código na VPS

```bash
su - studioxxvii
git clone <url-do-repo> /srv/studioxxvii/app
cd /srv/studioxxvii/app/webapp
cp .env.example .env
nano .env   # DATABASE_URL com a password do role studioxxvii criado acima,
            # NEXTAUTH_SECRET (openssl rand -base64 32), NEXTAUTH_URL=https://studioxxvii.pt,
            # e as chaves de Twilio quando existirem
npm install
npx prisma migrate deploy
SEED_PASSWORD="uma-password-forte" npm run seed   # só na primeira vez — guarda as passwords geradas
npm run build
exit
```

## 4. Serviço systemd

```bash
sudo cp /srv/studioxxvii/app/webapp/deploy/studioxxvii.service /etc/systemd/system/
sudo nano /etc/systemd/system/studioxxvii.service   # confirmar WorkingDirectory/ExecStart
sudo systemctl daemon-reload
sudo systemctl enable --now studioxxvii
sudo systemctl status studioxxvii
```

## 5. nginx + HTTPS

```bash
sudo cp /srv/studioxxvii/app/webapp/deploy/nginx.conf /etc/nginx/sites-available/studioxxvii.conf
sudo ln -s /etc/nginx/sites-available/studioxxvii.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# emite e instala o certificado, e reescreve os blocos 443 automaticamente:
sudo certbot --nginx -d studioxxvii.pt -d www.studioxxvii.pt
```

Confirmar em `https://studioxxvii.pt/marcar` **e também** que `http://studioxxvii.pt`,
`http://www.studioxxvii.pt` e `https://www.studioxxvii.pt` redirecionam todos
para `https://studioxxvii.pt` (o domínio canónico, sem `www`) — se o certbot
tiver juntado os dois domínios no mesmo bloco 443 em vez de manter o `www` só
como redirect, corrige manualmente o `studioxxvii.conf` para não ficar com o
site duplicado em dois domínios aos olhos do Google.

## 6. Backups do PostgreSQL

Usa só o `deploy/backup.sh` (dump diário comprimido, guarda 14 dias em
`/var/backups/studioxxvii`). Instruções de instalação e restauro no topo do
ficheiro.

Uma cópia só na mesma máquina não protege contra a perda do disco. Para enviar
também para fora da VPS, configura um remote com `rclone config` (ex. Hetzner
Storage Box ou um bucket S3) e define `BACKUP_REMOTE` no cron, por exemplo
`BACKUP_REMOTE=storagebox:studioxxvii`. Testa um restauro de vez em quando.

## 7. Atualizar depois de alterações no código

```bash
su - studioxxvii
cd /srv/studioxxvii/app && git pull
cd webapp && npm install && npx prisma migrate deploy && npm run build
exit
sudo systemctl restart studioxxvii
```

## 8. Integrações externas (opcional)

- **Twilio (WhatsApp)**: preencher `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
  `TWILIO_WHATSAPP_FROM` no `.env`.
É opcional e tem fallback automático (ver `.env.example`): sem ela, a app
continua a funcionar (sem enviar WhatsApp). A equipa vê as marcações na
tabela/agenda em `/equipa`. Não há pagamento antecipado — o cliente paga sempre na barbearia,
depois do corte.

## Segurança (checklist antes de publicar)

1. **Segredo da sessão:** `NEXTAUTH_SECRET` com 32+ caracteres (`openssl rand -base64 32`). A app recusa arrancar em produção com um segredo fraco.
2. **Password do barbeiro:** não existe password por omissão. Corre `SEED_PASSWORD="uma-password-forte" npm run seed` ou, depois, `node scripts/reset-password.cjs <email> "<password>"`.
3. **nginx:** usa o `deploy/nginx.conf` tal como está. A app depende de `X-Real-IP` e de `X-Forwarded-For $remote_addr` para os limites de pedidos; sem nginx todos os pedidos partilham o mesmo limite. Depois do certbot, confirma que o HTTPS está ativo (o cabeçalho HSTS só é enviado em produção).
4. **Firewall:** só portas 22, 80 e 443 (`ufw`). A porta 5432 (PostgreSQL) nunca aberta ao exterior; usa túnel SSH.
5. **SSH:** só por chave (`PasswordAuthentication no` em `/etc/ssh/sshd_config`) e `apt install fail2ban`.
6. **Atualizações automáticas:** `apt install unattended-upgrades`. Na app, corre `npm audit` de vez em quando.
7. **Cópias de segurança:** instala o `deploy/backup.sh` (instruções no topo do ficheiro) e testa uma restauração.
8. **Logs:** tentativas de login falhadas e bloqueios aparecem como `[seguranca]` em `journalctl -u studioxxvii`.

9. **Monitorização:** `GET /api/health` responde 200 se a BD está ligada (503 se não). Aponta um serviço de uptime gratuito (ex. UptimeRobot) para `https://studioxxvii.pt/api/health`.
