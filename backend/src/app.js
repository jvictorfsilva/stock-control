import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import itemsRouter from "./routes/items.js";
import categoriesRouter from "./routes/categories.js";
import authRouter from "./routes/auth.js";
import "./db.js";

dotenv.config();

const app = express();

const allowedOrigin =
  process.env.NODE_ENV === "PROD"
    ? "https://stock-control-teal.vercel.app"
    : "http://localhost:3000";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: false,
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
