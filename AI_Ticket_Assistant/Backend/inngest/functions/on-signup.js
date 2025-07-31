import { NonRetriableError } from "inngest";
import user from "../../models/user.js";
import { inngest } from "../client.js";
import { sendMail } from "../../utils/mailer.js";

export const onUserSignUp = inngest.createFunction(
  { id: "on-user-signup", retries: 2 },
  { event: "user/signup" },
  async ({ event, step }) => {
    try {
      const { email } = event.data;
      const userr = await step.run("get-user-email", async () => {
        const userObject = await user.find({ email });
        // Doubt
        if (!userObject) {
          throw new NonRetriableError("User no longer exist in our DB");
        }
        return userObject;
      });

      await step.run("send-welcome-email", async () => {
        const subject = `Welcome to the app`;
        const message = `Hi, Thanks for signing up. We're glad to have you onboard`;

        await sendMail(userr.email, subject, message);
      });

      return { success: true };
    } catch (error) {
      console.log("Error", error);
      return { success: false };
    }
  }
);
