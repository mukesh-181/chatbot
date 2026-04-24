import express from "express";
import cors from "cors";
import chatRoutes from "./routes/chat.route";
import morgan from "morgan";

const app = express();

app.use(morgan("dev")); 
app.use(cors(
  {origin: ["http://localhost:5173","https://chatbot-1-55zr.onrender.com"], // Adjust this to your frontend URL
   credentials: true}
));
app.use(express.json());


app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
  res.send("API running...");
});

export default app;
