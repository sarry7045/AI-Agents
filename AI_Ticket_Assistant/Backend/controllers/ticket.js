import { inngest } from "../inngest/client.js";
import ticket from "../models/ticket.js";

export const createTicket = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res
        .staus(400)
        .json({ message: "Title and Description are Required" });
    }
    const newTicket = ticket.create({
      title,
      description,
      createdBy: req.user._id.toString(),
    });

    await inngest.send({
      name: "ticket/created",
      data: {
        ticketId: (await newTicket)._id.toString(),
        title,
        description,
        createdBy: req.user._id.toString(),
      },
    });

    return res.status(201).json({
      message: "Ticket Created and Processing Started",
      ticket: newTicket,
    });
  } catch (error) {
    console.log("Error in Inggesting Ticket");
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTickets = async (req, res) => {
  try {
    const user = req.user;
    let tickets = [];
    if (user.role !== "user") {
      tickets = ticket
        .find({})
        .populate("assignedTo", ["email", "_id"])
        .sort({ createdAt: -1 });
    } else {
      tickets = await ticket
        .find({ createdBy: user._id })
        .select("Title Description status CreatedAt")
        .sort({ createdAt: -1 });
    }
    return res.status(200).json(tickets);
  } catch (error) {
    console.error("Error fetching tickets", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getSingleTicket = async (req, res) => {
  try {
    const user = req.user;
    let Ticket;

    if (user.role !== "user") {
      Ticket = ticket
        .findById(req.params.id)
        .populate("assignedTo", ["email", "_id"]);
    } else {
      Ticket = ticket
        .findOne({
          createdBy: user._id,
          _id: req.params.id,
        })
        .select("Title Description status CreatedAt");
    }

    if (!Ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    return res.status(404).json({ Ticket });
  } catch (error) {
    console.error("Error fetching ticket", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
