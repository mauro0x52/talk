/*----------------------------------------------------------------------------*/
/** Chat
*
* @ autor : Rafael Erthali
* @ since : 2012-04
*
* @ description : Servidor de chat
*/

var express = require('express');
var config = require('./config.js');
var model = require('./model.js');
var ejs = require('ejs')

var app = module.exports = express.createServer();

app.configure(function(){
    app.set('view engine', 'ejs');
    app.disable('view cache');
    app.set('view options', {layout : false});
});

app.get('/(load)?', function(request,response){
    response.header('Content-Type', 'text/javascript');
    response.render('chat.ejs', {baseUrl : 'http://' + config.baseUrl + ':' + config.port + '/'});
});

var Conversant = model.Conversant;
var Message = model.Message;
var ConversantBkp = model.ConversantBkp;
var MessageBkp = model.MessageBkp;

Conversant.find(function(error,conversants){
    conversants.forEach(function(conversant){

        conversant.disconnect();

	ConversantBkp.findOne({user : conversant.user}, function(conversantbkp){
            console.log(conversantbkp);
	    if(conversantbkp === null){
	        var conversantbkp = new ConversantBkp({
		    _id         : conversant._id,
                    company     : conversant.company,
                    user        : conversant.user ,
                    label       : conversant.label ,
                    typing      : conversant.typing ,
                    status      : conversant.status ,
                    lastCheck   : conversant.lastCheck, 
                    activeChats : conversant.activeChats
		});

		conversantbkp.save(function(error){});
		conversant.remove(function(error){});
	    }
	});
    });
});

Message.find(function(error,messages){
    messages.forEach(function(message){

        var messagebkp = new MessageBkp({
            _id        : message._id,
            message    : message.message,
            from       : message.from ,
            to         : message.to ,
            status     : message.status,
            date       : message.date
	});

	messagebkp.save(function(error){});
	message.remove(function(error){});

    });
});

/*----------------------------------------------------------------------------*/
/** connect
*
* @ autor : Rafael Erthal
* @ since : 2012-04
*
* @ description : Seta o status do usuario como conectado ou cadastra ele no banco e seta-o como conectado
*
* @ param userId : identificação do usuário que esta conectando ao chat
*/
 
app.get('/:userId/connect', function(request, response){
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Cache-Control', 'no-cache');
    var Conversant = model.Conversant;
    
    Conversant.find({user : request.params.userId}, function(error, conversants){
        if(error){
	    response.end('({"error" : "'+error+'"})');
	    return;
	}

        var conversant;
	if(conversants[0] === undefined)
            conversant = new Conversant({user : request.params.userId, company : request.query.companyId, label : request.query.label});
        else
            conversant = conversants[0];

        if(conversant.status === 'offline')
            conversant.connect();

	response.end('({"error" : ""})');

    });
});

/*----------------------------------------------------------------------------*/
/** open-chat
*
* @ autor : Rafael Erthal
* @ since : 2012-04
*
* @ description : Seta o status do usuario como conectado ou cadastra ele no banco e seta-o como conectado
*
* @ param userId : identificação do usuário que esta conectando ao chat
*/
 
app.get('/:userId/open-chat/:chatId', function(request, response){
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Cache-Control', 'no-cache');

    var Conversant = model.Conversant;
    
    Conversant.findOne({user : request.params.userId}, function(error, conversant){
        if(error){
	    response.end('({"error" : "'+error+'"})');
            return;
        }

        if(conversant === null) {
	    response.end('({"error" : "Usuário não encontrado"})');
	    return;
	}
        
        conversant.enableChat(request.params.chatId, function(error,from,to){
	    response.end('(' + JSON.stringify({error : error, from : from, to : to}) + ')');
	});
    });
});

/*----------------------------------------------------------------------------*/
/** close-chat
*
* @ autor : Rafael Erthal
* @ since : 2012-04
*
* @ description : Seta o status do usuario como conectado ou cadastra ele no banco e seta-o como conectado
*
* @ param userId : identificação do usuário que esta conectando ao chat
*/
 
app.get('/:userId/close-chat/:chatId', function(request, response){
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Cache-Control', 'no-cache');

    var Conversant = model.Conversant;
    
    Conversant.findOne({user : request.params.userId}, function(error, conversant){
        if(error){
	    response.end('({"error" : "'+error+'"})');
            return;
        }

        if(conversant === undefined) {
	    response.end('({"error" : "Usuário não encontrado"})');
	    return;
	}
        
        conversant.disableChat(request.params.chatId, function(error){
	    response.end('({"error" : "' + error + '"})');
	});   
    });
});

/*----------------------------------------------------------------------------*/
/** unread-messages
*
* @ autor : Rafael Erthal
* @ since : 2012-04
*
* @ description : pega todas as mensagens não lidas
*
* @ param userId : identificação do usuário que esta requisitando as mensagens
*/
 
