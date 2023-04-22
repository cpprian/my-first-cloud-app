const express = require('express')
const OAuth2Data = require('./google_key.json')
const cloudData = require('./my-first-app-382113-965b7d08d5ee.json')

const app = express()
app.set('view engine', 'ejs');

const port = 8080;

const {google} = require('googleapis');
const sqladmin = google.sqladmin('v1beta4');

const auth = new google.auth.GoogleAuth({
  keyFile: 'my-first-app-382113-965b7d08d5ee.json',
  scopes: ['https://www.googleapis.com/auth/sqlservice.admin'],
});

async function getInstances(request) {
  try {
    console.log('Getting instances...');
    const response = await sqladmin.instances.get(request);
    console.log('Result ', response.data);
    return response;
  } catch (err) {
    console.log('Error ', err);
    return null;
  }
}

async function main() {
    const authClient = await auth.getClient();

    const project = cloudData.project_id;
    const instance = 'my-first-app-instance';
    const request = {
      project,
      instance,
      auth: authClient,
    };

    const response = await getInstances(request);

    const ipAddresses = response.data.ipAddresses;
    const ipAddress = ipAddresses[0].ipAddress;
    const username = 'postgres';
    const password = '1234';
    const database = 'guestbook';
    
    const knex = require('knex')({
      client: 'pg',
      connection: {
        host: ipAddress,
        user: username,
        password: password,
        database: database,
      },
    });
    
    const result = knex.raw('SELECT * FROM uzytkownicy');
    console.log(result.rows);
}

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret; 
const REDIRECT_URL = OAuth2Data.web.redirect_uris[0];

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)
var authed = false;

app.get('/', (req, res) => {
    if (!authed) {
        const url = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: 'https://www.googleapis.com/auth/userinfo.profile'
        });
        console.log(url)
        res.redirect(url);
    } else {
        var oauth2 = google.oauth2({ auth: oAuth2Client, version: 'v2' });
        oauth2.userinfo.get(function (err, response) {
            if (err) {
                console.log('Error occured')
                console.log(err);
                return;
            } else {
                console.log(response.data);
                const data = { name: response.data.name };
                res.render('data', { data });
            }
            main();
        });
    }
})

app.get('/auth/google/callback', function (req, res) {
    const code = req.query.code
    if (code) {
        // Get an access token based on our OAuth code
        oAuth2Client.getToken(code, function (err, tokens) {
            if (err) {
                console.log('Error authenticating')
                console.log(err);
            } else {
                console.log('Successfully authenticated');
                oAuth2Client.setCredentials(tokens);
                authed = true;
                res.redirect('/')
            }
        });
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});
