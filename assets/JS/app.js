function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.id = "toast-notification";
  toast.className = `toast ${type} show`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function setLoading(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';
  } else {
    button.disabled = false;
    const icon = button.classList.contains("login-btn")
      ? "fa-sign-in-alt"
      : "fa-user-plus";
    button.innerHTML = `<i class="fas ${icon}"></i> ${button.textContent.trim()}`;
  }
}

async function register(e) {
  e.preventDefault();
  const form = e.target;
  const button = form.querySelector("button[type='submit']");

  try {
    setLoading(button, true);
    const formData = {
      name: form.querySelector("#name").value.trim(),
      email: form.querySelector("#email").value.trim(),
      password: form.querySelector("#password").value,
    };

    if (!formData.name || !formData.email || !formData.password) {
      showToast("Veuillez remplir tous les champs", "error");
      return;
    }

    const response = await fetch("http://localhost:3000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erreur lors de l'inscription");
    }

    showToast("Inscription réussie ! Redirection...", "success");
    setTimeout(() => (window.location.href = "login.html"), 2000);
  } catch (error) {
    console.error("Erreur:", error);
    showToast(error.message || "Erreur lors de l'inscription", "error");
  } finally {
    setLoading(button, false);
  }
}

async function login(e) {
  e.preventDefault();
  const form = e.target;
  const button = form.querySelector("button[type='submit']");

  try {
    setLoading(button, true);
    const formData = {
      email: form.querySelector("#email").value.trim(),
      password: form.querySelector("#password").value,
    };

    const response = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!response) {
      throw new Error("Impossible de se connecter au serveur");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Email ou mot de passe incorrect");
    }

    localStorage.setItem("authToken", data.token);
    localStorage.setItem("currentUser", JSON.stringify(data.user));
    showToast("Connexion réussie !", "success");
    setTimeout(() => (window.location.href = "users.html"), 1500);
  } catch (error) {
    console.error("Erreur:", error);
    showToast(error.message || "Erreur de connexion au serveur", "error");
  } finally {
    setLoading(button, false);
  }
}

function logout() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("currentUser");
  showToast("Déconnexion réussie", "success");
  setTimeout(() => (window.location.href = "login.html"), 1000);
}

function checkAuth() {
  const token = localStorage.getItem("authToken");
  const currentPage = location.pathname.split("/").pop();
  const protectedPages = ["users.html"];
  const authPages = ["login.html", "auth.html"];

  if (protectedPages.includes(currentPage) && !token) {
    showToast("Veuillez vous connecter", "error");
    setTimeout(() => (location.href = "login.html"), 1500);
    return false;
  }

  if (token && authPages.includes(currentPage)) {
    showToast("Vous êtes déjà connecté", "info");
    setTimeout(() => (location.href = "users.html"), 1500);
    return false;
  }

  return true;
}

async function loadUsers() {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("Authentification requise");

    const response = await fetch("http://localhost:3000/users", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Erreur lors du chargement");

    const users = await response.json();
    const table = $("#usersTable").DataTable({
      language: { url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/fr-FR.json" },
      responsive: true,
      data: users,
      columns: [
        { data: "id", title: "ID" },
        { data: "name", title: "Nom" },
        { data: "email", title: "Email" },
        {
          data: "createdAt",
          title: "Date d'inscription",
          render: (data) => new Date(data).toLocaleDateString(),
        },
        {
          title: "Actions",
          data: "id",
          orderable: false,
          render: (data) => `
            <div class="action-btns">
              <button class="btn btn-sm btn-primary edit-btn" data-id="${data}">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-danger delete-btn" data-id="${data}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          `,
        },
      ],
      destroy: true,
    });
  } catch (error) {
    console.error("Erreur:", error);
    showToast(error.message || "Erreur serveur", "error");
    if (error.message === "Authentification requise") {
      setTimeout(() => (location.href = "login.html"), 1500);
    }
  }
}

function setupTableActions() {
  $(document).on("click", ".delete-btn", async function () {
    const userId = $(this).data("id");
    if (confirm(`Supprimer l'utilisateur ${userId} ?`)) {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(`http://localhost:3000/users/${userId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Échec de la suppression");

        showToast("Utilisateur supprimé", "success");
        loadUsers();
      } catch (error) {
        console.error("Erreur:", error);
        showToast(error.message || "Erreur de suppression", "error");
      }
    }
  });

  $(document).on("click", ".edit-btn", function () {
    const userId = $(this).data("id");
    showToast(`Édition de l'utilisateur ${userId}`, "info");
    // Ici prouquoi pas implémenter la logique d'édition dit moi gays
  });
}

document.addEventListener("DOMContentLoaded", function () {
  checkAuth();

  const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
  document.querySelectorAll(".user-name").forEach((el) => {
    el.textContent = user.name || "Invité";
  });

  //c'est là que on gere les formulaires
  document
    .querySelector("form[onsubmit='register(event)']")
    ?.addEventListener("submit", register);
  document
    .querySelector("form[onsubmit='login(event)']")
    ?.addEventListener("submit", login);

  // Initialisation du tab si on est sur users.html
  if (location.pathname.includes("users.html")) {
    loadUsers();
    setupTableActions();
  }
});
