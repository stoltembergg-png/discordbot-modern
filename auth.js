const fs = require("fs");
const path = require("path");

const ENV_KEYS = [
  "bot_token",
  "client_id",
  "youtube_api_key",
  "google_custom_search",
  "imgflip_username",
  "imgflip_password",
  "wolfram_api_key",
  "twitch_client_id",
  "twitch_client_secret",
  "spotify_client_id",
  "spotify_client_secret",
  "giphy_api_key",
  "finage_api_key",
];

function loadAuthDetails() {
  const authPath = path.join(__dirname, "auth.json");
  try {
    return JSON.parse(fs.readFileSync(authPath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(`Unable to read ${authPath}: ${error.message}`);
    }
    return Object.fromEntries(
      ENV_KEYS.map((key) => [key, process.env[key]]).filter((entry) => entry[1] !== undefined)
    );
  }
}

function validateAuthDetails(details) {
  if (!details || typeof details.bot_token !== "string" || details.bot_token.trim() === "") {
    return ["bot_token is required"];
  }
  return [];
}

const AuthDetails = loadAuthDetails();

exports.getAuthDetails = () => ({ ...AuthDetails });
exports.validateAuthDetails = validateAuthDetails;
