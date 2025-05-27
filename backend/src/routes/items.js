import express from "express";
import pool from "../db.js";
import { authenticate, authorizeAdmin } from "../middleware/auth.js";
import { body, param, validationResult } from "express-validator";

const router = express.Router();

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM items");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post(
  "/",
  authenticate,
  authorizeAdmin,
  [
    body("name")
      .isString()
      .notEmpty()
      .withMessage("Name must be a non-empty string"),
    body("quantity")
      .isInt({ min: 0 })
      .withMessage("Quantity must be a non-negative integer"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, quantity, price } = req.body;
      const [result] = await pool.execute(
        "INSERT INTO items (name, quantity, price) VALUES (?, ?, ?)",
        [name, quantity, price]
      );
      res.status(201).json({ id: result.insertId, name, quantity, price });
    } catch (err) {
      console.error("Error creating item:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.put(
  "/:id",
  authenticate,
  authorizeAdmin,
  [
    param("id").isInt().withMessage("ID must be an integer"),
    body("name")
      .isString()
      .notEmpty()
      .withMessage("Name must be a non-empty string"),
    body("quantity")
      .isInt({ min: 0 })
      .withMessage("Quantity must be a non-negative integer"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { name, quantity, price } = req.body;
      const [result] = await pool.execute(
        "UPDATE items SET name = ?, quantity = ?, price = ? WHERE id = ?",
        [name, quantity, price, id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json({ id, name, quantity, price });
    } catch (err) {
      console.error("Error updating item:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.delete(
  "/:id",
  authenticate,
  authorizeAdmin,
  [param("id").isInt().withMessage("ID must be an integer")],
  handleValidationErrors,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const [result] = await pool.execute("DELETE FROM items WHERE id = ?", [
        id,
      ]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.sendStatus(204);
    } catch (err) {
      console.error("Error deleting item:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
