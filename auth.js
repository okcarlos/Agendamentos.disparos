const { google } = require("googleapis");

async function authorize() {

    const credentials = JSON.parse(
        process.env.GOOGLE_CREDENTIALS
    );

    const token = JSON.parse(
        process.env.GOOGLE_TOKEN
    );

    const { client_secret, client_id, redirect_uris } =
        credentials.installed || credentials.web;

    const auth = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
    );

    auth.setCredentials(token);

    return auth;
}

module.exports = authorize;
