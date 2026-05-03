# Cards Backend

Backend для приложения с карточками. Проект написан на TypeScript, запускается на Fastify, хранит данные в PostgreSQL, а изображения карточек хранит в S3-совместимом хранилище MinIO.

## Требования к окружению

Перед запуском проекта на новом компьютере нужно установить:

| Инструмент | Нужная версия | Комментарий |
| --- | --- | --- |
| Node.js | 20.x LTS или новее в рамках 20.x | Проект использует ESM, TypeScript и `@types/node` 20.x. Для локальной разработки лучше использовать именно Node.js 20. |
| npm | 10.x | Устанавливается вместе с Node.js 20. |
| PostgreSQL | 16.x или новее | Рекомендуемая локальная версия - PostgreSQL 16. В миграциях используются стандартные возможности PostgreSQL: `IDENTITY`, `timestamptz`, `text[]`. |
| MinIO | RELEASE.2025-09-07T16-13-09Z или новее | Локальное S3-совместимое хранилище для изображений. На Windows команда `npm run minio:start` скачивает MinIO автоматически. |

Проект подготовлен под локальную разработку на Windows/PowerShell. На macOS/Linux он тоже может работать, но скрипт запуска MinIO `scripts/start-minio.ps1` написан для PowerShell.

## Структура проекта

```text
src/
  app.ts
  server.ts
  config/
    env.ts
    db.ts
  clients/
    s3.ts
  db/
    migrations/
    queries/
  modules/
    auth/
    cards/
    likes/
    sessions/
    users/
  plugins/
  types/
  utils/
scripts/
  migrate.ts
  reset-db.ts
  seed.ts
  start-minio.ps1
```

## Быстрый запуск на Ubuntu VM

Ниже пример для чистой виртуалки Ubuntu 22.04/24.04. Команды рассчитаны на пользователя с `sudo`.

### 1. Установить системные пакеты

```bash
sudo apt update
sudo apt install -y curl ca-certificates gnupg build-essential
```

### 2. Установить Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Ожидаемо: `node -v` показывает `v20...`, `npm -v` показывает `10...`.

### 3. Установить PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

Создайте базу и пользователя. В примере пароль такой же, как в `.env.example`: `postgres`.

```bash
sudo -u postgres psql
```

Внутри `psql`:

```sql
ALTER USER postgres WITH PASSWORD 'postgres';
CREATE DATABASE cards_app;
\q
```

Если хотите отдельного пользователя:

```sql
CREATE USER cards_user WITH PASSWORD 'strong_password_here';
CREATE DATABASE cards_app OWNER cards_user;
\q
```

Тогда в `.env` используйте:

```env
DATABASE_URL=postgres://cards_user:strong_password_here@localhost:5432/cards_app
```

### 4. Установить и запустить MinIO

```bash
sudo useradd -r minio-user -s /sbin/nologin || true
sudo mkdir -p /opt/minio /var/lib/minio
sudo chown -R minio-user:minio-user /var/lib/minio
curl -L https://dl.min.io/server/minio/release/linux-amd64/minio -o /tmp/minio
sudo install /tmp/minio /usr/local/bin/minio
```

Создайте systemd-сервис:

```bash
sudo tee /etc/systemd/system/minio.service >/dev/null <<'EOF'
[Unit]
Description=MinIO object storage
After=network-online.target
Wants=network-online.target

[Service]
User=minio-user
Group=minio-user
Environment="MINIO_ROOT_USER=minioadmin"
Environment="MINIO_ROOT_PASSWORD=minioadmin"
ExecStart=/usr/local/bin/minio server /var/lib/minio --address :9000 --console-address :9001
Restart=always
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF
```

