# Гребля Татарстана

Сайт Федерации гребли на байдарках и каноэ Республики Татарстан. Публичная часть использует шаблоны Django, CSS и обычный JavaScript. Контент редактируется в Django Admin.

## Локальный запуск через Docker Compose

Запустите Docker Desktop, затем выполните из каталога с `compose.yaml`:

```sh
docker compose up -d --build --wait
docker compose exec web python manage.py seed_content
docker compose exec web python manage.py createsuperuser
```

`seed_content` и `createsuperuser` нужны при первом запуске с пустой базой. Миграции применяются при старте Django. Повторный запуск `seed_content` сохраняет существующие записи и добавляет отсутствующие.

- Сайт [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- Админка [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)
- База PostgreSQL и загруженные файлы хранятся в томах Compose. `docker compose down` сохраняет тома.
- После изменений в коде выполните `docker compose up -d --build --wait`. Для другого локального порта задайте `WEB_PORT` в окружении или в файле `.env`.

## Редактирование

Админка содержит соревнования, новости, документы, площадки, виды гребли, состав сборной и сведения о федерации. Изменения появляются при следующем открытии публичной страницы.

У соревнования можно прикрепить PDF-протокол или указать внешнюю ссылку. При наличии файла посетитель увидит ссылку на него. Новый сезон появляется после добавления первого старта с соответствующим годом.

Для новости укажите ссылку на первоисточник. При загрузке фотографии заполните поле авторства или источника. Для сотрудника редакции создайте отдельную учётную запись, включите статус персонала и выдайте права на нужные разделы контента.

## Структура

- `config/` — настройки и маршруты Django.
- `rowing/models.py`, `rowing/admin.py` — модель контента и формы админки.
- `rowing/templates/rowing/` — публичная страница и шаблоны разделов.
- `rowing/static/rowing/` — стили и JavaScript.
- `rowing/seed/` — данные и фотографии для первичного наполнения.

## Размещение

Compose-конфигурация предназначена для локальной разработки. Для размещения приложения используйте сервер WSGI или ASGI. Укажите переменные `DJANGO_SECRET_KEY` и `DJANGO_ALLOWED_HOSTS` (через запятую). Для PostgreSQL задайте `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, при необходимости `POSTGRES_HOST` и `POSTGRES_PORT`.

Выполните `python manage.py migrate`, `python manage.py seed_content` (при первичном наполнении), `python manage.py collectstatic --noinput` и `python manage.py check --deploy`. Настройте выдачу `/static/` из `staticfiles/`. Загружаемые фото и PDF хранятся в постоянном каталоге `DJANGO_MEDIA_ROOT` (по умолчанию `media/`). На сервере отдавайте этот каталог с отдельного домена для пользовательских файлов. Укажите его базовый HTTPS-адрес с завершающим слешем в `DJANGO_MEDIA_URL`. Для файлов настройте корректные MIME-типы и заголовок `X-Content-Type-Options: nosniff`. Сервер приложений использует `config.wsgi:application` или `config.asgi:application`.

На сервере оставьте `DJANGO_DEBUG` выключенным, а сайт отдавайте по HTTPS. Устанавливайте `DJANGO_TRUST_PROXY=1` только если доверенный прокси сам задаёт `X-Forwarded-Proto` и удаляет входящие значения этого заголовка. Параметры `DJANGO_HSTS_SUBDOMAINS=1` и `DJANGO_HSTS_PRELOAD=1` включают соответствующие директивы HSTS, если домен готов к ним. Для официальной публикации задайте `DJANGO_SITE_PROTOTYPE=0`.

## Тесты

```sh
docker compose exec web python manage.py test
```
