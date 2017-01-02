'use strict';

// Messenger API integration example
// We assume you have:
// * a Wit.ai bot setup (https://wit.ai/docs/quickstart)
// * a Messenger Platform setup (https://developers.facebook.com/docs/messenger-platform/quickstart)
// You need to `npm install` the following dependencies: body-parser, express, request.
//
// 1. npm install body-parser express request
// 2. Download and install ngrok from https://ngrok.com/download
// 3. ./ngrok http 8445
// 4. WIT_TOKEN=your_access_token FB_APP_SECRET=your_app_secret FB_PAGE_TOKEN=your_page_token node examples/messenger.js
// 5. Subscribe your page to the Webhooks using verify_token and `https://<your_ngrok_io>/webhook` as callback URL.
// 6. Talk to your bot on Messenger!

const bodyParser = require('body-parser');
const crypto = require('crypto');
const express = require('express');
const fetch = require('node-fetch');
const request = require('request');
var messanger = express();
var imdb = require('imdb-api');
var mongodb = require('mongodb');
var cheerio=require('cheerio');
const util = require('util');
var MongoClient = mongodb.MongoClient ;
//var url = 'mongodb://root:welcome123@jello.modulusmongo.net:27017/uB5odesu';
var url = 'mongodb://Pranav-Naik:99problems@jello.modulusmongo.net:27017/q2ihadIj';
let Wit = null;
let log = null;
var j,k;
var collection;
var arr =[];
var recommend_movies=[];
var movie_genere_matchmovies= [];
var geners_userdefinedmovie;
var usergenere;
var first="";
var second="";
var third="";
var fourth="";
var fifth="";
var sixth="";
var seventh="";
var eight="";
var movieData = {
		recipient: {
			id:""
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "generic",
					elements: []
				}
			}
		}
};
try {
	// if running from repo
	Wit = require('../').Wit;
	log = require('../').log;
} catch (e) {
	Wit = require('node-wit').Wit;
	log = require('node-wit').log;
}

// Webserver parameter
const PORT = process.env.PORT || 8445;

// Wit.ai parameters
//const WIT_TOKEN = "5DBZW3TJYDKUN7ZLPGX5WLB44EAAXABE";//test//5DBZW3TJYDKUN7ZLPGX5WLB44EAAXABE
//  const WIT_TOKEN ="N7BD3IG4RVPRMPXMY7YFS5C67OJMOOE5"; //moviebot
const WIT_TOKEN = "MRHSX6EFBJVFPI25RZHNVZ3GCK2X4XG7"; // Teteg
// Messenger API parameters
const FB_PAGE_TOKEN = 'EAAUSZAbCXgZB0BAFWj6hVziSf09VR08SHtXtYCXVdDkgLbRY7WSD3fYu7ql3Juk6usSdMp9Lz30ZAaL3YbMuwMHYTWPaUhBfb2DikgyPc1Mbxj4MMstAQAedLZCTj2urAbnlil1EJp8kkTrioaj7ib3AD2LjfjKDZASn1Qd3iZBwZDZD';
if (!FB_PAGE_TOKEN) { throw new Error('missing FB_PAGE_TOKEN') }
const FB_APP_SECRET ='0f5ddadf0577ffb7e73ddfcf7e8afc4f';
if (!FB_APP_SECRET) { throw new Error('missing FB_APP_SECRET') }
const FB_VERIFY_TOKEN = 'access_token';
MongoClient.connect(url, function (err, db) {
	if (err) {
		console.log('Unable to connect to the mongoDB server. Error:', err);
	} else {
		//HURRAY!! We are connected. :)
		console.log('Connection established to', url);

		// Get the documents collection
		collection = db.collection('moviess');
	}
});
const fbMessage = (id, text) => {
	console.log('am in ffbMessage');
	const body = JSON.stringify({
		recipient: { id },
		message: { text },
	});
	const qs = 'access_token=' + encodeURIComponent(FB_PAGE_TOKEN);
	return fetch('https://graph.facebook.com/me/messages?' + qs, {
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body,
	})
	.then(rsp => rsp.json())
	.then(json => {
		if (json.error && json.error.message) {
			throw new Error(json.error.message);
			console.log('the json is',json.error.message);
		}
		console.log('the json is',json);
		return json;
	});
};
/*fbReq(opts, (err, resp, data) => {
		console.log('am in fbReq');
	if (cb) {
					cb(err || data.error && data.error.message, data);
			}
		});
	};*/
// ----------------------------------------------------------------------------
// Wit.ai bot specific code

// This will contain all user sessions.
// Each session has an entry:
// sessionId -> {fbid: facebookUserId, context: sessionState}
const sessions = {};

const findOrCreateSession = (fbid) => {
	let sessionId;
	// Let's see if we already have a session for the user fbid
	Object.keys(sessions).forEach(k => {
		if (sessions[k].fbid === fbid) {
			// Yep, got it!
			sessionId = k;
		}
	});
	if (!sessionId) {
		// No session found for user fbid, let's create a new one
		sessionId = new Date().toISOString();
		sessions[sessionId] = {fbid: fbid, context: {}};
	}
	return sessionId;
};

// Our bot actions
const actions = {

		send({sessionId}, {text}) {
			// Our bot has something to say!
			// Let's retrieve the Facebook user whose session belongs to
			console.log('the sessions are',sessions);
			console.log('the sessionId is',sessions[sessionId]);
			console.log('the sessionId is',{text});
			const recipientId = sessions[sessionId].fbid;
			//id = recipientId;
			console.log('recipient id is ',recipientId);
			//const {sessionId, context, entities} = request;
			if (recipientId) {
				// Yay, we found our recipient!
				// Let's forward our bot response to her.
				// We return a promise to let our bot know when we're done sending
				console.log('I called it from actions');
				console.log('the received text in action is',text);
				return fbMessage(recipientId, text)
				.then(() => null)
				.catch((err) => {
					console.error(
							'Oops! An error occurred while forwarding the response to',
							recipientId,
							':',
							err.stack || err
					);
				});
			} else {
				console.error('Oops! Couldn\'t find user for session:', sessionId);
				// Giving the wheel back to our bot
				return Promise.resolve()
			}
		},
		// You should implement your custom actions here
		// See https://wit.ai/docs/quickstart
		getmovielist({sessionId,context, entities}) {
			var moviename, genre,text1,time;
			const recipientId = sessions[sessionId].fbid;
			console.log('am in getmovielist',context);
			console.log('the entit value is',entities);
			console.log('recipient id is ',recipientId);
			//console.log('the entit length is',entities.genere.length);
			//console.log('the movie name is',entities.movie_name[0].value);
			//console.log('the movie name is',entities.genre[0].value);
			//console.log('the movie name is',entities.number[0].value);//genere
			if(typeof(entities) != "undefined")
			{ 
				if(typeof(entities.genere) != "undefined"){
					text1 = entities.genere[0].value;
					for(var i =1;i<entities.genere.length;i++){ 
						console.log(entities.genere[i].value);
						text1 += ","+entities.genere[i].value;
						console.log('the text1 is', text1);
					}
				}
				if(typeof(entities.search_query) != "undefined"){
					moviename = entities.search_query[0].value;
					moviename = moviename.toLocaleLowerCase();
					console.log('the moviname is',moviename);
					if(moviename==="hi"){
						moviename = undefined;
					}
					if(moviename.includes('movie')) {
						moviename =moviename.replace(/movies/i, "");
						moviename =moviename.replace(/movie/i, "");
						console.log('the movie is', moviename);
					} if(moviename.includes('film')){
						moviename =moviename.replace(/films/i, "");
						moviename =moviename.replace(/film/i, "");
						console.log('the movie is', moviename);
					}
					if(moviename.includes('like')){
						moviename =moviename.replace(/like/i, "");
						console.log('the movie is', moviename);
					}
					if(moviename.includes('similar to')){
						moviename =moviename.replace(/similar to/i, "");
						console.log('the movie is', moviename);
					}
				}
				if(typeof(entities.time) != "undefined")
				{
					time=entities.time[0].value;
					console.log("time span is :",time);
				}

			}
			//console.log('the final text is',text1)
			//console.log(typeof(entities.search_query));
			console.log('recipient id is getmovielist',recipientId);
			// console.log(sessions[sessionId].fbid);
			return new Promise(function(resolve, reject) {
				if(typeof(text1) != "undefined"){
					console.log("text1.length",text1.length)	;
					if(text1.endsWith(","))
						genre = text1.substring(0, text1.length-2);
					else
						genre = text1;
					console.log('the final text after substring is',genre);
				}
				usergenere = genre;
				console.log('the final text is',genre);
				if (genre || moviename ||time) {
					//context.movie_name = "";
					//sleep(20000);
					if (genre&&time){
						if(typeof(genre)!= "undefined" && typeof(time)!="undefined")
						{
							movie_time_genre(recipientId,time,genre);
						}
					}
					else if(genre){
						if(typeof(genre)!='undefined'){
							movieInfo(recipientId,genre);
						}
					}
					else if(moviename){
						if(typeof(moviename)!='undefined'){
							console.log('movieInfo_imdbreq called');
							//context.movie_name = moviename;
							moviename = moviename.trim();
							movieInfo_imdbreq(recipientId,moviename);
						}
					}else if(time)
					{
						console.log('movie_time called');
						if(typeof(time)!="undefined")
							movie_time(recipientId,time);
					}
				}else{
					var messageText = "Sorry try again?\nYou can:\n1. Give me a movie name and I will find similar movies. Example: Movies like Inception.\n2. Tell me a genre and I will give you recs. Example: Latest comedies";
					//context.missing_moviename = messageText;
					sendTextMessage(recipientId, messageText);
				}
				return resolve(context);
			});
		},
};
// Setting up our bot
const wit = new Wit({
	accessToken: WIT_TOKEN,
	actions,
	logger: new log.Logger(log.INFO)
});

