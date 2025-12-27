// /components/event-invite.js
// Usage: <event-invite></event-invite>
//
// - Everything is hardcoded (no attributes, no escaping, no styles).
// - Light DOM so your global CSS applies.

class EventInvite extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
<section class="event-invite event-invite--lead" aria-labelledby="event-invite-title">
  <div class="event-invite__inner">
    <h2 class="event-invite__title" id="event-invite-title">
      <span class="event-invite__kicker">Events</span>
      <span class="event-invite__headline">Come to an Event</span>
    </h2>

    <p class="event-invite__subhead">
      <span class="event-invite__line">Product walkthroughs, technical deep dives, and Q&amp;A.</span>
      <span class="event-invite__line"><span class="event-invite__em">Bring your messy real-world signals.</span></span>
      <span class="event-invite__line">We’ll show how we verify alignment before anyone trusts the numbers.</span>
    </p>

    <div class="event-invite__actions">
      <a class="button button--primary event-invite__button" href="/events">
        View Upcoming Events
      </a>
      <a class="button button--secondary event-invite__button" href="/events#rsvp">
        RSVP / Get Notified
      </a>
    </div>

    <p class="event-invite__note">
      Prefer small groups? Ask about private demos for your team.
      <a class="link link--primary event-invite__link" href="/contact">Contact us</a>.
    </p>
  </div>
</section>
    `;
  }
}

customElements.define("event-invite", EventInvite);
