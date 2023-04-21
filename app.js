const { google } = require('googleapis');
const express = require('express')
const OAuth2Data = require('./google_key.json')
const cloudData = require('./my-first-app.json')
const app = express()
const port = 8080;

const {Client} = require('@google-cloud/sql');

const client = new Client({
  projectId: cloudData.project_id,
  credentials: {
    client_email: cloudData.client_email,
    private_key: cloudData.private_key,
  },
});
const instanceConnectionName ='my-first-app-382113:us-central1:my-first-app-instance';
const databaseName = 'my-first-app-instance';

async function connect() {
  await client.connect({
    connectionName: instanceConnectionName,
    database: databaseName,
  });

  console.log(`Connected to database ${databaseName}`);
}

connect();

const query = 'SELECT * FROM guestbook;';
async function executeQuery() {
    const [results] = await client.query(query);

    console.log('Query results:', results);
}

executeQuery();

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
            } else {
                console.log(response.data);
                res.header("Content-Type", 'application/json');
                res.write(JSON.stringify(response.data));
            }

            res.end();
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
