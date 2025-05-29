import express from "express";
import { connectToDatabase } from "../db.js";
import { authenticate, authorizeAdmin } from "../middleware/auth.js";
import { body, param, validationResult } from "express-validator";
import { ObjectId } from "mongodb";

const router = express.Router();

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

router.get("/", async (req, res) => {
  const db = await getDb();
  try {
    const categories = await db
      .collection("categories")
      .aggregate([
        {
          $lookup: {
            from: "items",
            localField: "_id",
            foreignField: "category_id",
            as: "items_in_category",
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            created_on: 1,
            updated_on: 1,
            item_count: { $size: "$items_in_category" },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ])
      .toArray();

    const formattedCategories = categories.map((cat) => ({
      ...cat,
      id: cat._id,
    }));

    res.json(formattedCategories);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get(
  "/:id",
  [
    param("id").custom((value) => {
      if (!ObjectId.isValid(value)) {
        throw new Error("ID must be a valid MongoDB ObjectId");
      }
      return true;
    }),
  ],
  handleValidationErrors,
  async (req, res) => {
    const db = await getDb();
    try {
      const id = req.params.id;
      const item = await db
        .collection("categories")
        .findOne({ _id: new ObjectId(id) }, { projection: { name: 1 } });

      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json({ ...item, id: item._id });
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
      .trim()
      .notEmpty()
      .withMessage("Category name must be a non-empty string"),
  ],
  handleValidationErrors,
  async (req, res) => {
    const db = await getDb();
    try {
      const { name } = req.body;
      const currentTime = Math.floor(Date.now() / 1000);
      const newCategory = {
        name,
        created_on: currentTime,
        updated_on: currentTime,
      };
      const result = await db.collection("categories").insertOne(newCategory);
      res.status(201).json({
        id: result.insertedId,
        name: newCategory.name,
        created_on: newCategory.created_on,
        updated_on: newCategory.updated_on,
      });
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
    param("id").custom((value) => {
      if (!ObjectId.isValid(value)) {
        throw new Error("ID must be a valid MongoDB ObjectId");
      }
      return true;
    }),
    body("name")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Category name must be a non-empty string"),
  ],
  handleValidationErrors,
  async (req, res) => {
    const db = await getDb();
    try {
      const id = req.params.id;
      const { name } = req.body;
      const currentTime = Math.floor(Date.now() / 1000);
      const result = await db
        .collection("categories")
        .findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: { name: name, updated_on: currentTime } },
          { returnDocument: "after" }
        );

      if (!result) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json({
        id: result._id,
        name: result.name,
        updated_on: result.updated_on,
      });
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
  [
    param("id").custom((value) => {
      if (!ObjectId.isValid(value)) {
        throw new Error("ID must be a valid MongoDB ObjectId");
      }
      return true;
    }),
  ],
  handleValidationErrors,
  async (req, res) => {
    const db = await getDb();
    try {
      const id = req.params.id;

      const itemCount = await db
        .collection("items")
        .countDocuments({ category_id: new ObjectId(id) });

      if (itemCount > 0) {
        return res.status(400).json({
          error: "Cannot delete category: items are associated with it.",
        });
      }

      const result = await db
        .collection("categories")
        .deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Category not found" });
      }
      res
        .status(200)
        .json({ message: `Category with id ${id} successfully deleted` });
    } catch (err) {
      console.error("Error deleting category:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
