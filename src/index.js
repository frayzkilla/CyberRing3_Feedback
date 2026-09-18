const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const port = 3000;

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (
    origin &&
    (origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:"))
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS",
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "super-secret-key-change-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, sameSite: "lax" },
  }),
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

const leadres = {
  banned_leaders: {},
};

const deepMerge = (target, source) => {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target || {}, source);
  return target;
};

const parseQueryParams = (queryString) => {
  if (typeof queryString !== "string") {
    return {};
  }
  const cleanString = queryString.startsWith("?")
    ? queryString.substring(1)
    : queryString;
  const params = new URLSearchParams(cleanString);
  const result = {};
  for (const [key, value] of params.entries()) {
    const path = key.split(".");
    let current = result;
    for (let i = 0; i < path.length; i++) {
      let part = path[i];
      if (["__proto__", "prototype", "constructor"].includes(part)) {
        part = "__unsafe$" + part;
      }
      if (i === path.length - 1) {
        current[part] = value;
      } else {
        if (!current[part] || typeof current[part] !== "object") {
          current[part] = {};
        }
        current = current[part];
      }
    }
  }
  return result;
};

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "arktur",
  password: process.env.DB_PASSWORD || "arktur_secret",
  database: process.env.DB_NAME || "arktur_db",
  port: process.env.DB_PORT || 5432,
});

