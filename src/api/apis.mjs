// Ensure this file is located at: D:\NapTapGo\ntg-whatsapp\Whatsapp flow endpoint\src\api\axios.mjs
import axios from "axios";
import {
  locations,
  no_of_travellers,
  sub_locations,
} from "../library/dropdowns.mjs";
import { catalogue } from "../library/catalogue.mjs";

const apiEndpoints = {
  BaseURL: process.env.META_URI,
  get: {},
  post: {
    messages: "/messages",
  },
  put: {},
  patch: {},
};

const axiosInstance = axios.create({
  baseURL: `${apiEndpoints.BaseURL}${process.env.BUSINESS_PHONE_NUMBER_ID}`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    config.headers.Authorization = `Bearer ${process.env.metatoken}`;
    config.headers["Content-Type"] = "application/json";
    return config;
  },
  (error) => {
    console.error("Request error:", error.message);
    return Promise.reject(error);
  }
);

const postRequest = async (postData, url) => {
  try {
    const response = await axiosInstance.post(url, postData);
    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error:", error.response?.data || error.message);
    } else {
      console.error("Unexpected error:", error.message);
    }
    throw error;
  }
};

export const readMessage = async (messageId) => {
  try {
    const postData = {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    };
    await postRequest(postData, apiEndpoints.post.messages);
  } catch (error) {
    console.error("Error reading message:", error.message);
    throw error;
  }
};

export const sendFlow = async (
  flow_id,
  flow_status,
  phone_number,
  bodyText,
  footerText,
  buttonText,
  initialScreenName,
  flow_token
) => {
  try {
    const postData = {
      messaging_product: "whatsapp",
      to: `${phone_number}`,
      type: "interactive",
      interactive: {
        type: "flow",
        body: {
          text: bodyText,
        },
        footer: {
          text: footerText,
        },
        action: {
          name: "flow",
          parameters: {
            flow_message_version: process.env.flow_message_version,
            flow_token: flow_token,
            flow_id: flow_id,
            flow_cta: buttonText,
            flow_action: "navigate",
            mode: flow_status,
            flow_action_payload: {
              screen: `${initialScreenName}`,
              data: {
                phone_number: phone_number,
                ...(initialScreenName == "user_details_communityTrip"
                  ? { rbData: catalogue }
                  : {
                      location: locations,
                      sub_location: sub_locations,
                      no_of_travellers: no_of_travellers,
                    }),
              },
            },
          },
        },
      },
    };
    await postRequest(postData, apiEndpoints.post.messages);
  } catch (error) {
    console.error("Error reading message:", error.message);
    throw error;
  }
};

export const sendMessageWithReplyButtons = async (
  phone,
  headerText,
  bodyText,
  footerText,
  button1_text,
  button2_text,
  button3_text
) => {
  try {
    const buttons = [];
    if (button1_text) {
      buttons.push({
        type: "reply",
        reply: {
          id: "replyButton1",
          title: button1_text,
        },
      });
    }
    if (button2_text) {
      buttons.push({
        type: "reply",
        reply: {
          id: "replyButton2",
          title: button2_text,
        },
      });
    }
    if (button3_text) {
      buttons.push({
        type: "reply",
        reply: {
          id: "replyButton3",
          title: button3_text,
        },
      });
    }

    const postData = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: `${phone}`,
      type: "interactive",
      interactive: {
        type: "button",
        header: {
          type: "text",
          text: `${headerText}`,
        },
        body: {
          text: `${bodyText}`,
        },
        footer: {
          text: `${footerText}`,
        },
        action: {
          buttons,
        },
      },
    };
    await postRequest(postData, apiEndpoints.post.messages);
  } catch (error) {
    console.error("Error sending message:", error.message);
    throw error;
  }
};

export const sendTypingIndicatorAnimation = async (WHATSAPP_MESSAGE_ID) => {
  try {
    const postData = {
      messaging_product: "whatsapp",
      status: "read",
      message_id: `${WHATSAPP_MESSAGE_ID}`,
      typing_indicator: {
        type: "text",
      },
    };
    await postRequest(postData, apiEndpoints.post.messages);
  } catch (error) {
    console.error("Error sending message:", error.message);
    throw error;
  }
};

export const sendTextMessage = async (phoneNumber, textBody) => {
  try {
    const postData = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: `${phoneNumber}`,
      type: "text",
      text: {
        body: `${textBody}`,
      },
    };
    await postRequest(postData, apiEndpoints.post.messages);
  } catch (error) {
    console.error("Error sending message:", error.message);
    throw error;
  }
};

export const sendTemplateMessage = async (phoneNumber, textBody, templateName) => {
  try {
    const postData = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: `${phoneNumber}`,
      type: "template",
      template: {
        name: `${templateName}`,
        language: {
          code: "en",
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: `${textBody}`,
              },
            ],
          },
        ],
      },
    };
    await postRequest(postData, apiEndpoints.post.messages);
  } catch (error) {
    console.error("Error sending message:", error.message);
    throw error;
  }
};
