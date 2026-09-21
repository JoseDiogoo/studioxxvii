# Deploy — Studio XXVII (VPS + nginx + systemd + PostgreSQL)

Guia para pôr a `webapp/` a correr num servidor real, com disco persistente
(a app e o PostgreSQL correm ambos na mesma VPS).

## 1. Servidor

Um plano de webhosting partilhado (tipo o Hetzner Webhosting S a ~2€/mês) **não
serve** — só tem PHP, sem Node.js nem SSH nos planos mais baratos. É preciso uma
VPS com acesso root, por exemplo **Hetzner Cloud CX22** (2 vCPU / 4GB RAM / 40GB
NVMe, Ubuntu 22.04/24.04).

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
            # e as chaves de Twilio/Google quando existirem
npm install
npx prisma migrate deploy
npm run seed   # só na primeira vez — guarda as passwords geradas
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

```bash
sudo -u studioxxvii crontab -e
```

Adicionar (backup diário às 4h, guarda 14 dias):

```
0 4 * * * PGPASSWORD='<password-do-role>' pg_dump -U studioxxvii -h localhost studioxxvii > /srv/studioxxvii/backups/studioxxvii-$(date +\%F).sql
0 5 * * * find /srv/studioxxvii/backups -name 'studioxxvii-*.sql' -mtime +14 -delete
```

Idealmente copiar também esses ficheiros para fora da VPS (ex. Hetzner Storage
Box, rclone para um bucket S3-compatível) — uma cópia só na mesma máquina não
protege contra a perda do disco todo. Para restaurar: `psql -U studioxxvii -h
localhost studioxxvii < ficheiro.sql`.

## 7. Atualizar depois de alterações no código

```bash
su - studioxxvii
cd /srv/studioxxvii/app && git pull
cd webapp && npm install && npx prisma migrate deploy && npm run build
exit
sudo systemctl restart studioxxvii
```

## 8. Integrações externas (configurar quando houver contas/credenciais)

- **Twilio (WhatsApp)**: preencher `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
  `TWILIO_WHATSAPP_FROM` no `.env`.
- **Google Calendar**: criar credenciais OAuth em
  console.cloud.google.com/apis/credentials, com
  `https://studioxxvii.pt/api/equipa/google/callback` como redirect URI
  autorizado. Preencher `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
  `GOOGLE_REDIRECT_URI` no `.env`. Cada colaborador liga a própria conta em
  `/equipa/definicoes`.

Ambas são opcionais e têm fallback automático (ver `.env.example`): sem elas,
a app continua a funcionar (sem enviar WhatsApp, sem sincronizar Google
Calendar). Não há pagamento antecipado — o cliente paga sempre na barbearia,
depois do corte.
