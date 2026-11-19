import json
from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand
from django.db import transaction

from rowing.models import Document, Event, Location, News, Organization, Sport

SEED_DIR = Path(__file__).resolve().parents[2] / "seed"


class Command(BaseCommand):
    help = "Импортировать исходный контент прототипа, сохранив ранее созданные записи."

    @transaction.atomic
    def handle(self, *args, **options):
        content = json.loads((SEED_DIR / "content.json").read_text(encoding="utf-8"))
        if not Organization.objects.exists():
            Organization.objects.create(**content["organization"])

        for key, model, identifier in (
            ("events", Event, "slug"),
            ("locations", Location, "slug"),
            ("sports", Sport, "slug"),
            ("documents", Document, "slug"),
        ):
            for entry in content[key]:
                reference = {identifier: entry[identifier]}
                model.objects.get_or_create(**reference, defaults=entry)

        field = News._meta.get_field("photo")
        for entry in content["news"]:
            filename = entry.pop("photo")
            news, created = News.objects.get_or_create(slug=entry["slug"], defaults=entry)
            if created and filename:
                original = f"news/prototype/{filename}"
                if field.storage.exists(original):
                    news.photo = original
                else:
                    with (SEED_DIR / "photos" / filename).open("rb") as photo:
                        news.photo.save(f"prototype/{filename}", File(photo), save=False)
                news.save(update_fields=["photo"])

        if options["verbosity"]:
            self.stdout.write(self.style.SUCCESS("Исходный контент загружен. Существующие записи сохранены."))
