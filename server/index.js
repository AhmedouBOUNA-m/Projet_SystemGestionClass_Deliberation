const http = require("http");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const SECRET_KEY = "ma_clé_secrète_plus_complexe_123!";
const saltRounds = 10;

const usersFile = path.join(__dirname, "data", "users.json");
const logFile = path.join(__dirname, "server.log");

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage, { flag: "a" });
}

// en gros ça crée le fichier users.json s'il n'existe pas
if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, "[]", "utf-8");
  log("Fichier users.json créé");
}

function getUsers() {
  try {
    const data = fs.readFileSync(usersFile, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    log(`Erreur lecture users.json: ${error.message}`);
    return [];
  }
}

function saveUsers(users) {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), "utf-8");
  } catch (error) {
    log(`Erreur sauvegarde users.json: ${error.message}`);
  }
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        log(`Erreur parsing body: ${error.message}`);
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    return res.end();
  }

  try {
    log(`${req.method} ${req.url}`);

    // Route:Inscription
    if (req.url === "/register" && req.method === "POST") {
      const userData = await parseBody(req);
      const users = getUsers();

      if (!userData.name || !userData.email || !userData.password) {
        log("Tentative d'inscription - Champs manquants");
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({ error: "Tous les champs sont requis" })
        );
      }

      if (users.some((u) => u.email === userData.email)) {
        log(`Tentative d'inscription - Email déjà utilisé: ${userData.email}`);
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Email déjà utilisé" }));
      }

      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      const newUser = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      saveUsers(users);
      log(`Nouvel utilisateur inscrit: ${newUser.email}`);

      res.writeHead(201, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          message: "Inscription réussie",
          user: { id: newUser.id, name: newUser.name, email: newUser.email },
        })
      );

      // Route:Connexion
    } else if (req.url === "/login" && req.method === "POST") {
      const loginData = await parseBody(req);
      const users = getUsers();
      const user = users.find((u) => u.email === loginData.email);

      if (!user) {
        log(
          `Tentative de connexion échouée - Email inconnu: ${loginData.email}`
        );
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Identifiants incorrects" }));
      }

      const passwordMatch = await bcrypt.compare(
        loginData.password,
        user.password
      );
      if (!passwordMatch) {
        log(
          `Tentative de connexion échouée - Mot de passe incorrect pour: ${loginData.email}`
        );
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Identifiants incorrects" }));
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        SECRET_KEY,
        { expiresIn: "1h" }
      );

      log(`Connexion réussie: ${user.email}`);
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          message: "Connexion réussie",
          token,
          user: { id: user.id, name: user.name, email: user.email },
        })
      );

      // Route: Liste des users
    } else if (req.url === "/users" && req.method === "GET") {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        log("Tentative d'accès non autorisée à /users");
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Non autorisé" }));
      }

      const token = authHeader.split(" ")[1];
      try {
        jwt.verify(token, SECRET_KEY);
        const users = getUsers().map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          createdAt: u.createdAt,
        }));

        log(`Liste utilisateurs envoyée (${users.length} utilisateurs)`);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(users));
      } catch (error) {
        log(`Token invalide: ${error.message}`);
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Token invalide" }));
      }

      // Route: Suppression user
    } else if (req.url.startsWith("/users/") && req.method === "DELETE") {
      const userId = req.url.split("/")[2];
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        log(`Tentative de suppression non autorisée (utilisateur ${userId})`);
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Non autorisé" }));
      }

      const token = authHeader.split(" ")[1];
      try {
        jwt.verify(token, SECRET_KEY);
        let users = getUsers();
        const initialLength = users.length;
        users = users.filter((u) => u.id !== userId);

        if (users.length === initialLength) {
          log(`Tentative de suppression - Utilisateur non trouvé: ${userId}`);
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Utilisateur non trouvé" }));
        }

        saveUsers(users);
        log(`Utilisateur supprimé: ${userId}`);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Utilisateur supprimé" }));
      } catch (error) {
        log(`Erreur suppression utilisateur: ${error.message}`);
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Token invalide" }));
      }
    } else {
      log(`Route non trouvée: ${req.url}`);
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Route non trouvée" }));
    }
  } catch (error) {
    // Log de l'erreur en cmd
    log(`ERREUR SERVEUR - ${req.method} ${req.url}:
    Message: ${error.message}
    Stack: ${error.stack}
    Body: ${JSON.stringify(req.body || {})}
    Headers: ${JSON.stringify(req.headers)}`);

    // Réponse plus large
    const errorResponse = {
      error: "Erreur serveur",
      message: error.message,
      ...(process.env.NODE_ENV === "development" && {
        stack: error.stack,
        endpoint: `${req.method} ${req.url}`,
      }),
    };

    res.writeHead(500, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(errorResponse));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  log(`Serveur démarré sur http://localhost:${PORT}`);
});
