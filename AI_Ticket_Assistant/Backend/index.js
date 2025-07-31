import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import userRouter from "./routes/user.js";
import ticketRouter from "./routes/ticket.js";
import { serve } from "inngest/express";
import { inngest } from "./inngest/client.js";
import { onUserSignUp } from "./inngest/functions/on-signup.js";
import { onTicketCreated } from "./inngest/functions/on-ticket-create.js";
import { config } from "dotenv";

const app = express();
const PORT = process.env.PORT || 3000;
config()


app.use(cors());
app.use(express.json());
app.use("/api/auth", userRouter);
app.use("/api/tickets", ticketRouter);

app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: [onUserSignUp, onTicketCreated],
  })
);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MDB Connected");
    app.listen(PORT, () => console.log("Server at 3000"));
  })
  .catch((err) => console.log("Err while DB Connection", err));
