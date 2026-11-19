from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator, URLValidator
from django.db import models

http_url = URLValidator(schemes=["http", "https"])
pdf_file = FileExtensionValidator(["pdf"])


class Organization(models.Model):
    name = models.CharField("Полное название", max_length=250)
    president = models.CharField("Президент", max_length=200, blank=True)
    president_source = models.URLField("Источник сведений о руководстве", max_length=1000, blank=True, validators=[http_url])
    email = models.EmailField("Электронная почта", blank=True)
    phone = models.CharField("Телефон", max_length=50, blank=True)
    telegram = models.URLField("Канал в Telegram", blank=True, validators=[http_url])

    class Meta:
        verbose_name = "Сведения о федерации"
        verbose_name_plural = "Сведения о федерации"

    def __str__(self):
        return self.name


class Event(models.Model):
    class Discipline(models.TextChoices):
        SPRINT = "sprint", "Байдарки и каноэ"
        DRAGON = "dragon", "Лодки «Дракон»"

    slug = models.SlugField("Идентификатор", unique=True, max_length=100, allow_unicode=True)
    title = models.CharField("Название", max_length=240)
    subtitle = models.CharField("Категория", max_length=240)
    start = models.DateField("Дата начала", db_index=True)
    end = models.DateField("Дата окончания")
    place = models.CharField("Место", max_length=240)
    discipline = models.CharField("Дисциплина", choices=Discipline.choices, max_length=10)
    level = models.CharField("Уровень", max_length=100)
    description = models.TextField("Описание")
    source = models.URLField("Первоисточник", max_length=1000, validators=[http_url])
    results = models.URLField("Ссылка на протокол", max_length=1000, blank=True, validators=[http_url])
    protocol = models.FileField("Протокол (PDF)", upload_to="protocols/", blank=True, validators=[pdf_file])

    class Meta:
        ordering = ["-start", "pk"]
        verbose_name = "Соревнование"
        verbose_name_plural = "Соревнования"
        constraints = [models.CheckConstraint(condition=models.Q(end__gte=models.F("start")), name="event_end_on_or_after_start")]

    def clean(self):
        if self.start and self.end and self.end < self.start:
            raise ValidationError({"end": "Дата окончания должна быть не раньше даты начала."})

    def __str__(self):
        return self.title


class News(models.Model):
    slug = models.SlugField("Идентификатор", max_length=100, unique=True, allow_unicode=True)
    date = models.DateField("Дата публикации", db_index=True)
    category = models.CharField("Категория", max_length=100)
    title = models.CharField("Заголовок", max_length=240)
    excerpt = models.TextField("Краткое описание")
    source_name = models.CharField("Название источника", max_length=150)
    url = models.URLField("Ссылка на первоисточник", max_length=1000, validators=[http_url])
    photo = models.ImageField("Фото", upload_to="news/", blank=True)
    photo_alt = models.CharField("Описание фото", max_length=300, blank=True)
    photo_credit = models.CharField("Авторство и источник фото", max_length=300, blank=True)

    class Meta:
        ordering = ["-date", "pk"]
        verbose_name = "Новость"
        verbose_name_plural = "Новости"

    def clean(self):
        if self.photo and not self.photo_credit.strip():
            raise ValidationError({"photo_credit": "Укажите авторство или источник фотографии."})

    def __str__(self):
        return self.title


class Location(models.Model):
    slug = models.SlugField("Идентификатор", max_length=100, unique=True, allow_unicode=True)
    name = models.CharField("Название", max_length=200)
    kind = models.CharField("Тип площадки", max_length=100)
    address = models.CharField("Адрес", max_length=240)
    description = models.TextField("Описание")
    source = models.URLField("Информация о площадке", max_length=1000, validators=[http_url])
    maps = models.URLField("Ссылка на карту", max_length=1000, validators=[http_url])
    badge = models.CharField("Подпись на фото", max_length=100, blank=True)
    photo = models.ImageField("Загрузить фото", upload_to="places/", blank=True)
    photo_url = models.URLField("Ссылка на фото", max_length=1000, blank=True, validators=[http_url])
    photo_alt = models.CharField("Описание фото", max_length=240, blank=True)
    position = models.PositiveIntegerField("Порядок", default=0)

    @property
    def image_url(self):
        return self.photo.url if self.photo else self.photo_url

    class Meta:
        ordering = ["position", "pk"]
        verbose_name = "Тренировочная площадка"
        verbose_name_plural = "Тренировочные площадки"

    def __str__(self):
        return self.name


class Sport(models.Model):
    slug = models.SlugField("Идентификатор", max_length=100, unique=True, allow_unicode=True)
    name = models.CharField("Название", max_length=100)
    short_code = models.CharField("Буква в списке", max_length=3)
    code = models.CharField("Классы лодок", max_length=100)
    description = models.TextField("Описание")
    position = models.PositiveIntegerField("Порядок", default=0)

    class Meta:
        ordering = ["position", "pk"]
        verbose_name = "Вид гребли"
        verbose_name_plural = "Виды гребли"

    def __str__(self):
        return self.name


class Document(models.Model):
    slug = models.SlugField("Идентификатор", max_length=120, unique=True, allow_unicode=True)
    name = models.CharField("Название", max_length=240)
    kind = models.CharField("Формат", max_length=30)
    updated = models.CharField("Дата или примечание", max_length=100, blank=True)
    url = models.URLField("Внешняя ссылка", max_length=1000, blank=True, validators=[http_url])
    file = models.FileField("Файл (PDF)", upload_to="documents/", blank=True, validators=[pdf_file])
    position = models.PositiveIntegerField("Порядок", default=0)

    @property
    def public_url(self):
        return self.file.url if self.file else self.url

    class Meta:
        ordering = ["position", "pk"]
        verbose_name = "Документ"
        verbose_name_plural = "Документы"

    def __str__(self):
        return self.name


class TeamMember(models.Model):
    class Group(models.TextChoices):
        ATHLETES = "athletes", "Спортсмены"
        COACHES = "coaches", "Тренеры"

    group = models.CharField("Раздел", choices=Group.choices, max_length=10)
    name = models.CharField("Имя", max_length=160)
    role = models.CharField("Роль или дисциплина", max_length=100, blank=True)
    club = models.CharField("Клуб или регион", max_length=100, blank=True)
    achievements = models.TextField("Достижения", blank=True)
    position = models.PositiveIntegerField("Порядок", default=0)

    class Meta:
        ordering = ["position", "pk"]
        verbose_name = "Участник сборной"
        verbose_name_plural = "Спортсмены и тренеры"

    def __str__(self):
        return self.name