// Starting our webserver and putting it all together
const app = express();
app.use(({method, url}, rsp, next) => {
	rsp.on('finish', () => {
		console.log(`${rsp.statusCode} ${method} ${url}`);
	});
	next();
});
app.use(bodyParser.json({ verify: verifyRequestSignature }));
app.get('/', function (req, res) {
	//res.send('Hello world This is logituit Movie recommender bot');
	console.error('Hello world This is logituit Movie recommender bot', res);
	var messageData = {
			recipient: {
				id: recipientId
			},
			message: {
				text:"Hello world This is logituit Movie recommender bot"
			}
	}
	callSendAPI(messageData);
	return;
});
// Webhook setup
app.get('/webhook', (req, res) => {
	if (req.query['hub.mode'] === 'subscribe' &&
			req.query['hub.verify_token'] === FB_VERIFY_TOKEN) {
		res.send(req.query['hub.challenge']);
	} else {
		res.sendStatus(400);
	}
});

// Message handler
app.post('/webhook', (req, res) => {
	// Parse the Messenger payload
	// See the Webhook reference
	// https://developers.facebook.com/docs/messenger-platform/webhook-reference
	const data = req.body;
	console.log('data.object',data.object);
	if (data.object === 'page') {
		data.entry.forEach(entry => {
			entry.messaging.forEach(event => {
				if (event.message && !event.message.is_echo) {
					// Yay! We got a new message!
					// We retrieve the Facebook user ID of the sender
					const sender = event.sender.id;
					console.log('the sender id is',sender);
					// We retrieve the user's current session, or create one if it doesn't exist
					// This is needed for our bot to figure out the conversation history
					const sessionId = findOrCreateSession(sender);
					console.log('The session id is',sessionId);
					console.log('the echo is',event.message.is_echo);
					// We retrieve the message content
					const {text, attachments} = event.message;  
					if (attachments) {
						// We received an attachment
						// Let's reply with an automatic message
						fbMessage(sender, 'Sorry I can only process text messages for now.')
						.catch(console.error);
					} else if (text) {
						console.log('the text message is',text);
						console.log('the final movie is',movie_genere_matchmovies);
						var message = event.message;
						var quickReply = message.quick_reply;
						console.log('the quick reply is',quickReply);
						if(quickReply){
							if(text==1)
							{    
								if(first!=""){
									console.log("tpped 1",first);
									GenericmovieInfo(sender,first);
								}
								else{
									console.log("tpped 1",movie_genere_matchmovies[0]);
									GenericmovieInfo(sender,movie_genere_matchmovies[0]);
									console.log(movie_genere_matchmovies);
								}
							}
							else if (text==2) {
								console.log("tpped 2"); 
								if(second!="")
									GenericmovieInfo(sender,second);
								else{
									console.log("tpped 2",movie_genere_matchmovies[1]);
									GenericmovieInfo(sender,movie_genere_matchmovies[1]);
								}
							}
							else if (text==3) {
								console.log("tpped 3"); 
								if(third!="")
									GenericmovieInfo(sender,third);
								else{
									console.log("tpped 3",movie_genere_matchmovies[2]);
									GenericmovieInfo(sender,movie_genere_matchmovies[2]);
								}
							}
							else if (text==4) {
								console.log("tpped 4"); 
								if(fourth!="")
									GenericmovieInfo(sender,fourth);
								else{
									console.log("tpped 4",movie_genere_matchmovies[3]);
									GenericmovieInfo(sender,movie_genere_matchmovies[3]);
								}
							}
							else if (text==="more") {
								console.log("tpped more");
								if(typeof(usergenere)!='undefined') 
									moreMovie(sender,usergenere);
								else
									sendQuickReply(sender," That you may also like",movie_genere_matchmovies,"more");
							}
							else if (text==="Back") {
								console.log("tpped Back"); 
								if(typeof(usergenere)!='undefined') 
									Backmovies(sender,usergenere);
								else
									sendQuickReply(sender," That you may also like",movie_genere_matchmovies,"Back");
							}
							else if (text==5) {
								console.log("tpped 5"); 
								if(fifth!="")
									GenericmovieInfo(sender,fifth);
								else{
									GenericmovieInfo(sender,movie_genere_matchmovies[4]);
								}
							}
							else if (text==6) {
								console.log("tpped 6");
								if(sixth!="")
									GenericmovieInfo(sender,sixth);
								else{
									GenericmovieInfo(sender,movie_genere_matchmovies[5]);
								}

							}
							else if (text==7) {
								console.log("tpped 7");
								if(seventh!="")	
									GenericmovieInfo(sender,seventh);
								else{
									GenericmovieInfo(sender,movie_genere_matchmovies[6]);
								}
							}
							else if (text==8) {
								console.log("tpped 8")
								if(eight!="")
									GenericmovieInfo(sender,eight);
								else{
									GenericmovieInfo(sender,movie_genere_matchmovies[7]);
								}
							}
							else if (text==9) {
								console.log("tpped 10")
								if(eight!="")
									GenericmovieInfo(sender,eight);
								else{
									GenericmovieInfo(sender,movie_genere_matchmovies[8]);
								}
							}
							else if (text==10) {
								console.log("tpped 10")
								if(eight!="")
									GenericmovieInfo(sender,eight);
								else{
									GenericmovieInfo(sender,movie_genere_matchmovies[9]);
								}
							}
							else if (text==11) {
								console.log("tpped 11")
								if(eight!="")
									GenericmovieInfo(sender,eight);
								else{
									GenericmovieInfo(sender,movie_genere_matchmovies[10]);
								}
							}
						}else{
							wit.runActions(
									sessionId, // the user's current session
									text, // the user's message
									sessions[sessionId].context // the user's current session state
							).then((context) => {
								// Our bot did everything it has to do.
								// Now it's waiting for further messages to proceed.
								console.log('Waiting for next user messages');
								console.log('the context is ',context);
								// Based on the session state, you might want to reset the session.
								// This depends heavily on the business logic of your bot.
								// Example:
								/*if (context['ok']) {
	                delete sessions[sessionId];
	               }*/

								// Updating the user's current session state
								sessions[sessionId].context = context;
								console.log('the context is ',context);
							})
							.catch((err) => {
								console.error('Oops! Got an error from Wit: ', err.stack || err);
							})
						}
					}
				} else {
					console.log('received event', JSON.stringify(event));
					/* data.entry.forEach(function(pageEntry) {
								      	var pageID = pageEntry.id;
								      	var timeOfEvent = pageEntry.time;

								      // Iterate over each messaging event
								      pageEntry.messaging.forEach(function(messagingEvent) {
								        if (messagingEvent.optin) {
								          receivedAuthentication(messagingEvent);
								        } else if (messagingEvent.message) {
								          receivedMessage(messagingEvent);
								        } else if (messagingEvent.delivery) {
								          receivedDeliveryConfirmation(messagingEvent);
								        } else if (messagingEvent.postback) {
								          receivedPostback(messagingEvent);
								        } else if (messagingEvent.read) {
								          receivedMessageRead(messagingEvent);
								        } else if (messagingEvent.account_linking) {
								          receivedAccountLink(messagingEvent);
								        } else {
								          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
								        }
								      });
								    });*/
				}
			});//entry.messaging for each
		});//data.entry for each
	}
	res.sendStatus(200);
});

