const { WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');
const { ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');
const { DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

const { PredictionAPIClient } = require("@azure/cognitiveservices-customvision-prediction");
const { ApiKeyCredentials } = require("@azure/ms-rest-js");

const { Translator } = require('../translator');

const WATERFALL_DIALOG = 'WATERFALL_PROMPT';

const mysql2 = require('mysql2/promise');

var endDialog ='';
var identificacao = '';

class IdentificarUsuarioDialog extends ComponentDialog {

    constructor(conservsationState, userState) {
        super('identificarUsuarioDialog');

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.identificarUsuario.bind(this),
            //this.usuarioIdentificado.bind(this),
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
        this.translator = new Translator();
    }

    async run(turnContext, accessor, entities) {

        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);
        const dialogContext = await dialogSet.createContext(turnContext);

        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id, entities);
        }

    }

    async identificarUsuario(step) {
        endDialog = false;

        const credentials = new ApiKeyCredentials({ inHeader: { "Prediction-key": process.env.CustonVisionKey } });
        const client = new PredictionAPIClient(credentials, process.env.CustonVisionEndpoint);

        var ret = await client.classifyImageUrl(
                            process.env.CustonVisionProjectId, 
                            process.env.CustonVisionIteration,
                            { url: step.context.activity['attachments'][0].contentUrl });
        
        
        //console.log(ret);
        
        identificacao = '';
        
        if (ret.predictions[0].tagName) {
                      
            const pool = mysql2.createPool({
                host: process.env.DB_host,
                user: process.env.DB_user,
                password: process.env.DB_password,
                port: process.env.DB_port,
                database: process.env.DB_database,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });
        
            var sql = "";
                sql += " select nome, id, tipo ";
                sql += " from usuarios ";
                sql += " where tag = '" + ret.predictions[0].tagName + "'; ";
        
            const res1 = await pool.query(sql, []);
            if (res1[0].length >= 1) {
                identificacao = res1[0][0].nome;
            }

        }
        
        endDialog = true;
        return await step.endDialog();
    }

    async getIdentificacao() {
        return identificacao;
    }

    async isDialogComplete() {
        return endDialog;
    }

}

module.exports.IdentificarUsuarioDialog = IdentificarUsuarioDialog;