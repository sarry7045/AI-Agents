import express from "express";
import { authenticate } from "../middlewares/auth.js";
import {
  createTicket,
  getSingleTicket,
  getTickets,
} from "../controllers/ticket.js";

const ticketRouter = express.Router();

ticketRouter.get("/", authenticate, getTickets);
ticketRouter.get("/:id", authenticate, getSingleTicket);
ticketRouter.post("/", authenticate, createTicket);

export default ticketRouter;
