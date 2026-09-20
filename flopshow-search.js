(() => {
  "use strict";

  const CONFIG = {
    sitemapUrl: "/sitemap.xml",
    maxPages: 180,
    concurrency: 4,
    minCharacters: 2,
    debounceMs: 180,
    cacheKey: "flopshow-search-index-v1",
    cacheDuration: 1000 * 60 * 60 * 6,
  };

  const state = {
    pages: [],
    indexPromise: null,
    activeRequest: 0,
    lastFocusedElement: null,
  };

  const normalize = (value = "") =>
    value
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const escapeHTML = (value = "") =>
    value.replace(
      /[&<>'"]/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[character],
    );

  const escapeRegex = (value = "") =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const getPageTitle = (document, url) => {
    const title = document.querySelector("title")?.textContent?.trim();
    const heading = document.querySelector("h1, h2")?.textContent?.trim();
    return (
      title || heading || new URL(url).pathname.split("/").pop() || "FlopShow"
    );
  };

  const getPageDescription = (document, text) => {
    const description = document
      .querySelector('meta[name="description"]')
      ?.content?.trim();
    if (description) return description;
    return text.replace(/\s+/g, " ").trim().slice(0, 220);
  };

  const getSearchableText = (document) => {
    document
      .querySelectorAll(
        "script, style, noscript, svg, nav, footer, [data-search-ignore]",
      )
      .forEach((element) => element.remove());
    return (document.body?.textContent || "").replace(/\s+/g, " ").trim();
  };

  const cacheRead = () => {
    try {
      const cached = JSON.parse(
        localStorage.getItem(CONFIG.cacheKey) || "null",
      );
      if (!cached || Date.now() - cached.timestamp > CONFIG.cacheDuration)
        return null;
      return Array.isArray(cached.pages) ? cached.pages : null;
    } catch {
      return null;
    }
  };

  const cacheWrite = (pages) => {
    try {
      localStorage.setItem(
        CONFIG.cacheKey,
        JSON.stringify({ timestamp: Date.now(), pages }),
      );
    } catch {
      // O localStorage pode estar bloqueado; a busca continua funcionando em memória.
    }
  };

  const getSitemapUrls = async () => {
    try {
      const response = await fetch(CONFIG.sitemapUrl, {
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("Sitemap indisponível");
      const xml = new DOMParser().parseFromString(
        await response.text(),
        "application/xml",
      );
      const urls = [...xml.querySelectorAll("url loc, sitemap loc")]
        .map((node) => node.textContent.trim())
        .filter(Boolean);
      if (urls.length) return urls;
    } catch {
      // O fallback abaixo usa os links da própria página.
    }

    return [...document.querySelectorAll("a[href]")]
      .map((link) => {
        try {
          return new URL(link.href, location.href).href;
        } catch {
          return null;
        }
      })
      .filter((url) => url && new URL(url).origin === location.origin)
      .concat(location.href);
  };

  const fetchPage = async (url) => {
    try {
      const response = await fetch(url, { credentials: "same-origin" });
      const type = response.headers.get("content-type") || "";
      if (!response.ok || !type.includes("text/html")) return null;
      const html = await response.text();
      const pageDocument = new DOMParser().parseFromString(html, "text/html");
      const text = getSearchableText(pageDocument);
      if (!text) return null;
      return {
        url,
        title: getPageTitle(pageDocument, url),
        description: getPageDescription(pageDocument, text),
        text,
        normalizedTitle: normalize(getPageTitle(pageDocument, url)),
        normalizedText: normalize(text),
      };
    } catch {
      return null;
    }
  };

  const buildIndex = async (onProgress = () => {}) => {
    const cached = cacheRead();
    if (cached?.length) {
      state.pages = cached;
      onProgress(cached.length, cached.length);
      return cached;
    }

    const currentUrl = location.href.split("#")[0];
    const urls = [
      ...new Set(
        (await getSitemapUrls())
          .map((url) => url.split("#")[0])
          .filter((url) => {
            try {
              const parsed = new URL(url, location.href);
              return (
                parsed.origin === location.origin &&
                !/\.(xml|jpg|jpeg|png|gif|webp|svg|pdf|zip)$/i.test(
                  parsed.pathname,
                )
              );
            } catch {
              return false;
            }
          }),
      ),
    ].slice(0, CONFIG.maxPages);

    if (!urls.includes(currentUrl)) urls.unshift(currentUrl);

    const pages = [];
    let completed = 0;
    let cursor = 0;

    const worker = async () => {
      while (cursor < urls.length) {
        const url = urls[cursor++];
        const page = await fetchPage(url);
        if (page) pages.push(page);
        completed += 1;
        onProgress(completed, urls.length);
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(CONFIG.concurrency, urls.length) }, worker),
    );
    state.pages = pages;
    cacheWrite(pages);
    return pages;
  };

  const createInterface = () => {
    if (document.getElementById("flopshow-search-dialog")) return;

    const dialog = document.createElement("div");
    dialog.id = "flopshow-search-dialog";
    dialog.className = "flopshow-search-dialog";
    dialog.innerHTML = `
      <div class="flopshow-search-backdrop" data-search-close></div>
      <section class="flopshow-search-panel" role="dialog" aria-modal="true" aria-labelledby="flopshow-search-title">
        <div class="flopshow-search-heading">
          <div>
            <span class="flopshow-search-kicker">FlopShow</span>
            <h2 id="flopshow-search-title">Pesquisar no site</h2>
          </div>
          <button class="flopshow-search-close" type="button" aria-label="Fechar pesquisa" data-search-close>&times;</button>
        </div>
        <form class="flopshow-search-form" role="search">
          <label class="flopshow-search-input-wrap">
            <span class="fa-solid fa-magnifying-glass" aria-hidden="true"></span>
            <input id="flopshow-search-input" type="search" autocomplete="off" placeholder="Busque notícias, realities, enquetes..." aria-label="Pesquisar no FlopShow">
            <kbd>ESC</kbd>
          </label>
        </form>
        <div class="flopshow-search-status" aria-live="polite">Digite pelo menos 2 caracteres para pesquisar.</div>
        <div id="flopshow-search-results" class="flopshow-search-results"></div>
      </section>`;
    document.body.appendChild(dialog);

    dialog.querySelectorAll("[data-search-close]").forEach((element) => {
      element.addEventListener("click", closeSearch);
    });

    dialog
      .querySelector(".flopshow-search-form")
      .addEventListener("submit", (event) => event.preventDefault());
    dialog.querySelector("#flopshow-search-input").addEventListener(
      "input",
      debounce((event) => {
        runSearch(event.target.value);
      }, CONFIG.debounceMs),
    );
  };

  const setStatus = (message) => {
    const status = document.querySelector(".flopshow-search-status");
    if (status) status.textContent = message;
  };

  const highlight = (text, query) => {
    const safe = escapeHTML(text);
    const words = normalize(query)
      .split(" ")
      .filter(Boolean)
      .map(escapeRegex)
      .map(escapeHTML);
    if (!words.length) return safe;
    return safe.replace(
      new RegExp(`(${words.join("|")})`, "gi"),
      "<mark>$1</mark>",
    );
  };

  const getSnippet = (page, query) => {
    const normalized = normalize(page.text);
    const term = normalize(query).split(" ").find(Boolean) || "";
    const position = Math.max(0, normalized.indexOf(term));
    const start = Math.max(0, position - 90);
    const end = Math.min(page.text.length, start + 220);
    return `${start > 0 ? "…" : ""}${page.text.slice(start, end)}${end < page.text.length ? "…" : ""}`;
  };

  const searchPages = (query) => {
    const normalizedQuery = normalize(query);
    const terms = normalizedQuery.split(" ").filter(Boolean);
    return state.pages
      .map((page) => {
        const title = page.normalizedTitle;
        const text = page.normalizedText;
        let score = 0;
        terms.forEach((term) => {
          if (title.includes(term)) score += 20;
          if (text.includes(term)) score += 5;
          if (title.startsWith(term)) score += 10;
        });
        return { page, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  };

  const renderResults = (query, results) => {
    const container = document.getElementById("flopshow-search-results");
    if (!container) return;
    if (!results.length) {
      container.innerHTML = `<div class="flopshow-search-empty"><span>⌕</span><strong>Nenhum resultado encontrado</strong><p>Tente outro termo ou confira a ortografia.</p></div>`;
      return;
    }
    container.innerHTML = results
      .map(
        ({ page }) => `
      <a class="flopshow-search-result" href="${escapeHTML(page.url)}">
        <span class="flopshow-search-result-icon fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></span>
        <span class="flopshow-search-result-copy">
          <strong>${highlight(page.title, query)}</strong>
          <small>${highlight(getSnippet(page, query), query)}</small>
          <em>${escapeHTML(new URL(page.url).pathname.replace(/\/$/, "") || "/")}</em>
        </span>
      </a>`,
      )
      .join("");
  };

  const runSearch = async (query) => {
    const cleanQuery = query.trim();
    const requestId = ++state.activeRequest;
    if (cleanQuery.length < CONFIG.minCharacters) {
      setStatus("Digite pelo menos 2 caracteres para pesquisar.");
      document.getElementById("flopshow-search-results").innerHTML = "";
      return;
    }

    setStatus("Preparando a busca no FlopShow…");
    if (!state.indexPromise) {
      state.indexPromise = buildIndex((loaded, total) => {
        if (requestId === state.activeRequest && total)
          setStatus(`Indexando páginas… ${loaded}/${total}`);
      });
    }
    await state.indexPromise;
    if (requestId !== state.activeRequest) return;
    const results = searchPages(cleanQuery);
    setStatus(
      `${results.length} resultado${results.length === 1 ? "" : "s"} encontrado${results.length === 1 ? "" : "s"}.`,
    );
    renderResults(cleanQuery, results);
  };

  function openSearch() {
    createInterface();
    const dialog = document.getElementById("flopshow-search-dialog");
    state.lastFocusedElement = document.activeElement;
    dialog.classList.add("is-open");
    document.body.classList.add("search-is-open");
    const input = dialog.querySelector("#flopshow-search-input");
    input.value = "";
    input.focus();
    setStatus("Digite pelo menos 2 caracteres para pesquisar.");
  }

  function closeSearch() {
    const dialog = document.getElementById("flopshow-search-dialog");
    if (!dialog) return;
    dialog.classList.remove("is-open");
    document.body.classList.remove("search-is-open");
    state.lastFocusedElement?.focus?.();
  }

  function debounce(callback, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => callback(...args), delay);
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    document
      .querySelectorAll(
        "#search-button, [data-search-trigger], .fa-magnifying-glass",
      )
      .forEach((trigger) => {
        trigger.setAttribute("role", "button");
        trigger.setAttribute("tabindex", "0");
        trigger.setAttribute("aria-label", "Pesquisar no FlopShow");
        trigger.addEventListener("click", openSearch);
        trigger.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openSearch();
          }
        });
      });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeSearch();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      }
    });
  });
})();
