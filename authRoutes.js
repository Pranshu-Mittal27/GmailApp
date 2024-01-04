// importing libraries required and modules from other files
const express = require('express');
const router = express.Router();
const cron = require('node-cron');
const {initiateExecution} = require("./gmail")
const {getAuthObject} = require("./auth")

// scopes required for making various google api calls, mainly mail scope and userinfo scope.
const scopes = ['https://mail.google.com/', "https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"];

// Initiates the Google Login flow
router.get('/initiateLogin', async (req, res) => {
    // getting OAuth2 client object build in auth.js file
    const oauth2Client = await getAuthObject()
    // building url to provide access to this app. User will allow this app to access the scopes mentioned
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes
      });
    
    // on hitting the initial route, redirect to access url, for user to provide access
    res.redirect(url);
});

// Callback URL for handling the Google Login response
router.get('/auth/google/callback', async (req, res) => {
    console.log("2nd Route Hit")
    const oauth2Client = await getAuthObject()
    // code will contains access token object required in the OAuth2 object
    const { code } = req.query;

    try {
        // adding token received through code to the OAuth2Client object to make api calls. 
        const {tokens} = await oauth2Client.getToken(code)
        oauth2Client.setCredentials(tokens);  
        
        // cron job, which will repeat after every 30 seconds. This will enable us to achieve our aim to running this function after certain interval regularly
        cron.schedule("*/30 * * * * *", async function() {
            // currentTime, from which the app will start watching for any new emails
            const currentTime = Math.trunc(Date.now()/1000) - 120
            // since we have to keep repeating time as random, this will help us getting that random time interval
            const delay = Math.floor(Math.random() * (90000 - 15000) + 15000);
            
            // settimeout to achieve random interval gap
            setTimeout(() => {
                // main function, which will do all functionalities, which is called by cronjob after a random interval
                initiateExecution(currentTime,oauth2Client);
            }, delay)
        })

        // initiateExecution(1704394200, oauth2Client)

        // response
        res.json("Process Has been Initiated")
    } catch (error) {
        console.error('Error:', error.response.data.error);
        res.redirect('/initiateLogin');
    }
});

// exporting router object, to be used in app.js file
module.exports = router;