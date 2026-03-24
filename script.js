// Shared configuration
const CART_KEY = "csmss_canteen_cart";
const USER_KEY = "csmss_user";
const AUTH_PROFILE_KEY = "csmss_auth_profile";
const USER_UPDATED_EVENT = "csmss-user-updated";
const ORDERS_KEY = "csmss_canteen_order_history";
const ORDER_HISTORY_UPDATED_EVENT = "csmss-order-history-updated";

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function getCartCount(items) {
  return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

function getCartTotals(items) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * (item.quantity || 0),
    0
  );
  return {
    subtotal,
    total: subtotal,
    items: getCartCount(items),
  };
}

function formatCurrency(value) {
  return `₹${value.toFixed(0)}`;
}

function escapeHtml(str) {
  const s = String(str ?? "");
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

/** Normalized email for per-user order storage */
function getUserEmailKeyForOrders() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      const u = JSON.parse(raw);
      const e = String(u?.email || "").trim().toLowerCase();
      if (e) return e;
    }
  } catch {
    /* ignore */
  }
  try {
    const raw = localStorage.getItem(AUTH_PROFILE_KEY);
    const p = raw ? JSON.parse(raw) : null;
    const e = String(p?.email || "").trim().toLowerCase();
    if (e) return e;
  } catch {
    /* ignore */
  }
  return "";
}

function readOrderHistoryMap() {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function writeOrderHistoryMap(map) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(map));
}

function getOrdersForCurrentUser() {
  const email = getUserEmailKeyForOrders();
  if (!email) return [];
  const map = readOrderHistoryMap();
  const list = map[email];
  return Array.isArray(list) ? list : [];
}

/**
 * @param {{ id: string, createdAt: string, items: Array, total: number, itemCount: number }} orderRecord
 */
function appendOrderForCurrentUser(orderRecord) {
  const email = getUserEmailKeyForOrders();
  if (!email) return false;
  const map = readOrderHistoryMap();
  if (!map[email]) map[email] = [];
  map[email].unshift(orderRecord);
  writeOrderHistoryMap(map);
  window.dispatchEvent(new Event(ORDER_HISTORY_UPDATED_EVENT));
  return true;
}

