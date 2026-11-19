from django.contrib import admin

from .models import Document, Event, Location, News, Organization, Sport, TeamMember

admin.site.site_header = "Федерация гребли Татарстана"
admin.site.site_title = "Редакция сайта"
admin.site.index_title = "Управление контентом"


class SlugAdmin(admin.ModelAdmin):
    def get_prepopulated_fields(self, request, obj=None):
        return {} if obj else super().get_prepopulated_fields(request, obj)

    def get_readonly_fields(self, request, obj=None):
        return ("slug",) if obj else ()


@admin.register(Event)
class EventAdmin(SlugAdmin):
    list_display = ("title", "start", "end", "discipline", "level")
    list_filter = ("discipline", "start")
    search_fields = ("title", "place")
    prepopulated_fields = {"slug": ("title",)}


@admin.register(News)
class NewsAdmin(SlugAdmin):
    list_display = ("title", "date", "category", "source_name")
    list_filter = ("date", "category")
    search_fields = ("title", "excerpt")
    prepopulated_fields = {"slug": ("title",)}


@admin.register(Location)
class LocationAdmin(SlugAdmin):
    list_display = ("name", "address", "position")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "address")


@admin.register(Document)
class DocumentAdmin(SlugAdmin):
    list_display = ("name", "kind", "updated", "position")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ("name", "group", "role", "club")
    list_filter = ("group",)
    search_fields = ("name", "club")


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return not Organization.objects.exists() and super().has_add_permission(request)

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Sport)
class SportAdmin(SlugAdmin):
    list_display = ("name", "short_code", "position")
    prepopulated_fields = {"slug": ("name",)}
