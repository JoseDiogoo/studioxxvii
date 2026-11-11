#!/bin/bash
# Cópia de segurança diária da base de dados (guarda os últimos 14 dias).
# Instalar:  sudo cp deploy/backup.sh /usr/local/bin/studioxxvii-backup && sudo chmod 700 /usr/local/bin/studioxxvii-backup
# Agendar (como root):  echo '30 3 * * * root /usr/local/bin/studioxxvii-backup' | sudo tee /etc/cron.d/studioxxvii-backup
#   (cópia externa opcional: acrescentar BACKUP_REMOTE=remote:pasta antes de "/usr/local/bin/..." na linha do cron, ex. "30 3 * * * root BACKUP_REMOTE=box:sxxvii /usr/local/bin/studioxxvii-backup")
# Restaurar:  gunzip -c ficheiro.sql.gz | sudo -u postgres psql studioxxvii
set -euo pipefail
DESTINO=/var/backups/studioxxvii
mkdir -p "$DESTINO"
chmod 700 "$DESTINO"
sudo -u postgres pg_dump studioxxvii | gzip > "$DESTINO/studioxxvii-$(date +%F).sql.gz"
# Cópia para fora da VPS (opcional): BACKUP_REMOTE=<remote-rclone>:<pasta>
if [ -n "${BACKUP_REMOTE:-}" ]; then
  rclone copy "$DESTINO" "$BACKUP_REMOTE" --max-age 2d
fi
find "$DESTINO" -name 'studioxxvii-*.sql.gz' -mtime +14 -delete
