// Fonction pour se connecter
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