app.get('/:userId/unread-messages/:chatId', function(request, response){
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Cache-Control', 'no-cache');

    var Conversant = model.Conversant;
    
    Conversant.findOne({user : request.params.userId}, function(error, conversant){
        if(error){
            response.end('({"error" : "'+error+'"})');
            return;
        }

        if(conversant === null)
	{
	    response.end('({"error" : "Usário não encontrado"})');
	    return;
	}

        if(conversant.status === 'offline'){
	    response.end('({"error" : "Usuário deslogado"})');
	    return;
	}

	conversant.unreadMessages(request.params.chatId, function(messages){
	    response.end('(' +JSON.stringify({error : "", messages : messages}) + ')');

            var length = messages.length; 
            for(var i = 0; i < length; i++)
                messages[i].read();
        });
    });
});

/*----------------------------------------------------------------------------*/
/** messages
*
* @ autor : Rafael Erthal
* @ since : 2012-04
*
* @ description : pega todas as mensagens
*
* @ param userId : identificação do usuário que esta requisitando as mensagens
*/
 
app.get('/:userId/messages/:chatId', function(request, response){
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Cache-Control', 'no-cache');

    var Conversant = model.Conversant;
    
    Conversant.findOne({user : request.params.userId}, function(error, conversant){
        if(error){
            response.end('({"error" : "'+error+'"})');
            return;
        }

        if(conversant === null)
	{
	    response.end('({"error" : "Usário não encontrado"})');
	    return;
	}
        
        if(conversant.status === 'offline'){
	    response.end('({"error" : "Usuário deslogado"})');
	    return;
	}
         
	conversant.messages(request.params.chatId, function(messages){ 
	    response.end('(' +JSON.stringify({error : "", messages : messages}) + ')');
	});
    });
});

/*----------------------------------------------------------------------------*/
/** send-message
*
* @ autor : Rafael Erthal
* @ since : 2012-04
*
* @ description : pega todas as conversas que estão ativas
*
* @ param userId : identificação do usuário que esta verificando as conversas
*/
 
app.get('/:userId/send-message/:to', function(request, response){
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Cache-Control', 'no-cache');

    var Conversant = model.Conversant;
    
    Conversant.findOne({user : request.params.userId}, function(error, conversant){
        if(error){
            response.end('({"error" : "'+error+'"})');
            return;
        }

        if(conversant === null){
	    response.end('({"error" : "Usuário não encontrado"})');
	    return;
	}

        if(conversant.status === 'offline'){
	    response.end('({"error" : "Usuário deslogado"})');
	    return;
	}

	conversant.sendMessage({message : request.query.message, to : request.params.to});

        response.end('({"error" : ""})');
    });
});

/*----------------------------------------------------------------------------*/
/** active-chats
*
* @ autor : Rafael Erthal
* @ since : 2012-04
*
* @ description : pega todas as conversas que estão ativas
*
* @ param userId : identificação do usuário que esta verificando as conversas
*/
 
app.get('/:userId/active-chats', function(request, response){
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Cache-Control', 'no-cache');

    var Conversant = model.Conversant;
    
    Conversant.findOne({user : request.params.userId}, function(error, conversant){
        if(error) response.end('({"error" : "'+error+'"})');
	
        if(conversant === null){
            response.end('({"error" : "Usuário não encontrado"})');
	    return;
        }

        if(conversant.status === 'offline'){
	    response.end('({"error" : "Usuário deslogado"})');
	    return;
	}

        conversant.refreshStatus();
        response.end("(" + JSON.stringify({error : "", activeChats : conversant.activeChats}) + ")");
    });
});

/*----------------------------------------------------------------------------*/
/** company-status
*
* @ autor : Rafael Erthal
* @ since : 2012-06
*
* @ description : retorna se a empresa esta online ou offline
*
* @ param userId : identificação do usuário que esta verificando as conversas
*/
 
app.get('/:companyId/company-status', function(request, response){
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Cache-Control', 'no-cache');

    var Conversant = model.Conversant;
    
    Conversant.findOne({company : request.params.companyId, status : 'online'}, function(error, conversant){
        if(error) response.end('({"error" : "'+error+'"})');
	
        if(conversant === null){
            response.end('({"error" : "", "status" : "offline"})');
        }
	else{
            response.end('({"error" : "", "status" : "online"})');
	}
    });
});

/*----------------------------------------------------------------------------*/
/** panel
*
* @ autor : Rafael Erthal
* @ since : 2012-06
*
* @ description : painel de controle do chat
*/
 
