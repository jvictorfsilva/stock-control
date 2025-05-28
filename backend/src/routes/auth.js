import express from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import logger from "../logger.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

router.post(
  "/register",
  [
    body("username").isString().notEmpty().withMessage("Username is required"),
    body("email").isEmail().withMessage("Must be a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { username, email, password } = req.body;
      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      const [result] = await pool.execute(
        "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
        [username, email, hash, "user"]
      );
      res.status(201).json({
        id: result.insertId,
        username,
        email,
      });
    } catch (err) {
      logger.log("Error in /auth/register", err);
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "User already exists" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Must be a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const [rows] = await pool.execute(
        "SELECT id, username, password, role FROM users WHERE email = ?",
        [email]
      );
      if (rows.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const user = rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const token = jwt.sign(
        { sub: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "2h" }
      );
      res.json({ token });
    } catch (err) {
      logger.log("Error in /auth/login", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.get("/validate-token", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({ error: "Token is required" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    const [rows] = await pool.execute("SELECT id FROM users WHERE id = ?", [
      decoded.sub,
    ]);

    if (rows.length === 0) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    return res.json({
      valid: true,
      userId: decoded.sub,
      username: decoded.username,
      role: decoded.role,
    });
  } catch (err) {
    logger.log("Error in /auth/validate-token", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

export default router;
