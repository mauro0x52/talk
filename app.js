/*----------------------------------------------------------------------------*/
/** Chat
*
* @ autor : Rafael Erthali
* @ since : 2012-04
*
* @ description : Servidor de chat
*/

var express = require('express');
var model = require('./model.js');

var app = module.exports = express.createServer();

app.configure(function(){
    
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    
    app.use(express.errorHandler());
});

app.get('/(load)?', function(request,response){
    response.sendfile('chat.js');
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
    var Conversant = model.Conversant;
    
    Conversant.find({user : request.params.userId}, function(error, conversants){
        if(error){
	    response.end('({"error" : "'+error+'"})');
	    return;
	}

        var conversant;
	if(conversants[0] === undefined)
            conversant = new Conversant({user : request.params.userId});
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

app.listen(33889);
