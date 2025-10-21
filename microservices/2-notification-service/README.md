# TypeScript Path Aliases

## Package.json Scripts

### Production Scripts
- **`start`** - Запускает приложение в production режиме через PM2 с 5 инстансами, автоперезапуском и красивым выводом логов
- **`stop`** - Останавливает все PM2 процессы
- **`delete`** - Удаляет все PM2 процессы

### Development Scripts
- **`dev`** - Запускает приложение в dev режиме с автоперезапуском при изменениях файлов через nodemon
- **`build`** - Компилирует TypeScript в JavaScript и заменяет алиасы путей на реальные пути

### Testing Scripts
- **`test`** - Запускает Jest тесты с покрытием кода, принудительным завершением и обнаружением открытых хендлеров

### Code Quality Scripts
- **`lint:check`** - Проверяет код на соответствие правилам ESLint
- **`lint:fix`** - Автоматически исправляет ошибки ESLint где это возможно
- **`prettier:check`** - Проверяет форматирование кода согласно правилам Prettier
- **`prettier:fix`** - Автоматически форматирует код согласно правилам Prettier

### Детальное описание команд

**Build команда:**
```bash
tsc --project tsconfig.json && tsc-alias -p tsconfig.json && ts-node tools/copyAssets.ts
```
1. `tsc --project tsconfig.json` - компилирует TypeScript в JavaScript используя настройки из tsconfig.json
2. `tsc-alias -p tsconfig.json` - заменяет алиасы путей (например `@notifications/*`) на реальные относительные пути в скомпилированном коде
3. `ts-node tools/copyAssets.ts` - копирует статические ресурсы (например, email шаблоны) из src в build директорию

**Dev команда:**
```bash
nodemon -r tsconfig-paths/register src/app.ts
```
- `nodemon` - следит за изменениями файлов и автоматически перезапускает приложение
- `-r tsconfig-paths/register` - регистрирует обработчик алиасов путей для runtime выполнения
- `src/app.ts` - точка входа приложения

**Test команда:**
```bash
jest --coverage=true -w=1 --forceExit --detectOpenHandles --watchAll=false
```
- `--coverage=true` - генерирует отчет о покрытии кода тестами
- `-w=1` - использует только 1 worker процесс (для стабильности)
- `--forceExit` - принудительно завершает процесс после тестов
- `--detectOpenHandles` - обнаруживает открытые хендлеры, которые могут препятствовать завершению
- `--watchAll=false` - отключает режим наблюдения за файлами

## Connections

### ENABLE_APM
send the code to the application monitoring platform.

### CLIENT_URL
http://localhost:3000

### RABBITMQ_ENDPOINT
#amqp - protocol RABBITMQ_DEFAULT_USER:RABBITMQ_DEFAULT_PASS@URL:PORT
RABBITMQ_ENDPOINT=amqp://fixme:fixmepass@localhost:5672

### ELASTIC_SEARCH_URL
http://elastic:password123@localhost:9200
elastic:admin1234@ — user name and pass
- #elastic# - это стандартный суперпользователь, который создаётся по умолчанию при включении безопасности (xpack.security.enabled: true)
- Имеет полный доступ ко всем API и данным.
- Пароль задаётся через переменную окружения ELASTIC_PASSWORD, как у тебя: admin1234.
ELASTIC_SEARCH_URL=http://elastic:admin1234@localhost:9200

### SERVER_PORT
API gateway PORT - 4000
Notification service PORT - 4001
and so on...

## Инструменты

### ts-node
Запускает TypeScript-код напрямую без предварительной компиляции в JS. Использует встроенный typescript для трансляции "на лету". Удобно для CLI, скриптов, dev-сервера.

### tsc-alias
Постобработка результата tsc. Заменяет алиасы путей (`@/*` и т.п.), описанные в `tsconfig.json`, на реальные относительные пути в скомпилированных JS-файлах.

### tsconfig-paths
Подключается на этапе выполнения (runtime). Читает `tsconfig.json` и подменяет `require`/`import`, чтобы Node понимал алиасы путей при запуске кода (без компиляции). Обычно используется вместе с `ts-node`.

### typescript-transform-paths
Трансформер для компилятора TypeScript. Делает то же, что `tsc-alias`, но прямо в процессе компиляции, без отдельного шага постобработки.

## Пример кода

```typescript
// src/utils/logger.ts
export const log = (msg: string) => console.log(`[LOG] ${msg}`);

// src/index.ts
import { log } from '@utils/logger'; // алиас @utils → ./src/utils

log('Hello World');
```

## Проблема

TypeScript компилирует `import { log } from '@utils/logger'` в JS без изменения пути.

Node.js не понимает `@utils/logger`, выдает ошибку `Cannot find module`.

## Решения

### 1. ts-node + tsconfig-paths (runtime)

```bash
ts-node -r tsconfig-paths/register src/index.ts
```

- `ts-node` выполняет код на лету
- `tsconfig-paths` читает алиасы из `tsconfig.json` и исправляет пути

### 2. tsc + tsc-alias (после компиляции)

```bash
tsc
tsc-alias
node dist/index.js
```

- `tsc` компилирует TS → JS, оставляя алиасы
- `tsc-alias` заменяет алиасы в скомпилированных JS-файлах на реальные пути

### 3. typescript-transform-paths (во время компиляции)

```typescript
// tsconfig.json + ts-patch
"plugins": [{ "transform": "typescript-transform-paths" }]
```

Пути подставляются прямо на этапе компиляции, постобработка не нужна.

### 4. Webpack (сборка и запуск)

```javascript
// webpack.config.js
resolve: {
  extensions: ['.ts', '.js'],
  alias: {
    '@utils': path.resolve(__dirname, 'src/utils/'),
  },
},
```

- Все импорты с алиасами подставляются в бандл автоматически
- Node.js получает корректные пути, отдельные пакеты не нужны

## Webpack как комплексное решение

Webpack решает проблему алиасов путей и сборки:

- В `webpack.config.js` есть поле `resolve.alias`, которое делает то же, что `paths` в `tsconfig.json`
- При сборке Webpack сам заменяет алиасы на реальные пути, так что `tsc-alias`, `tsconfig-paths` и `typescript-transform-paths` не нужны
- Для запуска `.ts` в dev-режиме используют `ts-loader` или `babel-loader` + `@babel/preset-typescript`. Это делает ненужным `ts-node`