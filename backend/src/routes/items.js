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
    const items = await db
      .collection("items")
      .aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "category_id",
            foreignField: "_id",
            as: "category_info",
          },
        },
        {
          $unwind: {
            path: "$category_info",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            quantity: 1,
            price: 1,
            created_on: 1,
            updated_on: 1,
            category_id: 1,
            category_name: "$category_info.name",
          },
        },
        {
          $sort: { _id: 1 },
        },
      ])
      .toArray();

    const formattedItems = items.map((item) => ({ ...item, id: item._id }));
    res.json(formattedItems);
  } catch (err) {
    console.error("Error fetching items:", err);
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
        .collection("items")
        .findOne(
          { _id: new ObjectId(id) },
          { projection: { name: 1, quantity: 1, price: 1, category_id: 1 } }
        );

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
      .notEmpty()
      .withMessage("Name must be a non-empty string"),
    body("quantity")
      .isInt({ min: 0 })
      .withMessage("Quantity must be a non-negative integer"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
    body("category")
      .custom((value) => {
        if (!ObjectId.isValid(value)) {
          throw new Error("Category ID must be a valid MongoDB ObjectId");
        }
        return true;
      })
      .withMessage("Category ID must be a valid ObjectId"),
  ],
  handleValidationErrors,
  async (req, res) => {
    const db = await getDb();
    try {
      const { name, quantity, price, category: categoryIdString } = req.body;

      const categoryExists = await db
        .collection("categories")
        .findOne({ _id: new ObjectId(categoryIdString) });
      if (!categoryExists) {
        return res
          .status(400)
          .json({ errors: [{ path: "category", msg: "Category not found" }] });
      }

      const newItem = {
        name,
        quantity: parseInt(quantity, 10),
        price: parseFloat(price),
        category_id: new ObjectId(categoryIdString),
        created_on: new Date(),
        updated_on: new Date(),
      };
      const result = await db.collection("items").insertOne(newItem);
      res.status(201).json({
        id: result.insertedId,
        name: newItem.name,
        quantity: newItem.quantity,
        price: newItem.price,
        category: newItem.category_id.toHexString(),
        created_on: newItem.created_on,
        updated_on: newItem.updated_on,
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
    param("id").custom((value) => {
      if (!ObjectId.isValid(value)) {
        throw new Error("ID must be a valid MongoDB ObjectId");
      }
      return true;
    }),
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
      .custom((value) => {
        if (!ObjectId.isValid(value)) {
          throw new Error("Category ID must be a valid MongoDB ObjectId");
        }
        return true;
      })
      .withMessage("Category ID must be a valid ObjectId"),
  ],
  handleValidationErrors,
  async (req, res) => {
    const db = await getDb();
    try {
      const id = req.params.id;
      const { name, quantity, price, category: categoryIdString } = req.body;

      const categoryExists = await db
        .collection("categories")
        .findOne({ _id: new ObjectId(categoryIdString) });
      if (!categoryExists) {
        return res
          .status(400)
          .json({ errors: [{ path: "category", msg: "Category not found" }] });
      }

      const result = await db.collection("items").findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {
            name,
            quantity: parseInt(quantity, 10),
            price: parseFloat(price),
            category_id: new ObjectId(categoryIdString),
            updated_on: new Date(),
          },
        },
        { returnDocument: "after" }
      );

      if (!result) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json({
        id: result._id,
        name: result.name,
        quantity: result.quantity,
        price: result.price,
        category: result.category_id.toHexString(),
        updated_on: result.updated_on,
      });
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
      const result = await db
        .collection("items")
        .deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
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
