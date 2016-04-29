// Get the lib
var irc = require("irc");
var fs = require('fs');

function rand(floor, ceil){
	return Math.floor( (Math.random() * (ceil-floor)) +floor);
};

// Create the configuration
var config = {
	owner: ["Hobgoblin101"],
	channels: ["#botTest", "#luna'sBedRoom"],
	server: "irc.canternet.org",
	botName: "Woona-Bot",
	canSend: true,
	humanDelay: 50,
	loadSaves: ["basicLuna"]
};

var memory = [];

// Create the bot name
var bot = new irc.Client(config.server, config.botName, {
	channels: config.channels
});

bot.addListener('error', function(message) {
    console.log('error: ', message);
});

/**Listen for joins**/
bot.addListener("join", function(channel, who) {
	// Welcome them in!
	if (who != config.botName){
		//Don't welcome yourself
		bot.say(channel, "Welcome come "+ who +" into our presence");
	}
});

/**On action**/
bot.addListener("action", function(from, channel, message){
	console.log('('+channel+')'+from+': '+message);
	var itext = message.toLowerCase();
	if (itext.indexOf(config.botName.toLowerCase()) != -1){
		Message(channel, "Stop Playing With Me!");
	}
});

/**On PM**/
bot.addListener("pm", function(from, text, message){
	console.log('(PM)'+from+': '+text);
});

/**On Standard Message**/
bot.addListener("message", function(from, to, text, message) {
  console.error('('+ to + ')' + from + ': ' + text);
  var itext = text.toLowerCase();

	/**Commands**/
	if (itext.indexOf("!") != -1 && IsAdmin(from)){ //If it is possibly a command
		if (itext.indexOf("luna-save") != -1 && from == config.owner[0]){
			arguments = text.split(" ");
			if (arguments[1] != undefined){
				var fileDir = arguments[1];
			}else{
				var fileDir = "live";
			}
			SaveData(fileDir);
			return;
		}
		else if (itext.indexOf("luna-load") != -1 && from == config.owner[0]){
			arguments = text.split(" ");
			if (arguments[1] != undefined){
				var fileDir = arguments[1];
			}else{
				var fileDir = "live";
			}
			LoadData(fileDir);
			Message(to, "Loaded: " + fileDir);
			return;
		}
		else if (itext.indexOf("luna-command") != -1){
			arguments = text.split(" ");
			arguments.splice(0, 1); //Remove the message to allow bot to find
			message(to, arguments, "action");
			return;
		}
		else if (itext.indexOf("luna-die") != -1){
			arguments = text.split(" ");
			arguments.splice(0, 1); //Remove the message to allow bot to find
			bot.send('QUIT', arguments[1]);
			return;
		}
		else if (itext.indexOf("luna-newadmin") != -1 && from == config.owner[0]){
			arguments = text.split(" ");
			arguments.splice(0, 1); //Remove the message to allow bot to find
			index = config.owner.indexOf(arguments[0]);
			if (index != -1){
				//If admin exists then rdon't add them
				config.owner.push(arguments[0]);
			}
			return;
		}
		else if (itext.indexOf("luna-removeadmin") != -1 && from == config.owner[0]){ //Is Main Admin
			arguments = text.split(" ");
			arguments.splice(0, 1); //Remove the message to allow bot to find
			index = config.owner.indexOf(arguments[0]);
			if (index != -1){
				//If admin exists then remove them
				config.owner.splice(index, 1);
			}
			return;
		}
		else if (itext.indexOf("luna-canrespond") != -1){
			arguments = text.split(" ");
			arguments.splice(0, 1); //Remove the message to allow bot to find
			config.canSend = arguments[0];
			console.log("canSend has been set to: " + config.canSend);
			return;
		}
		else if (itext.indexOf("luna-setdelay") != -1){
			arguments = text.split(" ");
			arguments.splice(0, 1); //Remove the message to allow bot to find
			config.humanDelay = arguments[0];
			console.log("Human delay set to: " + config.humanDelay);
			return;
		}
		else if (itext.indexOf("luna-part") != -1){
			arguments = text.split(" ");
			bot.send('PART', arguments[1]);
			return;
		}
		else if (itext.indexOf("luna-join") != -1){
			arguments = text.split(" ");
			bot.send('JOIN', arguments[1]);
			return;
		}
		else if (itext.indexOf("luna-say") != -1){
			arguments = text.split(" ");
			to = arguments[1];
			arguments.splice(0, 1);
			arguments.splice(0, 1);
			message = arguments.join(" ");
			bot.say(to, message);
			console.log('Said: ' + message + " | To: " + to);
			return;
		}
		else if (itext.indexOf("luna-help") != -1){
			bot.say(to, "luna-load           - load save file [name]");
			bot.say(to, "luna-save           - save a save file [name]");
			bot.say(to, "luna-command        - gets Woona-Bot to run a specified command - [command argument1 argument 2]");
			bot.say(to, "luna-die            - shuts down Woona-Bot");
			bot.say(to, "luna-canRespond     - turns off or on Woona-Bot's auto response [true/false]");
			bot.say(to, "luna-setdelay       - sets the value of Woona-Bot's humanDelay factor [inMs]");
			bot.say(to, "luna-part           - get's Woona-Bot to leave a channel [#channel]");
			bot.say(to, "luna-join           - get's Woona-Bot to join a channel [#channel]");
			bot.say(to, "luna-say            - get's Woona-Bot to say something for you [#channel/nick message]");
			bot.say(to, "luna-help           - get's Woona-Bot to tell you a list of her commands");
		}
	}

  /**Public chat**/
	if (to.indexOf('#') != -1){ //If PM ignore
		Message(to, GenerateReply(text, from), "message");
	}

});

