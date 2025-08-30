import express from "express";
import totRoute from "./src/routes/mainRoute.mjs"

const PORT = process.env.PORT || 8080;

const app = express();

app.use(
  express.json({
    // store the raw request body to use it for signature verification
    verify: (req, res, buf, encoding) => {
      req.rawBody = buf?.toString(encoding || "utf8");
    },
  }),
);

app.use("/v1/tapontravel/", totRoute);
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