function buildOrderRecordFromCart(cart) {
  const totals = getCartTotals(cart);
  const id = `ORD-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const items = cart.map((i) => ({
    id: i.id,
    name: i.name,
    price: Number(i.price) || 0,
    quantity: Number(i.quantity) || 0,
    lineTotal: (Number(i.price) || 0) * (Number(i.quantity) || 0),
  }));
  return {
    id,
    createdAt,
    items,
    total: totals.total,
    itemCount: totals.items,
    status: "Completed",
  };
}

function formatOrderDateTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(iso);
  }
}

// Basic menu data used across pages
const MENU_DATA = {
  breakfast: [
    {
      id: "idli-sambar",
      name: "Idli Sambar",
      price: 35,
      description: "Steamed rice idlis served with hot sambar & chutney.",
      image:
        "https://images.pexels.com/photos/14372675/pexels-photo-14372675.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      id: "masala-dosa",
      name: "Masala Dosa",
      price: 45,
      description: "Crispy dosa filled with spiced potato masala.",
      image:
        "images/masala dosa.jpg",
    },
    {
      id: "poha",
      name: "Kanda Poha",
      price: 25,
      description: "Light Maharashtrian flattened rice with onions & peanuts.",
      image:
        "https://images.pexels.com/photos/14372691/pexels-photo-14372691.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
  ],
  snacks: [
    {
      id: "samosa",
      name: "Veg Samosa",
      price: 15,
      description: "Crispy pastry stuffed with spiced potato filling.",
      image:
        "https://images.pexels.com/photos/14372671/pexels-photo-14372671.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      id: "sandwich",
      name: "Grilled Veg Sandwich",
      price: 40,
      description: "Grilled sandwich with fresh veggies & cheese.",
      image:
        "https://images.pexels.com/photos/1600711/pexels-photo-1600711.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      id: "pav-bhaji",
      name: "Pav Bhaji",
      price: 50,
      description: "Buttery pav served with spicy mashed vegetable curry.",
      image:
        "https://images.pexels.com/photos/4611421/pexels-photo-4611421.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      id: "noodles",
      name: "Veg Hakka Noodles",
      price: 55,
      description: "Stir-fried noodles with veggies and Indo-Chinese flavours.",
      image:
        "https://images.pexels.com/photos/884600/pexels-photo-884600.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
  ],
  lunch: [
    {
      id: "veg-thali",
      name: "Veg Thali",
      price: 80,
      description: "Rice, chapati, dal, sabzi, salad & pickle.",
      image:
        "images/vegthali.png",
    },
    {
      id: "paneer-thali",
      name: "Paneer Thali",
      price: 100,
      description: "Paneer curry, dal, rice, chapati and accompaniments.",
      image:
        "https://images.pexels.com/photos/888457/pexels-photo-888457.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      id: "fried-rice",
      name: "Veg Fried Rice",
      price: 60,
      description: "Indo-Chinese style fried rice with vegetables.",
      image:
        "https://images.pexels.com/photos/14375974/pexels-photo-14375974.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
  ],
  beverages: [
    {
      id: "tea",
      name: "Masala Tea",
      price: 10,
      description: "Hot Indian spiced tea.",
      image:
        "https://images.pexels.com/photos/1793035/pexels-photo-1793035.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      id: "coffee",
      name: "Cold Coffee",
      price: 35,
      description: "Chilled coffee with ice and cream.",
      image:
        "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      id: "juice",
      name: "Fresh Lime Soda",
      price: 25,
      description: "Refreshing sweet & salty lime soda.",
      image:
        "https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
  ],
};

const NON_VEG_ITEMS = [
  {
    id: "chicken-roll",
    name: "Chicken Roll",
    price: 90,
    description: "Juicy chicken wrapped with fresh veggies in a soft roll.",
    image:
      "https://images.pexels.com/photos/4958792/pexels-photo-4958792.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "chicken-burger",
    name: "Chicken Burger",
    price: 110,
    description: "Crispy chicken patty burger with lettuce and mayo.",
    image:
      "https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "egg-sandwich",
    name: "Egg Sandwich",
    price: 55,
    description: "Toasted sandwich filled with spiced egg and fresh greens.",
    image:
      "https://images.pexels.com/photos/4109996/pexels-photo-4109996.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "chicken-sandwich",
    name: "Chicken Sandwich",
    price: 85,
    description: "Grilled chicken sandwich with creamy dressing.",
    image:
      "https://images.pexels.com/photos/1600727/pexels-photo-1600727.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "bread-omelette",
    name: "Bread Omelette",
    price: 40,
    description: "Classic college favorite with masala omelette and bread.",
    image:
      "https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];

const CATEGORY_NAV = [
  {
    key: "vegetarian",
    title: "Vegetarian",
    href: "vegetarian.html",
    image:
      "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    key: "nonveg",
    title: "Non Veg",
    href: "nonveg.html",
    image:
      "https://images.pexels.com/photos/616354/pexels-photo-616354.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    key: "beverages",
    title: "Beverages",
    href: "beverages.html",
    image:
      "https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    key: "breakfast",
    title: "Breakfast",
    href: "breakfast.html",
    image:
      "https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];

// Expose flattened list for suggestions
const ALL_ITEMS = [
  ...MENU_DATA.breakfast,
  ...MENU_DATA.snacks,
  ...MENU_DATA.lunch,
  ...MENU_DATA.beverages,
  ...NON_VEG_ITEMS,
];

function getItemsByCategoryKey(categoryKey) {
  if (categoryKey === "breakfast") return MENU_DATA.breakfast;
  if (categoryKey === "beverages") return MENU_DATA.beverages;
  if (categoryKey === "nonveg") return NON_VEG_ITEMS;
  if (categoryKey === "vegetarian") {
    return [...MENU_DATA.snacks, ...MENU_DATA.lunch, MENU_DATA.breakfast[1]].filter(
      Boolean
    );
  }
  return [];
}

function renderCategoryNavCards(root) {
  if (!root) return;
  root.innerHTML = "";
  CATEGORY_NAV.forEach((cat) => {
    const card = document.createElement("a");
    card.href = cat.href;
    card.className = "category-nav-card";
    card.innerHTML = `
      <div class="category-nav-card__image">
        <img src="${cat.image}" alt="${cat.title}" />
      </div>
      <div class="category-nav-card__body">
        <h3 class="category-nav-card__title">${cat.title}</h3>
      </div>
    `;
    root.appendChild(card);
  });
}

function addToCart(itemId) {
  const item =
    ALL_ITEMS.find((x) => x.id === itemId) ||
    ALL_ITEMS.find((x) => x.name === itemId);
  if (!item) return;

  const cart = readCart();
  const existing = cart.find((c) => c.id === item.id);
  if (existing) {
    existing.quantity = (existing.quantity || 0) + 1;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
    });
  }
  writeCart(cart);
  updateCartBadges();
  showMiniToast(`Added "${item.name}" to cart`);
}

function updateCartBadges() {
  const cart = readCart();
  const count = getCartCount(cart);
  const text = String(count);
  document.querySelectorAll("[data-cart-quantity]").forEach((el) => {
    el.textContent = text;
  });
  const nav = document.getElementById("nav-cart-count");
  const mobile = document.getElementById("mobile-cart-count");
  if (nav) nav.textContent = text;
  if (mobile) mobile.textContent = text;
}

function showMiniToast(message) {
  let toast = document.getElementById("mini-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "mini-toast";
    toast.className = "mini-toast is-hidden";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.remove("is-hidden");

  if (toast._hideTimer) clearTimeout(toast._hideTimer);

  toast._hideTimer = setTimeout(() => {
    toast.classList.add("is-hidden");
  }, 1600);
}

function setCurrentYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = String(new Date().getFullYear());
}

function setupMobileNav() {
  const toggle = document.getElementById("mobile-menu-toggle");
  const menu = document.getElementById("mobile-menu");
  if (!toggle || !menu) return;
  toggle.addEventListener("click", () => {
    menu.classList.toggle("is-hidden");
  });
}

function initSignupModalGlobal() {
  if (!initSignupModalGlobal._orderHistoryListener) {
    initSignupModalGlobal._orderHistoryListener = true;
    window.addEventListener(ORDER_HISTORY_UPDATED_EVENT, () => {
      // History updates are consumed by dedicated Order History page.
    });
  }

  const SIGNUP_STORAGE_KEY = "csmss_canteen_signup_profiles";
  const modalId = "signup-modal";
  const DEFAULT_EMAIL = "";

  function readUserProfile() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        name: String(parsed?.name || ""),
        phone: String(parsed?.phone || ""),
        email: String(parsed?.email || DEFAULT_EMAIL),
      };
    } catch {
      return null;
    }
  }

  function getUserInitial(user) {
    const name = String(user?.name || "").trim();
    return name ? name.charAt(0).toUpperCase() : "";
  }

  function setProfileDropdownOpen(wrapper, isOpen) {
    const dropdown = wrapper.querySelector('[data-profile-dropdown="true"]');
    if (!dropdown) return;

    if (isOpen) {
      dropdown.classList.add("profile-dropdown--open");
      dropdown.setAttribute("aria-hidden", "false");
      wrapper.setAttribute("data-profile-open", "true");
    } else {
      dropdown.classList.remove("profile-dropdown--open");
      dropdown.setAttribute("aria-hidden", "true");
      wrapper.setAttribute("data-profile-open", "false");
    }
  }

  function closeAllProfileDropdowns(exceptWrapper) {
    document
      .querySelectorAll('[data-profile-wrapper="true"]')
      .forEach((wrapper) => {
        if (exceptWrapper && wrapper === exceptWrapper) return;
        setProfileDropdownOpen(wrapper, false);
      });
  }

  function bindProfileDropdownGlobal() {
    if (bindProfileDropdownGlobal.bound) return;
    bindProfileDropdownGlobal.bound = true;

    document.addEventListener("click", (e) => {
      const toggleBtn = e.target.closest('[data-action="toggle-profile"]');
      if (toggleBtn) {
        const wrapper = toggleBtn.closest('[data-profile-wrapper="true"]');
        if (!wrapper) return;
        e.preventDefault();
        const isOpen = wrapper.getAttribute("data-profile-open") === "true";
        closeAllProfileDropdowns(wrapper);
        setProfileDropdownOpen(wrapper, !isOpen);
        return;
      }

      if (!e.target.closest('[data-profile-wrapper="true"]')) {
        closeAllProfileDropdowns();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAllProfileDropdowns();
    });

    document.addEventListener("click", (e) => {
      const logoutBtn = e.target.closest('[data-action="logout"]');
      if (!logoutBtn) return;
      e.preventDefault();

      try {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(AUTH_PROFILE_KEY);
      } catch {
        // ignore
      }
      location.reload();
    });
  }

  function updateProfileFields(wrapper) {
    const user = readUserProfile();
    if (!user) return;
    const setText = (selector, value) => {
      wrapper.querySelectorAll(selector).forEach((el) => {
        el.textContent = value || "—";
      });
    };

    setText('[data-profile-name="true"]', user.name);
    setText('[data-profile-phone="true"]', user.phone);
    setText('[data-profile-email="true"]', user.email);
  }

  function onlyDigits(value) {
    return String(value || "").replace(/\D+/g, "");
  }

  function isDarkHeader() {
    const header = document.querySelector("header");
    return header?.classList.contains("site-header--dark") ?? false;
  }

  function getHeaderActionsContainer() {
    const nav = document.querySelector("header nav");
    if (!nav) return null;
    return nav.querySelector("[data-header-actions]") || nav.querySelector(".nav-actions");
  }

  function removeGuestAuthUI(container) {
    container.querySelectorAll('[data-auth-guest="true"]').forEach((el) => el.remove());
    container
      .querySelectorAll('[data-action="open-signup"]')
      .forEach((el) => {
        if (!el.closest("[data-auth-guest]")) el.remove();
      });
  }

  function ensureButtonInDesktopNav() {
    const desktop = getHeaderActionsContainer();
    if (!desktop) return;

    const cart = desktop.querySelector('a[href="cart.html"]');

    const user = readUserProfile();
    if (!user) {
      desktop.querySelectorAll('[data-profile-wrapper="true"]').forEach((el) => el.remove());
      removeGuestAuthUI(desktop);

      if (desktop.querySelector('[data-auth-guest="true"]')) {
        bindOpenButtons();
        return;
      }

      const guestWrap = document.createElement("div");
      guestWrap.setAttribute("data-auth-guest", "true");
      guestWrap.className = "guest-auth-cluster";

      const loginClass = isDarkHeader()
        ? "btn-guest-login"
        : "btn-guest-login btn-guest-login--light";

      const signupClass = isDarkHeader()
        ? "btn-guest-signup"
        : "btn-guest-signup btn-guest-signup--light";

      const onAuthPage = document.body.getAttribute("data-page") === "auth";
      guestWrap.innerHTML = onAuthPage
        ? `
        <button type="button" data-action="open-signup" class="${signupClass}">
          Sign up
        </button>
      `
        : `
        <a href="login.html" class="${loginClass}">Login</a>
        <button type="button" data-action="open-signup" class="${signupClass}">
          Sign up
        </button>
      `;

      if (cart && cart.parentElement === desktop) {
        desktop.insertBefore(guestWrap, cart);
      } else {
        desktop.appendChild(guestWrap);
      }
      bindOpenButtons();
      return;
    }

    // Signed in: remove guest UI and show avatar dropdown
    removeGuestAuthUI(desktop);

    let wrapper = desktop.querySelector('[data-profile-wrapper="true"]');
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.setAttribute("data-profile-wrapper", "true");
      wrapper.setAttribute("data-profile-open", "false");
      wrapper.className = "profile-wrap";

      const initial = getUserInitial(user);
      const avatarBtnClass = isDarkHeader()
        ? "avatar-btn"
        : "avatar-btn avatar-btn--light";

      wrapper.innerHTML = `
        <button
          type="button"
          data-action="toggle-profile"
          aria-label="Open profile"
          class="${avatarBtnClass}"
        >
          ${
            initial
              ? `<span class="avatar-btn__initial">${initial}</span>`
              : `<svg xmlns="http://www.w3.org/2000/svg" class="avatar-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>`
          }
        </button>
        <div
          data-profile-dropdown="true"
          aria-hidden="true"
          class="profile-dropdown"
          role="menu"
        >
          <div class="profile-dropdown__inner">
            <div class="profile-header-row">
              <div class="profile-avatar-lg">
                ${initial ? `<span>${initial}</span>` : `<span>U</span>`}
              </div>
              <div class="profile-dropdown__meta">
                <p class="profile-name-main" data-profile-name="true">—</p>
                <p class="profile-subtitle">View your details</p>
              </div>
            </div>

            <div class="profile-details-stack">
              <div>
                <p class="profile-field-label">Name</p>
                <p class="profile-field-value" data-profile-name="true">—</p>
              </div>
              <div>
                <p class="profile-field-label">Phone</p>
                <p class="profile-field-value" data-profile-phone="true">—</p>
              </div>
              <div>
                <p class="profile-field-label">Email</p>
                <p class="profile-field-value" data-profile-email="true">—</p>
              </div>
            </div>

            <a href="order-history.html" class="btn-secondary" style="width:100%;text-decoration:none;justify-content:center">
              View Order History
            </a>

            <button type="button" data-action="logout" class="btn-logout">
              Logout
            </button>
          </div>
        </div>
      `;

      updateProfileFields(wrapper);
      if (cart && cart.parentElement === desktop) {
        desktop.insertBefore(wrapper, cart);
      } else {
        desktop.appendChild(wrapper);
      }

      bindProfileDropdownGlobal();
    } else {
      updateProfileFields(wrapper);
    }
  }

  function ensureButtonInMobileMenu() {
    const menu = document.getElementById("mobile-menu");
    if (!menu) return;
    const container = menu.querySelector("div");
    if (!container) return;

    const user = readUserProfile();
    const existingProfile = container.querySelector('[data-profile-wrapper="true"]');

    if (!user) {
      if (existingProfile) existingProfile.remove();
      removeGuestAuthUI(container);

      if (container.querySelector('[data-auth-guest="true"]')) {
        bindOpenButtons();
        return;
      }

      const guestWrap = document.createElement("div");
      guestWrap.setAttribute("data-auth-guest", "true");
      guestWrap.className =
        "mobile-guest-box" + (isDarkHeader() ? "" : " mobile-guest-box--light");

      const loginClass = isDarkHeader()
        ? "btn-guest-login"
        : "btn-guest-login btn-guest-login--light";

      const signupClass = isDarkHeader()
        ? "btn-guest-signup"
        : "btn-guest-signup btn-guest-signup--light";

      const onAuthPage = document.body.getAttribute("data-page") === "auth";
      guestWrap.innerHTML = onAuthPage
        ? `
        <button type="button" data-action="open-signup" class="${signupClass}">
          Sign up
        </button>
      `
        : `
        <a href="login.html" class="${loginClass}">Login</a>
        <button type="button" data-action="open-signup" class="${signupClass}">
          Sign up
        </button>
      `;

      const cartLink = container.querySelector('a[href="cart.html"]');
      if (cartLink && cartLink.parentElement === container) {
        container.insertBefore(guestWrap, cartLink);
      } else {
        container.appendChild(guestWrap);
      }
      bindOpenButtons();
      return;
    }

    removeGuestAuthUI(container);

    let wrapper = existingProfile;
    if (!wrapper) {
      const initial = getUserInitial(user);
      const mobileAvatarClass = isDarkHeader()
        ? "avatar-btn avatar-btn--mobile-dark"
        : "avatar-btn avatar-btn--light";

      wrapper = document.createElement("div");
      wrapper.setAttribute("data-profile-wrapper", "true");
      wrapper.setAttribute("data-profile-open", "false");
      wrapper.className = "profile-wrap profile-wrap--mobile";

      wrapper.innerHTML = `
        <button
          type="button"
          data-action="toggle-profile"
          aria-label="Open profile"
          class="${mobileAvatarClass}"
        >
          ${
            initial
              ? `<span class="avatar-btn__initial">${initial}</span>`
              : `<svg xmlns="http://www.w3.org/2000/svg" class="avatar-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>`
          }
        </button>
        <div
          data-profile-dropdown="true"
          aria-hidden="true"
          class="profile-dropdown profile-dropdown--mobile"
          role="menu"
        >
          <div class="profile-dropdown__inner">
            <div class="profile-header-row">
              <div class="profile-avatar-lg">
                ${initial ? `<span>${initial}</span>` : `<span>U</span>`}
              </div>
              <div class="profile-dropdown__meta">
                <p class="profile-name-main" data-profile-name="true">—</p>
                <p class="profile-subtitle">View your details</p>
              </div>
            </div>

            <div class="profile-details-stack">
              <div>
                <p class="profile-field-label">Name</p>
                <p class="profile-field-value" data-profile-name="true">—</p>
              </div>
              <div>
                <p class="profile-field-label">Phone</p>
                <p class="profile-field-value" data-profile-phone="true">—</p>
              </div>
              <div>
                <p class="profile-field-label">Email</p>
                <p class="profile-field-value" data-profile-email="true">—</p>
              </div>
            </div>

            <a href="order-history.html" class="btn-secondary" style="width:100%;text-decoration:none;justify-content:center">
              View Order History
            </a>

            <button type="button" data-action="logout" class="btn-logout">
              Logout
            </button>
          </div>
        </div>
      `;

      updateProfileFields(wrapper);

      const cartLink = container.querySelector('a[href="cart.html"]');
      if (cartLink && cartLink.parentElement === container) {
        container.insertBefore(wrapper, cartLink);
      } else if (cartLink) {
        cartLink.insertAdjacentElement("beforebegin", wrapper);
      } else {
        container.appendChild(wrapper);
      }

      bindProfileDropdownGlobal();
    } else {
      updateProfileFields(wrapper);
    }
  }

  function ensureModal() {
    let modal = document.getElementById(modalId);
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = modalId;
    modal.className = "signup-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-hidden", "true");

    modal.innerHTML = `
      <div data-signup-backdrop class="signup-modal__backdrop"></div>
      <div class="signup-modal__panel">
        <div class="signup-modal__card">
          <div class="signup-modal__header">
            <div>
              <p class="signup-modal__title">Sign Up</p>
              <p class="signup-modal__lead">Student fields appear only when Student is selected.</p>
            </div>
            <button
              type="button"
              data-action="close-signup"
              class="icon-btn"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form id="signup-form" class="signup-form" novalidate>
            <div class="signup-form__row2">
              <div>
                <label for="signup-fullName" class="signup-label">Full Name *</label>
                <input
                  id="signup-fullName"
                  name="fullName"
                  type="text"
                  autocomplete="name"
                  class="signup-input"
                  placeholder="Enter your full name"
                  required
                />
                <p class="signup-error is-hidden" data-error-for="fullName"></p>
              </div>

              <div>
                <label for="signup-email" class="signup-label">Email *</label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  class="signup-input"
                  required
                />
                <p class="signup-error is-hidden" data-error-for="email"></p>
              </div>
            </div>

            <div class="signup-form__row2">
              <div>
                <label for="signup-phone" class="signup-label">Phone Number *</label>
                <input
                  id="signup-phone"
                  name="phone"
                  type="tel"
                  inputmode="numeric"
                  maxlength="10"
                  class="signup-input"
                  placeholder="10-digit number"
                  required
                />
                <p class="signup-error is-hidden" data-error-for="phone"></p>
              </div>

              <fieldset class="signup-fieldset">
                <legend>User Type *</legend>
                <div class="signup-role-grid">
                  <label class="signup-role-label">
                    <span>Staff</span>
                    <input type="radio" name="userType" value="Staff" class="radio-accent" required />
                  </label>
                  <label class="signup-role-label">
                    <span>Student</span>
                    <input type="radio" name="userType" value="Student" class="radio-accent" required />
                  </label>
                </div>
                <p class="signup-error is-hidden" data-error-for="userType"></p>
              </fieldset>
            </div>

            <div
              id="signup-student-fields"
              class="collapsible-panel collapsible-panel--signup"
              aria-hidden="true"
            >
              <div class="collapsible-panel__inner">
                <div class="collapsible-panel__head">
                  <h3>Student details</h3>
                  <span class="badge-pill">Required</span>
                </div>

                <div class="signup-form__row2" style="margin-top: 1rem">
                  <div>
                    <label for="signup-branch" class="signup-label">Branch *</label>
                    <select id="signup-branch" name="branch" class="signup-input">
                      <option value="">Select branch</option>
                      <option>Computer Science</option>
                      <option>Electrical</option>
                      <option>Mechanical</option>
                      <option>AIDS</option>
                      <option>ECE</option>
                      <option>ACT</option>
                      <option>Civil</option>
                    </select>
                    <p class="signup-error is-hidden" data-error-for="branch"></p>
                  </div>

                  <div>
                    <label for="signup-roll" class="signup-label">Roll Number *</label>
                    <input
                      id="signup-roll"
                      name="rollNumber"
                      type="text"
                      class="signup-input"
                      placeholder="Enter roll number"
                    />
                    <p class="signup-error is-hidden" data-error-for="rollNumber"></p>
                  </div>
                </div>

                <div class="signup-form__row2">
                  <div>
                    <label for="signup-year" class="signup-label">Year *</label>
                    <select id="signup-year" name="year" class="signup-input">
                      <option value="">Select year</option>
                      <option>1st Year</option>
                      <option>2nd Year</option>
                      <option>3rd Year</option>
                      <option>4th Year</option>
                    </select>
                    <p class="signup-error is-hidden" data-error-for="year"></p>
                  </div>
                  <div class="signup-grid-spacer" aria-hidden="true"></div>
                </div>
              </div>
            </div>

            <div class="signup-form__footer">
              <p class="text-muted" style="font-size: 11px">Fill details and submit.</p>
              <button type="submit" class="btn-signup-submit">Submit</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    return modal;
  }

  function openModal() {
    const modal = ensureModal();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const first = modal.querySelector("#signup-fullName");
    if (first) first.focus();
  }

  function closeModal() {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function setFieldError(root, key, message) {
    const el = root.querySelector(`[data-error-for="${key}"]`);
    if (!el) return;
    if (!message) {
      el.textContent = "";
      el.classList.add("is-hidden");
      return;
    }
    el.textContent = message;
    el.classList.remove("is-hidden");
  }

  function clearErrors(root) {
    ["fullName", "email", "phone", "userType", "branch", "rollNumber", "year"].forEach(
      (k) => setFieldError(root, k, "")
    );
  }

  function bindModalOnce() {
    const modal = ensureModal();
    if (modal.getAttribute("data-bound") === "true") return;
    modal.setAttribute("data-bound", "true");

    const form = modal.querySelector("#signup-form");
    const phone = modal.querySelector("#signup-phone");
    const studentWrap = modal.querySelector("#signup-student-fields");
    const branch = modal.querySelector("#signup-branch");
    const roll = modal.querySelector("#signup-roll");
    const year = modal.querySelector("#signup-year");
    const roleInputs = Array.from(
      modal.querySelectorAll('input[name="userType"]')
    );

    function getUserType() {
      const checked = roleInputs.find((r) => r.checked);
      return checked ? checked.value : "";
    }

    function setStudentVisibility(isStudent) {
      if (!studentWrap) return;
      if (isStudent) {
        studentWrap.setAttribute("aria-hidden", "false");
        studentWrap.classList.add("is-open");
      } else {
        studentWrap.setAttribute("aria-hidden", "true");
        studentWrap.classList.remove("is-open");
      }
    }

    modal.addEventListener("click", (e) => {
      const target = e.target;
      if (target?.matches?.("[data-signup-backdrop]")) closeModal();
      if (target?.closest?.('[data-action="close-signup"]')) closeModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    if (phone) {
      phone.addEventListener("input", () => {
        phone.value = onlyDigits(phone.value).slice(0, 10);
      });
    }

    roleInputs.forEach((r) =>
      r.addEventListener("change", () => {
        const isStudent = getUserType() === "Student";
        setStudentVisibility(isStudent);
        if (!isStudent) {
          if (branch) branch.value = "";
          if (roll) roll.value = "";
          if (year) year.value = "";
          setFieldError(modal, "branch", "");
          setFieldError(modal, "rollNumber", "");
          setFieldError(modal, "year", "");
        }
      })
    );

    setStudentVisibility(false);
    if (!form) return;


     form.addEventListener("submit", async (e) => {
     e.preventDefault();
     clearErrors(modal);

     const fd = new FormData(form);
     const fullName = String(fd.get("fullName") || "").trim();
    const emailVal = String(fd.get("email") || "").trim();
     const phoneDigits = onlyDigits(fd.get("phone") || "");
     const userType = getUserType();

     let ok = true;

     if (!fullName) {
       ok = false;
      setFieldError(modal, "fullName", "Full Name is required.");
  }
  if (!emailVal) {
    ok = false;
    setFieldError(modal, "email", "Email is required.");
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      ok = false;
      setFieldError(modal, "email", "Please enter a valid email.");
    }
  }
  if (!phoneDigits) {
    ok = false;
    setFieldError(modal, "phone", "Phone number is required.");
  } else if (phoneDigits.length !== 10) {
    ok = false;
    setFieldError(modal, "phone", "Phone number must be exactly 10 digits.");
  }
  if (!userType) {
    ok = false;
    setFieldError(modal, "userType", "Please select Staff or Student.");
  }

  const isStudent = userType === "Student";
  const branchVal = String(fd.get("branch") || "").trim();
  const rollVal = String(fd.get("rollNumber") || "").trim();
  const yearVal = String(fd.get("year") || "").trim();

  if (isStudent) {
    if (!branchVal) {
      ok = false;
      setFieldError(modal, "branch", "Branch is required for Students.");
    }
    if (!rollVal) {
      ok = false;
      setFieldError(modal, "rollNumber", "Roll Number is required for Students.");
    }
    if (!yearVal) {
      ok = false;
      setFieldError(modal, "year", "Year is required for Students.");
    }
  }

  if (!ok) return;

  const payload = {
    fullName,
    email: emailVal,
    phone: phoneDigits,
    userType,
    branch: isStudent ? branchVal : "",
    rollNumber: isStudent ? rollVal : "",
    year: isStudent ? yearVal : "",
    createdAt: new Date().toISOString(),
  };

  try {
    const { initializeApp, getApps, getApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
    const { getFirestore, collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

    const firebaseConfig = {
      apiKey: "AIzaSyDyXlQfTUVIWgOtGPp9-PSBhUuBxHgggHo",
      authDomain: "csmss-canteen-96d28.firebaseapp.com",
      projectId: "csmss-canteen-96d28",
      storageBucket: "csmss-canteen-96d28.firebasestorage.app",
      messagingSenderId: "541374142906",
      appId: "1:541374142906:web:8112606f02edbd6eada583",
      measurementId: "G-JBD9TPTXET"
    };

    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);

    await addDoc(collection(db, "users"), payload);

    // Persist minimal profile for navbar avatar dropdown + keep auth data for checkout autofill.
    try {
      localStorage.setItem(
        USER_KEY,
        JSON.stringify({
          name: fullName,
          phone: phoneDigits,
          email: emailVal,
        })
      );
      localStorage.setItem(
        AUTH_PROFILE_KEY,
        JSON.stringify({
          fullName,
          email: emailVal,
          phone: phoneDigits,
          role: userType,
          branch: isStudent ? branchVal : "",
          rollNumber: isStudent ? rollVal : "",
          year: isStudent ? yearVal : "",
          savedAt: Date.now(),
        })
      );
    } catch {
      // ignore storage errors
    }
    window.dispatchEvent(new Event(USER_UPDATED_EVENT));

    showMiniToast("Sign up saved successfully");
    form.reset();
    setStudentVisibility(false);
    closeModal();
  } catch (error) {
    console.error("Firebase save error:", error);
    alert("Error: " + error.message);
  }
});
  }

  function bindOpenButtons() {
    if (readUserProfile()) return;
    document.querySelectorAll('[data-action="open-signup"]').forEach((el) => {
      if (el.getAttribute("data-bound") === "true") return;
      el.setAttribute("data-bound", "true");
      el.addEventListener("click", () => {
        bindModalOnce();
        openModal();
      });
    });
  }

  bindProfileDropdownGlobal();
  ensureButtonInDesktopNav();
  ensureButtonInMobileMenu();
  bindOpenButtons();

  window.addEventListener(USER_UPDATED_EVENT, () => {
    ensureButtonInDesktopNav();
    ensureButtonInMobileMenu();
  });
}

function initAuthPage() {
  const form = document.getElementById("auth-form");
  const studentFields = document.getElementById("student-fields");
  const success = document.getElementById("form-success");
  const footerYear = document.getElementById("footer-year");
  const phone = document.getElementById("phone");
  const fullName = document.getElementById("fullName");
  const email = document.getElementById("email");
  const branch = document.getElementById("branch");
  const year = document.getElementById("year");

  if (footerYear) footerYear.textContent = String(new Date().getFullYear());

  const roleInputs = Array.from(
    document.querySelectorAll('input[name="role"]')
  );

  function getRole() {
    const checked = roleInputs.find((r) => r.checked);
    return checked ? checked.value : "";
  }

  function setStudentVisibility(isStudent) {
    if (!studentFields) return;
    if (isStudent) {
      studentFields.setAttribute("aria-hidden", "false");
      studentFields.classList.add("is-open");
    } else {
      studentFields.setAttribute("aria-hidden", "true");
      studentFields.classList.remove("is-open");
    }
  }

  function setFieldError(fieldName, message) {
    const el = document.querySelector(`[data-error-for="${fieldName}"]`);
    if (!el) return;
    if (!message) {
      el.textContent = "";
      el.classList.add("is-hidden");
      return;
    }
    el.textContent = message;
    el.classList.remove("is-hidden");
  }

  function clearErrors() {
    ["fullName", "email", "phone", "role", "branch", "year"].forEach((k) =>
      setFieldError(k, "")
    );
  }

  function onlyDigits(value) {
    return String(value || "").replace(/\D+/g, "");
  }

  if (phone) {
    phone.addEventListener("input", () => {
      const digits = onlyDigits(phone.value).slice(0, 10);
      phone.value = digits;
    });
  }

  roleInputs.forEach((r) =>
    r.addEventListener("change", () => {
      const isStudent = getRole() === "Student";
      setStudentVisibility(isStudent);
      if (!isStudent) {
        if (branch) branch.value = "";
        if (year) year.value = "";
        setFieldError("branch", "");
        setFieldError("year", "");
      }
    })
  );

  setStudentVisibility(getRole() === "Student");

  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (success) success.classList.add("is-hidden");

    clearErrors();
    let ok = true;

    const nameVal = (fullName?.value || "").trim();
    const emailVal = (email?.value || "").trim();
    const phoneDigits = onlyDigits(phone?.value || "");
    const roleVal = getRole();

    if (!nameVal) {
      ok = false;
      setFieldError("fullName", "Full Name is required.");
    }
    if (!emailVal) {
      ok = false;
      setFieldError("email", "Email is required.");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailVal)) {
        ok = false;
        setFieldError("email", "Please enter a valid email.");
      }
    }
    if (!phoneDigits) {
      ok = false;
      setFieldError("phone", "Phone number is required.");
    } else if (phoneDigits.length !== 10) {
      ok = false;
      setFieldError("phone", "Phone number must be exactly 10 digits.");
    }
    if (!roleVal) {
      ok = false;
      setFieldError("role", "Please select Student or Staff.");
    }

    const isStudent = roleVal === "Student";
    if (isStudent) {
      const branchVal = (branch?.value || "").trim();
      const yearVal = (year?.value || "").trim();
      if (!branchVal) {
        ok = false;
        setFieldError("branch", "Branch is required for Students.");
      }
      if (!yearVal) {
        ok = false;
        setFieldError("year", "Year is required for Students.");
      }
    }

    if (!ok) return;

    const payload = {
      fullName: nameVal,
      email: emailVal,
      phone: phoneDigits,
      role: roleVal,
      branch: isStudent ? branch?.value || "" : "",
      year: isStudent ? year?.value || "" : "",
      savedAt: Date.now(),
    };

    try {
      localStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(payload));

      localStorage.setItem(
        USER_KEY,
        JSON.stringify({
          name: nameVal,
          phone: phoneDigits,
          email: emailVal,
        })
      );
    } catch {
      // Ignore storage errors in restricted environments
    }

    window.dispatchEvent(new Event(USER_UPDATED_EVENT));

    if (success) success.classList.remove("is-hidden");
    showMiniToast("Profile saved (demo)");
    form.reset();
    setStudentVisibility(false);
  });
}