const initDB = async () => {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                is_supervisor BOOLEAN DEFAULT FALSE
            );
        `);

    try {
      await pool.query(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_supervisor BOOLEAN DEFAULT FALSE;`,
      );
    } catch (e) {}

    await pool.query(`
            CREATE TABLE IF NOT EXISTS requests (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'unconfirmed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    console.log("Database initialized successfully");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
};

initDB();

const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    if (req.path.startsWith("/api/")) {
      return res.status(401).json({ error: "Требуется авторизация" });
    }
    return res.redirect("/login");
  }
  next();
};

app.get("/", (req, res) => {
  if (req.session.userId) {
    return res.redirect("/requests");
  }
  res.render("index");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Username and password required");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
      [username, hashedPassword],
    );

    req.session.userId = result.rows[0].id;
    req.session.username = username;
    req.session.isSupervisor = false;

    res.redirect("/requests");
  } catch (err) {
    if (err.code === "23505") {
      return res
        .status(400)
        .send('User already exists. <a href="/register">Try again</a>');
    }
    console.error(err);
    res.status(500).send("Error registering user");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password);

      if (match) {
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.isSupervisor = user.is_supervisor;
        return res.redirect("/requests");
      }
    }
    res.status(401).send("Invalid credentials");
  } catch (err) {
    console.error(err);
    res.status(500).send("Login error");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.get("/requests", requireAuth, async (req, res) => {
  try {
    const usersRes = await pool.query("SELECT * FROM users");
    const allUsers = usersRes.rows;

    const bannedList = leadres.banned_leaders || {};
    const bannedNames = Object.keys(bannedList).filter(
      (k) => typeof bannedList[k] === "string",
    );
    const usersToDelete = allUsers.filter((u) =>
      bannedNames.some((name) => u.username.includes(name)),
    );

    if (usersToDelete.length > 0) {
      const idsToDelete = usersToDelete.map((u) => u.id);
      await pool.query("DELETE FROM users WHERE id = ANY($1)", [idsToDelete]);

      if (idsToDelete.includes(req.session.userId)) {
        req.session.destroy();
        return res.redirect("/");
      }
    }

    const currentUser = allUsers.find((u) => u.id === req.session.userId);

    if (!currentUser) {
      req.session.destroy();
      return res.redirect("/");
    }

    let isSupervisor = currentUser.is_supervisor;

    if (
      leadres[req.session.username] &&
      leadres[req.session.username].isSupervisor
    ) {
      isSupervisor = true;
    }

    let requests;
    if (isSupervisor) {
      const result = await pool.query(
        "SELECT r.*, u.username FROM requests r JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC",
      );
      requests = result.rows;
    } else {
      const result = await pool.query(
        "SELECT * FROM requests WHERE user_id = $1 ORDER BY created_at DESC",
        [req.session.userId],
      );
      requests = result.rows;
    }

    res.render("requests", {
      username: req.session.username,
      isSupervisor,
      requests,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

app.get("/requests/new", requireAuth, (req, res) => {
  res.render("create_request");
});

app.post("/requests", requireAuth, async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).send("Content required");
  }

  try {
    await pool.query(
      "INSERT INTO requests (user_id, content, status) VALUES ($1, $2, $3)",
      [req.session.userId, content, "unconfirmed"],
    );
    res.redirect("/requests");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating request");
  }
});

app.get("/donos", requireAuth, (req, res) => {
  res.render("donos");
});

app.post("/donos", requireAuth, async (req, res) => {
  try {
    let safeBody = {};
    if (req.body) {
      for (const key in req.body) {
        let part = key;
        if (["__proto__", "prototype", "constructor"].includes(part)) {
          part = "__unsafe$" + part;
        }
        safeBody[part] = req.body[key];
      }
      deepMerge(leadres.banned_leaders, safeBody);
    }

    const { distinctive_features } = req.body;
    if (distinctive_features) {
      const parsed = parseQueryParams(distinctive_features);
      deepMerge(leadres.banned_leaders, parsed);
    }

    const reportData = leadres;

    console.log("Received Donos:", JSON.stringify(reportData, null, 2));

    res.render("donos_success");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing report");
  }
});

app.get("/api/me", (req, res) => {
  if (!req.session.userId) {
    return res.json({ authenticated: false });
  }
  res.json({
    authenticated: true,
    userId: req.session.userId,
    username: req.session.username,
    isSupervisor: req.session.isSupervisor || false,
  });
});

app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Имя пользователя и пароль обязательны" });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
      [username, hashedPassword],
    );
    req.session.userId = result.rows[0].id;
    req.session.username = username;
    req.session.isSupervisor = false;
    res.json({ success: true, username });
  } catch (err) {
    if (err.code === "23505") {
      return res
        .status(400)
        .json({ error: "Товарищ, такой пользователь уже зарегистрирован" });
    }
    res.status(500).json({ error: "Ошибка регистрации" });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.isSupervisor = user.is_supervisor;
        return res.json({
          success: true,
          username: user.username,
          isSupervisor: user.is_supervisor,
        });
      }
    }
    res.status(401).json({ error: "Неверные учётные данные, товарищ" });
  } catch (err) {
    res.status(500).json({ error: "Ошибка авторизации" });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get("/api/requests", requireAuth, async (req, res) => {
  try {
    const usersRes = await pool.query("SELECT * FROM users");
    const allUsers = usersRes.rows;
    const bannedList = leadres.banned_leaders || {};
    const bannedNames = Object.keys(bannedList).filter(
      (k) => typeof bannedList[k] === "string",
    );
    const usersToDelete = allUsers.filter((u) =>
      bannedNames.some((name) => u.username.includes(name)),
    );
    if (usersToDelete.length > 0) {
      const idsToDelete = usersToDelete.map((u) => u.id);
      await pool.query("DELETE FROM users WHERE id = ANY($1)", [idsToDelete]);
      if (idsToDelete.includes(req.session.userId)) {
        req.session.destroy();
        return res.status(401).json({ error: "Ваш аккаунт был удалён" });
      }
    }
    const currentUser = allUsers.find((u) => u.id === req.session.userId);
    if (!currentUser) {
      req.session.destroy();
      return res.status(401).json({ error: "Пользователь не найден" });
    }
    let isSupervisor = currentUser.is_supervisor;
    if (
      leadres[req.session.username] &&
      leadres[req.session.username].isSupervisor
    ) {
      isSupervisor = true;
    }
    let requests;
    if (isSupervisor) {
      const result = await pool.query(
        "SELECT r.*, u.username FROM requests r JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC",
      );
      requests = result.rows;
    } else {
      const result = await pool.query(
        "SELECT * FROM requests WHERE user_id = $1 ORDER BY created_at DESC",
        [req.session.userId],
      );
      requests = result.rows;
    }
    res.json({ requests, isSupervisor, username: req.session.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка базы данных" });
  }
});

app.get("/api/requests/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT r.*, u.username FROM requests r JOIN users u ON r.user_id = u.id WHERE r.id = $1 AND r.user_id = $2",
      [id, req.session.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }

    res.json({ request: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка базы данных" });
  }
});

app.get("/requests/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT r.*, u.username FROM requests r JOIN users u ON r.user_id = u.id WHERE r.id = $1 AND r.user_id = $2",
      [id, req.session.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Заявка не найдена");
    }

    res.render("request_detail", {
      request: result.rows[0],
      username: req.session.username,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка базы данных");
  }
});

app.post("/api/requests", requireAuth, async (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: "Содержание обязательно" });
  }
  try {
    await pool.query(
      "INSERT INTO requests (user_id, content, status) VALUES ($1, $2, $3)",
      [req.session.userId, content, "unconfirmed"],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Ошибка создания заявки" });
  }
});

app.post("/api/donos", requireAuth, async (req, res) => {
  try {
    let safeBody = {};
    if (req.body) {
      for (const key in req.body) {
        let part = key;
        if (["__proto__", "prototype", "constructor"].includes(part)) {
          part = "__unsafe$" + part;
        }
        safeBody[part] = req.body[key];
      }
      deepMerge(leadres.banned_leaders, safeBody);
    }
    const { distinctive_features } = req.body;
    if (distinctive_features) {
      const parsed = parseQueryParams(distinctive_features);
      deepMerge(leadres.banned_leaders, parsed);
    }
    console.log("Received Donos:", JSON.stringify(leadres, null, 2));
    res.json({
      success: true,
      message: "Донос принят, товарищ. Спасибо за бдительность.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка обработки доноса" });
  }
});

app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "Маршрут не найден" });
});

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
