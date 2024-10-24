const axios = require("axios");

class Middleware {
  bkash_auth = async (req, res, next) => {
    // Token clear for a fresh request
    global.id_token = null;

    try {
      // Make the API request to bKash for a token
      const { data } = await axios.post(
        process.env.bkash_grant_token_url,
        {
          app_key: process.env.bkash_api_key,
          app_secret: process.env.bkash_secret_key,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            username: process.env.bkash_username,
            password: process.env.bkash_password,
          },
        }
      );

      // Log the entire response to see what you receive
      console.log("bKash API Response:", data);

      // Check if token is received and set it
      if (data.id_token) {
        global.id_token = data.id_token; // Store token globally
        console.log("Token Received:", global.id_token);
        next(); // Proceed to next middleware
      } else {
        console.error("Token not found in response");
        return res.status(401).json({ error: "Token not found in response" });
      }
    } catch (error) {
      // Catch any error from the request and log it
      console.error(
        "Error fetching token:",
        error.response ? error.response.data : error.message
      );
      return res
        .status(401)
        .json({ error: "Failed to authenticate with bKash" });
    }
  };
}

module.exports = new Middleware();
