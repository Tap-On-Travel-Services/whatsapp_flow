import express from "express";
import { WebhookController } from "../controller/webhookController.mjs";

// Router Setup
const router = express.Router();
const webhookController = new WebhookController();

// POST: Main Endpoint
router.post("/", async (req, res) => {
  await webhookController.handlePostRequest(req, res);
});

// POST: Webhook Message Handling
router.post("/webhook", async (req, res) => {
  webhookController.handleWebhook(req, res);
});

// GET: Default Route for Webhook Verification.
// For more info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
router.get("/webhook", (req, res) => {
  webhookController.handleWebhookVerification(req, res);
});

// GET: Default Route
router.get("/", (req, res) => {
 res.send(
    `<pre>Nothing to see here.
  Checkout README.md to start.</pre>`
  );
});

export default router;