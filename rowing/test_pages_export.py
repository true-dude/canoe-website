import json
import re
from pathlib import Path
from tempfile import TemporaryDirectory

from django.core.files.base import ContentFile
from django.core.management import call_command
from django.test import TestCase, override_settings

from .models import Event


class PagesExportTests(TestCase):
    def test_public_page_and_assets_use_project_relative_paths(self):
        with TemporaryDirectory() as temporary:
            root = Path(temporary)
            output = root / "pages"
            with override_settings(MEDIA_ROOT=root / "uploads"):
                call_command("seed_content", verbosity=0)
                event = Event.objects.get(slug="spartakiada-2026")
                event.protocol.save("test.pdf", ContentFile(b"%PDF-1.7\n"))
                unpublished = root / "uploads" / "unlinked.pdf"
                unpublished.write_bytes(b"%PDF-1.7\n")

                call_command("export_pages", output, verbosity=0)
                page = (output / "index.html").read_text(encoding="utf-8")
                payload = re.search(r'<script id="events-data" type="application/json">(.*?)</script>', page)
                exported = next(item for item in json.loads(payload.group(1)) if item["id"] == event.slug)
                self.assertEqual(exported["results"], "./media/protocols/test.pdf")
                self.assertTrue((output / "media/protocols/test.pdf").is_file())
                self.assertFalse((output / "media/unlinked.pdf").exists())
                self.assertIn('src="./media/news/prototype/n2.webp"', page)
                self.assertIn('href="./static/rowing/site.css"', page)
                self.assertIn('src="./static/rowing/kayak-scene.js"', page)
                self.assertTrue((output / ".nojekyll").is_file())

                event.protocol = ""
                event.save(update_fields=["protocol"])
                call_command("export_pages", output, verbosity=0)
                self.assertFalse((output / "media/protocols/test.pdf").exists())
