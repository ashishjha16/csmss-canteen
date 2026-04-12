/**
 * CSMSS Canteen — Canteen admin dashboard (Firestore: menuItems + orders).
 * Access is gated by sessionStorage admin session from admin-login.html (not Firebase user role).
 * Load this file BEFORE script.js so window.initCanteenDashboard exists when DOMContentLoaded runs.
 */
(function () {
  let unsubOrders = null;
  let unsubMenu = null;
  let staffClickAbort = null;

  function escapeHtml(str) {
    const s = String(str ?? "");
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function formatCurrency(value) {
    return `₹${Number(value || 0).toFixed(0)}`;
  }

  function formatWhen(v) {
    try {
      if (!v) return "—";
      if (typeof v?.toDate === "function") {
        return v.toDate().toLocaleString();
      }
      return new Date(v).toLocaleString();
    } catch {
      return String(v);
    }
  }

  const ADMIN_SESSION_KEY = "csmss_canteen_admin_ok";

  function hasAdminSession() {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
    } catch {
      return false;
    }
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function renderMenuTable(items) {
    const tbody = document.querySelector("#staff-menu-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    items.forEach((row) => {
      const tr = document.createElement("tr");
      tr.dataset.id = row.id;
      tr.dataset.available = row.isAvailable ? "true" : "false";
      tr.innerHTML = `
        <td>${escapeHtml(row.name)}</td>
        <td>${formatCurrency(row.price)}</td>
        <td>${escapeHtml(row.category)}</td>
        <td>${row.isAvailable ? "Yes" : "No"}</td>
        <td class="staff-table__actions">
          <button type="button" class="btn-secondary btn--xs" data-action="toggle-menu" data-id="${escapeHtml(row.id)}">
            ${row.isAvailable ? "Mark unavailable" : "Mark available"}
          </button>
          <button type="button" class="btn-secondary btn--xs" data-action="edit-menu" data-id="${escapeHtml(row.id)}">Edit</button>
          <button type="button" class="btn-secondary btn--xs staff-btn--danger" data-action="delete-menu" data-id="${escapeHtml(row.id)}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderOrdersList(orders) {
    const root = document.getElementById("staff-live-orders");
    if (!root) return;
    root.innerHTML = "";
    if (!orders.length) {
      root.innerHTML =
        '<p class="staff-empty">No pending orders. Customer orders appear here after checkout (Razorpay).</p>';
      return;
    }
    orders.forEach((o) => {
      const card = document.createElement("article");
      card.className = "staff-order-card";
      const items = Array.isArray(o.items) ? o.items : [];
      const lines = items
        .map(
          (it) => `
          <li class="staff-order-card__line">
            <span>${escapeHtml(it.name || "")} × ${escapeHtml(String(it.quantity || 0))}</span>
            <span>${formatCurrency(Number(it.lineTotal) || 0)}</span>
          </li>`
        )
        .join("");
      const userName = String(o.userName || "—");
      const userType = String(o.userType || "—");
      const ident = String(
        o.userIdentifier || o.userEmail || o.userPhone || o.uid || "—"
      );
      const email = String(o.userEmail || "").trim();
      const phone = String(o.userPhone || "").trim();
      const pay = String(o.paymentStatus || "—");
      const st = String(o.status || "Pending");
      const contactBits = [email && `Email: ${email}`, phone && `Phone: ${phone}`]
        .filter(Boolean)
        .join(" · ");
      card.innerHTML = `
        <div class="staff-order-card__head">
          <div>
            <p class="staff-order-card__id">${escapeHtml(o.id)}</p>
            <p class="staff-order-card__meta">${escapeHtml(formatWhen(o.createdAt))}</p>
          </div>
          <span class="staff-badge staff-badge--placed">${escapeHtml(st)}</span>
        </div>
        <div class="staff-order-card__user">
          <p class="staff-order-card__userline"><strong>Name:</strong> ${escapeHtml(userName)}</p>
          <p class="staff-order-card__userline"><strong>Type:</strong> ${escapeHtml(userType)}</p>
          <p class="staff-order-card__userline"><strong>ID / contact:</strong> ${escapeHtml(ident)}</p>
          ${contactBits ? `<p class="staff-order-card__userline">${escapeHtml(contactBits)}</p>` : ""}
          <p class="staff-order-card__userline"><strong>Payment:</strong> ${escapeHtml(pay)}</p>
        </div>
        <p class="staff-order-card__items-title">Items</p>
        <ul class="staff-order-card__items">${lines}</ul>
        <div class="staff-order-card__foot">
          <strong>Total ${formatCurrency(Number(o.totalAmount) || 0)}</strong>
          <label class="staff-complete-label">
            <input type="checkbox" data-action="complete-order-cb" data-id="${escapeHtml(o.id)}" />
            <span>Mark as Completed</span>
          </label>
        </div>
      `;
      root.appendChild(card);
    });
  }

  function setStaffAccessState(ok, message) {
    const banner = document.getElementById("staff-access-banner");
    const inner = document.querySelector(".staff-dashboard-inner");
    if (!banner || !inner) return;
    if (ok) {
      banner.textContent = "";
      banner.classList.add("is-hidden");
      inner.classList.remove("is-hidden");
    } else {
      banner.textContent = message;
      banner.classList.remove("is-hidden");
      inner.classList.add("is-hidden");
    }
  }

  window.initCanteenDashboard = async function initCanteenDashboard() {
    const root = document.getElementById("staff-dashboard-root");
    if (!root) return;

    if (!hasAdminSession()) {
      window.location.replace("admin-login.html");
      return;
    }

    const svc = await window.__csmssGetFirebaseServices?.();
    if (!svc?.db) {
      setStaffAccessState(
        false,
        "Firebase is not ready. Open this page from your hosted site."
      );
      return;
    }

    const { db } = svc;
    setStaffAccessState(true, "");

    const { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } =
      await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

    // Live orders: listen to full collection (client filter) to avoid index issues and include legacy "placed".
    if (unsubOrders) unsubOrders();
    unsubOrders = onSnapshot(
      collection(db, "orders"),
      (snap) => {
        const rows = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() || {}) }))
          .filter((o) => {
            const s = String(o.status || "").toLowerCase();
            return s === "pending" || s === "placed";
          });
        rows.sort((a, b) => {
          const ta =
            (a.createdAt && typeof a.createdAt.toDate === "function"
              ? a.createdAt.toDate()
              : new Date(a.createdAt || 0)
            ).getTime() || 0;
          const tb =
            (b.createdAt && typeof b.createdAt.toDate === "function"
              ? b.createdAt.toDate()
              : new Date(b.createdAt || 0)
            ).getTime() || 0;
          return tb - ta;
        });
        setText("staff-stat-live", String(rows.length));
        renderOrdersList(rows);
      },
      (err) => {
        console.error(err);
        const live = document.getElementById("staff-live-orders");
        if (live) {
          live.innerHTML = `<p class="staff-empty">Could not load orders. ${escapeHtml(err.message)}</p>`;
        }
      }
    );

    // Menu items
    if (unsubMenu) unsubMenu();
    unsubMenu = onSnapshot(collection(db, "menuItems"), (snap) => {
      const rows = snap.docs.map((d) => {
        const x = d.data() || {};
        return {
          id: d.id,
          name: String(x.name || ""),
          price: Number(x.price) || 0,
          category: String(x.category || ""),
          description: String(x.description || ""),
          image: String(x.image || ""),
          isAvailable: x.isAvailable !== false,
          createdAt: x.createdAt,
        };
      });
      rows.sort((a, b) => {
        const ta = a.createdAt?.seconds || 0;
        const tb = b.createdAt?.seconds || 0;
        return tb - ta;
      });
      setText("staff-stat-menu", String(rows.length));
      renderMenuTable(rows);
    });

    const form = document.getElementById("staff-add-item-form");
    if (form && form.dataset.staffBound !== "true") {
      form.dataset.staffBound = "true";
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = String(document.getElementById("staff-item-name")?.value || "").trim();
        const price = Number(document.getElementById("staff-item-price")?.value || 0);
        const category = String(document.getElementById("staff-item-category")?.value || "").trim();
        const description = String(document.getElementById("staff-item-desc")?.value || "").trim();
        const image = String(document.getElementById("staff-item-image")?.value || "").trim();
        const isAvailable = document.getElementById("staff-item-available")?.checked !== false;
        if (!name || !category || !price) {
          alert("Name, category, and price are required.");
          return;
        }
        try {
          await addDoc(collection(db, "menuItems"), {
            name,
            price,
            category,
            description,
            image,
            isAvailable,
            createdAt: serverTimestamp(),
          });
          form.reset();
          const cb = document.getElementById("staff-item-available");
          if (cb) cb.checked = true;
        } catch (err) {
          console.error(err);
          alert("Could not add item: " + err.message);
        }
      });
    }

    if (staffClickAbort) staffClickAbort.abort();
    staffClickAbort = new AbortController();

    document.body.addEventListener(
      "change",
      async (e) => {
        const t = e.target;
        if (!t || !t.matches || !t.matches('input[data-action="complete-order-cb"]')) return;
        if (!t.checked) return;
        const id = t.getAttribute("data-id");
        if (!id) return;
        t.disabled = true;
        try {
          await updateDoc(doc(db, "orders", id), {
            status: "Completed",
            completedAt: serverTimestamp(),
          });
        } catch (err) {
          console.error(err);
          alert("Could not update order: " + err.message);
          t.disabled = false;
          t.checked = false;
        }
      },
      { signal: staffClickAbort.signal }
    );

    document.body.addEventListener(
      "click",
      async (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;

      if (btn.matches('[data-action="admin-logout"]')) {
        try {
          sessionStorage.removeItem(ADMIN_SESSION_KEY);
          sessionStorage.removeItem("csmss_canteen_admin_identifier");
        } catch {
          // ignore
        }
        window.location.href = "admin-login.html";
        return;
      }

      if (btn.matches('[data-action="toggle-menu"]')) {
        const id = btn.getAttribute("data-id");
        const tr = btn.closest("tr");
        const cur = tr?.dataset.available === "true";
        try {
          await updateDoc(doc(db, "menuItems", id), {
            isAvailable: !cur,
          });
        } catch (err) {
          alert(err.message);
        }
      }

      if (btn.matches('[data-action="delete-menu"]')) {
        const id = btn.getAttribute("data-id");
        if (!confirm("Delete this menu item?")) return;
        try {
          await deleteDoc(doc(db, "menuItems", id));
        } catch (err) {
          alert(err.message);
        }
      }

      if (btn.matches('[data-action="edit-menu"]')) {
        const id = btn.getAttribute("data-id");
        const tr = btn.closest("tr");
        if (!tr) return;
        const name = prompt("Food name", tr.children[0]?.textContent || "");
        if (name === null) return;
        const price = Number(prompt("Price (INR)", tr.children[1]?.textContent?.replace("₹", "") || "0"));
        if (Number.isNaN(price)) return;
        const category = prompt("Category", tr.children[2]?.textContent || "");
        if (category === null) return;
        try {
          await updateDoc(doc(db, "menuItems", id), {
            name: String(name).trim(),
            price,
            category: String(category).trim(),
          });
        } catch (err) {
          alert(err.message);
        }
      }
    },
      { signal: staffClickAbort.signal }
    );
  };

  window.addEventListener("beforeunload", () => {
    if (staffClickAbort) {
      staffClickAbort.abort();
      staffClickAbort = null;
    }
    if (unsubOrders) {
      unsubOrders();
      unsubOrders = null;
    }
    if (unsubMenu) {
      unsubMenu();
      unsubMenu = null;
    }
  });
})();

