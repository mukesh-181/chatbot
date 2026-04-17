import express from "express";
import cors from "cors";
import chatRoutes from "./routes/chat.route";




const app = express();

app.use(cors());
app.use(express.json());


app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
  res.send("API running...");
});

export default app;