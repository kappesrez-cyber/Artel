// Поведение статической демо-копии сайта (GitHub Pages): меню телефона, панель «+» в поиске,
// поиск по заранее сохранённым запросам и вежливый отказ там, где нужен сервер.
(function () {
  var ROOT = window.ARTEL_ROOT || "./";
  var SEARCH = window.ARTEL_SEARCH || { queries: {}, empty: "search/index.html" };
  var banner = document.querySelector("[data-static-banner]");
  var bannerTimer;

  function notice(text) {
    if (!banner) return alert(text);
    banner.textContent = text;
    banner.style.display = "block";
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(function () {
      banner.style.display = "none";
    }, 4500);
  }

  function go(file) {
    location.href = ROOT + file;
  }

  // Меню телефона.
  var menuButton = document.querySelector('button[aria-controls="mobile-menu"]');
  var menuBox = document.querySelector("[data-static-menu]");
  if (menuButton && menuBox) {
    var path = menuButton.querySelector("path");
    var closedD = path && path.getAttribute("d");
    var setMenu = function (open) {
      menuBox.hidden = !open;
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
      if (path) path.setAttribute("d", open ? "M6 6l12 12M18 6L6 18" : closedD);
    };
    menuButton.addEventListener("click", function () {
      setMenu(menuBox.hidden);
    });
    var overlay = menuBox.querySelector("button[aria-hidden]");
    if (overlay)
      overlay.addEventListener("click", function () {
        setMenu(false);
      });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
  }

  // Панель «+» под строкой поиска.
  var details = document.getElementById("search-details");
  var plus = document.querySelector('button[aria-controls="search-details"]');
  if (details && plus) {
    var icon = plus.querySelector("svg");
    var setDetails = function (open) {
      if (open) details.setAttribute("data-open", "true");
      else details.removeAttribute("data-open");
      details.inert = !open;
      plus.setAttribute("aria-expanded", String(open));
      if (icon) icon.classList.toggle("rotate-[135deg]", open);
    };
    plus.addEventListener("click", function (e) {
      e.preventDefault();
      setDetails(!details.hasAttribute("data-open"));
    });
    details.querySelectorAll("button").forEach(function (b) {
      if (/закрыть|скрыть/i.test(b.getAttribute("aria-label") || b.textContent || ""))
        b.addEventListener("click", function () {
          setDetails(false);
        });
    });
  }

  // Поиск: подбираем ближайший из сохранённых запросов.
  function findSearch(q) {
    var norm = q.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();
    if (!norm) return SEARCH.empty;
    var queries = SEARCH.queries;
    var keys = Object.keys(queries);
    for (var i = 0; i < keys.length; i++)
      if (keys[i].replace(/ё/g, "е") === norm) return queries[keys[i]];
    var words = norm.split(" ");
    var best = null;
    var bestScore = 0;
    keys.forEach(function (k) {
      var kw = k.replace(/ё/g, "е").split(" ");
      var score = 0;
      kw.forEach(function (w) {
        words.forEach(function (u) {
          var a = w.slice(0, Math.max(4, Math.min(w.length, u.length) - 2));
          if (u.indexOf(a) === 0 || w.indexOf(u) === 0) score += Math.min(w.length, u.length);
        });
      });
      score = score / kw.length;
      if (score > bestScore) {
        bestScore = score;
        best = k;
      }
    });
    return best && bestScore >= 3 ? queries[best] : null;
  }

  document.addEventListener(
    "submit",
    function (e) {
      var form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      e.preventDefault();
      e.stopPropagation();
      var text = form.textContent || "";
      var q = form.querySelector('input[name="q"]');
      if (q) {
        var file = findSearch(q.value);
        if (file) return go(file);
        return notice(
          "В демо-версии сохранены результаты для запросов вроде «подшипник», «фильтр», «гидроцилиндр», «амилаза».",
        );
      }
      if (/гост/i.test(text) || form.querySelector('input[name="password"]')) {
        return go("profile/index.html");
      }
      notice("Это демо-версия сайта: отправка форм и оплата работают в полной версии с сервером.");
    },
    true,
  );

  // Кнопки, которые без сервера ничего не сделают, говорят об этом.
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("button");
    if (!b || b.type === "submit" || b.closest("form")) return;
    if (
      b === menuButton ||
      b === plus ||
      b.closest("[data-static-menu]") ||
      b.closest("#search-details")
    )
      return;
    if (b.hasAttribute("data-static-ok")) return;
    var gallery = b.closest("[data-gallery]");
    if (gallery) return;
    var img = b.querySelector("img");
    if (img) return swapPhoto(b, img);
  });

  // Галерея фото: миниатюра становится большой картинкой.
  function swapPhoto(button, thumb) {
    var box = button.parentElement;
    for (var i = 0; i < 4 && box; i++) {
      var imgs = box.querySelectorAll("img");
      if (imgs.length > 1 && imgs[0] !== thumb) {
        imgs[0].src = thumb.src;
        if (thumb.srcset) imgs[0].srcset = thumb.srcset;
        box.querySelectorAll("button[aria-current], button[aria-pressed]").forEach(function (x) {
          x.removeAttribute("aria-current");
          x.setAttribute("aria-pressed", "false");
        });
        button.setAttribute("aria-pressed", "true");
        return;
      }
      box = box.parentElement;
    }
  }
})();
