var fs = require('fs');
var separator = '############################################################################\n';   
var respId = 0;
var variables = require('./variables');
var feedback_chatId = variables['feedback_chatId'];

function processOnText(msg, match) {
    var resp = null;
    var timestamp = new Date();
    var messagesToSend = [];
    var openingh = require('./openingh');
    var chatId = msg.chat.id;


    //Mensas, die Abendessen Haben
    var dinner_dict = {
        "poly" : "Mensa Polyterrasse",
        "pizzapasta" : "food market - pizza pasta"
    }

    //Übersetzt den einfacheren Befehl zum komplizierteren Mensanamen im JSON
    var dict = {
                "cliff" : "Clausiusbar",
                "haoyi" : "Woka",
                "poly" : "Mensa Polyterrasse",
                "foodlab" : "foodLAB",
                "clausiusbar" : "Clausiusbar",
                "asia" : "Clausiusbar",
                "fusion" : "FUSION meal",
                "woka" : "Woka",
                "tannenbar" : "Tannenbar",
                "trailer" : "Foodtrailer ETZ",
                "dozentenfoyer" : "Dozentenfoyer",
                "grill" : "food market - grill bbQ",
                "pizzapasta" : "food market - pizza pasta",
                "green" : "food market - green day",
        };

    console.log(msg);
    console.log(JSON.stringify(match));
    fs.appendFile('logs/requests.log', separator + timestamp + '\n\n' + JSON.stringify(msg) + '\n' + separator, function (err) {
        console.log(err);
    });
    //Feedback
    if(match[0].indexOf('/feedback') != -1 || match[0].indexOf('/respond') != -1) {
        if (match[0] === '/feedback'){
            resp = '*Feedback für Dummies:*\n/feedback <Deine Nachricht>';
            
        }else if(match[0].indexOf('/feedback')!=-1){
            respId=chatId;
            fs.appendFile('logs/feedback.log', separator + '\n\n' + timestamp + '\n\n' + JSON.stringify(msg) + '\n\n', function (err) {
                console.log(err);
            });
            resp = 'Vielen Dank für Dein Feedback!';
            
            messagesToSend.push({chatId:-106064170, message:'New feedback:\n\n' + JSON.stringify(msg)});
        }else if(match[0].indexOf('/respond') != -1){
            
            resp = match[0].split('respond');
            resp = resp[1];
         
            chatId = respId;
        }
    }else{
        //Chopping '@...' from the command if needed
        var command = match[1].split('@');
        command = command[0];
        //Nicht ideal weil ja nicht ein Strang, aber funktioniert so weit ganz gut (denke ich):
        //Checking whether a cafeteria has dinner and if its late enough to display the dinner menu
        if (command in dinner_dict && timestamp.getHours() >= 14){
            command = dinner_dict[command];
            var mensas = require('./mensas_abig.json');
            var t = 1;
        //Checking whether its a known cafeteria
        }else if (command in dict){
            command = dict[command];
            var mensas = require('./mensas.json');
            var t = 0;
        //...help/start, opening hours
        }
        
        if(command in openingh){
            resp = openingh[command];
        //Mensa
        }else if(command in mensas){
                
            //Weekend?
            if(timestamp.getDay() === 6 || timestamp.getDay() === 0){
                resp = "Heute haben leider alle Mensen geschlossen, sorry!";
            //If weekday, wanted information is formatted as follows:
            }else{
                if (mensas[command] != undefined){
                    resp = "*" + command + "*\n_Essen von " + mensas[command].hours.mealtime[t]["from"] +" bis " +mensas[command].hours.mealtime[t]["to"] + " Uhr_\n\n";
                    for (var meal in mensas[command]["meals"]){
                        var description = "";
                        for (i in mensas[command]["meals"][meal]["description"]){
                            description += mensas[command]["meals"][meal]["description"][i]+ " " ;
                            if (i === "0"){
                                description += "\n"; 
                            }
                        }
                        resp += "*" +mensas[command]["meals"][meal]["label"] + " (" + mensas[command]["meals"][meal]["prices"]["student"]+ "/" +mensas[command]["meals"][meal]["prices"]["staff"] +  "/" + mensas[command]["meals"][meal]["prices"]["extern"]+"):*\n" + description + "\n";
                    }
                }else{
                    resp = "Tut mir Leid, für diese Mensa ist momentan leider kein Menü verfügbar :(";
                }
            }
        }
}

    messagesToSend.push({chatId:chatId, message:resp, options:{parse_mode: 'Markdown'}});
    
    fs.appendFile('logs/handled_requests.log', separator + timestamp + '\n\n' + JSON.stringify(msg,null,2) + '\n+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+\nRESPONSE:\n\n' + resp + '\n', function (err) {
        console.log(err);
    });
    
    return messagesToSend;
}
module.exports.processOnText = processOnText;
