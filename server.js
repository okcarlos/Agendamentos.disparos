const express = require("express");
const multer = require("multer");
const cors = require("cors");

const {
    criarPasta,
    enviarArquivo
} = require("./drive");

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({
    storage: multer.memoryStorage()
});

/*
|--------------------------------------------------------------------------
| CONFIGURAÇÕES DO TELEGRAM
|--------------------------------------------------------------------------
*/

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = "-1004393101406";

/*
|--------------------------------------------------------------------------
| UPLOAD DOS ARQUIVOS
|--------------------------------------------------------------------------
*/

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

            /*
            |--------------------------------------------------------------------------
            | ARQUIVO
            |--------------------------------------------------------------------------
            */

            if (req.files.arquivo) {

                const arquivo = req.files.arquivo[0];

                links.arquivo = await enviarArquivo(
                    arquivo,
                    "Documento." + arquivo.originalname.split(".").pop(),
                    pastaId
                );

            }

            /*
            |--------------------------------------------------------------------------
            | IMAGEM
            |--------------------------------------------------------------------------
            */

            if (req.files.imagem) {

                const imagem = req.files.imagem[0];

                links.imagem = await enviarArquivo(
                    imagem,
                    "Imagem." + imagem.originalname.split(".").pop(),
                    pastaId
                );

            }

            /*
            |--------------------------------------------------------------------------
            | COMPROVANTE
            |--------------------------------------------------------------------------
            */

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

/*
|--------------------------------------------------------------------------
| NOTIFICAÇÃO DO TELEGRAM
|--------------------------------------------------------------------------
*/

app.post("/notificar-agendamento", async (req, res) => {

    try {

        if (!TELEGRAM_BOT_TOKEN) {

            console.error("TELEGRAM_BOT_TOKEN não configurado.");

            return res.status(500).json({
                sucesso: false,
                erro: "Token do Telegram não configurado no servidor."
            });

        }

        const {
            empresa,
            quantidade,
            horario,
            parceiro,
            texto,
            numeros
        } = req.body;

        if (!empresa || !quantidade || !horario || !parceiro) {

            return res.status(400).json({
                sucesso: false,
                erro: "Dados do agendamento incompletos."
            });

        }

        /*
        |--------------------------------------------------------------------------
        | FORMATA A QUANTIDADE
        |--------------------------------------------------------------------------
        */

        const quantidadeFormatada = Number(quantidade).toLocaleString("pt-BR");

        /*
        |--------------------------------------------------------------------------
        | FORMATA O HORÁRIO
        |--------------------------------------------------------------------------
        */

        let horarioFormatado = horario;

        try {

            const data = new Date(horario);

            if (!isNaN(data.getTime())) {

                horarioFormatado = data.toLocaleString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                });

            }

        } catch (erro) {

            console.log("Não foi possível formatar o horário.");

        }

        /*
        |--------------------------------------------------------------------------
        | MONTA A MENSAGEM
        |--------------------------------------------------------------------------
        */

        let mensagem = `🔔 <b>NOVO AGENDAMENTO</b>\n\n`;

        mensagem += `🏢 <b>Empresa:</b> ${empresa}\n`;
        mensagem += `📦 <b>Quantidade:</b> ${quantidadeFormatada}\n`;
        mensagem += `📅 <b>Data/Horário:</b> ${horarioFormatado}\n`;
        mensagem += `👤 <b>Parceiro:</b> ${parceiro}\n`;

        if (numeros !== undefined) {

            let quantidadeNumeros = 0;

            if (Array.isArray(numeros)) {
                quantidadeNumeros = numeros.length;
            } else if (typeof numeros === "number") {
                quantidadeNumeros = numeros;
            }

            mensagem += `📱 <b>Números:</b> ${quantidadeNumeros}\n`;
        }

        if (texto) {

            mensagem += `\n📝 <b>Mensagem:</b>\n`;
            mensagem += `${texto}\n`;

        }

        mensagem += `\n⏳ <b>Status:</b> Pendente`;

        /*
        |--------------------------------------------------------------------------
        | ENVIA PARA O TELEGRAM
        |--------------------------------------------------------------------------
        */

        const resposta = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: mensagem,
                    parse_mode: "HTML"
                })
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.ok) {

            console.error("Erro Telegram:", resultado);

            throw new Error(
                resultado.description ||
                "Erro ao enviar mensagem para o Telegram."
            );

        }

        console.log("Notificação enviada para o Telegram.");

        res.json({
            sucesso: true
        });

    } catch (erro) {

        console.error("Erro na notificação:", erro);

        res.status(500).json({
            sucesso: false,
            erro: erro.message
        });

    }

});

/*
|--------------------------------------------------------------------------
| SERVIDOR
|--------------------------------------------------------------------------
*/

app.listen(process.env.PORT || 3000, () => {

    console.log(
        `Servidor iniciado na porta ${process.env.PORT || 3000}`
    );

});