Запустите MinIO:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now minio
sudo systemctl status minio --no-pager
```

Проверка:

```text
API:     http://<server-ip>:9000
Console: http://<server-ip>:9001
Login:   minioadmin
Password: minioadmin
```

### 5. Склонировать проект и установить зависимости

```bash
git clone <repository-url>
cd carton-backend
npm ci
```

Если `package-lock.json` ещё не актуален для вашей ветки:

```bash
npm install
```

### 6. Создать `.env`

```bash
cp .env.example .env
nano .env
```

Пример `.env` для Ubuntu VM:

```env
PORT=3002
HOST=0.0.0.0
DATABASE_URL=postgres://postgres:postgres@localhost:5432/cards_app
WEB_ORIGIN=http://localhost:8081,http://<frontend-ip-or-domain>:8081
COOKIE_SECURE=false
BODY_LIMIT_MB=20
ACCESS_TOKEN_TTL_MINUTES=15
REFRESH_TOKEN_TTL_DAYS=30
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=cards-images
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_FORCE_PATH_STYLE=true
```

Если frontend открывается с другого адреса, добавьте его в `WEB_ORIGIN` через запятую. Для production с HTTPS обычно нужно поставить `COOKIE_SECURE=true`.

### 7. Применить миграции и заполнить тестовые данные

```bash
npm run db:migrate
npm run db:seed
```

Seed создаёт демо-пользователей и карточки Stray Kids, а изображения кладёт в MinIO bucket `cards-images`.

Демо-доступы:

```text
alex / test
mira / password123
```

### 8. Запустить backend в dev-режиме

```bash
npm run dev
```

Проверка:

```bash
curl http://localhost:3002/api/health
```

Ожидаемый ответ:

```json
{"ok":true}
```

### 9. Запустить backend как systemd-сервис

Соберите проект:

```bash
npm run build
```

Создайте сервис. Замените пути на реальные:

```bash
sudo tee /etc/systemd/system/carton-backend.service >/dev/null <<'EOF'
[Unit]
Description=Carton backend
After=network.target postgresql.service minio.service

[Service]
Type=simple
WorkingDirectory=/home/ubuntu/carton-backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/src/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

