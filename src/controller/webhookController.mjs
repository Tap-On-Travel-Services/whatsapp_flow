import crypto from "crypto";
import {
  decryptRequest,
  encryptResponse,
  FlowEndpointException,
} from "../common/encryption/encryption.mjs";
import logger from "../utils/logger.mjs";
import { getNextScreen } from "./dataExchange.mjs";
import {
  handleFlowResponse,
  handleTextOrHiMessage,
} from "../utils/handleInitializeMessage.mjs";
import { appendToSheet } from "../utils/GSheetManager.mjs";
import {
  sendFlow,
  sendMessageWithReplyButtons,
  sendTextMessage,
  sendTypingIndicatorAnimation,
} from "../api/apis.mjs";
import dbCRUD from "../common/db/dbCRUD.mjs";
import { generateToken } from "../library/token.mjs";

export class WebhookController {
  constructor() {
    this.privateKey = process.env.PRIVATE_KEY;
    this.passphrase = process.env.PASSPHRASE;
    this.appSecret = process.env.APP_SECRET;
    this.verifyToken = process.env.WEBHOOK_VERIFY_TOKEN;

    if (!this.privateKey) {
      throw new Error("Private key is empty. Please check your Private Key.");
    }
  }

  validateRequestSignature(req) {
    if (!this.appSecret) {
      logger.warn("App Secret is not set up. Skipping request validation.");
      return true;
    }

    const signatureHeader = req.get("x-hub-signature-256");
    if (!signatureHeader) {
      logger.error("Missing signature header.");
      return false;
    }
    const signatureBuffer = Buffer.from(
      signatureHeader.replace("sha256=", ""),
      "utf-8"
    );

    const hmac = crypto.createHmac("sha256", this.appSecret);
    const digestBuffer = Buffer.from(
      hmac.update(req.rawBody).digest("hex"),
      "utf-8"
    );
    if (!crypto.timingSafeEqual(digestBuffer, signatureBuffer)) {
      logger.error("Request signature did not match.");
      return false;
    }

    return true;
  }

  async processDecryptedRequest(req) {
    try {
      const decryptedRequest = decryptRequest(
        req.body,
        this.privateKey,
        this.passphrase
      );

      const { aesKeyBuffer, initialVectorBuffer, decryptedBody } =
        decryptedRequest;
      const screenResponse = await getNextScreen(decryptedBody);

      return encryptResponse(screenResponse, aesKeyBuffer, initialVectorBuffer);
    } catch (err) {
      logger.error("Error decrypting request: ", err);
      if (err instanceof FlowEndpointException) {
        throw { statusCode: err.statusCode };
      }
      throw { statusCode: 500 };
    }
  }

  async handlePostRequest(req, res) {
    if (!this.validateRequestSignature(req)) {
      return res.status(432).send();
    }

    try {
      const response = await this.processDecryptedRequest(req);
      res.send(response);
    } catch (err) {
      logger;
      res.status(err.statusCode || 500).send();
    }
  }

  async handleWebhook(req, res) {
    res.sendStatus(200);
    const message = req.body?.entry?.[0]?.changes[0]?.value?.messages?.[0];
    if (!message) return;
    const messageId = message.id;

    await sendTypingIndicatorAnimation(messageId);
    const token = generateToken(message.from, messageId);
    const { text, interactive } = message;
    const dbcrud = new dbCRUD();
    dbcrud.insertDB("leads", {
      phoneNumber: message.from,
      message: message,
      status: "received",
      token: token,
    });

    if (text != undefined) {
      sendMessageWithReplyButtons(
        message.from,
        "Welcome To Tap On Travel",
        "Click on the below to Continue",
        "TAPONTRAVEL",
        process.env.CTA_BUTTON_INITIAL_MSG_1,
        process.env.CTA_BUTTON_INITIAL_MSG_2,
        process.env.CTA_BUTTON_INITIAL_MSG_3
      );
    }
    if (interactive != undefined) {
      if (interactive.nfm_reply != undefined) {
        const response = JSON.parse(interactive.nfm_reply.response_json);
        const dbcrud = new dbCRUD();
        const dbData = await dbcrud.findInDB("leads",{ token: response.flow_token });

        const phone = dbData.phoneNumber;
        sendTextMessage(
          phone,
          "Thankyou for conatacting TapOnTravel\n\nOur Executive will connect with you at your preferred time provided\n\nStay Awesome!!"
        );

        dbcrud.updateDB(
          "leads",
          { token: response.flow_token },
          {
            preferredDatToCall: response.preferred_date,
            preferredTimeToCall: response.preferred_time,
            status: "completed",
          }
        );
      } else {
        if (interactive.button_reply != undefined) {
          dbcrud.updateDB(
            "leads",
            { token: token },
            {
              tripPreference: interactive.button_reply.title,
            }
          );
        }
        if (
          interactive.button_reply.title == process.env.CTA_BUTTON_INITIAL_MSG_1
        ) {
          //Customize your trip
          sendFlow(
            process.env.FLOW_ID_1,
            process.env.FLOW_STATUS_1,
            message.from,
            "Click Below to Start Flow",
            "TAPONTRAVEL",
            "Customize Your Trip",
            "user_details",
            token
          );
        }
        if (
          interactive.button_reply.title == process.env.CTA_BUTTON_INITIAL_MSG_2
        ) {
          //Community Trip
        }
        if (
          interactive.button_reply.title == process.env.CTA_BUTTON_INITIAL_MSG_3
        ) {
          //PHone NUmber
        }
      }
    }
    // appendToSheet(
    //   process.env.google_sheet_id,
    //   "leads",
    //   ["contact", "name", "Timestamp"], // Column headers
    //   {
    //     contact: `${message?.from}`,
    //     name: req.body?.entry?.[0]?.changes[0]?.value?.contacts?.[0].profile
    //       ?.name,
    //     Timestamp: new Date()
    //       .toLocaleString("en-IN", {
    //         timeZone: "Asia/Kolkata",
    //         hour12: false,
    //       })
    //       .replace(",", ""),
    //   }
    // );
    // if (text?.body || interactive?.button_reply?.title === "Hi") {
    //   await handleTextOrHiMessage(message, req);
    // }

    // if (interactive) {
    //   await handleFlowResponse(req.rawBody);
    // }
  }

  handleWebhookVerification(req, res) {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === this.verifyToken) {
      res.status(200).send(challenge);
      logger.info("Webhook verified successfully!");
    } else {
      res.sendStatus(403);
    }
  }
}
