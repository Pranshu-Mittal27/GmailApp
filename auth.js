// importing libraries required
const process = require('process');
const fs = require('fs').promises;
const path = require('path');
const { google } = require("googleapis");

// path of the credentials.json file which contains the Google Cloud OAuth Credentials 
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

// function to make the Oauth2Client Object. This object will be used to provide authentication for making google api calls
const getAuthObject = async() => {

    // reading contents of credentials.json file
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;

    // making OAuth2 object using the google cloud credentials
	const oauth2Client = new google.auth.OAuth2(
        key.client_id,
        key.client_secret,
        key.redirect_uris[0]
    );

	return oauth2Client;
};

// exporting function to use in different file
module.exports = {
	getAuthObject
};