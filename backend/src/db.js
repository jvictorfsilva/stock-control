import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "your_db_name";

let db;

async function connectToDatabase() {
  if (db) {
    return db;
  }
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log("Successfully connected to MongoDB.");

    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    console.log("Ensured index on users.email");

    await db.collection("items").createIndex({ category_id: 1 });
    console.log("Ensured index on items.category_id");

    return db;
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
}

export { connectToDatabase };
