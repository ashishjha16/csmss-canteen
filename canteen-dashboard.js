/**
 * CSMSS Canteen — Staff dashboard (Firestore: menuItems + orders).
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

  async function isStaffUser(uid) {
    if (!uid) return false;
    try {
      const svc = await window.__csmssGetFirebaseServices?.();
      if (!svc?.db) return false;
      const { doc, getDoc } = await import(
        "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"
      );
      const snap = await getDoc(doc(svc.db, "users", uid));
      if (!snap.exists()) return false;
      const d = snap.data() || {};
      const role = String(d.userType || "").toLowerCase();
      if (role === "staff") return true;
      if (d.canteenStaff === true) return true;
      return false;
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
        '<p class="staff-empty">No live orders. New customer orders appear here after Razorpay payment.</p>';
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
      card.innerHTML = `
        <div class="staff-order-card__head">
          <div>
            <p class="staff-order-card__id">${escapeHtml(o.id)}</p>
            <p class="staff-order-card__meta">${escapeHtml(formatWhen(o.createdAt))}</p>
          </div>
          <span class="staff-badge staff-badge--placed">${escapeHtml(o.status || "placed")}</span>
        </div>
        <ul class="staff-order-card__items">${lines}</ul>
        <div class="staff-order-card__foot">
          <strong>${formatCurrency(o.totalAmount)}</strong>
          <button type="button" class="btn btn--primary btn--sm" data-action="complete-order" data-id="${escapeHtml(o.id)}">
            Mark completed
          </button>
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

    const svc = await window.__csmssGetFirebaseServices?.();
    if (!svc?.auth || !svc.db) {
      setStaffAccessState(
        false,
        "Firebase is not ready. Open this page from your hosted site."
      );
      return;
    }

    const { auth, db } = svc;
    const uid = auth.currentUser?.uid || "";
    if (!uid) {
      setStaffAccessState(
        false,
        "Please log in with a staff account to use the kitchen dashboard."
      );
      if (typeof window.openLoginModal === "function") window.openLoginModal();
      return;
    }

    const allowed = await isStaffUser(uid);
    if (!allowed) {
      setStaffAccessState(
        false,
        "Access denied. Firestore profile must have userType “Staff” or canteenStaff: true."
      );
      return;
    }

    setStaffAccessState(true, "");

    const { collection, onSnapshot, query, where, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } =
      await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

    // Live orders: status "placed"
    if (unsubOrders) unsubOrders();
    const ordersQ = query(collection(db, "orders"), where("status", "==", "placed"));
    unsubOrders = onSnapshot(
      ordersQ,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
        rows.sort((a, b) => {
          const ta = new Date(a.createdAt || 0).getTime();
          const tb = new Date(b.createdAt || 0).getTime();
          return tb - ta;
        });
        setText("staff-stat-live", String(rows.length));
        renderOrdersList(rows);
      },
      (err) => {
        console.error(err);
        document.getElementById("staff-live-orders").innerHTML =
          `<p class="staff-empty">Could not load orders (check Firestore rules / composite index). ${escapeHtml(err.message)}</p>`;
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
      "click",
      async (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;

      if (btn.matches('[data-action="complete-order"]')) {
        const id = btn.getAttribute("data-id");
        if (!id) return;
        try {
          await updateDoc(doc(db, "orders", id), {
            status: "completed",
            completedAt: serverTimestamp(),
          });
        } catch (err) {
          console.error(err);
          alert("Could not update order: " + err.message);
        }
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

