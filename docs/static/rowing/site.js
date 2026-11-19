"use strict";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const events = JSON.parse($("#events-data").textContent);
const team = JSON.parse($("#team-data").textContent);
const calendar = $("#events-list");
const season = $("#event-year");
const dialog = $("#event-dialog");

const months = ["ЯНВ", "ФЕВ", "МАР", "АПР", "МАЙ", "ИЮН", "ИЮЛ", "АВГ", "СЕН", "ОКТ", "НОЯ", "ДЕК"];
const monthsFull = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

let currentEventFilter = "all";
let eventActivator = null;

function escapeHTML(value) {
  const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value ?? "").replace(/[&<>"']/g, (character) => entities[character]);
}

function eventDate(value) {
  return new Date(`${value}T12:00:00`);
}

function dateRange(event) {
  const start = eventDate(event.start);
  const end = eventDate(event.end);
  const endLabel = `${end.getDate()} ${monthsFull[end.getMonth()]} ${end.getFullYear()}`;
  if (event.start === event.end) return endLabel;

  let startLabel = String(start.getDate());
  const differentYear = start.getFullYear() !== end.getFullYear();
  if (start.getMonth() !== end.getMonth() || differentYear) {
    startLabel += ` ${monthsFull[start.getMonth()]}`;
  }
  if (differentYear) startLabel += ` ${start.getFullYear()}`;
  return `${startLabel} — ${endLabel}`;
}

function renderEvents() {
  const year = season.value;
  $("#season-stamp").textContent = year;
  const items = events.filter((event) =>
    event.start.slice(0, 4) === year &&
    (currentEventFilter === "all" || event.discipline === currentEventFilter)
  );

  if (!items.length) {
    const message = year
      ? "Для выбранного направления в этом сезоне записей нет."
      : "Соревнования появятся после публикации календаря.";
    calendar.innerHTML = `
      <div class="empty-message"><strong>СТАРТОВ ПОКА НЕТ</strong><p>${message}</p></div>`;
    return;
  }

  calendar.innerHTML = items.map((event) => {
    const date = eventDate(event.start);
    const day = String(date.getDate()).padStart(2, "0");
    return `
      <article class="event-row">
        <div class="date-box">
          <strong class="date-day">${day}</strong>
          <span class="date-month">${months[date.getMonth()]}<br>${date.getFullYear()}</span>
        </div>
        <div>
          <h3 class="event-title">${escapeHTML(event.title)}</h3>
          <div class="event-meta">
            <span>${escapeHTML(event.subtitle)}</span>
            <i class="meta-dot" aria-hidden="true"></i>
            <span class="event-tag">${escapeHTML(event.level)}</span>
          </div>
        </div>
        <div class="event-place"><strong>${escapeHTML(event.place.split(",")[0])}</strong>${escapeHTML(event.place)}</div>
        <button class="details-button" type="button" data-event-id="${escapeHTML(event.id)}"
          aria-label="Открыть подробности: ${escapeHTML(event.title)}">Открыть</button>
      </article>`;
  }).join("");
}

function showEvent(button) {
  const event = events.find((item) => item.id === button.dataset.eventId);
  if (!event) return;

  eventActivator = button;
  const discipline = event.discipline === "dragon" ? "ЛОДКИ «ДРАКОН»" : "БАЙДАРКИ И КАНОЭ";
  const resultsLabel = event.results ? "Протокол опубликован" : "Протокол пока не добавлен";
  const resultsLink = event.results
    ? `<a class="secondary" href="${escapeHTML(event.results)}" target="_blank" rel="noopener noreferrer">Результаты</a>`
    : "";

  $("#dialog-content").innerHTML = `
    <div class="dialog-inner">
      <span class="dialog-eyebrow">${escapeHTML(event.level)} / ${discipline}</span>
      <h2 id="dialog-heading">${escapeHTML(event.title)}</h2>
      <p>${escapeHTML(event.description)}</p>
      <div class="dialog-grid">
        <div><span>КОГДА</span><strong>${escapeHTML(dateRange(event))}</strong></div>
        <div><span>ГДЕ</span><strong>${escapeHTML(event.place)}</strong></div>
        <div><span>КАТЕГОРИЯ</span><strong>${escapeHTML(event.subtitle)}</strong></div>
        <div><span>РЕЗУЛЬТАТЫ</span><strong>${resultsLabel}</strong></div>
      </div>
      <div class="dialog-actions">
        <a href="${escapeHTML(event.source)}" target="_blank" rel="noopener noreferrer">Перейти к источнику</a>
        ${resultsLink}
      </div>
    </div>`;
  if (!dialog.open) dialog.showModal();
}

function renderTeam(group = "athletes") {
  const container = $("#team-content");
  const members = team[group];
  if (!members.length) {
    const athletes = group === "athletes";
    container.innerHTML = `
      <div class="team-empty">
        <span class="team-empty-symbol" aria-hidden="true">${athletes ? "01" : "02"}.</span>
        <strong>${athletes ? "Здесь будет сборная Татарстана" : "Здесь будет тренерский штаб"}</strong>
        <p>Состав появится после официального подтверждения.</p>
        <span class="team-empty-badge">ЖДЁМ ПОДТВЕРЖДЁННЫЕ ДАННЫЕ</span>
      </div>`;
    return;
  }

  const cards = members.map((member) => {
    const initials = member.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("");
    const details = [member.role, member.club || "Татарстан"].filter(Boolean).join(" · ");
    const achievements = member.achievements
      ? `<p class="team-achievements">${escapeHTML(member.achievements)}</p>`
      : "";
    return `
      <article class="team-card">
        <span class="team-avatar" aria-hidden="true">${escapeHTML(initials)}</span>
        <div>
          <strong>${escapeHTML(member.name)}</strong>
          <p>${escapeHTML(details)}</p>
          ${achievements}
        </div>
      </article>`;
  });
  container.innerHTML = `<div class="team-grid">${cards.join("")}</div>`;
}

function bindTabs(selector, activeClass, activate) {
  const buttons = $$(selector);
  buttons.forEach((button, index) => {
    button.tabIndex = button.getAttribute("aria-selected") === "true" ? 0 : -1;

    button.addEventListener("click", () => {
      buttons.forEach((tab) => {
        const selected = tab === button;
        tab.classList.toggle(activeClass, selected);
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      activate(button);
    });

    button.addEventListener("keydown", (event) => {
      const destinations = {
        ArrowRight: (index + 1) % buttons.length,
        ArrowLeft: (index - 1 + buttons.length) % buttons.length,
        Home: 0,
        End: buttons.length - 1,
      };
      if (!Object.hasOwn(destinations, event.key)) return;

      event.preventDefault();
      const destination = buttons[destinations[event.key]];
      destination.focus();
      destination.click();
    });
  });
}

function initMobileMenu() {
  const button = $("#menu-toggle");
  const nav = $("#mobile-nav");

  function setOpen(open) {
    nav.classList.toggle("open", open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  }

  button.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("open")) {
      setOpen(false);
      button.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (nav.classList.contains("open") && !event.target.closest(".site-header")) setOpen(false);
  });
  window.matchMedia("(min-width:1001px)").addEventListener("change", (event) => {
    if (event.matches) setOpen(false);
  });
}

renderEvents();
renderTeam();
initMobileMenu();
bindTabs("[data-filter]", "active", (button) => {
  currentEventFilter = button.dataset.filter;
  renderEvents();
});
bindTabs("[data-team]", "selected", (button) => renderTeam(button.dataset.team));
season.addEventListener("change", renderEvents);
calendar.addEventListener("click", (event) => {
  const button = event.target.closest("[data-event-id]");
  if (button) showEvent(button);
});
$("#dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener("close", () => {
  if (eventActivator?.isConnected) eventActivator.focus();
});
$$(".news-media img").forEach((image) => {
  if (image.complete && !image.naturalWidth) image.remove();
  else image.addEventListener("error", () => image.remove(), { once: true });
});
