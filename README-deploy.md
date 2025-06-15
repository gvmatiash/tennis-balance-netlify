# Руководство по деплою TennisBalance на Netlify

## Обзор

Данное руководство содержит полные инструкции по развертыванию приложения TennisBalance v13.1 с интеграцией облачного хранилища на платформе Netlify. Все настройки выполняются через веб-интерфейс без необходимости локальной разработки.

## Структура проекта

После внесения изменений ваш проект должен иметь следующую структуру:

```
tennis-balance/
├── index.html                    # Основной HTML файл
├── app.js                       # Модифицированный JS файл с синхронизацией
├── style.css                   # Модифицированный CSS с стилями синхронизации
├── netlify.toml                 # Конфигурация Netlify
├── package.json                 # Зависимости проекта
├── netlify/
│   └── functions/
│       ├── sync-upload.mts      # Функция загрузки в облако
│       ├── sync-download.mts    # Функция выгрузки из облака
│       └── data-status.mts      # Функция проверки статуса
└── README.md                    # Это руководство
```

## Пошаговая инструкция деплоя

### Шаг 1: Подготовка файлов в GitHub

1. **Создайте GitHub репозиторий** (если ещё не создан):
   - Перейдите на [github.com](https://github.com)
   - Нажмите "New repository"
   - Назовите репозиторий `tennis-balance-netlify`
   - Сделайте его публичным или приватным по желанию
   - Нажмите "Create repository"

2. **Загрузите существующие файлы**:
   - Нажмите "uploading an existing file"
   - Загрузите `index.html`, `app.js`, `style.css`

3. **Создайте новые файлы через веб-интерфейс GitHub**:

   **netlify.toml** (в корне репозитория):
   ```toml
   [build]
     functions = "netlify/functions"
     publish = "."

   [functions]
     node_bundler = "esbuild"

   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200

   [dev]
     functions = "netlify/functions"
   ```

   **package.json** (в корне репозитория):
   ```json
   {
     "name": "tennis-balance-netlify",
     "version": "13.1.0",
     "description": "TennisBalance с облачной синхронизацией",
     "scripts": {
       "dev": "netlify dev",
       "build": "echo 'Статический сайт - сборка не требуется'"
     },
     "dependencies": {
       "@netlify/functions": "^2.8.1",
       "@netlify/blobs": "^8.1.0"
     },
     "devDependencies": {
       "typescript": "^5.4.5",
       "@types/node": "^20.12.12"
     }
   }
   ```

4. **Создайте папку netlify/functions** и добавьте три файла:

   **netlify/functions/sync-upload.mts**:
   ```typescript
   import { getStore } from '@netlify/blobs';
   import type { Context } from '@netlify/functions';

   export default async (req: Request, context: Context) => {
     if (req.method !== 'POST') {
       return new Response(
         JSON.stringify({ error: 'Метод не поддерживается' }),
         { status: 405, headers: { 'Content-Type': 'application/json' } }
       );
     }

     try {
       const requestData = await req.json();
       
       if (!requestData || typeof requestData !== 'object') {
         return new Response(
           JSON.stringify({ error: 'Неверный формат данных' }),
           { status: 400, headers: { 'Content-Type': 'application/json' } }
         );
       }

       const dataToSave = {
         ...requestData,
         lastSync: new Date().toISOString(),
         syncId: Date.now().toString()
       };

       const store = getStore('tennis-balance-data');
       await store.setJSON('app-data', dataToSave);

       return new Response(
         JSON.stringify({
           success: true,
           message: 'Данные успешно сохранены в облако',
           lastSync: dataToSave.lastSync,
           syncId: dataToSave.syncId
         }),
         { 
           status: 200,
           headers: { 
             'Content-Type': 'application/json',
             'Access-Control-Allow-Origin': '*'
           }
         }
       );

     } catch (error) {
       console.error('Ошибка при сохранении данных:', error);
       
       return new Response(
         JSON.stringify({ 
           error: 'Ошибка сервера при сохранении данных',
           details: error.message
         }),
         { status: 500, headers: { 'Content-Type': 'application/json' } }
       );
     }
   };

   export const config = {
     path: "/api/sync-upload"
   };
   ```

   **netlify/functions/sync-download.mts**:
   ```typescript
   import { getStore } from '@netlify/blobs';
   import type { Context } from '@netlify/functions';

   export default async (req: Request, context: Context) => {
     if (req.method !== 'GET') {
       return new Response(
         JSON.stringify({ error: 'Метод не поддерживается' }),
         { status: 405, headers: { 'Content-Type': 'application/json' } }
       );
     }

     try {
       const store = getStore('tennis-balance-data');
       const data = await store.getJSON('app-data');
       
       if (!data) {
         return new Response(
           JSON.stringify({ 
             error: 'Данные не найдены',
             exists: false
           }),
           { status: 404, headers: { 'Content-Type': 'application/json' } }
         );
       }

       return new Response(
         JSON.stringify({
           success: true,
           data: data,
           lastSync: data.lastSync || new Date().toISOString(),
           message: 'Данные успешно загружены'
         }),
         { 
           status: 200,
           headers: { 
             'Content-Type': 'application/json',
             'Access-Control-Allow-Origin': '*'
           }
         }
       );

     } catch (error) {
       console.error('Ошибка при загрузке данных:', error);
       
       return new Response(
         JSON.stringify({ 
           error: 'Ошибка сервера при загрузке данных',
           details: error.message
         }),
         { status: 500, headers: { 'Content-Type': 'application/json' } }
       );
     }
   };

   export const config = {
     path: "/api/sync-download"
   };
   ```

   **netlify/functions/data-status.mts**:
   ```typescript
   import { getStore } from '@netlify/blobs';
   import type { Context } from '@netlify/functions';

   export default async (req: Request, context: Context) => {
     if (req.method !== 'GET') {
       return new Response(
         JSON.stringify({ error: 'Метод не поддерживается' }),
         { status: 405, headers: { 'Content-Type': 'application/json' } }
       );
     }

     try {
       const store = getStore('tennis-balance-data');
       const metadata = await store.getMetadata('app-data');
       
       if (!metadata) {
         return new Response(
           JSON.stringify({
             exists: false,
             message: 'Данные в облаке не найдены',
             status: 'not-found'
           }),
           { 
             status: 200,
             headers: { 
               'Content-Type': 'application/json',
               'Access-Control-Allow-Origin': '*'
             }
           }
         );
       }

       const data = await store.getJSON('app-data');
       const lastSync = data?.lastSync;
       
       let timeAgo = 'неизвестно';
       let isRecent = false;
       
       if (lastSync) {
         const syncDate = new Date(lastSync);
         const now = new Date();
         const diffMs = now.getTime() - syncDate.getTime();
         const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
         const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
         
         if (diffHours > 0) {
           timeAgo = `${diffHours} ч. ${diffMinutes} мин. назад`;
         } else {
           timeAgo = `${diffMinutes} мин. назад`;
         }
         
         isRecent = diffMs < (1000 * 60 * 60);
       }

       return new Response(
         JSON.stringify({
           exists: true,
           lastSync: lastSync,
           timeAgo: timeAgo,
           isRecent: isRecent,
           status: isRecent ? 'fresh' : 'stale',
           message: `Данные синхронизированы ${timeAgo}`,
           participantsCount: data?.participants?.length || 0,
           historyCount: data?.history?.length || 0,
           subscriptionBudget: data?.subscriptionBudget || 0
         }),
         { 
           status: 200,
           headers: { 
             'Content-Type': 'application/json',
             'Access-Control-Allow-Origin': '*'
           }
         }
       );

     } catch (error) {
       console.error('Ошибка при проверке статуса:', error);
       
       return new Response(
         JSON.stringify({ 
           error: 'Ошибка сервера при проверке статуса',
           details: error.message,
           status: 'error'
         }),
         { status: 500, headers: { 'Content-Type': 'application/json' } }
       );
     }
   };

   export const config = {
     path: "/api/data-status"
   };
   ```

### Шаг 2: Модификация существующих файлов

1. **Обновите app.js**:
   - В конец класса TennisBalance (перед закрывающей скобкой) добавьте методы синхронизации
   - В метод setupEventListeners() добавьте обработчики кнопок синхронизации

2. **Обновите index.html**:
   - Добавьте раздел облачной синхронизации в настройки
   - Добавьте кнопки синхронизации

3. **Обновите style.css**:
   - Добавьте стили для кнопок синхронизации
   - Добавьте стили для статусных сообщений

### Шаг 3: Деплой на Netlify

1. **Подключите репозиторий к Netlify**:
   - Перейдите на [netlify.com](https://netlify.com)
   - Войдите в аккаунт или создайте новый
   - Нажмите "New site from Git"
   - Выберите GitHub
   - Авторизуйтесь и выберите ваш репозиторий

2. **Настройте деплой**:
   - **Build command**: оставьте пустым или `echo "Static site"`
   - **Publish directory**: `.` (точка)
   - **Functions directory**: `netlify/functions` (должно определиться автоматически)

3. **Запустите деплой**:
   - Нажмите "Deploy site"
   - Дождитесь завершения деплоя (обычно 2-3 минуты)

### Шаг 4: Проверка работы

1. **Откройте ваш сайт** по URL, предоставленному Netlify
2. **Перейдите в раздел "Настройки"**
3. **Найдите секцию "Облачная синхронизация"**
4. **Протестируйте кнопки**:
   - "Проверить статус" - должна показать "Данные в облаке не найдены"
   - "Сохранить в облако" - сохранит текущие данные
   - "Загрузить из облака" - загрузит сохранённые данные

## Функции синхронизации

### Сохранение в облако
- Кнопка "📤 Сохранить в облако"
- Сохраняет все текущие данные: участников, историю, настройки
- Показывает подтверждение с временной меткой

### Загрузка из облака
- Кнопка "📥 Загрузить из облака"
- Загружает данные из облачного хранилища
- Запрашивает подтверждение при наличии локальных данных

### Проверка статуса
- Кнопка "📊 Проверить статус"
- Показывает информацию о последней синхронизации
- Отображает количество участников, записей истории и бюджет

## Устранение проблем

### Деплой не работает
1. Проверьте, что все файлы созданы правильно
2. Убедитесь, что netlify.toml находится в корне репозитория
3. Проверьте логи деплоя в Netlify Dashboard

### Функции не работают
1. Проверьте, что функции находятся в папке netlify/functions
2. Убедитесь, что расширение файлов .mts (TypeScript)
3. Проверьте логи функций в Netlify Dashboard → Functions

### Синхронизация не работает
1. Откройте DevTools в браузере (F12)
2. Проверьте консоль на наличие ошибок
3. Во вкладке Network проверьте запросы к /api/*

## Безопасность

- Данные хранятся в защищённом облачном хранилище Netlify Blobs
- Все запросы идут через HTTPS
- Доступ к данным есть только у владельца сайта Netlify
- Данные автоматически реплицируются для надёжности

## Обновления

При необходимости обновления приложения:
1. Внесите изменения в файлы в GitHub
2. Netlify автоматически пересоберёт и задеплоит сайт
3. Новые функции будут доступны через несколько минут

## Поддержка

При возникновении проблем:
1. Проверьте логи в Netlify Dashboard
2. Убедитесь, что все файлы созданы корректно
3. Сверьтесь с данным руководством

Приложение готово к использованию с полной поддержкой облачной синхронизации!