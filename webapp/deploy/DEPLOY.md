# Deploy — Studio XXVII (VPS + nginx + systemd)

Guia para pôr a `webapp/` a correr num servidor real, com disco persistente
(necessário por causa do SQLite — ver aviso no `PLANO-MARCACAO-STUDIO-XXVII.md`).

## 1. Servidor

Um plano de webhosting partilhado (tipo o Hetzner Webhosting S a ~2€/mês) **não
serve** — só tem PHP, sem Node.js nem SSH nos planos mais baratos. É preciso uma
VPS com acesso root, por exemplo **Hetzner Cloud CX22** (2 vCPU / 4GB RAM / 40GB
NVMe, Ubuntu 22.04/24.04).

```bash
# como root, na VPS nova
apt update && apt upgrade -y
apt install -y nginx certbot python3-certbot-nginx git ufw
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

useradd -m -s /bin/bash studioxxvii
mkdir -p /srv/studioxxvii
chown studioxxvii:studioxxvii /srv/studioxxvii
```

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
nano .env   # preencher NEXTAUTH_SECRET (openssl rand -base64 32), NEXTAUTH_URL=https://studioxxvii.pt,
            # e as chaves de ifthenpay/Twilio/Google quando existirem
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

# emite e instala o certificado, e reescreve o bloco 443 automaticamente:
sudo certbot --nginx -d studioxxvii.pt -d www.studioxxvii.pt
```

Confirmar em `https://studioxxvii.pt/marcar`.

## 6. Backups do SQLite

```bash
sudo -u studioxxvii crontab -e
```

Adicionar (backup diário às 4h, guarda 14 dias):

```
0 4 * * * cp /srv/studioxxvii/app/webapp/prisma/dev.db /srv/studioxxvii/backups/dev-$(date +\%F).db
0 5 * * * find /srv/studioxxvii/backups -name 'dev-*.db' -mtime +14 -delete
```

Idealmente copiar também esses ficheiros para fora da VPS (ex. Hetzner Storage
Box, rclone para um bucket S3-compatível) — uma cópia só na mesma máquina não
protege contra a perda do disco todo.

## 7. Atualizar depois de alterações no código

```bash
su - studioxxvii
cd /srv/studioxxvii/app && git pull
cd webapp && npm install && npx prisma migrate deploy && npm run build
exit
sudo systemctl restart studioxxvii
```

## 8. Integrações externas (configurar quando houver contas/credenciais)

- **ifthenpay (MB Way)**: no backoffice, associar o callback
  `https://studioxxvii.pt/api/pagamentos/callback` à chave MB Way. Preencher
  `IFTHENPAY_MBWAY_KEY` e `IFTHENPAY_ANTIPHISHING_KEY` no `.env` e reiniciar o
  serviço.
- **Twilio (WhatsApp)**: preencher `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
  `TWILIO_WHATSAPP_FROM` no `.env`.
- **Google Calendar**: criar credenciais OAuth em
  console.cloud.google.com/apis/credentials, com
  `https://studioxxvii.pt/api/equipa/google/callback` como redirect URI
  autorizado. Preencher `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
  `GOOGLE_REDIRECT_URI` no `.env`. Cada colaborador liga a própria conta em
  `/equipa/definicoes`.

Todas as três são opcionais e têm fallback automático (ver `.env.example`):
sem elas, a app continua a funcionar como hoje (sem exigir pagamento
antecipado, sem enviar WhatsApp, sem sincronizar Google Calendar).
