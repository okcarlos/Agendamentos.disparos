const { google } = require("googleapis");

async function authorize() {

    const credentials = JSON.parse(
        process.env.GOOGLE_SERVICE_ACCOUNT
    );

    const auth = new google.auth.GoogleAuth({

        credentials,

        scopes: [
            "https://www.googleapis.com/auth/drive"
        ]

    });

    return await auth.getClient();

}

module.exports = authorize;
