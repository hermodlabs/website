// /components/bloglist/bloglist.js
// Usage: <blog-list page-size="3"></blog-list>
//
// - Light DOM so your existing global CSS applies.
// - No build step: Lit imported via CDN.
// - Supports setting posts via property: el.posts = [...]
// - IMPORTANT: Do NOT HTML-escape text fields in Lit, or you'll see &#39; etc.

import { LitElement, html } from "https://esm.run/lit";

class BlogList extends LitElement {
  static properties = {
    // Set from JS: el.posts = [...]
    // (Attribute disabled because it's an array/object)
    posts: { attribute: false },

    // <blog-list page-size="3">
    pageSize: { type: Number, attribute: "page-size" },
  };

  constructor() {
    super();
    this.posts = [];
    this.pageSize = 3;
    this._page = 0;
  }

  // Light DOM so global CSS applies
  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();

    // Preserve your original behavior:
    // If static pre-rendered cards exist and posts not set, don't clobber.
    const hasPreRenderedCards = this.querySelector(".blog-card");
    if (hasPreRenderedCards && (!this.posts || this.posts.length === 0)) return;

    this.requestUpdate();
  }

  updated(changed) {
    // Reset page when data or page size changes
    if (changed.has("posts") || changed.has("pageSize")) {
      this._page = 0;
    }

    // Clamp page
    const pc = this.pageCount;
    this._page = Math.min(Math.max(this._page, 0), pc - 1);
  }

  get page() {
    return this._page;
  }

  get pageCount() {
    const size =
      Number.isFinite(this.pageSize) && this.pageSize > 0
        ? Math.floor(this.pageSize)
        : 1;

    const total = Array.isArray(this.posts) ? this.posts.length : 0;
    return Math.max(1, Math.ceil(total / size));
  }

  prev = () => {
    if (this._page > 0) {
      this._page -= 1;
      this.requestUpdate();
    }
  };

  next = () => {
    if (this._page < this.pageCount - 1) {
      this._page += 1;
      this.requestUpdate();
    }
  };

  render() {
    const posts = Array.isArray(this.posts) ? this.posts : [];
    const total = posts.length;

    const size =
      Number.isFinite(this.pageSize) && this.pageSize > 0
        ? Math.floor(this.pageSize)
        : 1;

    const pageCount = this.pageCount;

    // Clamp page in case posts changed
    this._page = Math.min(Math.max(this._page, 0), pageCount - 1);

    const start = this._page * size;
    const end = Math.min(start + size, total);
    const visible = posts.slice(start, end);

    const canPrev = this._page > 0;
    const canNext = this._page < pageCount - 1;

    return html`
      <div class="blog__list" role="list">
        ${visible.map((post) => this.renderPost(post))}
      </div>

      <nav class="blog-pager" aria-label="Blog pagination">
        <div class="blog-pager__inner">
          <button
            type="button"
            class="blog-pager__btn blog-pager__btn--prev"
            ?disabled=${!canPrev}
            aria-disabled=${canPrev ? "false" : "true"}
            aria-label="Previous posts"
            @click=${this.prev}
          >
            <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
            <span class="blog-pager__label">Prev</span>
          </button>

          <div class="blog-pager__status" aria-live="polite">
            <span class="blog-pager__page">
              Page ${pageCount === 0 ? 0 : this._page + 1} of ${pageCount}
            </span>
            <span class="blog-pager__range">
              (${total === 0 ? 0 : start + 1}–${end} of ${total})
            </span>
          </div>

          <button
            type="button"
            class="blog-pager__btn blog-pager__btn--next"
            ?disabled=${!canNext}
            aria-disabled=${canNext ? "false" : "true"}
            aria-label="Next posts"
            @click=${this.next}
          >
            <span class="blog-pager__label">Next</span>
            <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
          </button>
        </div>
      </nav>
    `;
  }

  renderPost(post) {
    // IDs + href are the only places we need to sanitize for attribute safety.
    const id = this.safeId(post?.id || this.slugify(post?.title || "post"));
    const href = this.safeHref(post?.href ?? "#");

    // IMPORTANT: no escapeHtml() here — Lit renders these as text safely.
    const tag = post?.tag ?? "";
    const date = post?.date ?? "";
    const title = post?.title ?? "";
    const excerpt = post?.excerpt ?? "";

    return html`
      <article class="blog-card" role="listitem" aria-labelledby=${id}>
        <div class="blog-card__meta">
          <span class="blog-card__tag">${tag}</span>
          <span class="blog-card__date">${date}</span>
        </div>

        <h2 class="blog-card__title" id=${id}>
          <a class="blog-card__link" href=${href}>${title}</a>
        </h2>

        <p class="blog-card__excerpt">${excerpt}</p>

        <div class="blog-card__actions">
          <a class="link link--primary blog-card__read-more" href=${href}>
            Read the article
          </a>
        </div>
      </article>
    `;
  }

  // Keep this only for cases where you are building HTML strings.
  // Not used for Lit text interpolations.
  escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  safeHref(href) {
    const s = String(href || "").trim();
    if (/^javascript:/i.test(s)) return "#";
    return s || "#";
  }

  safeId(id) {
    return (
      String(id || "")
        .trim()
        .replace(/[^A-Za-z0-9\-_:.]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "post"
    );
  }

  slugify(text) {
    return (
      String(text || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "post"
    );
  }
}

customElements.define("blog-list", BlogList);
