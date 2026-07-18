const express = require("express");
const multer = require("multer");
const cors = require("cors");

const {
    criarPasta,
    enviarArquivo
} = require("./drive");

const app = express();

app.use(cors());

const upload = multer({
    storage: multer.memoryStorage()
});

app.post(
    "/upload",
    upload.fields([
        { name: "arquivo", maxCount: 1 },
        { name: "imagem", maxCount: 1 },
        { name: "comprovante", maxCount: 1 }
    ]),
    async (req, res) => {

        try {

            const nomeDisparo = req.body.nomeDisparo
                .replace(/[^\w\s]/g, "")
                .replace(/\s+/g, "_");

            const nomePasta = `${nomeDisparo}_${Date.now()}`;

            const pastaId = await criarPasta(nomePasta);

            const links = {};

            if (req.files.arquivo) {

                const arquivo = req.files.arquivo[0];

                links.arquivo = await enviarArquivo(
                    arquivo,
                    "Documento." + arquivo.originalname.split(".").pop(),
                    pastaId
                );

            }

            if (req.files.imagem) {

                const imagem = req.files.imagem[0];

                links.imagem = await enviarArquivo(
                    imagem,
                    "Imagem." + imagem.originalname.split(".").pop(),
                    pastaId
                );

            }

            if (req.files.comprovante) {

                const comprovante = req.files.comprovante[0];

                links.comprovante = await enviarArquivo(
                    comprovante,
                    "Comprovante." + comprovante.originalname.split(".").pop(),
                    pastaId
                );

            }

            links.pasta = `https://drive.google.com/drive/folders/${pastaId}`;

            res.json({
                sucesso: true,
                links
            });

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                sucesso: false,
                erro: erro.message
            });

        }

    }
);

app.listen(process.env.PORT || 3000);