app.get('/panel', function(request, response){

    var Conversant = model.ConversantBkp;
    
    Conversant.find({label : {$ne : 'Visitante'}},function(error, conversants){
        if(error) response.end('({"error" : "'+error+'"})');
	response.write("<table border CELLSPACING='2px'>");

	response.write(
	    "<tr>"+
	    "    <td>Usuario</td>"+
	    "    <td>Empresa</td>"+
	    "    <td>Total de Conversas</td>"+
	    "    <td>Total de Conversas Efetivas</td>"+
	    "    <td>Chat Started</td>"+
	    "    <td>Chat Started Reply</td>"+
	    "    <td>Chat Received</td>"+
	    "    <td>Chat Received Reply</td>"+
	    "</tr>"
	);
	var showed = 0;

	for(var i = 0; i<conversants.length; i++)
	{
	    conversants[i].chats(function(conversant,chats){
		var chatStarted = 0,
		    chatStartedReply = 0,
		    chatReceived = 0,
		    chatReceivedReply = 0,
		    chatCount = 0;

		for(var chat in chats)
	        {
		    if(chats[chat].messages !== undefined)
		    {
		        var firstMessage = chats[chat].messages[0],
		            meSend = false,
		            otherSend = false;

		        for(var j = 1; j < chats[chat].messages.length; j++)
		        {
		            if(chats[chat].messages[j].date < firstMessage.date)
		            {
		                firstMessage = chats[chat].messages[j];
		            }

		            if(chats[chat].messages[j].from.toString() === conversant._id.toString())
		            {
		                meSend = true;
		            }
		            else
		            {
		                otherSend = true;
		            }
		        }

		        if(firstMessage.from.toString() === conversant._id.toString())
		        {
		            chatStarted++;
		            if(otherSend) chatStartedReply++;
		        }
		        else
		        {
		            chatReceived++;
		            if(meSend) chatReceivedReply++;
	                }

			chatCount++;
		    }
		}
                response.write(
	            "<tr>" +
		    "    <td> <a href='/panel/" + conversant._id + "'>" + conversant.label  + " </a></td>"+
		    "    <td>" + conversant.company  + "</td>"+
		    "    <td>" + chatCount + "</td>"+
		    "    <td>" + (chatStartedReply + chatReceivedReply) + "</td>"+
		    "    <td>" + chatStarted + "</td>"+
		    "    <td>" + chatStartedReply + "</td>"+
		    "    <td>" + chatReceived + "</td>"+
		    "    <td>" + chatReceivedReply + "</td>"+
	            "</tr>"
	        );
		showed++;
	    });
	}
        
	function teste()
        {
	    console.log(showed + " " + conversants.length);
	    if(showed === conversants.length)
	        response.end("</table>");
	    else
	        setTimeout(teste, 500);
        }

	teste();
    });
});

/*----------------------------------------------------------------------------*/
/** panel
*
* @ autor : Rafael Erthal
* @ since : 2012-06
*
* @ description : painel de controle do chat
*/
 
app.get('/panel/:user_id', function(request, response){

    var Conversant = model.ConversantBkp;
    Conversant.findById(request.params.user_id, function(error, conversant){
        if(error) response.end('({"error" : "'+error+'"})');

	conversant.chats(function(conversant,chats){
 	    response.write("<table border CELLSPACING='2px'>");
           var showed = 0;
	   var total = 0;
           response.write(
	        "<tr>"+
	        "    <td>Conversas de " + conversant.label + "</td>"+
	        "</tr>"
	    );

	    for(var chat in chats)
	    {
                Conversant.findById(chat, function(error, data){
	            response.write(
	                "<tr>" +
		        "    <td><a href='/panel/" + request.params.user_id + "/" + data._id + "'>" + data.label + "(" + chats[chat].messages.length + ")</a></td>" +
	                "</tr>"
	            );
		    showed++;
                });
	        total++;
	    }

        
	    function teste()
            {
	        console.log(showed + " " + total);
	        if(showed === total)
	            response.end("</table>");
	        else
	            setTimeout(teste, 500);
            }

	    teste();
	});
    });
});
 
/*----------------------------------------------------------------------------*/
/** panel
*
* @ autor : Rafael Erthal
* @ since : 2012-06
*
* @ description : painel de controle do chat
*/
 
app.get('/panel/:user_id/:other_id', function(request, response){

    var Conversant = model.ConversantBkp;
    Conversant.findById(request.params.user_id, function(error, conversant){
        Conversant.findById(request.params.other_id, function(error, other){

            if(error) response.end('({"error" : "'+error+'"})');

	    conversant.chats(function(conversant,chats){
 	        response.write("<table border CELLSPACING='2px'>");

                response.write(
	            "<tr>"+
	            "    <td>Conversas de " + conversant.label + " com " + other.label + "</td>"+
	            "</tr>"
	        );
	    
	        for(var i = 0; i < chats[request.params.other_id].messages.length; i++)
	        {
	            response.write(
	                "<tr>" +
		        "    <td>" + (chats[request.params.other_id].messages[i].from.toString() === conversant._id.toString() ? conversant.label : other.label) + " diz: " + chats[request.params.other_id].messages[i].message + "</td>" +
	                "</tr>"
	            );
	        }

                response.end("</table>")
	    });
	});
    });
});
/*----------------------------------------------------------------------------*/

app.listen(config.port);