// Render helpers
function createMenuCard(item) {
  const wrapper = document.createElement("article");
  wrapper.className = "menu-card";
  wrapper.innerHTML = `
    <div class="menu-card__image-wrap">
      <img src="${item.image}" alt="${item.name}" />
      <div class="menu-card__gradient"></div>
      <div class="menu-card__price-tag">
        <span class="menu-card__price-pill">${formatCurrency(item.price)}</span>
      </div>
    </div>
    <div class="menu-card__body">
      <div>
        <h3 class="menu-card__title">${item.name}</h3>
        <p class="menu-card__desc">${item.description}</p>
      </div>
      <div class="menu-card__footer">
        <p class="menu-card__price">${formatCurrency(item.price)}</p>
        <button type="button" data-add-to-cart="${item.id}" class="btn-add-cart">
          Add to Cart
        </button>
      </div>
    </div>
  `;
  return wrapper;
}

function bindMenuButtons(root) {
  root
    .querySelectorAll("[data-add-to-cart]")
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        addToCart(btn.getAttribute("data-add-to-cart"))
      )
    );
}

// Page initializers
function initHeroParallax() {
  const hero = document.querySelector('[data-hero-parallax="true"]');
  const bgImg = hero?.querySelector('[data-hero-bg="true"]');
  if (!hero || !bgImg) return;

  // Respect reduced motion preferences.
  try {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
  } catch {
    // ignore
  }

  bgImg.style.willChange = "transform";
  bgImg.style.transformOrigin = "center center";

  const getSettings = () => {
    const isMobile = window.innerWidth < 768;
    return {
      // 0.2-0.3 multiplier of scrollY, clamped to keep the movement premium.
      speed: isMobile ? 0.22 : 0.25,
      maxTranslate: isMobile ? 18 : 28,
      scale: isMobile ? 1.06 : 1.08,
    };
  };

  let ticking = false;
  let lastTransform = "";

  const update = () => {
    ticking = false;

    const rect = hero.getBoundingClientRect();
    const isActive = rect.bottom > -80 && rect.top < window.innerHeight + 80;
    if (!isActive) {
      if (lastTransform !== "") {
        bgImg.style.transform = "";
        lastTransform = "";
      }
      return;
    }

    const { speed, maxTranslate, scale } = getSettings();
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const rawTranslate = scrollY * speed;
    const translateY = Math.max(-maxTranslate, Math.min(maxTranslate, rawTranslate));

    const nextTransform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
    if (nextTransform !== lastTransform) {
      bgImg.style.transform = nextTransform;
      lastTransform = nextTransform;
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  // Initial paint.
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
}

function initHomePage() {
  const specialsRoot = document.getElementById("home-specials");
  const snacksRoot = document.getElementById("home-snacks");
  const categoryRoot = document.getElementById("home-category-nav");
  if (specialsRoot) {
    const specials = [
      MENU_DATA.breakfast[1],
      MENU_DATA.lunch[0],
      MENU_DATA.beverages[1],
    ];
    specials.forEach((item) => {
      const card = createMenuCard(item);
      specialsRoot.appendChild(card);
    });
  }
  if (snacksRoot) {
    MENU_DATA.snacks.slice(0, 4).forEach((item) => {
      const card = document.createElement("article");
      card.className = "snack-card";
      card.innerHTML = `
        <div class="snack-card__row">
          <div class="snack-card__thumb">
            <img src="${item.image}" alt="${item.name}" />
          </div>
          <div class="snack-card__info">
            <div class="snack-card__head">
              <h3 class="snack-card__name">${item.name}</h3>
              <span class="snack-card__price">${formatCurrency(item.price)}</span>
            </div>
            <p class="snack-card__desc">${item.description}</p>
          </div>
        </div>
        <div class="snack-card__actions">
          <button type="button" data-add-to-cart="${item.id}" class="btn-add-snack">
            Add
          </button>
        </div>
      `;
      snacksRoot.appendChild(card);
    });
  }
  if (categoryRoot) {
    renderCategoryNavCards(categoryRoot);
  }
  bindMenuButtons(document);
}

function initMenuPage() {
  const categoryRoot = document.getElementById("menu-category-nav");
  const map = {
    breakfast: "menu-breakfast",
    snacks: "menu-snacks",
    lunch: "menu-lunch",
    beverages: "menu-beverages",
  };
  Object.entries(map).forEach(([key, id]) => {
    const root = document.getElementById(id);
    if (!root) return;
    MENU_DATA[key].forEach((item) => {
      const card = createMenuCard(item);
      root.appendChild(card);
    });
  });
  if (categoryRoot) {
    renderCategoryNavCards(categoryRoot);
  }
  bindMenuButtons(document);
}

function initCategoryPage(categoryKey) {
  const listRoot = document.getElementById("category-items");
  if (!listRoot) return;
  listRoot.innerHTML = "";
  getItemsByCategoryKey(categoryKey).forEach((item) => {
    listRoot.appendChild(createMenuCard(item));
  });
  bindMenuButtons(document);
}

function initOrderHistoryPage() {
  const listRoot = document.getElementById("order-history-list");
  const emptyRoot = document.getElementById("order-history-empty");
  if (!listRoot || !emptyRoot) return;

  function render() {
    const orders = getOrdersForCurrentUser();
    listRoot.innerHTML = "";

    if (!orders.length) {
      emptyRoot.classList.remove("is-hidden");
      return;
    }

    emptyRoot.classList.add("is-hidden");
    orders.forEach((order) => {
      const itemsList = Array.isArray(order.items) ? order.items : [];
      const status = String(order.status || "Completed");
      const itemCount =
        Number(order.itemCount) ||
        itemsList.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

      const card = document.createElement("article");
      card.className = "order-history-card";
      card.innerHTML = `
        <div class="summary-row">
          <span style="font-weight:600;color:var(--color-zinc-900)">${escapeHtml(order.id || "")}</span>
          <span class="text-muted" style="font-size:11px">${escapeHtml(formatOrderDateTime(order.createdAt || ""))}</span>
        </div>
        <div class="summary-row summary-row--small" style="margin-top:0.25rem">
          <span>Status</span>
          <span style="font-weight:600;color:var(--color-emerald-700)">${escapeHtml(status)}</span>
        </div>
        <div class="summary-row summary-row--small">
          <span>Items</span>
          <span>${escapeHtml(String(itemCount))}</span>
        </div>
        <ul style="margin:0.625rem 0 0;padding:0;list-style:none">
          ${itemsList
            .map(
              (it) => `
            <li class="summary-row summary-row--small">
              <span>${escapeHtml(it.name || "")} × ${escapeHtml(String(Number(it.quantity) || 0))}</span>
              <span>${formatCurrency(Number(it.lineTotal) || 0)}</span>
            </li>
          `
            )
            .join("")}
        </ul>
        <div class="summary-row summary-row--total">
          <span>Total</span>
          <span>${formatCurrency(Number(order.total) || 0)}</span>
        </div>
      `;
      listRoot.appendChild(card);
    });
  }

  render();
  window.addEventListener(ORDER_HISTORY_UPDATED_EVENT, render);
}

function renderCartPage() {
  const cartItemsRoot = document.getElementById("cart-items");
  const emptyState = document.getElementById("cart-empty");
  const clearBtn = document.getElementById("clear-cart");
  const summaryItems = document.getElementById("summary-items");
  const summarySubtotal = document.getElementById("summary-subtotal");
  const summaryTotal = document.getElementById("summary-total");
  const checkoutOpen = document.getElementById("checkout-open");

  if (
    !cartItemsRoot ||
    !emptyState ||
    !summaryItems ||
    !summarySubtotal ||
    !summaryTotal
  ) {
    return;
  }

  function refresh() {
    const cart = readCart();
    cartItemsRoot.innerHTML = "";
    if (!cart.length) {
      emptyState.classList.remove("is-hidden");
      if (checkoutOpen) checkoutOpen.disabled = true;
    } else {
      emptyState.classList.add("is-hidden");
      cart.forEach((item) => {
        const row = document.createElement("div");
        row.className = "cart-line";
        row.innerHTML = `
          <div class="cart-line__main">
            <div class="cart-line__info">
              <span class="cart-line__name">${item.name}</span>
              <span class="cart-line__meta">${formatCurrency(item.price)} each</span>
            </div>
          </div>
          <div class="cart-line__side">
            <div class="cart-qty">
              <button type="button" data-cart-dec="${item.id}" class="btn-qty" aria-label="Decrease">-</button>
              <span class="cart-qty__num">${item.quantity}</span>
              <button type="button" data-cart-inc="${item.id}" class="btn-qty" aria-label="Increase">+</button>
            </div>
            <div class="cart-line__total">
              <p class="cart-line__price">${formatCurrency(item.price * item.quantity)}</p>
              <button type="button" data-cart-remove="${item.id}" class="btn-remove-line">
                Remove
              </button>
            </div>
          </div>
        `;
        cartItemsRoot.appendChild(row);
      });
      cartItemsRoot
        .querySelectorAll("[data-cart-inc]")
        .forEach((btn) =>
          btn.addEventListener("click", () =>
            updateQuantity(btn.getAttribute("data-cart-inc"), 1)
          )
        );
      cartItemsRoot
        .querySelectorAll("[data-cart-dec]")
        .forEach((btn) =>
          btn.addEventListener("click", () =>
            updateQuantity(btn.getAttribute("data-cart-dec"), -1)
          )
        );
      cartItemsRoot
        .querySelectorAll("[data-cart-remove]")
        .forEach((btn) =>
          btn.addEventListener("click", () =>
            removeItem(btn.getAttribute("data-cart-remove"))
          )
        );
      if (checkoutOpen) checkoutOpen.disabled = false;
    }
    const totals = getCartTotals(cart);
    summaryItems.textContent = `${totals.items} item${
      totals.items === 1 ? "" : "s"
    }`;
    summarySubtotal.textContent = formatCurrency(totals.subtotal);
    summaryTotal.textContent = formatCurrency(totals.total);
    updateCartBadges();
  }

  function updateQuantity(id, delta) {
    const cart = readCart();
    const item = cart.find((c) => c.id === id);
    if (!item) return;
    item.quantity = Math.max(1, (item.quantity || 0) + delta);
    writeCart(cart);
    refresh();
  }

  function removeItem(id) {
    let cart = readCart();
    cart = cart.filter((c) => c.id !== id);
    writeCart(cart);
    refresh();
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      writeCart([]);
      refresh();
    });
  }

  // Checkout modal integration
  const checkoutModal = document.getElementById("checkout-modal");
  const checkoutClose = document.getElementById("checkout-close");
  const checkoutCancel = document.getElementById("checkout-cancel");
  const checkoutItems = document.getElementById("checkout-items");
  const checkoutTotal = document.getElementById("checkout-total");
  const checkoutForm = document.getElementById("checkout-form");
  const msg = document.getElementById("checkout-message");
  const nameEl = document.getElementById("checkout-name");
  const emailEl = document.getElementById("checkout-email");
  const phoneEl = document.getElementById("checkout-phone");
  const roleEl = document.getElementById("checkout-role");
  const yearEl = document.getElementById("checkout-year");
  const branchEl = document.getElementById("checkout-branch");
  const rollEl = document.getElementById("checkout-roll");

  function openCheckout() {
    if (!checkoutModal) return;

    const rawProfile = localStorage.getItem("csmss_auth_profile");
    let profile = null;
    try {
      profile = rawProfile ? JSON.parse(rawProfile) : null;
    } catch {
      profile = null;
    }

    if (!profile) {
      if (msg) {
        msg.textContent =
          "No saved profile found. Please complete login/registration before checkout.";
        msg.classList.remove("is-hidden");
      }
      showMiniToast("Please log in / register first");
      return;
    }

    if (!profile.email) {
      if (msg) {
        msg.textContent =
          "No email found in saved profile. Please login/register again.";
        msg.classList.remove("is-hidden");
      }
      showMiniToast("Please login/register again");
      return;
    }

    if (msg) msg.classList.add("is-hidden");

    if (nameEl) nameEl.value = profile.fullName || "";
    if (emailEl) emailEl.value = profile.email || "";
    if (phoneEl) phoneEl.value = profile.phone || "";
    if (roleEl) roleEl.value = profile.role || "";
    if (yearEl) yearEl.value = profile.year || "";
    if (branchEl) branchEl.value = profile.branch || "";
    if (rollEl) rollEl.value = profile.rollNumber || profile.roll || "";

    if (checkoutItems && checkoutTotal) {
      checkoutItems.innerHTML = "";
      const cart = readCart();
      if (!cart.length) {
        const empty = document.createElement("p");
        empty.className = "text-muted";
        empty.style.fontSize = "11px";
        empty.textContent = "Your cart is empty.";
        checkoutItems.appendChild(empty);
        checkoutTotal.textContent = formatCurrency(0);
      } else {
        cart.forEach((item) => {
          const row = document.createElement("div");
          row.className = "checkout-line";
          row.innerHTML = `
            <div class="checkout-line__main">
              <p class="checkout-line__name">${item.name}</p>
              <p class="checkout-line__meta">Qty: ${item.quantity} × ${formatCurrency(item.price)}</p>
            </div>
            <p class="checkout-line__total">${formatCurrency(item.price * (item.quantity || 0))}</p>
          `;
          checkoutItems.appendChild(row);
        });
        const totals = getCartTotals(cart);
        checkoutTotal.textContent = formatCurrency(totals.total);
      }
    }

    checkoutModal.classList.add("is-open");
    checkoutModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeCheckout() {
    if (!checkoutModal) return;
    checkoutModal.classList.remove("is-open");
    checkoutModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  if (checkoutOpen && checkoutModal) {
    checkoutOpen.addEventListener("click", openCheckout);
  }
  if (checkoutClose) {
    checkoutClose.addEventListener("click", closeCheckout);
  }
  if (checkoutCancel) {
    checkoutCancel.addEventListener("click", closeCheckout);
  }
  if (checkoutModal) {
    checkoutModal.addEventListener("click", (e) => {
      const target = e.target;
      if (target?.matches?.("[data-checkout-backdrop]")) {
        closeCheckout();
      }
    });
  }
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const cart = readCart();
      if (!cart.length) {
        showMiniToast("Your cart is empty");
        return;
      }
      const emailKey = getUserEmailKeyForOrders();
      if (!emailKey) {
        showMiniToast("Please log in with a saved email to place an order");
        return;
      }
      const orderRecord = buildOrderRecordFromCart(cart);
      appendOrderForCurrentUser(orderRecord);
      writeCart([]);
      updateCartBadges();
      closeCheckout();
      refresh();
      showMiniToast("Order confirmed!");
    });
  }

  refresh();
}

// Keep header badge in sync when cart changes in another tab
window.addEventListener("storage", (e) => {
  if (e.key === CART_KEY) updateCartBadges();
  if (e.key === ORDERS_KEY) {
    window.dispatchEvent(new Event(ORDER_HISTORY_UPDATED_EVENT));
  }
});

document.addEventListener("DOMContentLoaded", () => {
  setCurrentYear();
  setupMobileNav();
  updateCartBadges();
  initSignupModalGlobal();

  const page = document.body.getAttribute("data-page");
  if (page === "home") {
    initHeroParallax();
    initHomePage();
  }
  if (page === "menu") initMenuPage();
  if (page === "vegetarian") initCategoryPage("vegetarian");
  if (page === "nonveg") initCategoryPage("nonveg");
  if (page === "beverages") initCategoryPage("beverages");
  if (page === "breakfast") initCategoryPage("breakfast");
  if (page === "order-history") initOrderHistoryPage();
  if (page === "cart") renderCartPage();
  if (page === "auth") initAuthPage();
});

