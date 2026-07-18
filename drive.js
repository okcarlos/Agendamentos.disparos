const { google } = require("googleapis");
const { Readable } = require("stream");
const authorize = require("./auth");

const PASTA_RAIZ = "1sUb4tBzzyPjz8y_lnHJWw8JSMgNuVNxs";

async function getDrive() {

    const auth = await authorize();

    return google.drive({
        version: "v3",
        auth
    });

}

async function criarPasta(nome) {

    const drive = await getDrive();

    const resposta = await drive.files.create({

        requestBody: {

            name: nome,

            mimeType: "application/vnd.google-apps.folder",

            parents: [PASTA_RAIZ]

        },

        fields: "id"

    });

    return resposta.data.id;

}

async function enviarArquivo(arquivo, nomeArquivo, pastaId) {

    const drive = await getDrive();

    const resposta = await drive.files.create({

        requestBody: {

            name: nomeArquivo,

            parents: [pastaId]

        },

        media: {

            mimeType: arquivo.mimetype,

            body: Readable.from(arquivo.buffer)

        },

        fields: "id"

    });

    await drive.permissions.create({

        fileId: resposta.data.id,

        requestBody: {

            role: "reader",

            type: "anyone"

        }

    });

    return `https://drive.google.com/file/d/${resposta.data.id}/view`;

}

async function publicarPasta(pastaId){

    const drive = await getDrive();

    await drive.permissions.create({

        fileId:pastaId,

        requestBody:{

            role:"reader",

            type:"anyone"

        }

    });

}

module.exports = {

    criarPasta,

    enviarArquivo,

    publicarPasta

};