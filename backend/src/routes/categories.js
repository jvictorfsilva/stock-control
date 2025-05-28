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
        c.id,
        c.name,
        c.created_on,
        c.updated_on,
        COUNT(i.id) AS item_count
      FROM categories AS c
      LEFT JOIN items AS i ON c.id = i.category_id
      GROUP BY c.id, c.name, c.created_on, c.updated_on
      ORDER BY c.id ASC;`
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching categories:", err);
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
      .trim()
      .notEmpty()
      .withMessage("Category name must be a non-empty string"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name } = req.body;
      const [result] = await pool.execute(
        `INSERT INTO categories (name, created_on, updated_on)
         VALUES (?, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())`,
        [name]
      );
      const insertId = result.insertId;
      const [newCategoryRows] = await pool.query(
        `SELECT created_on, updated_on FROM categories WHERE id = ?`,
        [insertId]
      );
      const { created_on, updated_on } = newCategoryRows[0];
      res.status(201).json({ id: insertId, name, created_on, updated_on });
    } catch (err) {
      console.error("Error creating category:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.put(
  "/:id",
  authenticate,
  authorizeAdmin,
  [
    param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
    body("name")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Category name must be a non-empty string"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { name } = req.body;
      const [result] = await pool.execute(
        `UPDATE categories
         SET name = ?, updated_on = UNIX_TIMESTAMP()
         WHERE id = ?`,
        [name, id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Category not found" });
      }
      const [updatedRows] = await pool.query(
        `SELECT updated_on FROM categories WHERE id = ?`,
        [id]
      );
      const { updated_on } = updatedRows[0];
      res.json({ id, name, updated_on });
    } catch (err) {
      console.error("Error updating category:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.delete(
  "/:id",
  authenticate,
  authorizeAdmin,
  [param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer")],
  handleValidationErrors,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      const [itemCountResult] = await pool.query(
        `SELECT COUNT(*) AS count FROM items WHERE category_id = ?`,
        [id]
      );

      if (itemCountResult[0].count > 0) {
        return res.status(400).json({
          error: "Cannot delete category: items are associated with it.",
        });
      }

      const [result] = await pool.execute(
        "DELETE FROM categories WHERE id = ?",
        [id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(`id ${id} successfully deleted`);
    } catch (err) {
      console.error("Error deleting category:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
