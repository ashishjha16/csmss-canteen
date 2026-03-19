// Shared configuration
const CART_KEY = "csmss_canteen_cart";
const USER_KEY = "csmss_user";
const AUTH_PROFILE_KEY = "csmss_auth_profile";
const USER_UPDATED_EVENT = "csmss-user-updated";

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
        "https://images.pexels.com/photos/14372692/pexels-photo-14372692.jpeg?auto=compress&cs=tinysrgb&w=800",
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
        "https://images.pexels.com/photos/4109990/pexels-photo-4109990.jpeg?auto=compress&cs=tinysrgb&w=800",
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

// Expose flattened list for suggestions
const ALL_ITEMS = [
  ...MENU_DATA.breakfast,
  ...MENU_DATA.snacks,
  ...MENU_DATA.lunch,
  ...MENU_DATA.beverages,
];

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
  const nav = document.getElementById("nav-cart-count");
  const mobile = document.getElementById("mobile-cart-count");
  if (nav) nav.textContent = String(count);
  if (mobile) mobile.textContent = String(count);
}

function showMiniToast(message) {
  let toast = document.getElementById("mini-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "mini-toast";
    toast.className =
      "fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-xs text-white shadow-lg transition opacity-0";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.remove("opacity-0", "translate-y-3");
  toast.classList.add("opacity-100");
  setTimeout(() => {
    toast.classList.add("opacity-0");
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
    menu.classList.toggle("hidden");
  });
}

function initSignupModalGlobal() {
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
      dropdown.classList.remove(
        "opacity-0",
        "scale-95",
        "pointer-events-none"
      );
      dropdown.classList.add("opacity-100", "scale-100", "pointer-events-auto");
      dropdown.setAttribute("aria-hidden", "false");
      wrapper.setAttribute("data-profile-open", "true");
    } else {
      dropdown.classList.add(
        "opacity-0",
        "scale-95",
        "pointer-events-none"
      );
      dropdown.classList.remove(
        "opacity-100",
        "scale-100",
        "pointer-events-auto"
      );
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
    const cls = header?.className || "";
    return cls.includes("bg-[#12422e]") || cls.includes("bg-[#12422e]/");
  }

  function ensureButtonInDesktopNav() {
    const nav = document.querySelector("header nav");
    if (!nav) return;

    const desktop = Array.from(nav.children).find(
      (el) => el?.classList?.contains("md:flex") && el?.classList?.contains("hidden")
    );
    if (!desktop) return;

    const user = readUserProfile();
    if (!user) {
      const existingProfile = desktop.querySelector('[data-profile-wrapper="true"]');
      if (existingProfile) existingProfile.remove();

      if (desktop.querySelector('[data-action="open-signup"]')) return;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-action", "open-signup");
      btn.className = isDarkHeader()
        ? "inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-100 backdrop-blur transition hover:bg-white/10"
        : "inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-medium text-zinc-800 shadow-sm transition hover:border-[#7db6ff] hover:bg-[#f5fbff]";
      btn.textContent = "Sign Up";

      const cart = desktop.querySelector('a[href="cart.html"]');
      if (cart && cart.parentElement === desktop) {
        desktop.insertBefore(btn, cart);
      } else {
        desktop.appendChild(btn);
      }
      return;
    }

    // Signed in: remove Sign Up and show avatar dropdown
    desktop.querySelectorAll('[data-action="open-signup"]').forEach((el) => el.remove());

    let wrapper = desktop.querySelector('[data-profile-wrapper="true"]');
    if (!wrapper) {
      const cart = desktop.querySelector('a[href="cart.html"]');
      wrapper = document.createElement("div");
      wrapper.setAttribute("data-profile-wrapper", "true");
      wrapper.setAttribute("data-profile-open", "false");
      wrapper.className = "relative";

      const initial = getUserInitial(user);
      const avatarBtnClass = isDarkHeader()
        ? "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 backdrop-blur transition hover:bg-white/10"
        : "inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm transition hover:border-[#7db6ff] hover:bg-[#f5fbff]";

      wrapper.innerHTML = `
        <button
          type="button"
          data-action="toggle-profile"
          aria-label="Open profile"
          class="${avatarBtnClass}"
        >
          ${
            initial
              ? `<span class="text-sm font-semibold ${isDarkHeader() ? "text-zinc-100" : "text-zinc-800"}">${initial}</span>`
              : `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ${isDarkHeader() ? "text-zinc-100" : "text-zinc-500"}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>`
          }
        </button>
        <div
          data-profile-dropdown="true"
          aria-hidden="true"
          class="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-zinc-200 bg-white shadow-lg transition-all duration-200 opacity-0 scale-95 pointer-events-none"
          role="menu"
        >
          <div class="p-4 space-y-3">
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                ${initial ? `<span class="text-sm font-semibold">${initial}</span>` : `<span class="text-sm font-semibold">U</span>`}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-zinc-900" data-profile-name="true">—</p>
                <p class="mt-0.5 text-[11px] text-zinc-500">View your details</p>
              </div>
            </div>

            <div class="space-y-2 text-sm">
              <div>
                <p class="text-[11px] font-medium text-zinc-500">Name</p>
                <p class="font-semibold text-zinc-800" data-profile-name="true">—</p>
              </div>
              <div>
                <p class="text-[11px] font-medium text-zinc-500">Phone</p>
                <p class="font-semibold text-zinc-800" data-profile-phone="true">—</p>
              </div>
              <div>
                <p class="text-[11px] font-medium text-zinc-500">Email</p>
                <p class="font-semibold text-zinc-800" data-profile-email="true">—</p>
              </div>
            </div>

            <button
              type="button"
              data-action="logout"
              class="mt-1 w-full inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-900"
            >
              Logout
            </button>
          </div>
        </div>
      `;

      updateProfileFields(wrapper);
      if (cart && cart.parentElement === desktop) {
        desktop.insertBefore(wrapper, cart.nextSibling);
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
    const existingSignup = container.querySelector('[data-action="open-signup"]');

    if (!user) {
      if (existingProfile) existingProfile.remove();
      if (existingSignup) return;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-action", "open-signup");
      btn.className = isDarkHeader()
        ? "mt-1 inline-flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-white/10"
        : "mt-1 inline-flex items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 shadow-sm hover:border-[#7db6ff] hover:bg-[#f5fbff]";
      btn.innerHTML = `<span>Sign Up</span><span class="text-[11px] text-white/70">${
        isDarkHeader() ? "Join" : "Join"
      }</span>`;
      container.appendChild(btn);
      return;
    }

    // Signed in: remove Sign Up and show avatar dropdown
    if (existingSignup) existingSignup.remove();

    let wrapper = existingProfile;
    if (!wrapper) {
      const initial = getUserInitial(user);

      wrapper = document.createElement("div");
      wrapper.setAttribute("data-profile-wrapper", "true");
      wrapper.setAttribute("data-profile-open", "false");
      wrapper.className = "relative mt-2";

      wrapper.innerHTML = `
        <button
          type="button"
          data-action="toggle-profile"
          aria-label="Open profile"
          class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm transition hover:border-[#7db6ff] hover:bg-[#f5fbff]"
        >
          ${
            initial
              ? `<span class="text-sm font-semibold text-zinc-800">${initial}</span>`
              : `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>`
          }
        </button>
        <div
          data-profile-dropdown="true"
          aria-hidden="true"
          class="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-zinc-200 bg-white shadow-lg transition-all duration-200 opacity-0 scale-95 pointer-events-none"
          role="menu"
        >
          <div class="p-4 space-y-3">
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                ${initial ? `<span class="text-sm font-semibold">${initial}</span>` : `<span class="text-sm font-semibold">U</span>`}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-zinc-900" data-profile-name="true">—</p>
                <p class="mt-0.5 text-[11px] text-zinc-500">View your details</p>
              </div>
            </div>

            <div class="space-y-2 text-sm">
              <div>
                <p class="text-[11px] font-medium text-zinc-500">Name</p>
                <p class="font-semibold text-zinc-800" data-profile-name="true">—</p>
              </div>
              <div>
                <p class="text-[11px] font-medium text-zinc-500">Phone</p>
                <p class="font-semibold text-zinc-800" data-profile-phone="true">—</p>
              </div>
              <div>
                <p class="text-[11px] font-medium text-zinc-500">Email</p>
                <p class="font-semibold text-zinc-800" data-profile-email="true">—</p>
              </div>
            </div>

            <button
              type="button"
              data-action="logout"
              class="mt-1 w-full inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-900"
            >
              Logout
            </button>
          </div>
        </div>
      `;

      updateProfileFields(wrapper);

      const cartLink = container.querySelector('a[href="cart.html"]');
      if (cartLink && cartLink.parentElement === container) {
        if (cartLink.nextSibling) {
          container.insertBefore(wrapper, cartLink.nextSibling);
        } else {
          container.appendChild(wrapper);
        }
      } else if (cartLink) {
        cartLink.insertAdjacentElement("afterend", wrapper);
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
    modal.className =
      "fixed inset-0 z-[60] hidden items-end sm:items-center justify-center p-4";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-hidden", "true");

    modal.innerHTML = `
      <div data-signup-backdrop class="absolute inset-0 bg-black/45 backdrop-blur-[2px]"></div>
      <div class="relative w-full max-w-xl">
        <div class="rounded-3xl border border-white/20 bg-white shadow-2xl shadow-black/10 overflow-hidden">
          <div class="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
            <div>
              <p class="text-sm font-semibold text-zinc-900">Sign Up</p>
              <p class="mt-0.5 text-[11px] text-zinc-500">Student fields appear only when Student is selected.</p>
            </div>
            <button
              type="button"
              data-action="close-signup"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition hover:border-[#7db6ff] hover:bg-[#f5fbff]"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form id="signup-form" class="px-5 py-5 space-y-4" novalidate>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label for="signup-fullName" class="text-xs font-medium text-zinc-700">Full Name *</label>
                <input
                  id="signup-fullName"
                  name="fullName"
                  type="text"
                  autocomplete="name"
                  class="mt-1 w-full rounded-2xl border border-zinc-200 bg-[#f5f5f5] px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:bg-white focus:ring-4 focus:ring-[#cfe6ff] focus:border-[#7db6ff]"
                  placeholder="Enter your full name"
                  required
                />
                <p class="mt-1 text-[11px] text-rose-600 hidden" data-error-for="fullName"></p>
              </div>

              <div>
                <label for="signup-email" class="text-xs font-medium text-zinc-700">Email *</label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  class="mt-1 w-full rounded-2xl border border-zinc-200 bg-[#f5f5f5] px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:bg-white focus:ring-4 focus:ring-[#cfe6ff] focus:border-[#7db6ff]"
                  required
                />
                <p class="mt-1 text-[11px] text-rose-600 hidden" data-error-for="email"></p>
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label for="signup-phone" class="text-xs font-medium text-zinc-700">Phone Number *</label>
                <input
                  id="signup-phone"
                  name="phone"
                  type="tel"
                  inputmode="numeric"
                  maxlength="10"
                  class="mt-1 w-full rounded-2xl border border-zinc-200 bg-[#f5f5f5] px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:bg-white focus:ring-4 focus:ring-[#cfe6ff] focus:border-[#7db6ff]"
                  placeholder="10-digit number"
                  required
                />
                <p class="mt-1 text-[11px] text-rose-600 hidden" data-error-for="phone"></p>
              </div>

              <fieldset class="space-y-2">
                <legend class="text-xs font-medium text-zinc-700">User Type *</legend>
                <div class="grid grid-cols-2 gap-2">
                  <label class="flex cursor-pointer items-center justify-between gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-medium text-zinc-800 transition hover:border-[#7db6ff]">
                    <span>Staff</span>
                    <input type="radio" name="userType" value="Staff" class="h-4 w-4 accent-[#12422e]" required />
                  </label>
                  <label class="flex cursor-pointer items-center justify-between gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-medium text-zinc-800 transition hover:border-[#7db6ff]">
                    <span>Student</span>
                    <input type="radio" name="userType" value="Student" class="h-4 w-4 accent-[#12422e]" required />
                  </label>
                </div>
                <p class="mt-1 text-[11px] text-rose-600 hidden" data-error-for="userType"></p>
              </fieldset>
            </div>

            <div
              id="signup-student-fields"
              class="overflow-hidden rounded-2xl border border-[#d7ebff] bg-[#f5fbff] px-4 transition-[max-height,opacity,transform] duration-300 ease-out max-h-0 opacity-0 -translate-y-1"
              aria-hidden="true"
            >
              <div class="py-4 space-y-4">
                <div class="flex items-center justify-between gap-3">
                  <p class="text-sm font-semibold text-zinc-900">Student details</p>
                  <span class="text-[11px] font-medium text-[#12422e] bg-[#12422e]/10 px-2 py-0.5 rounded-full">Required</span>
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label for="signup-branch" class="text-xs font-medium text-zinc-700">Branch *</label>
                    <select
                      id="signup-branch"
                      name="branch"
                      class="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:ring-4 focus:ring-[#cfe6ff] focus:border-[#7db6ff]"
                    >
                      <option value="">Select branch</option>
                      <option>Computer Science</option>
                      <option>Electrical</option>
                      <option>Mechanical</option>
                      <option>AIDS</option>
                      <option>ECE</option>
                      <option>ACT</option>
                      <option>Civil</option>
                    </select>
                    <p class="mt-1 text-[11px] text-rose-600 hidden" data-error-for="branch"></p>
                  </div>

                  <div>
                    <label for="signup-roll" class="text-xs font-medium text-zinc-700">Roll Number *</label>
                    <input
                      id="signup-roll"
                      name="rollNumber"
                      type="text"
                      class="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:ring-4 focus:ring-[#cfe6ff] focus:border-[#7db6ff]"
                      placeholder="Enter roll number"
                    />
                    <p class="mt-1 text-[11px] text-rose-600 hidden" data-error-for="rollNumber"></p>
                  </div>
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label for="signup-year" class="text-xs font-medium text-zinc-700">Year *</label>
                    <select
                      id="signup-year"
                      name="year"
                      class="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:ring-4 focus:ring-[#cfe6ff] focus:border-[#7db6ff]"
                    >
                      <option value="">Select year</option>
                      <option>1st Year</option>
                      <option>2nd Year</option>
                      <option>3rd Year</option>
                      <option>4th Year</option>
                    </select>
                    <p class="mt-1 text-[11px] text-rose-600 hidden" data-error-for="year"></p>
                  </div>
                  <div class="hidden sm:block"></div>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p class="text-[11px] text-zinc-500">Fill details and submit.</p>
              <button
              type="submit"
              class="inline-flex items-center justify-center rounded-full bg-[#1f6f4a] px-6 py-2.5 text-sm font-medium text-white shadow-sm">
              Submit
              </button>
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
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const first = modal.querySelector("#signup-fullName");
    if (first) first.focus();
  }

  function closeModal() {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function setFieldError(root, key, message) {
    const el = root.querySelector(`[data-error-for="${key}"]`);
    if (!el) return;
    if (!message) {
      el.textContent = "";
      el.classList.add("hidden");
      return;
    }
    el.textContent = message;
    el.classList.remove("hidden");
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
        studentWrap.classList.remove("max-h-0", "opacity-0", "-translate-y-1");
        studentWrap.classList.add(
          "max-h-[520px]",
          "opacity-100",
          "translate-y-0"
        );
      } else {
        studentWrap.setAttribute("aria-hidden", "true");
        studentWrap.classList.add("max-h-0", "opacity-0", "-translate-y-1");
        studentWrap.classList.remove(
          "max-h-[520px]",
          "opacity-100",
          "translate-y-0"
        );
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
      studentFields.classList.remove("max-h-0", "opacity-0", "-translate-y-1");
      studentFields.classList.add("max-h-[420px]", "opacity-100", "translate-y-0");
    } else {
      studentFields.setAttribute("aria-hidden", "true");
      studentFields.classList.add("max-h-0", "opacity-0", "-translate-y-1");
      studentFields.classList.remove(
        "max-h-[420px]",
        "opacity-100",
        "translate-y-0"
      );
    }
  }

  function setFieldError(fieldName, message) {
    const el = document.querySelector(`[data-error-for="${fieldName}"]`);
    if (!el) return;
    if (!message) {
      el.textContent = "";
      el.classList.add("hidden");
      return;
    }
    el.textContent = message;
    el.classList.remove("hidden");
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
    if (success) success.classList.add("hidden");

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

    if (success) success.classList.remove("hidden");
    showMiniToast("Profile saved (demo)");
    form.reset();
    setStudentVisibility(false);
  });
}

// Render helpers
function createMenuCard(item) {
  const wrapper = document.createElement("article");
  wrapper.className =
    "group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md";
  wrapper.innerHTML = `
    <div class="relative h-40 overflow-hidden bg-zinc-100">
      <img src="${item.image}" alt="${item.name}" class="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent"></div>
      <div class="absolute bottom-2 left-2 flex items-center gap-2 text-[11px] font-medium text-zinc-100">
        <span class="rounded-full bg-black/40 px-2 py-0.5">${formatCurrency(
          item.price
        )}</span>
      </div>
    </div>
    <div class="flex flex-1 flex-col gap-2 p-3.5">
      <div>
        <h3 class="text-sm font-semibold text-accent">${item.name}</h3>
        <p class="mt-1 text-xs text-zinc-600">${item.description}</p>
      </div>
      <div class="mt-auto flex items-center justify-between pt-1">
        <p class="text-sm font-semibold text-primary">${formatCurrency(
          item.price
        )}</p>
        <button
          type="button"
          data-add-to-cart="${item.id}"
          class="inline-flex items-center justify-center rounded-full bg-primary px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-emerald-900"
        >
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
function initHomePage() {
  const specialsRoot = document.getElementById("home-specials");
  const snacksRoot = document.getElementById("home-snacks");
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
      card.className =
        "group flex cursor-pointer flex-col rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md";
      card.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="h-14 w-14 overflow-hidden rounded-xl bg-zinc-100">
            <img src="${item.image}" alt="${item.name}" class="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
          </div>
          <div class="flex-1 space-y-1">
            <div class="flex items-center justify-between gap-2">
              <h3 class="text-xs font-semibold text-accent">${item.name}</h3>
              <span class="text-xs font-semibold text-primary">${formatCurrency(
                item.price
              )}</span>
            </div>
            <p class="text-[11px] text-zinc-600">${item.description}</p>
          </div>
        </div>
        <div class="mt-2 flex justify-end">
          <button
            type="button"
            data-add-to-cart="${item.id}"
            class="inline-flex items-center justify-center rounded-full bg-primary/5 px-2.5 py-1 text-[10px] font-medium text-primary hover:bg-primary/10"
          >
            Add
          </button>
        </div>
      `;
      snacksRoot.appendChild(card);
    });
  }
  bindMenuButtons(document);
}

function initMenuPage() {
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
  bindMenuButtons(document);
}

function initOrderPage() {
  const form = document.getElementById("order-form");
  const success = document.getElementById("order-success");
  const datalist = document.getElementById("food-suggestions");
  if (datalist) {
    ALL_ITEMS.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.name;
      datalist.appendChild(opt);
    });
  }
  if (form) {
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("fullName")?.value.trim() || "";
  const phone = document.getElementById("phone")?.value.trim() || "";

  if (!name || !phone) {
    alert("Please fill all details");
    return;
  }

  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
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

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    await addDoc(collection(db, "users"), {
      name,
      phone,
      createdAt: new Date().toISOString()
    });

    alert("Data saved successfully ✅");

    form.reset();

  } catch (error) {
    console.error(error);
    alert("Error: " + error.message);
  }
});
  }
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
      emptyState.classList.remove("hidden");
      if (checkoutOpen) checkoutOpen.disabled = true;
    } else {
      emptyState.classList.add("hidden");
      cart.forEach((item) => {
        const row = document.createElement("div");
        row.className =
          "flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs";
        row.innerHTML = `
          <div class="flex flex-1 items-center gap-3">
            <div class="flex flex-col">
              <span class="font-medium text-accent">${item.name}</span>
              <span class="mt-0.5 text-[11px] text-zinc-500">${formatCurrency(
                item.price
              )} each</span>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-1.5 py-0.5">
              <button type="button" data-cart-dec="${
                item.id
              }" class="h-5 w-5 rounded-full text-zinc-500 hover:bg-zinc-100 flex items-center justify-center">-</button>
              <span class="min-w-[1.5rem] text-center text-[11px] font-medium text-accent">${
                item.quantity
              }</span>
              <button type="button" data-cart-inc="${
                item.id
              }" class="h-5 w-5 rounded-full text-zinc-500 hover:bg-zinc-100 flex items-center justify-center">+</button>
            </div>
            <div class="text-right">
              <p class="text-xs font-semibold text-accent">${formatCurrency(
                item.price * item.quantity
              )}</p>
              <button type="button" data-cart-remove="${
                item.id
              }" class="mt-0.5 text-[10px] text-zinc-500 hover:text-primary">
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
        msg.classList.remove("hidden");
      }
      showMiniToast("Please log in / register first");
      return;
    }

    if (!profile.email) {
      if (msg) {
        msg.textContent =
          "No email found in saved profile. Please login/register again.";
        msg.classList.remove("hidden");
      }
      showMiniToast("Please login/register again");
      return;
    }

    if (msg) msg.classList.add("hidden");

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
        empty.className = "text-[11px] text-zinc-500";
        empty.textContent = "Your cart is empty.";
        checkoutItems.appendChild(empty);
        checkoutTotal.textContent = formatCurrency(0);
      } else {
        cart.forEach((item) => {
          const row = document.createElement("div");
          row.className =
            "flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 shadow-[0_1px_0_rgba(0,0,0,0.02)]";
          row.innerHTML = `
            <div class="flex-1">
              <p class="text-xs font-medium text-zinc-900">${item.name}</p>
              <p class="text-[11px] text-zinc-500">Qty: ${
                item.quantity
              } × ${formatCurrency(item.price)}</p>
            </div>
            <p class="text-xs font-semibold text-zinc-900">${formatCurrency(
              item.price * (item.quantity || 0)
            )}</p>
          `;
          checkoutItems.appendChild(row);
        });
        const totals = getCartTotals(cart);
        checkoutTotal.textContent = formatCurrency(totals.total);
      }
    }

    checkoutModal.classList.remove("hidden");
    checkoutModal.classList.add("flex");
    document.body.style.overflow = "hidden";
  }

  function closeCheckout() {
    if (!checkoutModal) return;
    checkoutModal.classList.add("hidden");
    checkoutModal.classList.remove("flex");
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
      showMiniToast("Order confirmed (demo)");
      closeCheckout();
    });
  }

  refresh();
}

document.addEventListener("DOMContentLoaded", () => {
  setCurrentYear();
  setupMobileNav();
  updateCartBadges();
  initSignupModalGlobal();

  const page = document.body.getAttribute("data-page");
  if (page === "home") initHomePage();
  if (page === "menu") initMenuPage();
  if (page === "order") initOrderPage();
  if (page === "cart") renderCartPage();
  if (page === "auth") initAuthPage();
});