function Message(to, message, type){
	//Cancel Message
	if (message == "" || message == " " || message == undefined || config.canSend != true){
		//Cancel the message if a requirement is not met
		if(config.canSend != true){
			console.log("message cancelled: not allowed to talk")
		}else if (message == "" || message == " "){
			console.error("message cancelled: blank message")
		}
		return;
	}

	//Set defult
	if (type == undefined){
		type = "message";
	}

	//Calculate human delay factor
	var delay = message.length * config.humanDelay;

	if (type == "message"){
		setTimeout(function(){ bot.say(to, message); console.log('Me: '+ message); }, delay);
	}else if (type == "action"){
		command = message[0];
		arguments = message;
		arguments.splice(0, 1); //Remove the message to allow bot to find

		bot.send(command, arguments[0], arguments[1], arguments[2]);
		console.log("command: " + command);
	}

};

function IsAdmin(person){
	return (config.owner.indexOf(person) != -1);
};

function GenerateReply(input, from){
	console.log("startingReply: " + input)
	if (input == undefined){
		console.log("broken input")
		return;
	}
	var itext = input.toLowerCase();
	reply = "null"
	var opts = [];
	var highestRank = 0;
	//For each know action loop though and work out components
	for (var item=0; item < memory.length; item++){
		validOpt = true;
		//Loop though components to see if they are in chat message
		for (var comp=0; comp < memory[item].action.length; comp++){
			test = memory[item].action[comp];
			test = test.toLowerCase();
			if (itext.indexOf(test) == -1 && validOpt == true){
				//If an option does not exist set validOpt to false
				validOpt = false;
			}
		}
		//If all needs are met for response
		if (validOpt == true){
			//add to list
			num = rand(0, memory[item].reaction.length);
			reactChosen = memory[item].reaction[num]
			newPos = {rank: memory[item].action.length, value: reactChosen};
			opts.push(newPos);

			//Level up make number of components used in a possible result
			if (memory[item].action.length >= highestRank){
				highestRank = memory[item].action.length;
			}
		}
	}

	var best = [];
	for (i=0; i<opts.length; i++){
		if (opts[i].rank >= highestRank){
			best.push(opts[i].value);
		}
	}

	num = rand(0, best.length);
	reply = best[num];
	if (reply == "null"){
		return;
	};
	return reply;
};


/**File system functions**/
function SaveData(fileName){
  var data = "";
  for (i=0; i<memory.length; i++){

    var newItem = "";
    if (i!=0){
      newItem += ', '
    };
    newItem += '{"action": [';

    for (a=0; a<memory[i].action.length; a++){
      if (a!=0){
        newItem += ', '
      };
      newItem += '"' + memory[i].action[a] + '"';
    };
    newItem += '], "reaction": [';

    for (r=0; r<memory[i].reaction.length; r++){
      if (r!=0){
        newItem += ', '
      };
      newItem += '"' + memory[i].reaction[r] + '"';
    };

    newItem += "]}"
    data += newItem;
  };

  data = "[" + data + "]";
  var dir = "./saves/" + fileName + ".js";
  fs.writeFile(dir, data, function(err) {
      if(err) {
          return console.log(err);
      }

      console.log("The file was saved!");
  });
};

function LoadData(fileName){
  dir = "./saves/" + fileName + '.js';
  var obj = JSON.parse(fs.readFileSync(dir, 'utf8'));
  console.log("File was loaded");

	//For each action in the object loaded
	for (i=0; i<obj.length; i++){
		var foundAct = false;
		//Loop though each action in the existing memory
		for (m=0; m<memory.length; m++){
			//If they are the same action then add the object's reaction the the memory's
			if (memory[m].action == obj[i].action){
				for (r=0; r<obj[i].reaction.length; r++){
					var index = memory[m].reaction.indexOf(obj[i].reaction[r]);
					if (index == -1){ //If it doesn't exist then add it
						memory[m].reaction.push(obj[i].reaction[r]);
					}
				}
				//Then since this memory found the corrent action stop checking for that action and move to the next
				foundAct = true;
				break;
			}
		}
		//If it could not find the correct action in memory add action to memory
		if (foundAct == false){
			memory.push(obj[i]);
		}
	};
};

for (i=0; i<config.loadSaves.length; i++){
	console.log("Loading: " + config.loadSaves[i]);
	LoadData(config.loadSaves[i]);
};
