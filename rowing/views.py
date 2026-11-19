from django.conf import settings
from django.shortcuts import render

from .models import Document, Event, Location, News, Organization, Sport, TeamMember

FEDERATION_NAME = "Федерация гребли на байдарках и каноэ Республики Татарстан"


def home(request):
    organization = Organization.objects.first()
    events = list(Event.objects.all())
    seasons = sorted({event.start.year for event in events}, reverse=True)
    event_data = [
        {
            "id": event.slug, "title": event.title, "subtitle": event.subtitle,
            "start": event.start, "end": event.end, "place": event.place,
            "discipline": event.discipline, "level": event.level,
            "description": event.description, "source": event.source,
            "results": event.protocol.url if event.protocol else event.results,
        }
        for event in events
    ]
    team = {group: [] for group in TeamMember.Group.values}
    for member in TeamMember.objects.all():
        team[member.group].append({
            "name": member.name, "role": member.role, "club": member.club,
            "achievements": member.achievements,
        })
    return render(request, "rowing/home.html", {
        "organization": organization,
        "federation_name": organization.name if organization else FEDERATION_NAME,
        "standard_name": not organization or organization.name == FEDERATION_NAME,
        "seasons": seasons,
        "events_data": event_data,
        "team_data": team,
        "news": News.objects.all(),
        "places": Location.objects.all(),
        "documents": Document.objects.all(),
        "sports": Sport.objects.all(),
        "prototype": settings.SITE_PROTOTYPE,
    })
