let siteData = null;

const money = value => value || "Confirm price";

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Something went wrong.");
  return body;
}

function setBusinessFields(business) {
  document.querySelectorAll("[data-business]").forEach(element => {
    const key = element.dataset.business;
    if (business[key]) element.textContent = business[key];
  });

  const booking = document.getElementById("externalBooking");
  if (booking && business.bookingUrl) booking.href = business.bookingUrl;
}

function renderServices(services) {
  const grid = document.getElementById("serviceGrid");
  const select = document.getElementById("bookingService");
  if (!grid || !select) return;

  grid.innerHTML = services.map(service => `
    <article class="service-card">
      <h3>${service.name}</h3>
      <div class="service-meta">
        <span class="pill">${service.duration}</span>
        <span class="pill">${money(service.price)}</span>
      </div>
      <p>${service.description}</p>
    </article>
  `).join("");

  select.innerHTML = '<option value="">Choose a service</option>' + services.map(service => (
    `<option value="${service.name}">${service.name}</option>`
  )).join("");
}

function renderReviews(reviews) {
  const grid = document.getElementById("reviewGrid");
  if (!grid) return;
  grid.innerHTML = reviews.map(review => `
    <article class="review-card">
      <div class="stars" aria-label="${review.rating} out of 5 stars">${"★".repeat(review.rating)}</div>
      <p>“${review.quote}”</p>
      <h3>${review.name}</h3>
      <span class="review-meta">${[review.location, review.date, review.source].filter(Boolean).join(" · ")}</span>
    </article>
  `).join("");
}

function renderFaq(faq) {
  const list = document.getElementById("faqList");
  if (!list) return;
  list.innerHTML = faq.map(item => `
    <article class="faq-item">
      <h3>${item.question}</h3>
      <p>${item.answer}</p>
    </article>
  `).join("");
}

function formToJson(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function wireForms() {
  const contactForm = document.getElementById("contactForm");
  const bookingForm = document.getElementById("bookingForm");

  contactForm?.addEventListener("submit", async event => {
    event.preventDefault();
    const status = document.getElementById("contactStatus");
    status.textContent = "Sending...";
    try {
      await api("/api/leads", { method: "POST", body: JSON.stringify(formToJson(contactForm)) });
      contactForm.reset();
      status.textContent = "Message saved. The owner would receive this lead.";
    } catch (error) {
      status.textContent = error.message;
    }
  });

  bookingForm?.addEventListener("submit", async event => {
    event.preventDefault();
    const status = document.getElementById("bookingStatus");
    status.textContent = "Sending...";
    try {
      await api("/api/bookings", { method: "POST", body: JSON.stringify(formToJson(bookingForm)) });
      bookingForm.reset();
      status.textContent = "Booking request saved. A live site would confirm by phone or text.";
    } catch (error) {
      status.textContent = error.message;
    }
  });
}

function normalizeText(value) {
  return String(value || "").toLowerCase();
}

function serviceNames() {
  return (siteData?.services || []).map(service => service.name).join(", ");
}

function hasAny(text, words) {
  return words.some(word => text.includes(word));
}

function scoreIntent(text, words) {
  return words.reduce((score, word) => score + (text.includes(word) ? 1 : 0), 0);
}

function receptionistReply(message) {
  const text = normalizeText(message);
  const business = siteData?.business || {};
  const intents = [
    ["call", scoreIntent(text, ["human", "person", "call", "phone", "number", "talk", "reach"])],
    ["hours", scoreIntent(text, ["hour", "open", "close", "today", "tonight", "late", "available now"])],
    ["location", scoreIntent(text, ["where", "address", "location", "parking", "directions", "street"])],
    ["price", scoreIntent(text, ["price", "cost", "how much", "rate", "rates", "menu"])],
    ["deep", scoreIntent(text, ["deep", "pain", "tight", "knot", "sore", "back", "shoulder", "neck", "pressure", "hurt"])],
    ["relax", scoreIntent(text, ["relax", "stress", "calm", "gentle", "tired", "reset", "easy", "light"])],
    ["feet", scoreIntent(text, ["foot", "feet", "reflex", "reflexology", "walking", "standing"])],
    ["booking", scoreIntent(text, ["book", "appointment", "schedule", "reserve", "available", "time", "tomorrow", "weekend"])],
    ["services", scoreIntent(text, ["service", "massage", "offer", "do you do", "options", "treatment"])],
    ["award", scoreIntent(text, ["award", "best", "review", "credible", "trust"])]
  ].sort((a, b) => b[1] - a[1]);
  const [intent, confidence] = intents[0];

  if (text.length < 4 || confidence === 0) {
    return "I might be reading between the lines here, but are you trying to book, compare services, or just see if KW Spa is open? If you tell me what is bothering you, I can point you to the best treatment.";
  }

  if (intent === "call") {
    return `Best move is to call KW Spa at ${business.phone || "(201) 322-5888"}. If you would rather not call right now, send your name and phone and I can save a callback request.`;
  }

  if (intent === "hours") {
    return `Looks like you are checking timing. KW Spa is listed as ${business.hours || "open daily, 10:00 AM - 10:00 PM"}. For same-day openings, calling is still the quickest confirmation.`;
  }

  if (intent === "location") {
    return `KW Spa is at ${business.address || "206 Washington Street, Jersey City, NJ"}. If you are already nearby, the directions button near the contact section is the easiest way in.`;
  }

  if (intent === "price") {
    return "I would rather be accurate than make up prices. This demo keeps pricing owner-confirmable, and the admin dashboard can add verified prices as soon as KW Spa confirms the menu.";
  }

  if (intent === "deep") {
    return "That sounds like tension or soreness. I would lean toward Deep Tissue Massage if you want firmer pressure, or Back Massage if it is mostly neck, shoulders, and upper back.";
  }

  if (intent === "relax") {
    return "If the goal is to unwind rather than work out serious knots, I would start with Foot Massage or Reflexology. If your back is carrying the stress, Back Massage is the better fit.";
  }

  if (intent === "feet") {
    return "For tired feet, Reflexology is the more focused pressure-point option. Foot Massage is the softer reset. Either one makes sense if you have been walking or standing all day.";
  }

  if (intent === "booking") {
    return "You can use the booking form on this page, call directly, or send your name, phone, preferred service, and rough time. I can save that as a request for follow-up.";
  }

  if (intent === "services") {
    return `The services shown here are ${serviceNames() || "Back Massage, Deep Tissue Massage, Reflexology, and Foot Massage"}. If you tell me whether you want relief, deep pressure, or relaxation, I can narrow it down.`;
  }

  if (intent === "award") {
    return "KW Spa's Best of 2022 Jersey City Massage Therapist recognition is shown near the top of the page. It is a useful trust signal before someone decides to book.";
  }

  return "I think you may be asking about services or booking. Tell me what you want out of the visit: pain relief, deeper pressure, foot care, or just a calm reset.";
}

function looksLikeLead(message) {
  const text = normalizeText(message);
  const hasPhone = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(message);
  const wantsCallback = text.includes("call me") || text.includes("my number") || text.includes("book me") || text.includes("appointment");
  return hasPhone || wantsCallback;
}

function parseLead(message) {
  const phoneMatch = message.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : "";
  const nameMatch = message.match(/(?:name is|i am|i'm|im)\s+([a-zA-Z][a-zA-Z\s'-]{1,40})/i);
  return {
    name: nameMatch ? nameMatch[1].trim() : "Luna concierge lead",
    phone,
    email: "",
    message: `Luna concierge request: ${message}`
  };
}