/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function receivedMessage(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfMessage = event.timestamp;
	var message = event.message;

	console.log("Received message for user %d and page %d at %d with message:", 
			senderID, recipientID, timeOfMessage);
	console.log(JSON.stringify(message));

	var isEcho = message.is_echo;
	var messageId = message.mid;
	var appId = message.app_id;
	var metadata = message.metadata;

	// You may get a text or attachment but not both
	var messageText = message.text;
	var messageAttachments = message.attachments;
	var quickReply = message.quick_reply;
	console.log('the received message is ',isEcho,quickReply);
	if (isEcho) {
		// Just logging message echoes to console
		console.log("Received echo for message %s and app %d with metadata %s", 
				messageId, appId, metadata);
		return;
	} else if (quickReply) {
		var quickReplyPayload = quickReply.payload;
		console.log("Quick reply for message %s with payload %s",
				messageId, quickReplyPayload);
		// console.log('movies list is ',myFile.movielist());
		switch (messageText) {
		case '1':
			GenericmovieInfo(senderID, arr[0]);
			break;
		case '2':
			GenericmovieInfo(senderID, arr[1]);
			break;
		case '3':
			GenericmovieInfo(senderID, arr[2]);
			break;
		case '4':
			GenericmovieInfo(senderID, arr[3]);
			break;
		case '5':
			GenericmovieInfo(senderID, arr[4]);
			break;
		case '6':
			GenericmovieInfo(senderID, arr[5]);
			break;
		case '7':
			GenericmovieInfo(senderID, arr[6]);
			break;
		case '8':
			GenericmovieInfo(senderID, arr[7]);
			break;
		case 'show More':
			//j =j+4;
			console.log('tapped show more');
			//sendQuickReply(senderID,messageText,arr,4);
			sendMore(senderID,messageText,arr);
			break;
		}
		return;
	}  
	if (messageText) {
		/*if(messageText.includes("drama")){ 
	      arr=myFile.movielist();
	      console.log('arr of Drama is',arr);
	    } else if(messageText.includes("comedy")){
	      arr=myFile.movielist_comedy();
	      console.log('arr of Comedy is',arr);
	    }
	    else if(messageText.includes("action")){
	      arr=myFile.movielist_action();
	      console.log('arr of action is',arr);
	    }*/
		// If we receive a text message, check to see if it matches any special
		// keywords and send back the corresponding example. Otherwise, just echo
		// the text we received.
		switch (messageText) {
		case 'image':
			sendImageMessage(senderID);
			break;

		case 'gif':
			sendGifMessage(senderID);
			break;

		case 'audio':
			sendAudioMessage(senderID);
			break;

		case 'video':
			sendVideoMessage(senderID);
			break;

		case 'file':
			sendFileMessage(senderID);
			break;

		case 'button':
			sendButtonMessage(senderID);
			break;

		case 'generic':
			sendGenericMessage(senderID);
			break;

		case 'receipt':
			sendReceiptMessage(senderID);
			break;

		case 'quick reply':
			sendQuickReply(senderID,messageText,arr);
			break; 
			/* case 'comedy':
	        sendQuickReply(senderID,messageText,arr);
	        break;        
	      case 'drama':
	        sendQuickReply(senderID,messageText,arr);
	        break; 
	      case 'action':
	        sendQuickReply(senderID,messageText,arr);
	        break;  */
		case 'read receipt':
			sendReadReceipt(senderID);
			break;        

		case 'typing on':
			sendTypingOn(senderID);
			break;        

		case 'typing off':
			sendTypingOff(senderID);
			break;        

		case 'account linking':
			sendAccountLinking(senderID);
			break;
		default:
			//sendTextMessage(senderID, messageText);
			//GenericmovieInfo(senderID, messageText);
			connect_to_db(messageText,senderID);
		console.log('the user messageText is',messageText);
		/*setTimeout(function() { arr =  myFile.movielist_action();  j =0;
	        sendQuickReply(senderID,messageText,arr,0);
	        console.log('arr of movies is',arr);}, 5000);*/
		//console.log('arr of movies is',arr);

		}
	} else if (messageAttachments) {
		sendTextMessage(senderID, "Message with attachment received");
	}
}
function receivedAuthentication(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfAuth = event.timestamp;

	// The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
	// The developer can set this to an arbitrary value to associate the 
	// authentication callback with the 'Send to Messenger' click event. This is
	// a way to do account linking when the user clicks the 'Send to Messenger' 
	// plugin.
	var passThroughParam = event.optin.ref;

	console.log("Received authentication for user %d and page %d with pass " +
			"through param '%s' at %d", senderID, recipientID, passThroughParam, 
			timeOfAuth);

	// When an authentication is received, we'll send a message back to the sender
	// to let them know it was successful.
	sendTextMessage(senderID, "Authentication successful");
}
function receivedDeliveryConfirmation(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var delivery = event.delivery;
	var messageIDs = delivery.mids;
	var watermark = delivery.watermark;
	var sequenceNumber = delivery.seq;

	if (messageIDs) {
		messageIDs.forEach(function(messageID) {
			console.log("Received delivery confirmation for message ID: %s", 
					messageID);
		});
	}

	console.log("All message before %d were delivered.", watermark);
}
function receivedPostback(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfPostback = event.timestamp;

	// The 'payload' param is a developer-defined field which is set in a postback 
	// button for Structured Messages. 
	var payload = event.postback.payload;

	console.log("Received postback for user %d and page %d with payload '%s' " + 
			"at %d", senderID, recipientID, payload, timeOfPostback);

	// When a postback is called, we'll send a message back to the sender to 
	// let them know it was successful
	sendTextMessage(senderID, "Postback called");
}
function receivedMessageRead(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;

	// All messages before watermark (a timestamp) or sequence have been seen.
	var watermark = event.read.watermark;
	var sequenceNumber = event.read.seq;
	https://botsify.com/bot/webhook/BXlQITM6TFzhJb6BlKp1
		console.log("Received message read event for watermark %d and sequence " +
				"number %d", watermark, sequenceNumber);
}
function receivedAccountLink(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;

	var status = event.account_linking.status;
	var authCode = event.account_linking.authorization_code;

	console.log("Received account link event with for user %d with status %s " +
			"and auth code %s ", senderID, status, authCode);
}
function sendTextMessage(recipientId, messageText) {
	var messageData = {
			recipient: {
				id: recipientId
			},
			message: {
				text: messageText,
				metadata: "DEVELOPER_DEFINED_METADATA"
			}
	};

	callSendAPI(messageData);
}
function Backmovies(recipientId,messageText) {
	var messageData = {
			recipient: {
				id: recipientId
			},
			message: {
				text: "Here are previous "+messageText+" recommendations for you.\n1."+first+"\n2."+second+"\n3."+third+"\n4."+fourth,
				metadata: "DEVELOPER_DEFINED_METADATA",
				quick_replies: [
				                {
				                	"content_type":"text",
				                	"title":1,
				                	"payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_ACTION"
				                },
				                {
				                	"content_type":"text",
				                	"title":2,
				                	"payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_COMEDY"
				                },
				                {
				                	"content_type":"text",
				                	"title":3,
				                	"payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRAMA"
				                },
				                {
				                	"content_type":"text",
				                	"title":4,
				                	"payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRAMA"
				                },
				                {
				                	"content_type":"text",
				                	"title":"show More",
				                	"payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRAMA"
				                }
				                ]
			}
	};
	callSendAPI(messageData);
}
function moreMovie(recipientId,messageText) {
	var i =i;
	//console.log('arr is',arr[i],arr[i+1],arr[i+2],arr[i+3]);
	var messageData = {
			recipient: {
				id: recipientId
			},
			message: {
				text: "Some more recommendations for "+messageText+" are.\n5."+fifth+"\n6."+sixth+"\n7."+seventh+"\n8."+eight,
				metadata: "DEVELOPER_DEFINED_METADATA",
				quick_replies: [
				                {
				                	"content_type":"text",
				                	"title":"Back",
				                	"payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_ACTION"
				                },
				                {
				                	"content_type":"text",
				                	"title":5,
				                	"payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_ACTION"
				                },
				                {
				                	"content_type":"text",
				                	"title":6,
				                	"payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_COMEDY"
				                },
				                {
				                	"content_type":"text",
				                	"title":7,
				                	"payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRAMA"
				                },
				                {
				                	"content_type":"text",
				                	"title":8,
				                	"payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRAMA"
				                }
				                ]
			}
	};
	callSendAPI(messageData);
}
function callSendAPI(messageData) {
	console.log('my message is',messageData);
	request({
		uri: 'https://graph.facebook.com/v2.6/me/messages',
		qs: { access_token: FB_PAGE_TOKEN },
		method: 'POST',
		json: messageData
	}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var recipientId = body.recipient_id;
			var messageId = body.message_id;
			if (messageId) {
				console.log("Successfully sent message with id %s to recipient %s", 
						messageId, recipientId);
			} else {
				console.log("Successfully called Send API for recipient %s", 
						recipientId);
			}
		} else {
			console.error('callSendAPI message of error is',response.error);
		}
	});  
}
/*function GenericmovieInfo(senderID,messageText)
	{
	//var movies;
	 imdb.getReq({ name:messageText }, function(err, things) 
	 {
	     if (err) {
	      console.error('Oops!!! No movie found with that name.\nCheck your spelling or try some other Popular Movie.\n', err);
	      var messageData = {
	       recipient: {
	       id: senderID
	    },
	    message: {
	      text:"Oops!!! No movie found with that name.\nCheck your spelling or try some other Popular Movie.\n"
	         }
	  }

	  callSendAPI(messageData);
	    return;
	  }
	console.log('the movie name is' , messageText);
	 var releseDate=things.released;
	 var actors=things.actors;
	 var geners=things.genres;
	 var director=things.director;
	 var writer=things.writer;
	 var rating=things.rating;
	 var language = things.languages;
	 console.log('the movie language is',language);
	 if(rating.includes("N/A")){
	  rating = "no rating";
	 }
	 var story=things.plot;
	 if(story.includes("N/A")){
	  story = "Sorry the stroy is unavialable for this movie";
	 }
	 var title=things.title;
	 var poster=things.poster;
	 console.log("imdb poster is", poster);
	 if(poster.includes("N/A")){
	   poster ="http://ia.media-imdb.com/images/M/MV5BMjAzOTcxMDA2Nl5BMl5BcG5nXkFtZTcwMTc1MzIzOA@@._V1_.png";
	 }
	 var imdburl=things.imdburl;
	 console.log("The imdb details is ","releseDate is" +releseDate,"actors are"+actors,"geners is"+geners,"director is"+director,"writer is"+writer,"story is"+story,"title is"+title,
	 "poster is "+poster,"imdburl is"+imdburl);
	 var messageData = {
	    recipient: {
	      id:senderID
	    },
	    message: {
	      attachment: {
	        type: "template",
	        payload: {
	          template_type: "generic",
	          elements: [{
	            title: title,
	            subtitle:"Ratings:"+rating+"\n\nActors:"+actors+"\n\nStory:"+story,
	            item_url:imdburl,               
	            //text:"Ratings:"+rating+"\n\nActors:"+actors+"\n\nStory:"+story,
	            image_url:poster,
	            buttons: [{
	              type: "web_url",
	              url: imdburl,
	              title: "More Details"
	            }]
	          }, {
	            title: "Story",
	            subtitle: story,
	            //item_url: "https://www.oculus.com/en-us/touch/",               
	            //image_url: SERVER_URL + "/assets/touch.png",

	            }]
	        }
	      }
	    }
	  };  
	 callSendAPI(messageData);
	 });
	}*/
