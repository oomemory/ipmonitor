// ipmonitor.js
// Iván Nieto Pérez
// Just a simple way to monitor public IP of host and be notified when it changes
const TelegramBot = require('node-telegram-bot-api');
const http        = require('http');
const fs          = require('fs');
const schedule    = require('node-schedule');


// configuration
// --------------------

// filename to keep track of last IP address seen
const ipTrackingFile = 'currentIp.txt';

// filename to keep track of chat id (persited, in case process ends and is restarted)
const chatIdTrackingFile = 'chatId.txt'

// token for Telegram bot (create a bot through botfather)
const token = 'YOUR TELEGRAM BOT TOKE GOES HERE';


// Telegram bot
// ---------------------
// create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

// matches "/get ip"
bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content of the message
  chatId = msg.chat.id;

  // write chat id to a file to persit value in case process is restarted
  fs.writeFileSync(chatIdTrackingFile, chatId);

  const command = match[1]; // the captured "whatever"

  // get IP address
  if (command == 'ip') {
    getCurrentIPAddress();
  }

});


// scheduler
// -----------------------
// run job at x:30 hours
var checkIPJob = schedule.scheduleJob('30 * * * *', function(){
  checkIfIPAddressDidChange();
});

checkIPJob.on('run', function() {
  console.log('Job was executed!');
});


// Helper functions
// -----------------------

// this uses API provided by https://www.ipify.org
// to get IP address and send it back to user through Telegram
function getCurrentIPAddress() {
  http.get({'host': 'api.ipify.org', 'port': 80, 'path': '/'}, function(resp) {
    resp.on('data', function(currentIP) {
      // send message with IP value
      const chatId = getChatId();
      bot.sendMessage(chatId, currentIP);
    });
  });
}

// this compares current IP address with last IP seen
// and send message if IP did change
function checkIfIPAddressDidChange() {
  http.get({'host': 'api.ipify.org', 'port': 80, 'path': '/'}, function(resp) {
    resp.on('data', function(currentIP) {

      // read old IP address stored in previous checks
      // what if file does not exist?
      const previousIP = fs.readFileSync(ipTrackingFile).toString();

      // comnpare old IP with new IP
      if ( currentIP != previousIP) {
        const chatId = getChatId();
        bot.sendMessage(chatId, 'Your public IP has changed. New IP is ' + currentIP);
      }

      // write ip value to the tracking file
      fs.writeFile(ipTrackingFile, currentIP, (err) => {
          // throws an error, you could also catch it here
          if (err) throw err;
      });

    });
  });
}


// read chat id var previously stored
function getChatId() {
    const chatId = fs.readFileSync(chatIdTrackingFile).toString();
    return chatId;
}
