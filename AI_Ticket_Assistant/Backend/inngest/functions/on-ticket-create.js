import { NonRetriableError } from "inngest";
import { inngest } from "../client.js";
import { sendMail } from "../../utils/mailer.js";
import ticket from "../../models/ticket.js";
import analyzeTicket from "../../utils/agent.js";
import user from "../../models/user.js";

export const onTicketCreated = inngest.createFunction(
  { id: "on-ticket-created", retries: 2 },
  { event: "ticket/created" },
  async ({ event, step }) => {
    try {
      const { ticketId } = event.data;
      const Ticket = await step.run("fetch-ticket", async () => {
        const ticketObject = await ticket.findById(ticketId);
        if (!Ticket) {
          throw new NonRetriableError("Ticket not Found");
        }
        return ticketObject;
      });

      await step.run("update-ticket-status", async () => {
        await ticket.findByIdAndUpdate(Ticket._id, {
          status: "TODO",
        });
      });

      const AI_Response = await analyzeTicket(Ticket);
      const relatedSkills = await step.run("ai-processing", async () => {
        let skills = [];
        if (AI_Response) {
          await ticket.findByIdAndUpdate(Ticket._id, {
            priority: !["low", "medium", "hight"].includes(AI_Response.priority)
              ? "medium"
              : AI_Response.priority,
            helpfulNotes: AI_Response.helpfulNotes,
            status: "IN_PROGRESS",
            relatedSkills: AI_Response.relatedSkills,
          });
          skills = AI_Response.relatedSkills;
        }
        return skills;
      });

      const moderator = await step.run("assign-moderator", async () => {
        let User = await user.findOne({
          role: "moderator",
          skills: {
            $elemMatch: {
              $regex: relatedSkills.join("|"),
              $options: "i",
            },
          },
        });
        if (!User) {
          User = await user.findOne({
            role: "admin",
          });
        }
        await ticket.findByIdAndUpdate(Ticket._id, {
          assignedTo: User?._id || null,
        });

        return User;
      });

      await step.run("send-email-notification", async () => {
        if (moderator) {
          const finalTicket = await ticket.findOne(Ticket._id);
          await sendMail(
            moderator.email,
            "Ticket Assigned",
            `A new Ticket is Assigned to you ${finalTicket.title}`
          );
        }
      });

      return { success: true };
    } catch (error) {
      console.log("Error while Inggesting");
      return { success: false };
    }
  }
);
