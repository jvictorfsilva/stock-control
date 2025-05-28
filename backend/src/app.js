import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import itemsRouter from "./routes/items.js";
import categoriesRouter from "./routes/categories.js";
import authRouter from "./routes/auth.js";
import "./db.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "https://stock-control-teal.vercel.app",
    credentials: true,
  })
);

app.use(express.json());

app.get("/health", (req, res) => {
  res.send("OK");
});

app.use("/api/items", itemsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/auth", authRouter);

export default app;
