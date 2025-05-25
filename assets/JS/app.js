function register(e) {
  e.preventDefault();
  fetch('http://localhost:3000/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      password: document.getElementById('password').value 
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        // alert("Connexion réussie !");
        window.location.href = 'index.html'; // Redirection après connexion
      } else {
        alert(data.error || "Erreur de connexion");
      }
    })
}

function login(e) {
  e.preventDefault();
  fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        // alert("Connexion réussie !");
        window.location.href = 'index.html'; // Redirection après connexion
      } else {
        alert(data.error || "Erreur de connexion");
      }
    })
    .catch(error => console.error('Erreur:', error));
}


function goToPage() {
  // rederiger de la formulaire connection vers d'inscription 
  window.location.href = "Login.html"; 
}


// Fonction pour afficher la liste des utilisateurs
    $(document).ready(function () {
        fetch('http://localhost:3000/users')
            .then(response => response.json())
            .then(users => {
                let rows = '';
                users.forEach(user => {
                    rows += `<tr>
                                <td>${user.id}</td>
                                <td>${user.name || 'N/A'}</td>
                                <td>${user.email}</td>
                             </tr>`;
                });
                $('#usersTable tbody').html(rows);
                $('#usersTable').DataTable(); // Activation de DataTables
            })
            .catch(error => console.error('Erreur de chargement:', error));
});

// Fonction pour se déconnecter
  function logout() {
  // Supprime le token stocké
  localStorage.removeItem('authToken');
  window.location.reload();
}

// Fonction pour vérifier le token JWT
    // recuperer le nom d'utilisateur
    const username = localStorage.getItem('username');
    document.addEventListener('DOMContentLoaded', function() {
      const token = localStorage.getItem('authToken');
      if (!token) {
        window.location.href = 'auth.html';
      }
});