Запустите сервис:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now carton-backend
sudo systemctl status carton-backend --no-pager
```

Логи:

```bash
journalctl -u carton-backend -f
```

### 10. Открыть порты в firewall

Если включён `ufw`:

```bash
sudo ufw allow 3002/tcp
sudo ufw allow 9000/tcp
sudo ufw allow 9001/tcp
sudo ufw status
```

Для публичного сервера лучше закрыть MinIO Console `9001` наружу и оставить доступ только через VPN/SSH tunnel.

## 1. Установить системные зависимости

### Node.js

1. Скачайте и установите Node.js 20 LTS с https://nodejs.org/.
2. Закройте и заново откройте терминал.
3. Проверьте установку:

```bash
node -v
npm -v
```

Ожидаемый результат: `node -v` показывает `v20...`, а `npm -v` показывает `10...`.

### PostgreSQL

1. Скачайте и установите PostgreSQL 16 с https://www.postgresql.org/download/.
2. При установке задайте пароль для пользователя `postgres`.
3. Если хотите использовать `.env.example` без изменений, поставьте пароль `postgres`.
4. Убедитесь, что PostgreSQL запущен на порту `5432`.
5. Создайте базу данных `cards_app`.

Создать базу можно через pgAdmin, DBeaver, DataGrip или через `psql`.

Пример через `psql`:

```bash
psql -U postgres -h localhost -p 5432
```

Внутри `psql` выполните:

```sql
CREATE DATABASE cards_app;
\q
```

Если у вас другой пользователь, пароль, хост, порт или имя базы, позже поменяйте `DATABASE_URL` в файле `.env`.

### MinIO

На Windows MinIO отдельно устанавливать не обязательно. Проектный скрипт сам скачает `minio.exe` в `.local/bin/minio.exe` и запустит сервер:

```bash
npm run minio:start
```

Локальный MinIO будет доступен здесь:

```text
API:     http://localhost:9000
Console: http://localhost:9001
Login:   minioadmin
Password: minioadmin
```

Бакет из настройки `S3_BUCKET` приложение создает автоматически при первой загрузке изображения.

На macOS/Linux установите MinIO вручную с https://min.io/download и запустите его с такими же параметрами:

```bash
MINIO_ROOT_USER=minioadmin MINIO_ROOT_PASSWORD=minioadmin minio server .local/minio-data --address :9000 --console-address :9001
```

## 2. Склонировать проект

```bash
git clone <repository-url>
cd carton-backend
```

Замените `<repository-url>` на реальный URL репозитория.

## 3. Установить зависимости проекта

На новом компьютере используйте `npm ci`. Эта команда ставит версии зависимостей строго по `package-lock.json`.

```bash
npm ci
```

Если `npm ci` не подходит, например `package-lock.json` был намеренно изменен или отсутствует, используйте:

```bash
npm install
```

## 4. Создать `.env`

Скопируйте пример окружения:

```bash
copy .env.example .env
```

На macOS/Linux:

```bash
cp .env.example .env
```

Стандартный локальный `.env`:

```env
PORT=3002
HOST=0.0.0.0
DATABASE_URL=postgres://postgres:postgres@localhost:5432/cards_app
WEB_ORIGIN=http://localhost:5173
COOKIE_SECURE=false
BODY_LIMIT_MB=20
ACCESS_TOKEN_TTL_MINUTES=15
REFRESH_TOKEN_TTL_DAYS=30
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=cards-images
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_FORCE_PATH_STYLE=true
```

Что чаще всего нужно менять:

- `DATABASE_URL` - строка подключения к PostgreSQL.
- `WEB_ORIGIN` - адрес frontend-приложения, которому разрешен CORS.
- `PORT` - порт backend API.
- `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` - настройки MinIO или другого S3-совместимого хранилища.

## 5. Запустить локальные сервисы

Сначала запустите PostgreSQL и проверьте, что база `cards_app` существует.

Затем запустите MinIO:

```bash
npm run minio:start
```

Если порт `9000` уже занят, остановите процесс, который его занимает, или запустите MinIO на другом порту и поменяйте `S3_ENDPOINT` в `.env`.

## 6. Подготовить базу данных

Примените миграции:

```bash
npm run db:migrate
```

Заполните проект демо-данными:

```bash
npm run db:seed
```

Seed-скрипт создает демо-пользователей, карточки, реакции, сессию, токен и тестовые PNG-изображения в MinIO.

Демо-доступы:

```text
alex / password123
mira / password123
Bearer token for alex: seed-access-token-alex
```

## 7. Запустить backend

Режим разработки с автоматическим перезапуском TypeScript:

```bash
npm run dev
```

API должен запуститься на:

```text
http://localhost:3002
```

Проверка health check:

```bash
curl http://localhost:3002/api/health
```

Ожидаемый ответ:

```json
{"ok":true}
```

Пример запроса к seeded cards:

```bash
curl -H "Authorization: Bearer seed-access-token-alex" http://localhost:3002/api/cards
```

## Production-запуск

Собрать TypeScript:

```bash
npm run build
```

Запустить собранный JavaScript:

```bash
npm start
```

Или собрать и запустить с production-настройками:

```bash
npm run start:prod
```

## Полезные команды

```bash
npm run dev          # Запустить сервер разработки
npm run build        # Скомпилировать TypeScript в dist/
npm start            # Запустить собранное приложение из dist/
npm run start:prod   # Собрать и запустить с NODE_ENV=production
npm run check        # Проверить TypeScript без сборки файлов
npm run db:migrate   # Применить миграции базы данных
npm run db:seed      # Заполнить PostgreSQL и MinIO демо-данными
npm run db:reset     # Удалить таблицы проекта и создать схему заново
npm run minio:start  # Скачать/запустить локальный MinIO на Windows
```

## Сброс локальных данных

Чтобы пересоздать все таблицы проекта:

```bash
npm run db:reset
npm run db:seed
```

Эта команда сбрасывает данные в PostgreSQL. Объекты в MinIO она не удаляет.

## Частые проблемы

### `npm ci` или `npm run dev` не видит Node.js

Установите Node.js 20 LTS, закройте терминал, откройте новый и проверьте:

```bash
node -v
npm -v
```

### `password authentication failed for user "postgres"`

Пароль локального PostgreSQL отличается от дефолтного. Измените `.env`:

```env
DATABASE_URL=postgres://postgres:<your-password>@localhost:5432/cards_app
```

### `database "cards_app" does not exist`

Создайте базу вручную:

```sql
CREATE DATABASE cards_app;
```

Затем запустите миграции:

```bash
npm run db:migrate
```

### MinIO не запускается

Проверьте, не заняты ли порты `9000` и `9001`. Если заняты, остановите конфликтующий процесс или запустите MinIO на других портах и обновите `.env`.

### `npm run db:seed` падает на загрузке изображений

Перед seed-скриптом должен быть запущен MinIO:

```bash
npm run minio:start
npm run db:seed
```
