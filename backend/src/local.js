import app from "./index.js";
import dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT || 4000;

app.then((server) => {
  server.listen(port, () => {
    console.log(`Local server running at http://localhost:${port}`);
  });
});
