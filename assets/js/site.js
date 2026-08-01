/*!
 * HM TRADELINK — shared site interactions
 * Handles: cart (localStorage), cart drawer, toasts, product quick-view,
 * catalog filter/sort/search, "view entire collection" reveal, and
 * misc cross-page button wiring.
 *
 * This file is safe to include on every page — every feature checks for
 * the elements it needs before wiring anything up.
 */
(function () {
  "use strict";

  var CART_KEY = "hmtradelink_cart_v1";

  /* ----------------------------- Cart core ----------------------------- */

  var Cart = {
    read: function () {
      try {
        var raw = window.localStorage.getItem(CART_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },
    write: function (items) {
      try {
        window.localStorage.setItem(CART_KEY, JSON.stringify(items));
      } catch (e) {
        /* localStorage unavailable — cart simply won't persist */
      }
      Cart.notify();
    },
    add: function (product, qty) {
      qty = qty || 1;
      var items = Cart.read();
      var existing = items.find(function (i) {
        return i.id === product.id;
      });
      if (existing) {
        existing.qty += qty;
      } else {
        items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          meta: product.meta || "",
          qty: qty
        });
      }
      Cart.write(items);
    },
    remove: function (id) {
      Cart.write(Cart.read().filter(function (i) {
        return i.id !== id;
      }));
    },
    setQty: function (id, qty) {
      var items = Cart.read();
      var item = items.find(function (i) {
        return i.id === id;
      });
      if (!item) return;
      item.qty = Math.max(1, qty | 0);
      Cart.write(items);
    },
    clear: function () {
      Cart.write([]);
    },
    count: function () {
      return Cart.read().reduce(function (sum, i) {
        return sum + i.qty;
      }, 0);
    },
    subtotal: function () {
      return Cart.read().reduce(function (sum, i) {
        return sum + i.qty * i.price;
      }, 0);
    },
    listeners: [],
    onChange: function (fn) {
      Cart.listeners.push(fn);
    },
    notify: function () {
      Cart.listeners.forEach(function (fn) {
        try { fn(); } catch (e) { /* ignore listener errors */ }
      });
      renderBadges();
    }
  };

  window.HMCart = Cart; // exposed for debugging / future pages

  function money(n) {
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* ------------------------------ Toasts -------------------------------- */

  function ensureToastHost() {
    var host = document.getElementById("hm-toast-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "hm-toast-host";
      host.style.cssText = [
        "position:fixed", "bottom:24px", "left:50%", "transform:translateX(-50%)",
        "z-index:9999", "display:flex", "flex-direction:column", "gap:8px",
        "align-items:center", "pointer-events:none"
      ].join(";");
      document.body.appendChild(host);
    }
    return host;
  }

  function toast(message) {
    var host = ensureToastHost();
    var el = document.createElement("div");
    el.textContent = message;
    el.style.cssText = [
      "background:#1a1a1a", "color:#fff", "font-family:'Hanken Grotesk',sans-serif",
      "font-size:13px", "font-weight:600", "letter-spacing:0.02em",
      "padding:12px 20px", "border-radius:4px", "box-shadow:0 4px 16px rgba(0,0,0,0.2)",
      "opacity:0", "transform:translateY(8px)", "transition:opacity .25s ease, transform .25s ease"
    ].join(";");
    host.appendChild(el);
    requestAnimationFrame(function () {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    });
    setTimeout(function () {
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
      setTimeout(function () { el.remove(); }, 250);
    }, 2200);
  }

  /* --------------------------- Cart badge(s) ----------------------------- */

  function renderBadges() {
    var count = Cart.count();
    document.querySelectorAll("[data-cart-trigger]").forEach(function (trigger) {
      var badge = trigger.querySelector(".hm-cart-badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "hm-cart-badge";
        badge.style.cssText = [
          "position:absolute", "top:-6px", "right:-8px", "background:#000",
          "color:#fff", "font-family:'Geist Mono',monospace", "font-size:10px",
          "line-height:1", "min-width:16px", "height:16px", "border-radius:999px",
          "display:flex", "align-items:center", "justify-content:center",
          "padding:0 3px", "border:1.5px solid #f9f9f9"
        ].join(";");
        if (getComputedStyle(trigger).position === "static") {
          trigger.style.position = "relative";
        }
        trigger.appendChild(badge);
      }
      badge.textContent = String(count);
      badge.style.display = count > 0 ? "flex" : "none";
    });
  }

  /* ------------------------------ Cart drawer ---------------------------- */

  var drawerBuilt = false;

  function buildDrawer() {
    if (drawerBuilt) return;
    drawerBuilt = true;

    var overlay = document.createElement("div");
    overlay.id = "hm-cart-overlay";
    overlay.style.cssText = [
      "position:fixed", "inset:0", "background:rgba(0,0,0,0.4)", "z-index:9997",
      "opacity:0", "pointer-events:none", "transition:opacity .3s ease"
    ].join(";");

    var drawer = document.createElement("aside");
    drawer.id = "hm-cart-drawer";
    drawer.style.cssText = [
      "position:fixed", "top:0", "right:0", "height:100%", "width:100%",
      "max-width:420px", "background:#fff", "z-index:9998", "box-shadow:-8px 0 32px rgba(0,0,0,0.15)",
      "transform:translateX(100%)", "transition:transform .35s ease", "display:flex",
      "flex-direction:column", "font-family:'Hanken Grotesk',sans-serif", "color:#1a1c1c"
    ].join(";");

    drawer.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #e5e5e5;">' +
        '<div style="font-weight:700;font-size:18px;letter-spacing:-0.01em;">Your Cart</div>' +
        '<button id="hm-cart-close" aria-label="Close cart" style="background:none;border:none;cursor:pointer;font-size:22px;line-height:1;color:#1a1a1a;">&times;</button>' +
      '</div>' +
      '<div id="hm-cart-items" style="flex:1;overflow-y:auto;padding:16px 24px;"></div>' +
      '<div id="hm-cart-footer" style="padding:20px 24px;border-top:1px solid #e5e5e5;"></div>';

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    overlay.addEventListener("click", closeDrawer);
    drawer.querySelector("#hm-cart-close").addEventListener("click", closeDrawer);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDrawer();
    });

    Cart.onChange(renderDrawerContents);
    renderDrawerContents();
  }

  function renderDrawerContents() {
    if (!drawerBuilt) return;
    var itemsHost = document.getElementById("hm-cart-items");
    var footerHost = document.getElementById("hm-cart-footer");
    var items = Cart.read();

    if (items.length === 0) {
      itemsHost.innerHTML =
        '<div style="text-align:center;padding:48px 0;color:#646464;">' +
          '<span class="material-symbols-outlined" style="font-size:40px;">shopping_cart</span>' +
          '<p style="margin-top:12px;font-size:14px;">Your cart is empty.</p>' +
        '</div>';
      footerHost.innerHTML =
        '<a href="index.html" style="display:block;text-align:center;background:#000;color:#fff;padding:14px;border-radius:4px;font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;text-decoration:none;">Browse Catalog</a>';
      return;
    }

    itemsHost.innerHTML = items.map(function (item) {
      return (
        '<div style="display:flex;gap:12px;padding:14px 0;border-bottom:1px solid #f0f0f0;" data-item-row="' + item.id + '">' +
          '<div style="width:64px;height:64px;flex-shrink:0;background:#f3f3f3;border:1px solid #e5e5e5;overflow:hidden;border-radius:4px;">' +
            (item.image ? '<img src="' + item.image + '" style="width:100%;height:100%;object-fit:cover;" alt="' + item.name + '"/>' : '') +
          '</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;justify-content:space-between;gap:8px;">' +
              '<span style="font-weight:700;font-size:14px;">' + item.name + '</span>' +
              '<span style="font-family:\'Geist Mono\',monospace;font-size:13px;white-space:nowrap;">' + money(item.price * item.qty) + '</span>' +
            '</div>' +
            (item.meta ? '<div style="font-size:12px;color:#646464;margin-top:2px;">' + item.meta + '</div>' : '') +
            '<div style="display:flex;align-items:center;gap:10px;margin-top:8px;">' +
              '<button data-qty-dec="' + item.id + '" style="width:22px;height:22px;border:1px solid #e5e5e5;background:#fff;cursor:pointer;line-height:1;">-</button>' +
              '<span style="font-size:13px;min-width:16px;text-align:center;">' + item.qty + '</span>' +
              '<button data-qty-inc="' + item.id + '" style="width:22px;height:22px;border:1px solid #e5e5e5;background:#fff;cursor:pointer;line-height:1;">+</button>' +
              '<button data-remove="' + item.id + '" style="margin-left:auto;font-size:12px;color:#ba1a1a;background:none;border:none;cursor:pointer;text-decoration:underline;">Remove</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join("");

    var subtotal = Cart.subtotal();
    footerHost.innerHTML =
      '<div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:14px;">' +
        '<span style="color:#646464;">Subtotal</span>' +
        '<span style="font-family:\'Geist Mono\',monospace;font-weight:700;">' + money(subtotal) + '</span>' +
      '</div>' +
      '<a href="checkout.html" style="display:block;text-align:center;background:#000;color:#fff;padding:14px;border-radius:4px;font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;text-decoration:none;">Proceed to Checkout</a>';

    itemsHost.querySelectorAll("[data-qty-inc]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-qty-inc");
        var item = Cart.read().find(function (i) { return i.id === id; });
        if (item) Cart.setQty(id, item.qty + 1);
      });
    });
    itemsHost.querySelectorAll("[data-qty-dec]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-qty-dec");
        var item = Cart.read().find(function (i) { return i.id === id; });
        if (item) {
          if (item.qty <= 1) Cart.remove(id);
          else Cart.setQty(id, item.qty - 1);
        }
      });
    });
    itemsHost.querySelectorAll("[data-remove]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        Cart.remove(btn.getAttribute("data-remove"));
      });
    });
  }

  function openDrawer() {
    buildDrawer();
    document.getElementById("hm-cart-overlay").style.opacity = "1";
    document.getElementById("hm-cart-overlay").style.pointerEvents = "auto";
    document.getElementById("hm-cart-drawer").style.transform = "translateX(0)";
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    var overlay = document.getElementById("hm-cart-overlay");
    var drawer = document.getElementById("hm-cart-drawer");
    if (!overlay || !drawer) return;
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    drawer.style.transform = "translateX(100%)";
    document.body.style.overflow = "";
  }

  /* ------------------------- Wire up cart triggers ------------------------ */

  function wireCartTriggers() {
    // Any element carrying data-cart-trigger opens the drawer.
    document.querySelectorAll("[data-cart-trigger]").forEach(function (trigger) {
      trigger.style.cursor = "pointer";
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        openDrawer();
      });
    });
  }

  /* ------------------------------------------------------------------------
   * Catalog page (index.html): quick-view, add-to-cart, filter, sort,
   * search, "view entire collection" reveal, hero CTA scroll.
   * ---------------------------------------------------------------------- */

  function initCatalogPage() {
    var grid = document.getElementById("catalog-grid");
    if (!grid) return; // not on the catalog page

    var cards = Array.prototype.slice.call(grid.querySelectorAll(".product-card"));

    // --- Hero "View Signature Collection" -> scroll to catalog ---
    var heroCta = document.getElementById("view-signature-collection");
    if (heroCta) {
      heroCta.addEventListener("click", function () {
        document.getElementById("catalog").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    // --- Add to cart + quick view wiring per card ---
    cards.forEach(function (card) {
      var product = {
        id: card.getAttribute("data-id"),
        name: card.getAttribute("data-name"),
        price: parseFloat(card.getAttribute("data-price")),
        image: card.getAttribute("data-image"),
        meta: card.getAttribute("data-material") || ""
      };

      var addBtn = card.querySelector("[data-add-to-cart]");
      if (addBtn) {
        addBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          Cart.add(product, 1);
          toast(product.name + " added to cart");
        });
      }

      // Tapping anywhere else on the card opens quick view.
      card.addEventListener("click", function (e) {
        if (e.target.closest("[data-add-to-cart]")) return;
        openQuickView(product);
      });
    });

    // --- Filter panel ---
    var filterBtn = document.getElementById("filter-btn");
    var filterPanel = document.getElementById("filter-panel");
    if (filterBtn && filterPanel) {
      filterBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        sortPanel && sortPanel.classList.add("hidden");
        filterPanel.classList.toggle("hidden");
      });
      filterPanel.querySelectorAll("[data-filter-material]").forEach(function (cb) {
        cb.addEventListener("change", applyFilters);
      });
      document.getElementById("filter-clear").addEventListener("click", function () {
        filterPanel.querySelectorAll("input[type=checkbox]").forEach(function (cb) { cb.checked = false; });
        applyFilters();
      });
    }

    // --- Sort panel ---
    var sortBtn = document.getElementById("sort-btn");
    var sortPanel = document.getElementById("sort-panel");
    if (sortBtn && sortPanel) {
      sortBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        filterPanel && filterPanel.classList.add("hidden");
        sortPanel.classList.toggle("hidden");
      });
      sortPanel.querySelectorAll("[data-sort]").forEach(function (opt) {
        opt.addEventListener("click", function () {
          applySort(opt.getAttribute("data-sort"));
          sortPanel.classList.add("hidden");
          sortPanel.querySelectorAll("[data-sort]").forEach(function (o) { o.classList.remove("text-primary", "font-bold"); });
          opt.classList.add("text-primary", "font-bold");
        });
      });
    }

    document.addEventListener("click", function () {
      if (filterPanel) filterPanel.classList.add("hidden");
      if (sortPanel) sortPanel.classList.add("hidden");
    });

    // --- Search ---
    var searchInput = document.getElementById("catalog-search");
    if (searchInput) {
      searchInput.addEventListener("input", applyFilters);
    }

    function applyFilters() {
      var query = (searchInput ? searchInput.value : "").trim().toLowerCase();
      var checked = filterPanel
        ? Array.prototype.slice.call(filterPanel.querySelectorAll("[data-filter-material]:checked")).map(function (cb) { return cb.value; })
        : [];
      var visibleCount = 0;
      cards.forEach(function (card) {
        var name = (card.getAttribute("data-name") || "").toLowerCase();
        var material = card.getAttribute("data-material") || "";
        var matchesQuery = !query || name.indexOf(query) !== -1;
        var matchesFilter = checked.length === 0 || checked.indexOf(material) !== -1;
        var show = matchesQuery && matchesFilter;
        card.style.display = show ? "" : "none";
        if (show) visibleCount++;
      });
      var emptyState = document.getElementById("catalog-empty");
      if (emptyState) emptyState.classList.toggle("hidden", visibleCount !== 0);
    }

    function applySort(mode) {
      var sorted = cards.slice().sort(function (a, b) {
        var pa = parseFloat(a.getAttribute("data-price"));
        var pb = parseFloat(b.getAttribute("data-price"));
        var na = a.getAttribute("data-name");
        var nb = b.getAttribute("data-name");
        if (mode === "price-asc") return pa - pb;
        if (mode === "price-desc") return pb - pa;
        if (mode === "name-asc") return na.localeCompare(nb);
        return 0; // "featured" = original order
      });
      sorted.forEach(function (card) { grid.appendChild(card); });
    }

    // --- View Entire Collection: reveal extra products ---
    var viewAllBtn = document.getElementById("view-entire-collection");
    var extraCards = grid.querySelectorAll(".product-card.hm-extra");
    if (viewAllBtn && extraCards.length) {
      var expanded = false;
      viewAllBtn.addEventListener("click", function () {
        expanded = !expanded;
        extraCards.forEach(function (card) {
          card.classList.toggle("hidden", !expanded);
        });
        viewAllBtn.querySelector(".hm-view-all-label").textContent = expanded
          ? "Show Fewer Pieces"
          : "View Entire Collection";
        viewAllBtn.querySelector(".material-symbols-outlined").style.transform = expanded
          ? "rotate(90deg)"
          : "none";
        if (expanded) {
          extraCards[0].scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    }
  }

  /* ------------------------------ Quick view modal ------------------------ */

  var quickViewBuilt = false;

  function buildQuickView() {
    if (quickViewBuilt) return;
    quickViewBuilt = true;

    var overlay = document.createElement("div");
    overlay.id = "hm-qv-overlay";
    overlay.style.cssText = [
      "position:fixed", "inset:0", "background:rgba(0,0,0,0.5)", "z-index:9995",
      "display:none", "align-items:center", "justify-content:center", "padding:24px"
    ].join(";");

    var modal = document.createElement("div");
    modal.id = "hm-qv-modal";
    modal.style.cssText = [
      "background:#fff", "max-width:720px", "width:100%", "max-height:90vh",
      "overflow-y:auto", "border-radius:6px", "display:grid",
      "grid-template-columns:1fr", "position:relative"
    ].join(";");

    modal.innerHTML =
      '<button id="hm-qv-close" aria-label="Close" style="position:absolute;top:12px;right:12px;background:#fff;border:1px solid #e5e5e5;border-radius:999px;width:32px;height:32px;cursor:pointer;font-size:18px;line-height:1;z-index:1;">&times;</button>' +
      '<div id="hm-qv-body"></div>';

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeQuickView();
    });
    modal.querySelector("#hm-qv-close").addEventListener("click", closeQuickView);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeQuickView();
    });
  }

  function openQuickView(product) {
    buildQuickView();
    var body = document.getElementById("hm-qv-body");
    body.innerHTML =
      '<div style="display:grid;grid-template-columns:1fr;">' +
        '<div style="aspect-ratio:1/1;background:#f3f3f3;overflow:hidden;">' +
          (product.image ? '<img src="' + product.image + '" style="width:100%;height:100%;object-fit:cover;" alt="' + product.name + '"/>' : '') +
        '</div>' +
        '<div style="padding:28px;">' +
          '<div style="font-family:\'Geist Mono\',monospace;font-size:11px;letter-spacing:0.05em;color:#646464;text-transform:uppercase;">' + (product.meta || "") + '</div>' +
          '<h3 style="font-size:26px;font-weight:600;margin:6px 0 10px;">' + product.name + '</h3>' +
          '<div style="font-family:\'Geist Mono\',monospace;font-size:16px;margin-bottom:20px;">' + money(product.price) + '</div>' +
          '<button id="hm-qv-add" style="width:100%;padding:14px;background:#000;color:#fff;border:none;border-radius:4px;font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;cursor:pointer;">Add to Cart</button>' +
        '</div>' +
      '</div>';

    document.getElementById("hm-qv-add").addEventListener("click", function () {
      Cart.add(product, 1);
      toast(product.name + " added to cart");
      closeQuickView();
    });

    document.getElementById("hm-qv-overlay").style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function closeQuickView() {
    var overlay = document.getElementById("hm-qv-overlay");
    if (!overlay) return;
    overlay.style.display = "none";
    document.body.style.overflow = "";
  }

  /* ------------------------------------------------------------------------
   * Checkout page: render real cart contents + "Complete Order" handler.
   * ---------------------------------------------------------------------- */

  function initCheckoutPage() {
    var summary = document.getElementById("checkout-summary");
    if (!summary) return; // not on checkout page

    var SHIPPING = 45.0;
    var TAX_RATE = 0.08;

    function render() {
      var items = Cart.read();
      var itemsHost = document.getElementById("checkout-items");
      var completeBtn = document.getElementById("complete-order-btn");

      if (items.length === 0) {
        itemsHost.innerHTML =
          '<div style="text-align:center;padding:32px 0;color:#646464;">' +
            '<p style="margin-bottom:12px;">Your cart is currently empty.</p>' +
            '<a href="index.html" style="text-decoration:underline;color:#1a1a1a;">Return to the catalog</a>' +
          '</div>';
        document.getElementById("checkout-subtotal").textContent = money(0);
        document.getElementById("checkout-shipping").textContent = money(0);
        document.getElementById("checkout-tax").textContent = money(0);
        document.getElementById("checkout-total").textContent = money(0);
        if (completeBtn) completeBtn.disabled = true;
        if (completeBtn) completeBtn.style.opacity = "0.5";
        if (completeBtn) completeBtn.style.cursor = "not-allowed";
        return;
      }

      itemsHost.innerHTML = items.map(function (item) {
        return (
          '<div class="flex items-start">' +
            '<div class="w-20 h-24 bg-surface border border-outline-variant flex-shrink-0 overflow-hidden">' +
              (item.image ? '<img class="w-full h-full object-cover" src="' + item.image + '" alt="' + item.name + '"/>' : '') +
            '</div>' +
            '<div class="ml-4 flex-grow">' +
              '<div class="flex justify-between">' +
                '<h3 class="font-body-md text-body-md font-bold">' + item.name + '</h3>' +
                '<span class="font-mono-label text-body-md">' + money(item.price * item.qty) + '</span>' +
              '</div>' +
              (item.meta ? '<p class="text-on-surface-variant font-body-sm text-body-sm mt-1">' + item.meta + '</p>' : '') +
              '<p class="text-on-surface-variant font-body-sm text-body-sm mt-0.5">Qty: ' + item.qty + '</p>' +
            '</div>' +
          '</div>'
        );
      }).join("");

      var subtotal = Cart.subtotal();
      var tax = subtotal * TAX_RATE;
      var total = subtotal + SHIPPING + tax;

      document.getElementById("checkout-subtotal").textContent = money(subtotal);
      document.getElementById("checkout-shipping").textContent = money(SHIPPING);
      document.getElementById("checkout-tax").textContent = money(tax);
      document.getElementById("checkout-total").textContent = money(total);
      if (completeBtn) {
        completeBtn.disabled = false;
        completeBtn.style.opacity = "";
        completeBtn.style.cursor = "";
      }
    }

    Cart.onChange(render);
    render();

    var completeBtn = document.getElementById("complete-order-btn");
    if (completeBtn) {
      completeBtn.addEventListener("click", function () {
        if (Cart.read().length === 0) return;
        var requiredFields = document.querySelectorAll("#checkout-form [required]");
        var missing = Array.prototype.slice.call(requiredFields).some(function (f) { return !f.value.trim(); });
        if (missing) {
          toast("Please complete all required fields.");
          return;
        }
        toast("Order placed! A confirmation has been sent to your email.");
        Cart.clear();
        setTimeout(function () {
          window.location.href = "index.html";
        }, 1600);
      });
    }
  }

  /* ------------------------------------------------------------------------
   * Bespoke Orders page: "View Full Archive" reveal.
   * ---------------------------------------------------------------------- */

  function initBespokePage() {
    var archiveBtn = document.getElementById("view-full-archive");
    var extra = document.querySelectorAll(".hm-portfolio-extra");
    if (!archiveBtn || !extra.length) return;
    var expanded = false;
    archiveBtn.addEventListener("click", function (e) {
      e.preventDefault();
      expanded = !expanded;
      extra.forEach(function (card) { card.classList.toggle("hidden", !expanded); });
      archiveBtn.textContent = expanded ? "Show Fewer Projects" : "View Full Archive";
      if (expanded) extra[0].scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  /* ------------------------------------------------------------------------
   * About page: "View Our Facility" scroll + generic anchor smoothing.
   * ---------------------------------------------------------------------- */

  function initAboutPage() {
    var facilityBtn = document.getElementById("view-our-facility");
    var process = document.getElementById("process");
    if (facilityBtn && process) {
      facilityBtn.addEventListener("click", function () {
        process.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  /* --------------------------------- Init --------------------------------- */

  document.addEventListener("DOMContentLoaded", function () {
    wireCartTriggers();
    renderBadges();
    initCatalogPage();
    initCheckoutPage();
    initBespokePage();
    initAboutPage();
  });
})();
