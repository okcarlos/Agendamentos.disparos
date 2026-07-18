const fs = require("fs");
const path = require("path");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");

const SCOPES = [
    "https://www.googleapis.com/auth/drive"
];

const TOKEN_PATH = path.join(__dirname, "token.json");
const CREDENTIALS_PATH = path.join(__dirname, "client_secret.json");

async function loadSavedCredentials() {

    try {

        const content = fs.readFileSync(
            CREDENTIALS_PATH
        );

        const credentials = JSON.parse(content);


        const {client_secret, client_id, redirect_uris} =
        credentials.installed || credentials.web;


        const auth = new google.auth.OAuth2(
            client_id,
            client_secret,
            redirect_uris[0]
        );


        const token = JSON.parse(
            fs.readFileSync(TOKEN_PATH)
        );


        auth.setCredentials(token);


        return auth;


    }

    catch(error) {

        console.log("Sem credenciais salvas");

        return null;

    }

}

async function saveCredentials(client) {

    fs.writeFileSync(
        TOKEN_PATH,
        JSON.stringify(client.credentials)
    );

}

async function authorize() {

    let auth = await loadSavedCredentials();

    if (auth) return auth;

    auth = await authenticate({

        scopes: SCOPES,

        keyfilePath: CREDENTIALS_PATH

    });

    await saveCredentials(auth);

    return auth;

}

module.exports = authorize;