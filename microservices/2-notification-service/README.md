# TypeScript Path Aliases

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