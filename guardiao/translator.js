const storage = require('node-persist');
const axios = require('axios').default;

class Translator {

    constructor() {
        storage.init();
        this.idioma = 'pt-br';
    }

    async t(texto) {

        this.idioma = await storage.getItem('idioma');        
        if ((this.idioma===undefined) || (this.idioma==='')) {
            this.idioma = 'pt-br';
        }

        if (this.idioma !== 'pt-br') {

            const res = await axios({
                baseURL: process.env.TRANSLATOR_TEXT_ENDPOINT,
                url: '/translate',
                method: 'post',
                responseType: 'json',
                headers: {
                    'Ocp-Apim-Subscription-Key': process.env.TRANSLATOR_TEXT_SUBSCRIPTION_KEY,
                    'Ocp-Apim-Subscription-Region': process.env.TRANSLATOR_TEXT_REGION,
                    'Content-type': 'application/json',
                    'X-ClientTraceId': process.env.TRANSLATOR_TEXT_ID
                },
                params: {
                    'api-version': '3.0',
                    'from': 'pt-br',
                    'to': [this.idioma]
                },
                data: [{
                    'text': texto
                }]
            });
            texto = res.data[0]['translations'][0].text;            
        }

        return texto;
    }

}
module.exports.Translator = Translator;