function GenericmovieInfo(senderID,arr1,req)
{
	//var movies;

	imdb.getReq({ name:arr1 }, function(err, things) 
			{
		if (err) {
			k++;
			//console.error('Oops!!! No movie found with that name.\nCheck your spelling or try some other Popular Movie.\n', err);
			//var messageData = {
			//recipient: {
			//id: senderID
			//},
			//message: {
			//text:"Oops!!! No movie found with that name.\nCheck your spelling or try some other Popular Movie.\n"
			//}
			//}
			//
			//callSendAPI(messageData);
			//return;
			console.log('the req in err is',req);
			if(req.includes('imdb')){
				console.log("my imdb arr length is",movie_genere_matchmovies.length);
				if(k<movie_genere_matchmovies.length){
					console.log('the movie is',movie_genere_matchmovies[k]);
					GenericmovieInfo(senderID,movie_genere_matchmovies[k],'imdb');
				}
			}
			if(req.includes('db')){
				console.log("my arr length is",movie_genere_matchmovies.length);
				if(k<arr.length){
					console.log('the movie is',movie_genere_matchmovies[k]);
					GenericmovieInfo(senderID,movie_genere_matchmovies[k],'db');
				}
			}
		}
		if(things){
			k++;
			var releseDate=things.released;
			var actors=things.actors;
			var geners=things.genres;
			var director=things.director;
			var writer=things.writer;
			var rating=things.rating;
			var language = things.languages;
			console.log('the movie language is',language);
			if(rating.includes("N/A")){
				rating = "no rating";
			}
			var story=things.plot;
			if(story.includes("N/A")){
				story = "Sorry the stroy is unavialable for this movie";
			}
			var title=things.title;
			var poster=things.poster;
			console.log("imdb poster is", poster);
			if(poster.includes("N/A")){
				poster ="http://ia.media-imdb.com/images/M/MV5BMjAzOTcxMDA2Nl5BMl5BcG5nXkFtZTcwMTc1MzIzOA@@._V1_.png";
			}
			var imdburl=things.imdburl;
			console.log("The imdb details is ","releseDate is" +releseDate,"actors are"+actors,"geners is"+geners,"director is"+director,"writer is"+writer,"story is"+story,"title is"+title,
					"poster is "+poster,"imdburl is"+imdburl); 
			var obj =  {
					title: title,
					subtitle:"Ratings:"+rating+"\n\nActors:"+actors+"\n\nStory:"+story,           
					image_url:poster,
					buttons: [{
						type: "web_url",
						url: imdburl,
						title: "More Details"
					}]
			}
			movieData.message.attachment.payload.elements.push(obj); 
			if(req.includes('imdb')){
				if(k<movie_genere_matchmovies.length){
					console.log('the movie is',movie_genere_matchmovies[k]);
					GenericmovieInfo(senderID,movie_genere_matchmovies[k],'imdb');
				}else{
					//console.log("my final msg is",movieData.message.attachment.payload.elements);
					//k=0;
					movieData.recipient.id = senderID;
					callSendAPI(movieData);
				}
			}else if(req.includes('db')){
				if(k<arr.length){
					console.log('the movie is',arr[k]);
					GenericmovieInfo(senderID,arr[k],'db');
				}else{
					//console.log("my final msg is",movieData.message.attachment.payload.elements);
					//k=0;
					movieData.recipient.id = senderID;
					callSendAPI(movieData);
				}
			}
		}
			});
}
const firstEntityValue = (entities, entity) => {
	console.log(entity);
	const val = entities && entities[entity] &&
	Array.isArray(entities[entity]) &&
	entities[entity].length > 0 &&
	entities[entity][0].value
	;
	if (!val) {
		return null;
	}
	return typeof val === 'object' ? val.value : val;
};
const getFirstMessagingEntry = (body) => {
	console.log('am in getFirstMessagingEntry');
	const val = body.object === 'page' &&
	body.entry &&
	Array.isArray(body.entry) &&
	body.entry.length > 0 &&
	body.entry[0] &&
	body.entry[0].messaging &&
	Array.isArray(body.entry[0].messaging) &&
	body.entry[0].messaging.length > 0 &&
	body.entry[0].messaging[0];
	return val || null;
};
function sleep(milliseconds) {
	var start = new Date().getTime();
	for (var i = 0; i < 1e7; i++) {
		if ((new Date().getTime() - start) > milliseconds){
			break;
		}
	}
}
function movieInfo(senderID, messageText)
{
	var messageData ;

	console.log("------------>"+messageText+"<-----------------");
	//db.users.find({"genres" : /.*action.*/i}).pretty();
	//var cursor= collection.find({"genres" : /.*action.*/i}).limit(15);
	// var cursor= collection.find({genres:{'$regex' : messageText, '$options' : 'i'}}).limit(15);
	//{title:{'$regex' : messageText, '$options' : 'i'}},
	var cursor= collection.find(
			{$and:
				[
				 {genres:{'$regex' : messageText, '$options' : 'i'}},
				 {"rating" :{$gt : '7'}}
				 ]
			}
	).limit(15);
	cursor.toArray(function(err, docs) {    
		if(err){
			var messagetext = "Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …";
			sendTextMessage(recipientId, messagetext);
		}else{            
			console.log("query 1-------->Returned #" + docs.length + " documents");
			if(docs.length>0){
				for(var i =0;i<docs.length;i++){
					arr[i]=docs[i]['title'] ? docs[i]['title']: null ;
				}
				var length = arr.length;
				console.log('before movie length is',arr.length);
				if(length>10){
					arr.splice(10, arr.length-10);
				}
				console.log('after movie length is',arr.length);
				for(var i =0;i<arr.length;i++){
					arr [i] = arr[i].trim();
				}
				arr = arr.filter( function( item, index, inputArray ) {
					return inputArray.indexOf(item) == index;
				});
				console.log('messageText is',messageText );
				messageText = messageText.toUpperCase();
				var messageData = {
						recipient: {
							id: senderID
						},
						message: {
							text:"Please wait we will show some more  \""+messageText+"\" movie recommendations..."
						}
				}
				callSendAPI(messageData);
				console.log("the"+messageText+"movies are",arr);
				movieData.message.attachment.payload.elements =[];
				k =0;  
				GenericmovieInfo(senderID,arr[k],"db");
			}else{
				var genre_split = messageText.split(",");
				var arr1 = [] ;
				var i = 0;
				for(i =0; i<genre_split.length;i++){
					arr1[i] = {genres:{'$regex' : genre_split[i], '$options' : 'i'}};
				}
				arr1[i]={"rating" :{$gt : '7'}};
				var query = {$and:arr1};
				console.log(util.inspect(query, {showHidden: false, depth: null}));
				var cursor1= collection.find(query).limit(10);;
				cursor1.toArray(function(err, docs) {
					if(err){
						console.log('err is',err);
						var messagetext = "Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …";
						sendTextMessage(senderID, messagetext);
					}else{
						console.log("Returned #" + docs.length + " documents");
						if(docs.length>0){
							//arr =[];
							for(var i =0;i<docs.length;i++){
								arr[i]=docs[i]['title'] ? docs[i]['title']: null ;
							}
							var length = arr.length;
							console.log('before movie length is',arr.length);
							if(length>10){
								arr.splice(10, arr1.length-10);
							}
							console.log('after movie length is',arr.length);
							for(var i =0;i<arr.length;i++){
								arr [i] = arr[i].trim();
							}
							arr = arr.filter( function( item, index, inputArray ) {
								return inputArray.indexOf(item) == index;
							});
							console.log('messageText is',messageText );
							messageText = messageText.toUpperCase();
							var messagetext = "Please wait we will show some more  \""+messageText+"\" movie recommendations...";
							sendTextMessage(senderID, messagetext);
							console.log("the"+messageText+"movies are",arr);
							movieData.message.attachment.payload.elements =[];
							k =0;  
							GenericmovieInfo(senderID,arr[k],"db");
						}else{
							var messagetext = "Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …";
							sendTextMessage(senderID, messagetext);
						}
					}   
					db.close(); 
				});
			}
		}
		//db.close(); 
	});
}
var connect_to_db = function(messagetext,senderID) {
	return new Promise(function (resolve, reject) {
		MongoClient.connect(url, function (err, db) {
			if (err) {
				console.log('Unable to connect to the mongoDB server. Error:', err);
			} else {
				console.log('am connect to db ', messagetext);
				var collection = db.collection('movies');
				//var collection = db.collection('moviess');
				var cursor= collection.find(
						{$and:
							[
							 {genres:{'$regex' : messagetext, '$options' : 'i'}},
							 {"rating" :{$gt : '7'}}
							 ]
						}
				).limit(15);
				cursor.each(function (err, doc) {
					if (err) {
						console.log(err);
					} else {
						if(doc!=null){
							doc.title = doc.title.replace(/[^a-zA-Z 0-9]+/g,'');
							arr.push(doc.title);
						}  

					}
				});
				db.close();  
			}
		});
		console.log('the return arr is', arr);
		return arr;
	});
}
function movielist(){
	arr = arr.filter( function( item, index, inputArray ) {
		return inputArray.indexOf(item) == index;
	});
	console.log('the arr in movielist ', arr);
	return arr;
};  
/*function connect_to_db(messagetext,senderID) {
    MongoClient.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    console.log('am connect to db ', messagetext);
    var collection = db.collection('movies');
    //var collection = db.collection('moviess');
    var cursor= collection.find(
	               {$and:
	                    [
	                      {genres:{'$regex' : messagetext, '$options' : 'i'}},
	                      {"rating" :{$gt : '7'}}
	                    ]
	                }
	                    ).limit(15);
    cursor.toArray(function(err, docs) {
      if (err) {
        console.log(err);
      } else {
        if(docs!=null){
               first=docs[0]['title'] ? docs[0]['title']: null ;
	           second=docs[1]['title'] ? docs[1]['title']: null ;
	           third=docs[2]['title'] ? docs[2]['title']: null ;
	           fourth=docs[3]['title'] ? docs[3]['title']: null ;
	           fifth=docs[4]['title'] ? docs[4]['title']: null ;
	           sixth=docs[5]['title'] ? docs[5]['title']: null ;
	           seventh=docs[6]['title'] ? docs[6]['title']: null ;
	           eight=docs[7]['title'] ? docs[7]['title']: null ;
	           first.trim();
	           second.trim();
	           third.trim();
	           fourth.trim();
	           fifth.trim();
	           sixth.trim();
	           seventh.trim();
	           eight.trim();
        }  

      }
    });
}
});
};*/
function sendQuickReply(recipientId,messageText,arr,userchoice) {
	//var title= [];
	//var usermovies=[];
	//if(userchoice=="first"){
	//title = ['1','2','3','4','more'];
	//usermovies[0] = arr[0];
	//usermovies[1] = arr[1];
	//usermovies[2] = arr[2];
	//usermovies[3] = arr[3];
	//}else if(userchoice=="more"){
	//title =[];
	//title = ['5','6','7','8','Back'];
	//usermovies[0] = arr[4];
	//usermovies[1] = arr[5];
	//usermovies[2] = arr[6];
	//usermovies[3] = arr[7];
	//}
	//else if(userchoice=="Back"){
	//title =[];
	//title = ['1','2','3','4','more'];
	//usermovies[0] = arr[0];
	//usermovies[1] = arr[1];
	//usermovies[2] = arr[2];
	//usermovies[3] = arr[3];
	//}
	var messageData = {
			recipient: {
				id: recipientId
			},
			message: {
				text: "Here are some movies"+messageText,
				metadata: "METADATA",
				quick_replies: [   

				                ]
			}
	};
	var length = arr.length;
	if(length>11){
		arr.splice(arr.length-1, arr.length-11);
	}
	console.log('the length of arr is',arr.length);  
	for (var i =0;i<arr.length;i++){
		var obj =  {
				"content_type":"text",
				"title":i+1,
				"payload":"ACTION"
		};
		messageData.message.text = messageData.message.text+"\n"+(i+1)+"."+arr[i];
		messageData.message.quick_replies.push(obj); 
	}
	//var messageData = {
	//recipient: {
	//id: recipientId
	//},
	//message: {
	//text: "Here are some movies"+messageText+"\n"+title[0]+"."+usermovies[0]+"\n"+title[1]+"."+usermovies[1]+"\n"+title[2]+"."+usermovies[2]+"\n"+title[3]+"."+usermovies[3],
	//metadata: "METADATA",
	//quick_replies: [
	//{
	//"content_type":"text",
	//"title":title[0],
	//"payload":"ACTION"
	//},
	//{
	//"content_type":"text",
	//"title":title[1],
	//"payload":"COMEDY"
	//},
	//{
	//"content_type":"text",
	//"title":title[2],
	//"payload":"DRAMA"
	//},
	//{
	//"content_type":"text",
	//"title":title[3],
	//"payload":"HORROR"
	//},
	//{
	//"content_type":"text",
	//"title":title[4],
	//"payload":"More"
	//}
	//]
	//}
	//};
	console.log('am in sendquick reply', messageData);
	callSendAPI(messageData); 
}
function verifyRequestSignature(req, res, buf) {
	var signature = req.headers["x-hub-signature"];

	if (!signature) {
		// For testing, let's log an error. In production, you should throw an
		// error.
		console.error("Couldn't validate the signature.");
	} else {
		var elements = signature.split('=');
		var method = elements[0];
		var signatureHash = elements[1];

		var expectedHash = crypto.createHmac('sha1', FB_APP_SECRET)
		.update(buf)
		.digest('hex');

		if (signatureHash != expectedHash) {
			throw new Error("Couldn't validate the request signature.");
		}
	}
}
function movieInfo_imdbreq(recipientId,movie){
	movie_genere_matchmovies =[];
	recommend_movies =[];
	geners_userdefinedmovie = null;
	imdb.getReq({ name: movie }, function(err, things) {
		if(things){
			var imdburl1=things.imdburl ? things.imdburl : null;
			console.log('the imdb url of '+movie+' is',imdburl1);
			geners_userdefinedmovie=things.genres ? things.genres :null;
			console.log('The user defined movie genere is',geners_userdefinedmovie);
			request(imdburl1,function(err,response,body)
					{
				if(!err&&response.statusCode=='200')
				{
					var $=cheerio.load(body);
					$('a img','#title_recs').each(function()
							{
						var movie=$(this).attr('title');
						recommend_movies.push(movie);
							});
				}
				recommend_movies = recommend_movies.filter( function( item, index, inputArray ) {
					return inputArray.indexOf(item) == index;
				});
				console.log("recommend_movies is",recommend_movies);
				if(recommend_movies.length==0){
					movieData.message.attachment.payload.elements =[];
					movieInfo(recipientId, geners_userdefinedmovie);
				}
				if(recommend_movies.length>0){
					movie = movie.toUpperCase();
					var messageText = "Please wait we will show some movie recommendations same like  \""+movie+"\"";
					sendTextMessage(recipientId, messageText);
				}
				j =0;
				FetchingimdbLikedmovies(recipientId,recommend_movies[j]);
					});
		}
		if(err){
			var messageText = "Sorry, I don’t seem to know this movie. Could you specify another one?";
			sendTextMessage(recipientId, messageText);
		}
	});
}
function FetchingimdbLikedmovies(recipientId,movie){
	console.log('am in FetchingimdbLikedmovies',movie);
	imdb.getReq({ name: movie }, function(err, things) {
		if(things){
			j++;
			var geners1=things.genres ? things.genres :null;
			if(typeof(geners1)!=undefined){
				var splitstring = geners1.split(',');
				for(var i =0 ;i<splitstring.length;i++){
					if(geners_userdefinedmovie.includes(splitstring[i])){
						movie_genere_matchmovies.push(movie);
						console.log('movie matched with user title genere....', movie +"   genere...."+geners1);
						break;
					}
				}
			}
			if(j<recommend_movies.length){
				FetchingimdbLikedmovies(recipientId,recommend_movies[j]);
			}else {
				console.log('FetchingimdbLikedmovies called GenericmovieInfo');
				var length = movie_genere_matchmovies.length;
				console.log('before movie length is',movie_genere_matchmovies.length);
				if(length>10){
					movie_genere_matchmovies.splice(10, movie_genere_matchmovies.length-10);
				}
				console.log('after movie length is',movie_genere_matchmovies.length);
				movieData.message.attachment.payload.elements =[];
				k =0;  
				GenericmovieInfo(recipientId,movie_genere_matchmovies[k],"imdb");
			}
		}
		else if(err){
			console.log('the err for movie is',movie)
			j++;
			if(j<recommend_movies.length){
				FetchingimdbLikedmovies(recipientId,recommend_movies[j]);
			}
			else {
				console.log('FetchingimdbLikedmovies called GenericmovieInfo');
				var length = movie_genere_matchmovies.length;
				console.log('before movie length is',movie_genere_matchmovies.length);
				if(length>10){
					movie_genere_matchmovies.splice(10, movie_genere_matchmovies.length-10);
				}
				console.log('after movie length is',movie_genere_matchmovies.length);
				movieData.message.attachment.payload.elements =[];
				k =0;  
				GenericmovieInfo(recipientId,movie_genere_matchmovies[k],"imdb");
			}
		}
	});
}
function movie_time_genre(senderID,time,messageText)
{
	console.log("In movie_time_genre finction:");
	console.log("time era---->:",time);
	console.log("Genre----->:",messageText);
	messageText=messageText.trim();
	if(time==="latest"){
		var cursor= collection.find(
				{$and:
					[
					 {'genres': {'$regex': messageText[0]}},
					 { "year" : {$gt : '2014'}},
					 {"rating" :{$gt : '7'}}
					 ]
				}
		).limit(10);
		cursor.toArray(function(err, docs)
				{
			if(err)
			{ 
				console.log("err----->",err);
				var messagetext = "Sorry, I did not understand that you specified.";
				sendTextMessage(senderID, messagetext);
			}
			else
			{
				console.log("query 1-------->Returned #" + docs.length + " documents");

				if(docs.length>0){
					for(var i =0;i<docs.length;i++){
						arr[i]=docs[i]['title'] ? docs[i]['title']: null ;
					}
					for(var i =0;i<arr.length;i++){
						arr [i] = arr[i].trim();
					}
					arr = arr.filter( function( item, index, inputArray ) {
						return inputArray.indexOf(item) == index;
					});
					console.log('messageText is',messageText );
					messageText = messageText.toUpperCase();
					time = time.toUpperCase();
					var messageData = {
							recipient: {
								id: senderID
							},
							message: {
								text:"Please wait we will show some \""+time+"\" \""+messageText+"\" movie recommendations..."
							}
					}
					callSendAPI(messageData);
					console.log("the"+messageText+"movies are",arr);
					movieData.message.attachment.payload.elements =[];
					k =0;  
					GenericmovieInfo(senderID,arr[k],"db");
				}
				else{
					console.error('else of query 1------>Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …', err);
					var messagetext = "Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …";
					sendTextMessage(senderID, messagetext);
				}	
			}
				});
	}else if(time==="old")
	{
		var cursor= collection.find(
				{$and:
					[
					 {'genres': {'$regex': messageText[0]}},
					 { year : {$gt: '2000', $lt: '2014'}},
					 {"rating" :{$gt : '7'}}
					 ]
				}
		).limit(10);
		cursor.toArray(function(err, docs)
				{
			if(err)
			{ 
				console.log("err----->",err);
				var messagetext = "Sorry, some error occured in our database.";
				sendTextMessage(senderID, messagetext);
			}
			else
			{
				console.log("query 2-------->Returned #" + docs.length + " documents");

				if(docs.length>0){
					for(var i =0;i<docs.length;i++){
						arr[i]=docs[i]['title'] ? docs[i]['title']: null ;
					}
					for(var i =0;i<arr.length;i++){
						arr [i] = arr[i].trim();
					}
					arr = arr.filter( function( item, index, inputArray ) {
						return inputArray.indexOf(item) == index;
					});
					console.log('messageText is',messageText );
					messageText = messageText.toUpperCase();
					time = time.toUpperCase();
					var messageData = {
							recipient: {
								id: senderID
							},
							message: {
								text:"Please wait we will show some \""+time+"\"  \""+messageText+"\" movie recommendations..."
							}
					}
					callSendAPI(messageData);
					console.log("the"+messageText+"movies are",arr);
					movieData.message.attachment.payload.elements =[];
					k =0;  
					GenericmovieInfo(senderID,arr[k],"db");
				}
				else{
					console.error('else of query 2------>Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …', err);
					var messagetext = "Sorry, some error occured in our database.";
					sendTextMessage(senderID, messagetext);}	
			}
				});
	}else if(time==="90's")
	{
		var cursor= collection.find(
				{$and:
					[
					 {'genres': {'$regex': messageText[0]}},
					 { year : {$gt: '1990', $lt: '2000'}},
					 {"rating" :{$gt : '7'}}
					 ]
				}
		).limit(10);

		cursor.toArray(function(err, docs)
				{
			if(err)
			{ 
				console.log("err----->",err);
				var messagetext = "Sorry, some error occured in our database.";
				sendTextMessage(senderID, messagetext);
			}
			else
			{
				console.log("query 2-------->Returned #" + docs.length + " documents");

				if(docs.length>0){
					for(var i =0;i<docs.length;i++){
						arr[i]=docs[i]['title'] ? docs[i]['title']: null ;
					}
					for(var i =0;i<arr.length;i++){
						arr [i] = arr[i].trim();
					}
					arr = arr.filter( function( item, index, inputArray ) {
						return inputArray.indexOf(item) == index;
					});
					console.log('messageText is',messageText );
					messageText = messageText.toUpperCase();
					time = time.toUpperCase();
					var messageData = {
							recipient: {
								id: senderID
							},
							message: {
								text:"Please wait we will show some \""+time+"\"   \""+messageText+"\" movie recommendations..."
							}
					}
					callSendAPI(messageData);
					console.log("the"+messageText+"movies are",arr);
					movieData.message.attachment.payload.elements =[];
					k =0;  
					GenericmovieInfo(senderID,arr[k],"db");
				}
				else{
					console.error('else of query 2------>Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …', err);
					var messagetext = "Sorry, some error occured in our database.";
					sendTextMessage(senderID, messagetext);
				}	
			}
				});
	}	else if(time==="50's")
	{
		var cursor= collection.find(
				{$and:
					[
					 {'genres': {'$regex': messageText[0]}},
					 { year : {$gt: '1950', $lt: '1960'}},
					 {"rating" :{$gt : '7'}}
					 ]
				}
		).limit(10);

		cursor.toArray(function(err, docs)
				{
			if(err)
			{ 
				console.log("err----->",err);
				var messagetext = "Sorry, some error occured in our database.";
				sendTextMessage(senderID, messagetext);
			}
			else
			{
				console.log("query 2-------->Returned #" + docs.length + " documents");

				if(docs.length>0){
					for(var i =0;i<docs.length;i++){
						arr[i]=docs[i]['title'] ? docs[i]['title']: null ;
					}
					for(var i =0;i<arr.length;i++){
						arr [i] = arr[i].trim();
					}
					arr = arr.filter( function( item, index, inputArray ) {
						return inputArray.indexOf(item) == index;
					});
					console.log('messageText is',messageText );
					messageText = messageText.toUpperCase();
					time = time.toUpperCase();
					var messageData = {
							recipient: {
								id: senderID
							},
							message: {
								text:"Please wait we will show some \""+time+"\"   \""+messageText+"\" movie recommendations..."
							}
					}
					callSendAPI(messageData);
					console.log("the"+messageText+"movies are",arr);
					movieData.message.attachment.payload.elements =[];
					k =0;  
					GenericmovieInfo(senderID,arr[k],"db");
				}
				else{
					console.error('else of query 2------>Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …', err);
					var messagetext = "Sorry, some error occured in our database.";
					sendTextMessage(senderID, messagetext);
				}	
			}
				});
	}else if(time==="60's")
	{
		var cursor= collection.find(
				{$and:
					[
					 {'genres': {'$regex': messageText[0]}},
					 { year : {$gt: '1960', $lt: '1970'}},
					 {"rating" :{$gt : '7'}}
					 ]
				}
		).limit(10);
		cursor.toArray(function(err, docs)
				{
			if(err)
			{ 
				console.log("err----->",err);
				var messagetext = "Sorry, some error occured in our database.";
				sendTextMessage(senderID, messagetext);
			}
			else
			{
				console.log("query 2-------->Returned #" + docs.length + " documents");

				if(docs.length>0){
					for(var i =0;i<docs.length;i++){
						arr[i]=docs[i]['title'] ? docs[i]['title']: null ;
					}
					for(var i =0;i<arr.length;i++){
						arr [i] = arr[i].trim();
					}
					arr = arr.filter( function( item, index, inputArray ) {
						return inputArray.indexOf(item) == index;
					});
					console.log('messageText is',messageText );
					messageText = messageText.toUpperCase();
					time = time.toUpperCase();
					var messageData = {
							recipient: {
								id: senderID
							},
							message: {
								text:"Please wait we will show some \""+time+"\"   \""+messageText+"\" movie recommendations..."
							}
					}
					callSendAPI(messageData);
					console.log("the"+messageText+"movies are",arr);
					movieData.message.attachment.payload.elements =[];
					k =0;  
					GenericmovieInfo(senderID,arr[k],"db");
				}
				else{	
					console.error('else of query 2------>Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …', err);
					var messagetext = "Sorry, some error occured in our database.";
					sendTextMessage(senderID, messagetext);}	
			}
				});
	}else if(time==="70's")
	{
		var cursor= collection.find(
				{$and:
					[
					 {'genres': {'$regex': messageText[0]}},
					 { year : {$gt: '1970', $lt: '1980'}},
					 {"rating" :{$gt : '7'}}
					 ]
				}
		).limit(10);

		cursor.toArray(function(err, docs)
				{
			if(err)
			{ 
				console.log("err----->",err);
				var messagetext = "Sorry, some error occured in our database.";
				sendTextMessage(senderID, messagetext);
			}
			else
			{
				console.log("query 2-------->Returned #" + docs.length + " documents");

				if(docs.length>0){
					for(var i =0;i<docs.length;i++){
						arr[i]=docs[i]['title'] ? docs[i]['title']: null ;
					}
					for(var i =0;i<arr.length;i++){
						arr [i] = arr[i].trim();
					}
					arr = arr.filter( function( item, index, inputArray ) {
						return inputArray.indexOf(item) == index;
					});

					console.log('messageText is',messageText );
					messageText = messageText.toUpperCase();
					time = time.toUpperCase();
					var messageData = {
							recipient: {
								id: senderID
							},
							message: {
								text:"Please wait we will show some \""+time+"\"   \""+messageText+"\" movie recommendations..."
							}
					}
					callSendAPI(messageData);
					console.log("the"+messageText+"movies are",arr);
					movieData.message.attachment.payload.elements =[];
					k =0;  
					GenericmovieInfo(senderID,arr[k],"db");
				}
				else{console.error('else of query 2------>Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …', err);
				var messagetext = "Sorry, some error occured in our database.";
				sendTextMessage(senderID, messagetext);}	
			}
				});
	}
	else if(time==="80's")
	{
		var cursor= collection.find(
				{$and:
					[
					 {'genres': {'$regex': messageText[0]}},
					 { year : {$gt: '1980', $lt: '1990'}},
					 {"rating" :{$gt : '7'}}
					 ]
				}
		).limit(10);

		cursor.toArray(function(err, docs)
				{
			if(err)
			{ 
				console.log("err----->",err);
				var messagetext = "Sorry, some error occured in our database.";
				sendTextMessage(senderID, messagetext);
			}
			else
			{
				console.log("query 2-------->Returned #" + docs.length + " documents");

				if(docs.length>0){
					for(var i =0;i<docs.length;i++){
						arr[i]=docs[i]['title'] ? docs[i]['title']: null ;
					}
					for(var i =0;i<arr.length;i++){
						arr [i] = arr[i].trim();
					}
					arr = arr.filter( function( item, index, inputArray ) {
						return inputArray.indexOf(item) == index;
					});

					console.log('messageText is',messageText );
					messageText = messageText.toUpperCase();
					time = time.toUpperCase();
					var messageData = {
							recipient: {
								id: senderID
							},
							message: {
								text:"Please wait we will show some \""+time+"\"   \""+messageText+"\" movie recommendations..."
							}
					}
					callSendAPI(messageData);
					console.log("the"+messageText+"movies are",arr);
					movieData.message.attachment.payload.elements =[];
					k =0;  
					GenericmovieInfo(senderID,arr[k],"db");
				}
				else{console.error('else of query 2------>Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …', err);
				var messagetext = "Sorry, some error occured in our database.";
				sendTextMessage(senderID, messagetext);}	
			}
				});
	}
}
function movie_time(senderID,time)
{
	console.log("In movie_time_genre finction:");
	console.log("time era---->:",time);
	time=time.trim();
	if(time==="latest"){
		var cursor= collection.find(
				{$and:
					[
					 { "year" : {$gt : '2015'}},
					 {"rating" :{$gt : '7'}}
					 ]
				}
		).limit(10);

		cursor.toArray(function(err, docs)
				{
			if(err)
			{ 
				console.log("err----->",err);
				var messagetext = "Sorry, I did not understand that you specified.";
				sendTextMessage(senderID, messagetext);
			}
			else
			{
				console.log("query 1-------->Returned #" + docs.length + " documents");

				if(docs.length>0){
					for(var i =0;i<docs.length;i++){
						arr[i]=docs[i]['title'] ? docs[i]['title']: null ;
					}
					for(var i =0;i<arr.length;i++){
						arr [i] = arr[i].trim();
					}
					arr = arr.filter( function( item, index, inputArray ) {
						return inputArray.indexOf(item) == index;
					});
					console.log('messageText is',time );
					time = time.toUpperCase();
					var messageData = {
							recipient: {
								id: senderID
							},
							message: {
								text:"Please wait we will show some \""+time+"\" movie recommendations..."
							}
					}
					callSendAPI(messageData);
					console.log("the"+time+"movies are",arr);
					movieData.message.attachment.payload.elements =[];
					k =0;  
					GenericmovieInfo(senderID,arr[k],"db");
				}
				else{console.error('else of query 1------>Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …', err);
				var messagetext = "Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …";
				sendTextMessage(senderID, messagetext);}	
			}
				});

	}
	else if(time==="old")
	{
		var cursor= collection.find(
				{$and:
					[
					 { year : {$gt: '2000', $lt: '2014'}},
					 {"rating" :{$gt : '7'}}
					 ]
				}
		).limit(10);

		cursor.toArray(function(err, docs)
				{
			if(err)
			{ 
				console.log("err----->",err);
				var messagetext = "Sorry, some error occured in our database.";
				sendTextMessage(senderID, messagetext);
			}
			else
			{
				console.log("query 2-------->Returned #" + docs.length + " documents");

				if(docs.length>0){
					for(var i =0;i<docs.length;i++){
						arr[i]=docs[i]['title'] ? docs[i]['title']: null ;
					}
					for(var i =0;i<arr.length;i++){
						arr [i] = arr[i].trim();
					}
					arr = arr.filter( function( item, index, inputArray ) {
						return inputArray.indexOf(item) == index;
					});
					console.log('messageText is',time );
					time = time.toUpperCase();
					var messageData = {
							recipient: {
								id: senderID
							},
							message: {
								text:"Please wait we will show some \""+time+"\" movie recommendations..."
							}
					}
					callSendAPI(messageData);
					console.log("the"+time+"movies are",arr);
					movieData.message.attachment.payload.elements =[];
					k =0;  
					GenericmovieInfo(senderID,arr[k],"db");
				}
				else{console.error('else of query 2------>Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …', err);
				var messagetext = "Sorry, some error occured in our database.";
				sendTextMessage(senderID, messagetext);}	
			}
				});

	}
	else
	{
		console.log('The time is', time);
		var cursor= collection.find(
				{$and:
					[
					 { year : {$gt: time, $lt: time+10}},
					 {"rating" :{$gt : '7'}}
					 ]
				}
		).limit(10);

		cursor.toArray(function(err, docs)
				{
			if(err)
			{ 
				console.log("err----->",err);
				var messagetext = "Sorry, some error occured in our database.";
				sendTextMessage(senderID, messagetext);
			}
			else
			{
				console.log("query 2-------->Returned #" + docs.length + " documents");

				if(docs.length>0){
					for(var i =0;i<docs.length;i++){
						arr[i]=docs[i]['title'] ? docs[i]['title']: null ;
					}
					for(var i =0;i<arr.length;i++){
						arr [i] = arr[i].trim();
					}
					arr = arr.filter( function( item, index, inputArray ) {
						return inputArray.indexOf(item) == index;
					});
					console.log('messageText is',time );
					time = time.toUpperCase();
					var messageData = {
							recipient: {
								id: senderID
							},
							message: {
								text:"Please wait we will show some \""+time+"\" movie recommendations..."
							}
					}
					callSendAPI(messageData);
					console.log("the"+time+"movies are",arr);
					movieData.message.attachment.payload.elements =[];
					k =0;  
					GenericmovieInfo(senderID,arr[k],"db");
				}
				else{console.error('else of query 2------>Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …', err);
				var messagetext = "Sorry, some error occured in our database.";
				sendTextMessage(senderID, messagetext);}	
			}
				});
	}
	//else if(time==="1950")
	//{
		//var cursor= collection.find(
				//{$and:
					//[
					 //{ year : {$gt: '1950', $lt: '1960'}},
					 //{"rating" :{$gt : '7'}}
					 //]
				//}
		//).limit(10);
//
		//cursor.toArray(function(err, docs)
				//{
			//if(err)
			//{ 
				//console.log("err----->",err);
				//var messagetext = "Sorry, some error occured in our database.";
				//sendTextMessage(senderID, messagetext);
			//}
			//else
			//{
				//console.log("query 2-------->Returned #" + docs.length + " documents");
//
				//if(docs.length>0){
					//for(var i =0;i<docs.length;i++){
						//arr[i]=docs[i]['title'] ? docs[i]['title']: null ;
					//}
					//for(var i =0;i<arr.length;i++){
						//arr [i] = arr[i].trim();
					//}
					//arr = arr.filter( function( item, index, inputArray ) {
						//return inputArray.indexOf(item) == index;
					//});
					//console.log('messageText is',time );
					//time = time.toUpperCase();
					//var messageData = {
							//recipient: {
								//id: senderID
							//},
							//message: {
								//text:"Please wait we will show some \""+time+"\" movie recommendations..."
							//}
					//}
					//callSendAPI(messageData);
					//console.log("the"+time+"movies are",arr);
					//movieData.message.attachment.payload.elements =[];
					//k =0;  
					//GenericmovieInfo(senderID,arr[k],"db");
				//}
				//else{console.error('else of query 2------>Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …', err);
				//var messagetext = "Sorry, some error occured in our database.";
				//sendTextMessage(senderID, messagetext);}	
			//}
				//});
	//}
	//else if(time==="1960")
	//{
		//var cursor= collection.find(
				//{$and:
					//[
					 //{ year : {$gt: '1960', $lt: '1970'}},
					 //{"rating" :{$gt : '7'}}
					 //]
				//}
		//).limit(10);
//
		//cursor.toArray(function(err, docs)
				//{
			//if(err)
			//{ 
				//console.log("err----->",err);
				//var messagetext = "Sorry, some error occured in our database.";
				//sendTextMessage(senderID, messagetext);
			//}
			//else
			//{
				//console.log("query 2-------->Returned #" + docs.length + " documents");
//
				//if(docs.length>0){
					//for(var i =0;i<docs.length;i++){
						//arr[i]=docs[i]['title'] ? docs[i]['title']: null ;
					//}
					//for(var i =0;i<arr.length;i++){
						//arr [i] = arr[i].trim();
					//}
					//arr = arr.filter( function( item, index, inputArray ) {
						//return inputArray.indexOf(item) == index;
					//});
					//console.log('messageText is',time );
					//time = time.toUpperCase();
					//var messageData = {
							//recipient: {
								//id: senderID
							//},
							//message: {
								//text:"Please wait we will show some \""+time+"\" movie recommendations..."
							//}
					//}
					//callSendAPI(messageData);
					//console.log("the"+time+"movies are",arr);
					//movieData.message.attachment.payload.elements =[];
					//k =0;  
					//GenericmovieInfo(senderID,arr[k],"db");
				//}
				//else{console.error('else of query 2------>Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …', err);
				//var messagetext = "Sorry, some error occured in our database.";
				//sendTextMessage(senderID, messagetext);}	
			//}
				//});
	//}
	//else if(time==="1970")
	//{
		//var cursor= collection.find(
				//{$and:
					//[
					 //{ year : {$gt: '1970', $lt: '1980'}},
					 //{"rating" :{$gt : '7'}}
					 //]
				//}
		//).limit(10);
//
		//cursor.toArray(function(err, docs)
				//{
			//if(err)
			//{ 
				//console.log("err----->",err);
				//var messagetext = "Sorry, some error occured in our database.";
				//sendTextMessage(senderID, messagetext);
			//}
			//else
			//{
				//console.log("query 2-------->Returned #" + docs.length + " documents");
//
				//if(docs.length>0){
					//for(var i =0;i<docs.length;i++){
						//arr[i]=docs[i]['title'] ? docs[i]['title']: null ;
					//}
					//for(var i =0;i<arr.length;i++){
						//arr [i] = arr[i].trim();
					//}
					//arr = arr.filter( function( item, index, inputArray ) {
						//return inputArray.indexOf(item) == index;
					//});
					//console.log('messageText is',time );
					//time = time.toUpperCase();
					//var messageData = {
							//recipient: {
								//id: senderID
							//},
							//message: {
								//text:"Please wait we will show some \""+time+"\" movie recommendations..."
							//}
					//}
					//callSendAPI(messageData);
					//console.log("the"+time+"movies are",arr);
					//movieData.message.attachment.payload.elements =[];
					//k =0;  
					//GenericmovieInfo(senderID,arr[k],"db");
				//}
				//else{console.error('else of query 2------>Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …', err);
				//var messagetext = "Sorry, some error occured in our database.";
				//sendTextMessage(senderID, messagetext);}	
			//}
				//});
	//}
	//else if(time==="1980")
	//{
		//var cursor= collection.find(
				//{$and:
					//[
					 //{ year : {$gt: '1980', $lt: '1990'}},
					 //{"rating" :{$gt : '7'}}
					 //]
				//}
		//).limit(10);
//
		//cursor.toArray(function(err, docs)
				//{
			//if(err)
			//{ 
				//console.log("err----->",err);
				//var messagetext = "Sorry, some error occured in our database.";
				//sendTextMessage(senderID, messagetext);
			//}
			//else
			//{
				//console.log("query 2-------->Returned #" + docs.length + " documents");
//
				//if(docs.length>0){
					//for(var i =0;i<docs.length;i++){
						//arr[i]=docs[i]['title'] ? docs[i]['title']: null ;
					//}
					//for(var i =0;i<arr.length;i++){
						//arr [i] = arr[i].trim();
					//}
					//arr = arr.filter( function( item, index, inputArray ) {
						//return inputArray.indexOf(item) == index;
					//});
					//console.log('messageText is',time );
					//time = time.toUpperCase();
					//var messageData = {
							//recipient: {
								//id: senderID
							//},
							//message: {
								//text:"Please wait we will show some \""+time+"\" movie recommendations..."
							//}
					//}
					//callSendAPI(messageData);
					//console.log("the"+time+"movies are",arr);
					//movieData.message.attachment.payload.elements =[];
					//k =0;  
					//GenericmovieInfo(senderID,arr[k],"db");
				//}
				//else{console.error('else of query 2------>Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …', err);
				//var messagetext = "Sorry, some error occured in our database.";
				//sendTextMessage(senderID, messagetext);}	
			//}
				//});
	//}
}
function movie_time(senderID,time)
{
	console.log("In movie_time_genre finction:");
	console.log("time era---->:",time);
	time=time.trim();
	if(time==="latest"){
		var cursor= collection.find(
				{$and:
					[
					 { "year" : {$gt : '2015'}},
					 {"rating" :{$gt : '7'}}
					 ]
				}
		).limit(10);

		cursor.toArray(function(err, docs)
				{
			if(err)
			{ 
				console.log("err----->",err);
				var messagetext = "Sorry, I did not understand that you specified.";
				sendTextMessage(senderID, messagetext);
			}
			else
			{
				console.log("query 1-------->Returned #" + docs.length + " documents");

				if(docs.length>0){
					for(var i =0;i<docs.length;i++){
						arr[i]=docs[i]['title'] ? docs[i]['title']: null ;
					}
					for(var i =0;i<arr.length;i++){
						arr [i] = arr[i].trim();
					}
					arr = arr.filter( function( item, index, inputArray ) {
						return inputArray.indexOf(item) == index;
					});
					console.log('messageText is',time );
					time = time.toUpperCase();
					var messageData = {
							recipient: {
								id: senderID
							},
							message: {
								text:"Please wait we will show some \""+time+"\" movie recommendations..."
							}
					}
					callSendAPI(messageData);
					console.log("the"+time+"movies are",arr);
					movieData.message.attachment.payload.elements =[];
					k =0;  
					GenericmovieInfo(senderID,arr[k],"db");
				}
				else{console.error('else of query 1------>Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …', err);
				var messagetext = "Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …";
				sendTextMessage(senderID, messagetext);}	
			}
				});

	}
	else if(time==="old")
	{
		var cursor= collection.find(
				{$and:
					[
					 { year : {$gt: '2000', $lt: '2014'}},
					 {"rating" :{$gt : '7'}}
					 ]
				}
		).limit(10);

		cursor.toArray(function(err, docs)
				{
			if(err)
			{ 
				console.log("err----->",err);
				var messagetext = "Sorry, some error occured in our database.";
				sendTextMessage(senderID, messagetext);
			}
			else
			{
				console.log("query 2-------->Returned #" + docs.length + " documents");

				if(docs.length>0){
					for(var i =0;i<docs.length;i++){
						arr[i]=docs[i]['title'] ? docs[i]['title']: null ;
					}
					for(var i =0;i<arr.length;i++){
						arr [i] = arr[i].trim();
					}
					arr = arr.filter( function( item, index, inputArray ) {
						return inputArray.indexOf(item) == index;
					});
					console.log('messageText is',time );
					time = time.toUpperCase();
					var messageData = {
							recipient: {
								id: senderID
							},
							message: {
								text:"Please wait we will show some \""+time+"\" movie recommendations..."
							}
					}
					callSendAPI(messageData);
					console.log("the"+time+"movies are",arr);
					movieData.message.attachment.payload.elements =[];
					k =0;  
					GenericmovieInfo(senderID,arr[k],"db");
				}
				else{console.error('else of query 2------>Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …', err);
				var messagetext = "Sorry, some error occured in our database.";
				sendTextMessage(senderID, messagetext);}	
			}
				});

	}
	else
	{
		console.log('time is',time);
		var time2 = parseInt(time)+10;
		time2 = time2+""; 
		var cursor= collection.find(
				{$and:
					[
					 { year : {$gt: time, $lt: time2}},
					 {"rating" :{$gt : '7'}}
					 ]
				}
		).limit(10);
		cursor.toArray(function(err, docs)
				{
			if(err)
			{ 
				console.log("err----->",err);
				var messagetext = "Sorry, some error occured in our database.";
				sendTextMessage(senderID, messagetext);
			}
			else
			{
				console.log("query 2-------->Returned #" + docs.length + " documents");

				if(docs.length>0){
					for(var i =0;i<docs.length;i++){
						arr[i]=docs[i]['title'] ? docs[i]['title']: null ;
					}
					for(var i =0;i<arr.length;i++){
						arr [i] = arr[i].trim();
					}
					arr = arr.filter( function( item, index, inputArray ) {
						return inputArray.indexOf(item) == index;
					});
					console.log('messageText is',time );
					time = time.toUpperCase();
					var messageData = {
							recipient: {
								id: senderID
							},
							message: {
								text:"Please wait we will show some \""+time+"\" movie recommendations..."
							}
					}
					callSendAPI(messageData);
					console.log("the"+time+"movies are",arr);
					movieData.message.attachment.payload.elements =[];
					k =0;  
					GenericmovieInfo(senderID,arr[k],"db");
				}
				else{console.error('else of query 2------>Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …', err);
				var messagetext = "Sorry, some error occured in our database.";
				sendTextMessage(senderID, messagetext);}	
			}
				});
	}
	//else if(time==="50's")
	//{
		//var cursor= collection.find(
				//{$and:
					//[
					 //{ year : {$gt: '1950', $lt: '1960'}},
					 //{"rating" :{$gt : '7'}}
					 //]
				//}
		//).limit(10);
//
		//cursor.toArray(function(err, docs)
				//{
			//if(err)
			//{ 
				//console.log("err----->",err);
				//var messagetext = "Sorry, some error occured in our database.";
				//sendTextMessage(senderID, messagetext);
			//}
			//else
			//{
				//console.log("query 2-------->Returned #" + docs.length + " documents");
//
				//if(docs.length>0){
					//for(var i =0;i<docs.length;i++){
						//arr[i]=docs[i]['title'] ? docs[i]['title']: null ;
					//}
					//for(var i =0;i<arr.length;i++){
						//arr [i] = arr[i].trim();
					//}
					//arr = arr.filter( function( item, index, inputArray ) {
						//return inputArray.indexOf(item) == index;
					//});
					//console.log('messageText is',time );
					//time = time.toUpperCase();
					//var messageData = {
							//recipient: {
								//id: senderID
							//},
							//message: {
								//text:"Please wait we will show some \""+time+"\" movie recommendations..."
							//}
					//}
					//callSendAPI(messageData);
					//console.log("the"+time+"movies are",arr);
					//movieData.message.attachment.payload.elements =[];
					//k =0;  
					//GenericmovieInfo(senderID,arr[k],"db");
				//}
				//else{console.error('else of query 2------>Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …', err);
				//var messagetext = "Sorry, some error occured in our database.";
				//sendTextMessage(senderID, messagetext);}	
			//}
				//});
	//}
	//else if(time==="60's")
	//{
		//var cursor= collection.find(
				//{$and:
					//[
					 //{ year : {$gt: '1960', $lt: '1970'}},
					 //{"rating" :{$gt : '7'}}
					 //]
				//}
		//).limit(10);
//
		//cursor.toArray(function(err, docs)
				//{
			//if(err)
			//{ 
				//console.log("err----->",err);
				//var messagetext = "Sorry, some error occured in our database.";
				//sendTextMessage(senderID, messagetext);
			//}
			//else
			//{
				//console.log("query 2-------->Returned #" + docs.length + " documents");
//
				//if(docs.length>0){
					//for(var i =0;i<docs.length;i++){
						//arr[i]=docs[i]['title'] ? docs[i]['title']: null ;
					//}
					//for(var i =0;i<arr.length;i++){
						//arr [i] = arr[i].trim();
					//}
					//arr = arr.filter( function( item, index, inputArray ) {
						//return inputArray.indexOf(item) == index;
					//});
					//console.log('messageText is',time );
					//time = time.toUpperCase();
					//var messageData = {
							//recipient: {
								//id: senderID
							//},
							//message: {
								//text:"Please wait we will show some \""+time+"\" movie recommendations..."
							//}
					//}
					//callSendAPI(messageData);
					//console.log("the"+time+"movies are",arr);
					//movieData.message.attachment.payload.elements =[];
					//k =0;  
					//GenericmovieInfo(senderID,arr[k],"db");
				//}
				//else{console.error('else of query 2------>Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …', err);
				//var messagetext = "Sorry, some error occured in our database.";
				//sendTextMessage(senderID, messagetext);}	
			//}
				//});
	//}
	//else if(time==="70's")
	//{
		//var cursor= collection.find(
				//{$and:
					//[
					 //{ year : {$gt: '1970', $lt: '1980'}},
					 //{"rating" :{$gt : '7'}}
					 //]
				//}
		//).limit(10);
//
		//cursor.toArray(function(err, docs)
				//{
			//if(err)
			//{ 
				//console.log("err----->",err);
				//var messagetext = "Sorry, some error occured in our database.";
				//sendTextMessage(senderID, messagetext);
			//}
			//else
			//{
				//console.log("query 2-------->Returned #" + docs.length + " documents");
//
				//if(docs.length>0){
					//for(var i =0;i<docs.length;i++){
						//arr[i]=docs[i]['title'] ? docs[i]['title']: null ;
					//}
					//for(var i =0;i<arr.length;i++){
						//arr [i] = arr[i].trim();
					//}
					//arr = arr.filter( function( item, index, inputArray ) {
						//return inputArray.indexOf(item) == index;
					//});
					//console.log('messageText is',time );
					//time = time.toUpperCase();
					//var messageData = {
							//recipient: {
								//id: senderID
							//},
							//message: {
								//text:"Please wait we will show some \""+time+"\" movie recommendations..."
							//}
					//}
					//callSendAPI(messageData);
					//console.log("the"+time+"movies are",arr);
					//movieData.message.attachment.payload.elements =[];
					//k =0;  
					//GenericmovieInfo(senderID,arr[k],"db");
				//}
				//else{console.error('else of query 2------>Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …', err);
				//var messagetext = "Sorry, some error occured in our database.";
				//sendTextMessage(senderID, messagetext);}	
			//}
				//});
	//}
	//else if(time==="80's")
	//{
		//var cursor= collection.find(
				//{$and:
					//[
					 //{ year : {$gt: '1980', $lt: '1990'}},
					 //{"rating" :{$gt : '7'}}
					 //]
				//}
		//).limit(10);
//
		//cursor.toArray(function(err, docs)
				//{
			//if(err)
			//{ 
				//console.log("err----->",err);
				//var messagetext = "Sorry, some error occured in our database.";
				//sendTextMessage(senderID, messagetext);
			//}
			//else
			//{
				//console.log("query 2-------->Returned #" + docs.length + " documents");
//
				//if(docs.length>0){
					//for(var i =0;i<docs.length;i++){
						//arr[i]=docs[i]['title'] ? docs[i]['title']: null ;
					//}
					//for(var i =0;i<arr.length;i++){
						//arr [i] = arr[i].trim();
					//}
					//arr = arr.filter( function( item, index, inputArray ) {
						//return inputArray.indexOf(item) == index;
					//});
					//console.log('messageText is',time );
					//time = time.toUpperCase();
					//var messageData = {
							//recipient: {
								//id: senderID
							//},
							//message: {
								//text:"Please wait we will show some \""+time+"\" movie recommendations..."
							//}
					//}
					//callSendAPI(messageData);
					//console.log("the"+time+"movies are",arr);
					//movieData.message.attachment.payload.elements =[];
					//k =0;  
					//GenericmovieInfo(senderID,arr[k],"db");
				//}
				//else{console.error('else of query 2------>Sorry, I did not understand the Genre you specified. I can understand Comedy, Thriller, Romance, Action …', err);
				//var messagetext = "Sorry, some error occured in our database.";
				//sendTextMessage(senderID, messagetext);}	
			//}
				//});
	//}
}
app.listen(PORT);
console.log('Listening on :' + PORT + '...');
/*module.exports = messanger;*/
module.exports = {
		getFirstMessagingEntry: getFirstMessagingEntry,
		fbMessage: fbMessage,
};