function addChatMessage(role, text) {
  const messages = document.getElementById("receptionistMessages");
  if (!messages) return;
  const bubble = document.createElement("div");
  bubble.className = `chat-message ${role}`;
  bubble.textContent = text;
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
}

function showTyping() {
  const messages = document.getElementById("receptionistMessages");
  if (!messages) return null;
  const bubble = document.createElement("div");
  bubble.className = "chat-message bot typing";
  bubble.setAttribute("aria-label", "Luna is typing");
  bubble.innerHTML = "<span></span><span></span><span></span>";
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
  return bubble;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function addBotMessageNaturally(text, extraDelay = 0) {
  const typing = showTyping();
  const delay = Math.min(1600, Math.max(650, 360 + text.length * 12 + extraDelay));
  await wait(delay);
  typing?.remove();
  addChatMessage("bot", text);
}

function renderReceptionistPrompts() {
  const prompts = document.getElementById("receptionistPrompts");
  if (!prompts) return;
  const items = ["I feel sore", "I need to relax", "Open today?", "Help me book"];
  prompts.innerHTML = items.map(item => `<button class="quick-prompt" type="button">${item}</button>`).join("");
  prompts.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => handleReceptionistMessage(button.textContent));
  });
}

async function handleReceptionistMessage(message) {
  const trimmed = String(message || "").trim();
  if (!trimmed) return;
  addChatMessage("user", trimmed);
  await addBotMessageNaturally(receptionistReply(trimmed));

  if (looksLikeLead(trimmed)) {
    const lead = parseLead(trimmed);
    if (lead.phone) {
      try {
        await api("/api/leads", { method: "POST", body: JSON.stringify(lead) });
        await addBotMessageNaturally("I saved that request for the owner. For urgent availability, calling the spa is still the fastest path.", 250);
      } catch {
        await addBotMessageNaturally("I could not save that request right now, but you can still use the contact form or call the spa directly.", 250);
      }
    } else {
      await addBotMessageNaturally("Send your phone number too and I can save this as a callback request.", 250);
    }
  }
}

function wireReceptionist() {
  const launcher = document.getElementById("receptionistLauncher");
  const panel = document.getElementById("receptionistPanel");
  const close = document.getElementById("receptionistClose");
  const form = document.getElementById("receptionistForm");
  const input = document.getElementById("receptionistInput");
  if (!launcher || !panel || !form || !input) return;

  const openPanel = () => {
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    input.focus();
  };

  const closePanel = () => {
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
  };

  launcher.addEventListener("click", () => {
    panel.hidden ? openPanel() : closePanel();
  });

  close?.addEventListener("click", closePanel);

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const message = input.value;
    input.value = "";
    await handleReceptionistMessage(message);
  });

  renderReceptionistPrompts();
  setTimeout(() => {
    addBotMessageNaturally("Hi, I am Luna. Tell me what you need today and I will point you toward the right KW Spa service.", 150);
  }, 450);
}

async function init() {
  siteData = await api("/api/site");
  setBusinessFields(siteData.business || {});
  renderServices(siteData.services || []);
  renderReviews(siteData.reviews || []);
  renderFaq(siteData.faq || []);
  wireForms();
  wireReceptionist();
}

init().catch(error => {
  document.body.insertAdjacentHTML("afterbegin", `<p class="form-status">${error.message}</p>`);
});
