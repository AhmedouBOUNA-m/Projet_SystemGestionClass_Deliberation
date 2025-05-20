// server/index.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'ma_clé_secrète';
const bcrypt = require('bcrypt');

const usersFile = path.join(__dirname, 'data', 'users.json');

function getUsers() {
  const data = fs.readFileSync(usersFile, 'utf-8');
  return JSON.parse(data);
}

function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf-8');
}

function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => callback(JSON.parse(body)));
}
// Fonction pour générer un identifiant numérique unique
function generateNumericId(users) {
    return users.length > 0 ? users[users.length - 1].id + 1 : 1;
}


const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Requête préliminaire OPTIONS (pour les navigateurs)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }
  if (req.url === '/register' && req.method === 'POST') {
    parseBody(req, async (userData) => {
      const users = getUsers();
      const exists = users.find(u => u.email === userData.email);
      if (exists) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Email déjà utilisé' }));
      }

      // Générer un identifiant unique
      userData.id = generateNumericId(users);

      // Hasher le mot de passe
      const saltRounds = 10;
      userData.password = await bcrypt.hash(userData.password, saltRounds);
      // Enregistrer l'utilisateur
      users.push(userData);
      saveUsers(users);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Inscription réussie', userId: userData.id }));
    });
  }

  else if (req.url === '/login' && req.method === 'POST') {
    parseBody(req, async (loginData) => {
      const users = getUsers();
      // Vérifier si l'utilisateur existe par email
      const found = users.find(u => u.email === loginData.email);
      if (found) {
        // Vérifier le mot de passe 
        const match = await bcrypt.compare(loginData.password, found.password);
        if (match) {
          const token = jwt.sign({ email: found.email }, SECRET_KEY, { expiresIn: '1h' });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Connexion réussie', token }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          // message d'erreur pour mot de passe incorrect
          res.end(JSON.stringify({ error: 'mot de passe incorrect' }));
        }
      } else {
        // message d'erreur pour email incorrect
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Email incorrect' }));
      }
    });
  }
  else if (req.url === '/users' && req.method === 'GET') {
    try{

      const users = getUsers();
  
      // Supprimer les mots de passe avant d'envoyer la liste des utilisateurs
      const sanitizedUsers = users.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
    
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(sanitizedUsers));
    }catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erreur interne du serveur' }));

    }
  }

  else {
    res.writeHead(404);
    res.end();
  }
});

 
// Middleware pour vérifier le token JWT
server.listen(3000, () => {
  console.log('Serveur démarré sur http://localhost:3000');
});