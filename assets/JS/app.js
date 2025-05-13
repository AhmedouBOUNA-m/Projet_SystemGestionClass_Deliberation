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
    .then(data => alert(data.message || data.error));
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

