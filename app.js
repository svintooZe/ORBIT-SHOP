// Строгий режим помогает замечать ошибки, например обращение к необъявленной переменной.
"use strict";
// Ключ — название записи в хранилище браузера. Версия позволяет отличать формат данных.
const CART_KEY = "orbit-cart-v1";
// Читаем сохранённую корзину при открытии каждой страницы.
let cart = readCart();
// Переменная хранит номер таймера всплывающего уведомления.
let noticeTimer;
// Превращаем число в цену по русским правилам и добавляем знак рубля.
function money(value) {
  return value.toLocaleString("ru-RU") + " ₽";
}
// Восстанавливаем корзину и защищаемся от испорченного содержимого localStorage.
function readCart() {
  try {
    // JSON.parse превращает JSON-строку в массив; если записи нет, берём пустой массив.
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    // Если сохранено что-то другое, возвращаем пустую корзину.
    if (!Array.isArray(saved)) return [];
    // Оставляем только известные товары с целым количеством от 1 до 99.
    return saved.filter(item => item && products.some(p => p.id === item.id) && Number.isInteger(item.qty) && item.qty > 0 && item.qty <= 99);
  } catch {
    // При ошибке чтения сайт продолжит работать с пустой корзиной.
    return [];
  }
}
// Записываем изменения и обновляем счётчик в шапке.
function saveCart() {
  try {
    // JSON.stringify превращает массив в строку, которую умеет хранить localStorage.
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    // Если браузер запретил хранилище, показываем причину, но не останавливаем работу.
    notify("Браузер запретил сохранение. Корзина работает до перехода на другую страницу.");
  }
  updateCount();
}
// Суммируем количество единиц товара, а не число разных позиций.
function updateCount() {
  document.getElementById("cart-count").textContent = cart.reduce((sum, item) => sum + item.qty, 0);
}
// Выводим временное уведомление без блокирующего alert.
function notify(message) {
  const notice = document.getElementById("notice");
  notice.textContent = message;
  notice.hidden = false;
  // Сбрасываем прошлый таймер, чтобы новое сообщение не исчезло слишком рано.
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { notice.hidden = true; }, 3500);
}
// Общая шапка и подвал создаются JavaScript, поэтому не нужно редактировать их на шести страницах.
function showLayout() {
  const current = document.body.dataset.page;
  const links = [["index", "index.html", "Главная"], ["catalog", "catalog.html", "Каталог"], ["delivery", "delivery.html", "Доставка"], ["contacts", "contacts.html", "Контакты"]];
  // Шаблонная строка в обратных кавычках позволяет вставлять переменные через ${...}.
  document.getElementById("header").innerHTML = `
    <div class="container nav-row">
      <a class="brand" href="index.html" aria-label="Orbit — главная"><span class="brand-mark">o</span> orbit<span class="brand-dot">.</span></a>
      <button class="menu-button" id="menu-toggle" aria-expanded="false" aria-controls="navigation">Меню ☰</button>
      <nav id="navigation" aria-label="Основная навигация">${links.map(link => `<a href="${link[1]}" ${current === link[0] ? 'aria-current="page"' : ""}>${link[2]}</a>`).join("")}</nav>
      <a class="cart-link" href="cart.html" ${current === "cart" ? 'aria-current="page"' : ""}>Корзина <span id="cart-count">0</span></a>
    </div>`;
  document.getElementById("footer").innerHTML = `
    <div class="container footer-grid"><div><a class="brand" href="index.html">orbit.</a><p>Техника для ваших идей.</p></div><div><strong>Магазин</strong><a href="catalog.html">Все товары</a><a href="delivery.html">Доставка и оплата</a><a href="contacts.html">Связаться с нами</a></div><div><strong>Учебный проект</strong><p>Независимый демонстрационный магазин.<br>Не является официальным сайтом Apple.<br>Цены условные. Покупки не совершаются.</p></div></div>
    <div class="container footer-bottom">© ${new Date().getFullYear()} Orbit · HTML / CSS / JavaScript<span>Сделано с вниманием к деталям</span></div>`;
  // По нажатию переключаем мобильное меню и сообщаем его состояние вспомогательным технологиям.
  document.getElementById("menu-toggle").addEventListener("click", () => {
    const navigation = document.getElementById("navigation");
    const open = navigation.classList.toggle("open");
    document.getElementById("menu-toggle").setAttribute("aria-expanded", String(open));
  });
  updateCount();
}
// Добавляем товар по уникальному номеру.
function addToCart(id) {
  const existing = cart.find(item => item.id === id);
  // Если позиция уже есть, увеличиваем количество; иначе добавляем новый объект.
  if (existing) {
    if (existing.qty >= 99) { notify("Максимум — 99 штук одного товара."); return; }
    existing.qty += 1;
  } else {
    cart.push({ id: id, qty: 1 });
  }
  saveCart();
  notify("Товар добавлен в корзину");
}
// Возвращаем HTML одной карточки. Здесь используются только наши заранее заданные данные.
function card(product) {
  return `
    <article class="product-card">
      <a class="product-image" href="product.html?id=${product.id}"><img src="assets/${product.image}" alt="${product.name}" loading="lazy"></a>
      <div class="card-info"><p class="eyebrow">${product.category}</p><h3><a href="product.html?id=${product.id}">${product.name}</a></h3><p class="card-description">${product.badge}</p>
      <div class="card-bottom"><strong>${money(product.price)}</strong><button class="add-button" data-add="${product.id}" aria-label="Добавить ${product.name} в корзину">+</button></div></div>
    </article>`;
}
// Навешиваем обработчики на кнопки, которые только что появились после innerHTML.
function connectAddButtons(container) {
  container.querySelectorAll("[data-add]").forEach(button => {
    button.addEventListener("click", () => addToCart(Number(button.dataset.add)));
  });
}
// На главной показываем четыре выбранных товара.
function showFeatured() {
  const target = document.getElementById("featured");
  if (!target) return;
  target.innerHTML = [products[0], products[2], products[3], products[5]].map(card).join("");
  connectAddButtons(target);
}
// Поиск, фильтр категорий и сортировка работают вместе на странице каталога.
function setupCatalog() {
  const grid = document.getElementById("catalog-grid");
  if (!grid) return;
  const search = document.getElementById("search");
  const category = document.getElementById("category");
  const sort = document.getElementById("sort");
  // Можно открыть каталог сразу с категорией, например catalog.html?category=Mac.
  const selected = new URLSearchParams(location.search).get("category");
  if ([...category.options].some(option => option.value === selected)) category.value = selected;
  function render() {
    // trim убирает пробелы с краёв, а нижний регистр делает поиск нечувствительным к регистру.
    const query = search.value.trim().toLowerCase();
    const result = products.filter(product => product.name.toLowerCase().includes(query) && (category.value === "all" || product.category === category.value));
    // sort меняет только новый массив result, исходный products остаётся прежним.
    if (sort.value === "cheap") result.sort((a, b) => a.price - b.price);
    if (sort.value === "expensive") result.sort((a, b) => b.price - a.price);
    grid.innerHTML = result.length ? result.map(card).join("") : '<p class="empty-state">Ничего не найдено. Попробуйте другое название или категорию.</p>';
    document.getElementById("results-count").textContent = "Найдено товаров: " + result.length;
    connectAddButtons(grid);
  }
  // input срабатывает при вводе, change — при выборе значения списка.
  search.addEventListener("input", render);
  category.addEventListener("change", render);
  sort.addEventListener("change", render);
  render();
}
// Одна HTML-страница товара обслуживает весь каталог благодаря параметру id в адресе.
function showProduct() {
  const target = document.getElementById("product-detail");
  if (!target) return;
  const id = Number(new URLSearchParams(location.search).get("id"));
  const product = products.find(item => item.id === id);
  if (!product) {
    target.innerHTML = '<div class="empty-state"><h1>Товар не найден</h1><a class="button" href="catalog.html">Открыть каталог</a></div>';
    return;
  }
  document.title = product.name + " — Orbit";
  // Object.entries превращает характеристики объекта в пары «название — значение» для таблицы.
  target.innerHTML = `
    <div class="detail-image"><img src="assets/${product.image}" alt="${product.name}"></div>
    <div class="detail-info"><p class="eyebrow">${product.category} / ${product.badge}</p><h1>${product.name}</h1><p class="lead">${product.description}</p><p class="stock">● Доступен в учебном каталоге</p><p class="detail-price">${money(product.price)}</p><button class="button" data-add="${product.id}">Добавить в корзину ↗</button><p class="muted">Одна фиксированная конфигурация. Цена демонстрационная.</p>
    <h2>Характеристики</h2><table class="specs"><tbody>${Object.entries(product.specs).map(([key, value]) => `<tr><th scope="row">${key}</th><td>${value}</td></tr>`).join("")}</tbody></table></div>`;
  connectAddButtons(target);
}
// Рисуем корзину и пересчитываем итог после каждого изменения.
function showCart() {
  const target = document.getElementById("cart-items");
  if (!target) return;
  let total = 0;
  target.innerHTML = cart.length ? cart.map(item => {
    const product = products.find(p => p.id === item.id);
    total += product.price * item.qty;
    return `<article class="cart-item"><img src="assets/${product.image}" alt="${product.name}"><div class="cart-item-info"><h2><a href="product.html?id=${product.id}">${product.name}</a></h2><p class="muted">${money(product.price)} / шт.</p><button class="text-button" data-remove="${item.id}" aria-label="Удалить ${product.name}">Удалить</button></div><div class="quantity"><button data-step="-1" data-id="${item.id}" aria-label="Уменьшить количество ${product.name}">−</button><span>${item.qty}</span><button data-step="1" data-id="${item.id}" aria-label="Увеличить количество ${product.name}">+</button></div><strong>${money(product.price * item.qty)}</strong></article>`;
  }).join("") : '<div class="empty-state"><h2>Пока здесь пусто</h2><p>Найдите технику для ваших идей.</p><a class="button" href="catalog.html">В каталог ↗</a></div>';
  document.getElementById("total").textContent = money(total);
  document.getElementById("summary-count").textContent = cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById("checkout-button").disabled = cart.length === 0;
  // На пустой корзине прячем форму оформления.
  if (!cart.length) document.getElementById("checkout-form").hidden = true;
  target.querySelectorAll("[data-remove]").forEach(button => {
    button.addEventListener("click", () => {
      cart = cart.filter(item => item.id !== Number(button.dataset.remove));
      saveCart();
      showCart();
    });
  });
  target.querySelectorAll("[data-step]").forEach(button => {
    button.addEventListener("click", () => {
      const item = cart.find(p => p.id === Number(button.dataset.id));
      // Ограничиваем количество снизу и сверху; удаление выполняется отдельной кнопкой.
      item.qty = Math.min(99, Math.max(1, item.qty + Number(button.dataset.step)));
      saveCart();
      showCart();
    });
  });
}
// Форма оформления — демонстрация: сервер и настоящая оплата не используются.
function setupCheckout() {
  const button = document.getElementById("checkout-button");
  if (!button) return;
  const form = document.getElementById("checkout-form");
  button.addEventListener("click", () => { form.hidden = false; form.querySelector("input").focus(); });
  form.addEventListener("submit", event => {
    // preventDefault отменяет обычную отправку формы и перезагрузку страницы.
    event.preventDefault();
    if (!cart.length) return;
    cart = [];
    saveCart();
    showCart();
    form.reset();
    document.getElementById("order-result").textContent = "Готово! Учебный заказ оформлен. Данные никуда не отправлены, оплата не списывалась.";
  });
}
// Контактная форма показывает сообщение об успехе, не отправляя письмо.
function setupContact() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  form.addEventListener("submit", event => {
    event.preventDefault();
    document.getElementById("contact-result").textContent = "Спасибо! Форма проверена. Это демонстрация: сообщение не отправлено.";
    form.reset();
  });
}
// Скрипт подключён с defer: к моменту этих вызовов HTML уже разобран браузером.
showLayout();
showFeatured();
setupCatalog();
showProduct();
showCart();
setupCheckout();
setupContact();
