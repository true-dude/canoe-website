import json
import re
from tempfile import TemporaryDirectory

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import TestCase, override_settings


class WebsiteTests(TestCase):
    def test_admin_requires_staff(self):
        self.assertRedirects(self.client.get("/admin/"), "/admin/login/?next=/admin/")
        self.client.force_login(get_user_model().objects.create_user(username="visitor"))
        self.assertRedirects(self.client.get("/admin/"), "/admin/login/?next=/admin/")

    def test_empty_home_page_loads(self):
        self.assertContains(self.client.get("/"), "СВОЯ<br>ВОДА.")

    def test_seed_and_admin_edit_reach_homepage(self):
        from .models import Event, News

        with TemporaryDirectory() as media, override_settings(MEDIA_ROOT=media):
            call_command("seed_content", verbosity=0)
            self.assertEqual(Event.objects.count(), 6)
            initial_page = self.client.get("/")
            self.assertContains(initial_page, "Спартакиада")
            self.assertContains(initial_page, "/media/news/prototype/n2.webp")
            with News.objects.get(slug="n2").photo.open("rb") as image:
                self.assertEqual(image.read(4), b"RIFF")
            event = Event.objects.get(slug="spartakiada-2026")
            editor = get_user_model().objects.create_user(username="editor", is_staff=True)
            editor.user_permissions.add(Permission.objects.get(
                content_type__app_label="rowing", codename="change_event",
            ))
            self.client.force_login(editor)
            response = self.client.post(f"/admin/rowing/event/{event.pk}/change/", {
                "title": "Кубок редактора",
                "subtitle": event.subtitle,
                "start": "2028-09-02",
                "end": "2028-09-04",
                "place": event.place,
                "discipline": event.discipline,
                "level": event.level,
                "description": event.description,
                "source": event.source,
                "protocol": SimpleUploadedFile("test.pdf", b"%PDF-1.7\n", content_type="application/pdf"),
                "_save": "Сохранить",
            })
            self.assertRedirects(response, "/admin/rowing/event/")
            call_command("seed_content", verbosity=0)
            page = self.client.get("/")
            payload = re.search(
                r'<script id="events-data" type="application/json">(.*?)</script>',
                page.content.decode(),
            )
            events = json.loads(payload.group(1))
            updated = next(item for item in events if item["id"] == event.slug)
            self.assertEqual(updated["title"], "Кубок редактора")
            self.assertEqual(updated["results"], "/media/protocols/test.pdf")
            self.assertContains(page, '<option value="2028" selected>2028</option>', html=True)
