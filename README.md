# ГРУЗЪ — production-ready структура статического сайта

## Что было

- Один большой `index.html` с HTML/CSS/JS в одном файле.
- Изображения были встроены как base64.
- Сложно масштабировать SEO-структуру и переиспользовать блоки.

## Что стало

- Исходники перенесены в `src/`.
- Production-результат формируется в `dist/`.
- Контент страницы разбит на переиспользуемые partials.
- Стили и скрипты вынесены в отдельные файлы.
- Base64-изображения вынесены в `assets/img`.
- Добавлены `robots.txt`, `sitemap.xml`, `manifest.webmanifest`, OG/Twitter meta.
- Контракт формы с `/send.php` сохранён полностью (`form action` и `fetch`).

## Структура проекта

```text
src/
  pages/
    index.njk
    robots.njk
    sitemap.njk
    manifest.webmanifest.njk
  partials/
    head.njk
    header-nav.njk
    hero.njk
    services.njk
    photo-strip.njk
    why.njk
    process.njk
    cta.njk
    seo-content.njk
    geo-coverage.njk
    contact.njk
    footer.njk
  assets/
    css/
      critical.css
      main.css
    js/
      main.js
    img/
      hero.jpg
      photo-strip-1.jpg
      photo-strip-2.jpg
      photo-strip-3.jpg
      og-image.jpg
      favicon.svg
      favicon-16x16.png
      favicon-32x32.png
      apple-touch-icon.png
      icon-192.png
      icon-512.png
  data/
    site.json
dist/
```

## Установка зависимостей

Нужен Node.js (LTS) только на локальной машине.

```bash
npm install
```

## Локальный запуск

```bash
npm run dev
```

## Сборка production

```bash
npm run build
```

Результат сборки: папка `dist/`.

## Что загружать на shared hosting

- Загружайте только содержимое `dist/` в корень сайта.

## Что не загружать на shared hosting

- `src/`
- `.eleventy.js`
- `package.json`
- `node_modules/`
- любые служебные/исходные файлы репозитория

## Файлы хостинга, которые нельзя терять

Если на хостинге уже есть:

- `send.php`
- файл верификации Яндекса (`yandex*.html`)

не удаляйте и не перезаписывайте их без необходимости.

Если эти файлы есть в корне репозитория, 11ty скопирует их в `dist/` автоматически.

## Как обновлять сайт после правок

1. Изменить файлы в `src/`.
2. Выполнить `npm run build`.
3. Загрузить обновлённое содержимое `dist/` на хостинг.
4. Проверить форму, навигацию, мобильную версию, `robots.txt` и `sitemap.xml`.

## Как добавить новую SEO-страницу

1. Создать новый файл в `src/pages/`, например `usluga-pereezd.njk`.
2. Подключить нужные partials через `{% include %}`.
3. Добавить уникальные title/description/контент под запрос.
4. Добавить URL страницы в `src/pages/sitemap.njk` (или реализовать генерацию из данных).
5. Выполнить `npm run build`.

## Как добавлять или убирать секции

1. Добавить/удалить файл partial в `src/partials/`.
2. Подключить/убрать include в `src/pages/index.njk`.
3. При необходимости добавить стили в `critical.css` или `main.css`.
4. Выполнить `npm run build`.

## Настройки SEO-домена

Перед деплоем укажите реальный домен в `src/data/site.json`:

- `url` — полный URL сайта, например `https://site.ru`
- `host` — домен без протокола, например `site.ru`

Это используется в canonical, Open Graph, `robots.txt` и `sitemap.xml`.

## Deployment checklist (shared hosting)

1. В `src/data/site.json` установлен реальный домен (`url`, `host`).
2. Выполнена сборка `npm run build`.
3. Проверено, что в `dist/index.html` форма отправляет на `/send.php`.
4. Проверены `dist/robots.txt`, `dist/sitemap.xml`, `dist/manifest.webmanifest`.
5. Загружено только содержимое `dist/`.
6. На хостинге сохранены рабочие `send.php` и `yandex*.html` (если используются).
7. После загрузки проверены: адаптив, sticky навигация, mobile CTA, отправка формы.