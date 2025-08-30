import dbCRUD from "../common/db/dbCRUD.mjs";
import { keywords, validMessage } from "../library/validInitialMessage.mjs";
import {
  readMessage,
  sendFlow,
  sendMessageWithReplyButtons,
  sendTypingIndicatorAnimation,
} from "../api/apis.mjs";
import { getUser } from "./handleUser.mjs";

/**
 * Handle text or "Hi" messages
 */
export async function handleTextOrHiMessage(message, req) {
  const isflow_Completed = message?.interactive != undefined; //to receive flow response on completion

  if (message != undefined && message?.text?.body != undefined) {
    const messageBody = message?.text?.body || "Hi"; //user message body received
    const messageType = message?.type; //type of message received
    const messageId = message?.id; //received message whatsapp id
    const phone_number = message?.from.slice(2); //user phone number
    const message_timestamp = message?.timestamp; //message received timestamp
    // logUserInitializationRequest(req)

    if (
      messageType == "text" &&
      (validMessage.has(messageBody) ||
        keywords.some((keyword) => messageBody.includes(keyword)))
    ) {
      // request to mark incoming message as read
      await readMessage(messageId);
      await sendTypingIndicatorAnimation(messageId)
      const dbcrud = new dbCRUD();
      const phoneTemp = phone_number
      // const isUserExists = await dbcrud.findInDB("trigo_user",{
      //   phone_number : phoneTemp
      // })
      let flow_id, flow_status, FlowBodyText, FlowFooterText, StartButtonText, InitialScreenName;

      //if (isUserExists) {
        flow_id = process.env.whatsapp_flow_id1;
        flow_status = "draft";
        FlowBodyText =
          "Click on the below button to start with Tap On Travel";
        StartButtonText = "Enquiry";
        InitialScreenName = "lead_generation";
      //}
      // else{
      //   flow_id = process.env.whatsapp_flow_id1;
      //   flow_status = "draft";
      //   FlowBodyText =
      //     "Click on the below button to start the journey with trigo";
      //   FlowFooterText = "powered by WayMiro";
      //   StartButtonText = "Start Booking";
      //   InitialScreenName = "user_profile";
      // }
      sendFlow(
        flow_id,
        flow_status,
        phone_number,
        FlowBodyText,
        FlowFooterText,
        StartButtonText,
        InitialScreenName
      );
    }


  }
}

/**
 * Validate message content
 */
export function isValidMessage(messageBody) {
  return (
    validMessage.has(messageBody) ||
    keywords.some((keyword) => messageBody.includes(keyword))
  );
}

/**
 * Handle flow response
 */
export async function handleFlowResponse(rawBody) {
  console.log("Flow Response",rawBody)
}
