const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const path = require("path");
const crypto = require("crypto");

const app = express();
const port = 3000;
const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET;

if (isProduction && (!sessionSecret || sessionSecret.length < 32)) {
  throw new Error("SESSION_SECRET must be set to at least 32 characters");
}

app.set("trust proxy", isProduction ? 1 : 0);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = new Set(
    (
      process.env.ALLOWED_ORIGINS ||
      "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001"
    )
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  const isAllowedOrigin = (value) => {
    if (!value || allowedOrigins.has(value)) return Boolean(value);

    try {
      const parsedOrigin = new URL(value);
      const allowedPort = ["3000", "3001"].includes(parsedOrigin.port);
      const isCtfHostname =
        parsedOrigin.hostname.endsWith(".ctflab.local") ||
        /^10\.62\.\d+\.10$/.test(parsedOrigin.hostname);
      return parsedOrigin.protocol === "http:" && allowedPort && isCtfHostname;
    } catch (_) {
      return false;
    }
  };
  const originAllowed = isAllowedOrigin(origin);

  if (originAllowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") {
    return originAllowed ? res.sendStatus(204) : res.sendStatus(403);
  }

  if (
    ["POST", "PUT", "PATCH", "DELETE"].includes(req.method) &&
    origin &&
    !originAllowed
  ) {
    return res.status(403).json({ error: "Недопустимый источник запроса" });
  }

  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
  next();
});

app.use(bodyParser.urlencoded({ extended: false, limit: "20kb" }));
app.use(bodyParser.json({ limit: "20kb" }));
app.use(
  session({
    secret: sessionSecret || crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000,
    },
  }),
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "arktur",
  password: process.env.DB_PASSWORD,
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

const establishSession = (req, user, callback) => {
  req.session.regenerate((err) => {
    if (err) return callback(err);
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.isSupervisor = Boolean(user.is_supervisor);
    callback(null);
  });
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

    establishSession(
      req,
      { id: result.rows[0].id, username, is_supervisor: false },
      (sessionError) => {
        if (sessionError) return res.status(500).send("Error creating session");
        res.redirect("/requests");
      },
    );
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
        return establishSession(req, user, (sessionError) => {
          if (sessionError) return res.status(500).send("Login error");
          res.redirect("/requests");
        });
      }
    }
    res.status(401).send("Invalid credentials");
  } catch (err) {
    console.error(err);
    res.status(500).send("Login error");
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.get("/requests", requireAuth, async (req, res) => {
  try {
    const usersRes = await pool.query("SELECT * FROM users");
    const allUsers = usersRes.rows;

    const currentUser = allUsers.find((u) => u.id === req.session.userId);

    if (!currentUser) {
      req.session.destroy();
      return res.redirect("/");
    }

    let isSupervisor = currentUser.is_supervisor;

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
    const { distinctive_features: distinctiveFeatures } = req.body;
    const reportData = {
      relatives: Object.keys(req.body || {}).filter(
        (key) => key.startsWith("relatives[") && key.endsWith("]"),
      ).length,
      distinctiveFeatures:
        typeof distinctiveFeatures === "string"
          ? distinctiveFeatures.slice(0, 2000)
          : "",
    };

    console.log("Received Donos:", JSON.stringify(reportData));

    res.render("donos_success");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing report");
  }
});

app.get("/api/me", async (req, res) => {
  if (!req.session.userId) {
    return res.json({ authenticated: false });
  }
  try {
    const result = await pool.query(
      "SELECT id, username, is_supervisor FROM users WHERE id = $1",
      [req.session.userId],
    );
    if (result.rows.length === 0) {
      return req.session.destroy(() => res.json({ authenticated: false }));
    }
    const user = result.rows[0];
    res.json({
      authenticated: true,
      userId: user.id,
      username: user.username,
      isSupervisor: Boolean(user.is_supervisor),
    });
  } catch (err) {
    res.status(500).json({ error: "Ошибка базы данных" });
  }
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
    establishSession(
      req,
      { id: result.rows[0].id, username, is_supervisor: false },
      (sessionError) => {
        if (sessionError)
          return res.status(500).json({ error: "Ошибка сессии" });
        res.json({ success: true, username });
      },
    );
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
        return establishSession(req, user, (sessionError) => {
          if (sessionError)
            return res.status(500).json({ error: "Ошибка сессии" });
          res.json({
            success: true,
            username: user.username,
            isSupervisor: Boolean(user.is_supervisor),
          });
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
    const currentUser = allUsers.find((u) => u.id === req.session.userId);
    if (!currentUser) {
      req.session.destroy();
      return res.status(401).json({ error: "Пользователь не найден" });
    }
    let isSupervisor = currentUser.is_supervisor;
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
    const { distinctive_features: distinctiveFeatures } = req.body;
    console.log(
      "Received Donos:",
      JSON.stringify({
        fields: Object.keys(req.body || {}).length,
        distinctiveFeatures:
          typeof distinctiveFeatures === "string"
            ? distinctiveFeatures.slice(0, 2000)
            : "",
      }),
    );
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
