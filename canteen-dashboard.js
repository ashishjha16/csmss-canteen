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

  function toJsDate(v) {
    try {
      if (!v) return null;
      if (typeof v.toDate === "function") return v.toDate();
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }

  /** Local calendar day [start, nextDay) for “today” counters (resets after midnight). */
  function getLocalDayBounds(d) {
    const now = d || new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  function isDateInRange(date, start, end) {
    if (!date || !start || !end) return false;
    return date >= start && date < end;
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

  function buildStaffOrderCard(o, variant) {
    const card = document.createElement("article");
    card.className =
      variant === "history"
        ? "staff-order-card staff-order-card--completed"
        : "staff-order-card";
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
    const orderType = String(o.orderType || "—");
    const ident = String(
      o.userIdentifier || o.userEmail || o.userPhone || o.uid || "—"
    );
    const email = String(o.userEmail || "").trim();
    const phone = String(o.userPhone || "").trim();
    const pay = String(o.paymentStatus || "—");
    const st =
      variant === "history"
        ? "Completed"
        : String(o.status || "Pending");
    const received = Boolean(o.canteenReceived);
    const contactBits = [email && `Email: ${email}`, phone && `Phone: ${phone}`]
      .filter(Boolean)
      .join(" · ");
    const receivedBlock =
      variant === "history"
        ? ""
        : `
        <label class="staff-received-label">
          <input type="checkbox" data-action="received-order-cb" data-id="${escapeHtml(o.id)}" ${received ? "checked" : ""} />
          <span>Received</span>
        </label>`;

    const completeBlock =
      variant === "history"
        ? `<span class="staff-order-card__done-tag">Completed</span>`
        : `<button type="button" class="btn-secondary btn--sm" data-action="complete-order" data-id="${escapeHtml(o.id)}">Complete</button>`;

    card.innerHTML = `
        <div class="staff-order-card__head">
          <div>
            <p class="staff-order-card__id">${escapeHtml(o.id)}</p>
            <p class="staff-order-card__meta">${escapeHtml(formatWhen(o.createdAt))}</p>
          </div>
          <span class="staff-badge ${variant === "history" ? "staff-badge--complete" : "staff-badge--placed"}">${escapeHtml(st)}</span>
        </div>
        <div class="staff-order-card__user">
          <p class="staff-order-card__userline"><strong>Name:</strong> ${escapeHtml(userName)}</p>
          <p class="staff-order-card__userline"><strong>Type:</strong> ${escapeHtml(userType)}</p>
          <p class="staff-order-card__userline"><strong>Order type:</strong> ${escapeHtml(orderType)}</p>
          <p class="staff-order-card__userline"><strong>ID / contact:</strong> ${escapeHtml(ident)}</p>
          ${contactBits ? `<p class="staff-order-card__userline">${escapeHtml(contactBits)}</p>` : ""}
          <p class="staff-order-card__userline"><strong>Payment:</strong> ${escapeHtml(pay)}</p>
        </div>
        <p class="staff-order-card__items-title">Items</p>
        <ul class="staff-order-card__items">${lines}</ul>
        <div class="staff-order-card__foot">
          <strong>Total ${formatCurrency(Number(o.totalAmount) || 0)}</strong>
          <div class="staff-order-card__actions-row">
            ${receivedBlock}
            ${completeBlock}
          </div>
        </div>
      `;

    return card;
  }

  function renderOrderGrid(root, orders, variant, emptyMsg) {
    if (!root) return;
    root.innerHTML = "";
    if (!orders.length) {
      root.innerHTML = `<p class="staff-empty">${escapeHtml(emptyMsg)}</p>`;
      return;
    }
    orders.forEach((o) => root.appendChild(buildStaffOrderCard(o, variant)));
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

    if (unsubOrders) unsubOrders();
    unsubOrders = onSnapshot(
      collection(db, "orders"),
      (snap) => {
        const { start: dayStart, end: dayEnd } = getLocalDayBounds();
        const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));

        let todayOrderCount = 0;
        let todayReceivedCount = 0;

        all.forEach((o) => {
          const created = toJsDate(o.createdAt);
          if (isDateInRange(created, dayStart, dayEnd)) {
            todayOrderCount += 1;
          }
          if (o.canteenReceived) {
            const recvAt = toJsDate(o.receivedAt);
            if (recvAt && isDateInRange(recvAt, dayStart, dayEnd)) {
              todayReceivedCount += 1;
            }
          }
        });

        const statusLower = (o) => String(o.status || "").toLowerCase();
        const isActive = (o) => {
          const s = statusLower(o);
          return s === "pending" || s === "placed";
        };
        const isDone = (o) => statusLower(o) === "completed";

        const live = all
          .filter((o) => isActive(o) && !o.canteenReceived)
          .sort((a, b) => {
            const ta = toJsDate(a.createdAt)?.getTime() || 0;
            const tb = toJsDate(b.createdAt)?.getTime() || 0;
            return tb - ta;
          });

        const received = all
          .filter((o) => isActive(o) && o.canteenReceived)
          .sort((a, b) => {
            const ta = toJsDate(a.createdAt)?.getTime() || 0;
            const tb = toJsDate(b.createdAt)?.getTime() || 0;
            return tb - ta;
          });

        const history = all
          .filter((o) => isDone(o))
          .sort((a, b) => {
            const ta = toJsDate(a.completedAt || a.createdAt)?.getTime() || 0;
            const tb = toJsDate(b.completedAt || b.createdAt)?.getTime() || 0;
            return tb - ta;
          });

        setText("staff-stat-today-total", String(todayOrderCount));
        setText("staff-stat-today-received", String(todayReceivedCount));
        setText("staff-stat-live", String(live.length));

        renderOrderGrid(
          document.getElementById("staff-received-orders"),
          received,
          "active",
          "No orders marked as Received yet."
        );
        renderOrderGrid(
          document.getElementById("staff-live-orders"),
          live,
          "active",
          "No live orders. Customer orders appear here after checkout (Razorpay)."
        );
        renderOrderGrid(
          document.getElementById("staff-completed-orders"),
          history,
          "history",
          "No completed orders in history yet."
        );
      },
      (err) => {
        console.error(err);
        const msg = `Could not load orders. ${escapeHtml(err.message)}`;
        ["staff-received-orders", "staff-live-orders", "staff-completed-orders"].forEach((id) => {
          const el = document.getElementById(id);
          if (el) el.innerHTML = `<p class="staff-empty">${msg}</p>`;
        });
      }
    );

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
        if (!t || !t.matches || !t.matches('input[data-action="received-order-cb"]')) return;
        const id = t.getAttribute("data-id");
        if (!id) return;
        const checked = Boolean(t.checked);
        t.disabled = true;
        try {
          await updateDoc(doc(db, "orders", id), {
            canteenReceived: checked,
            receivedAt: checked ? serverTimestamp() : null,
          });
        } catch (err) {
          console.error(err);
          alert("Could not update Received: " + err.message);
          t.checked = !checked;
        } finally {
          t.disabled = false;
        }
      },
      { signal: staffClickAbort.signal }
    );

    document.body.addEventListener(
      "click",
      async (e) => {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;

        if (btn.matches('[data-action="complete-order"]')) {
          const id = btn.getAttribute("data-id");
          if (!id) return;
          btn.disabled = true;
          try {
            await updateDoc(doc(db, "orders", id), {
              status: "Completed",
              completedAt: serverTimestamp(),
            });
          } catch (err) {
            console.error(err);
            alert("Could not complete order: " + err.message);
            btn.disabled = false;
          }
          return;
        }

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
