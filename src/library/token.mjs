import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWTSECRET;  

export const generateToken = (phoneNumber, messageId) => {
  const payload = {
    phoneNumber,
    messageId,
    timestamp: Date.now()
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });

  return token;
};
