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
    const [rows] = await pool.query(
      `SELECT 
        i.id,
        i.name,
        i.quantity,
        i.price,
        i.created_on,
        i.updated_on,
        c.name AS category_name
      FROM items AS i
      JOIN categories AS c
          ON i.category_id = c.id
      ORDER BY i.id ASC;
`
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get(
  "/:id",
  [param("id").isInt().withMessage("ID must be an integer")],
  handleValidationErrors,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const [rows] = await pool.query(
        `SELECT name, quantity, price, category_id 
         FROM items 
         WHERE id = ?`,
        [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json(rows[0]);
    } catch (err) {
      console.error("Error fetching item by id:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

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
    body("category")
      .isInt({ min: 1 })
      .withMessage("Category must be a non-negative integer"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, quantity, price, category } = req.body;
      const [result] = await pool.execute(
        `INSERT INTO items (name, quantity, price, category_id, created_on, updated_on)
         VALUES (?, ?, ?, ?, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())`,
        [name, quantity, price, category]
      );
      const insertId = result.insertId;
      const [newItemRows] = await pool.query(
        `SELECT created_on, updated_on FROM items WHERE id = ?`,
        [insertId]
      );
      const { created_on, updated_on } = newItemRows[0];
      res.status(201).json({
        id: insertId,
        name,
        quantity,
        price,
        category,
        created_on,
        updated_on,
      });
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
    body("category")
      .isInt({ min: 1 })
      .withMessage("Category must be a non-negative integer"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { name, quantity, price, category } = req.body;
      const [result] = await pool.execute(
        `UPDATE items
         SET name = ?, quantity = ?, price = ?, category_id = ?, updated_on = UNIX_TIMESTAMP()
         WHERE id = ?`,
        [name, quantity, price, category, id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Item not found" });
      }
      const [updatedRows] = await pool.query(
        `SELECT updated_on FROM items WHERE id = ?`,
        [id]
      );
      const { updated_on } = updatedRows[0];
      res.json({ id, name, quantity, price, updated_on });
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
