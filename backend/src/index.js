import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import itemsRouter from "./routes/items.js";
import CategoriesRouter from "./routes/categories.js";
import authRouter from "./routes/auth.js";
import "./db.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.send("OK");
});
app.use("/api/items", itemsRouter);
app.use("/api/categories", CategoriesRouter);
app.use("/auth", authRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
