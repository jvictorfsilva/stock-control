import express from "express";
import { body, validationResult } from "express-validator";
import { authenticate, authorizeAdmin } from "../middleware/auth.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "../db.js";
import logger from "../logger.js";
import dotenv from "dotenv";
import { ObjectId } from "mongodb";

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

async function getDb() {
  return await connectToDatabase();
}

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
    const db = await getDb();
    try {
      const { username, email, password } = req.body;
      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      const result = await db.collection("users").insertOne({
        username,
        email,
        password: hash,
        role: "user",
        created_on: new Date(),
        updated_on: new Date(),
      });
      res.status(201).json({
        id: result.insertedId,
        username,
        email,
      });
    } catch (err) {
      logger.log("Error in /auth/register", err);
      if (err.code === 11000) {
        return res
          .status(409)
          .json({ error: "User already exists (email must be unique)" });
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
    const db = await getDb();
    try {
      const { email, password } = req.body;
      const user = await db.collection("users").findOne({ email });

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        {
          sub: user._id.toHexString(),
          username: user.username,
          role: user.role,
        },
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
  const db = await getDb();
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({ error: "Token is required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!ObjectId.isValid(decoded.sub)) {
      return res
        .status(401)
        .json({ error: "Invalid token payload (user ID format)" });
    }

    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(decoded.sub) });

    if (!user) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    return res.json({
      valid: true,
      userId: user._id.toHexString(),
      username: user.username,
      role: user.role,
    });
  } catch (err) {
    logger.log("Error in /auth/validate-token", err);
    if (
      err instanceof jwt.JsonWebTokenError ||
      err instanceof jwt.TokenExpiredError
    ) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post(
  "/change-role",
  authenticate,
  authorizeAdmin,
  [
    body("role")
      .isString()
      .notEmpty()
      .withMessage("Role must be a non-empty string"),
    body("email").isEmail().withMessage("Must be a valid email"),
  ],
  handleValidationErrors,
  async (req, res) => {
    const db = await getDb();
    const { role, email } = req.body;
    try {
      const result = await db
        .collection("users")
        .updateOne(
          { email: email },
          { $set: { role: role, updated_on: new Date() } }
        );

      if (result.matchedCount === 0) {
        return res
          .status(404)
          .json({ error: `No user found with email '${email}'` });
      }
      if (result.modifiedCount === 0 && result.matchedCount > 0) {
        return res
          .status(200)
          .json({
            message: `User '${email}' already has the role '${role}'. No change made.`,
          });
      }
      return res.json({
        message: `Role of '${email}' changed to '${role}' successfully.`,
      });
    } catch (err) {
      logger.log("Error in /change-role", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
