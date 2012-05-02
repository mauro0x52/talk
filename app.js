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

    var Conversant = model.Conversant;
    
    Conversant.findOne({user : request.params.userId}, function(error, conversant){
        if(error){
	    response.end(request.query.callback + '({"error" : "'+error+'"})');
	    return;
	}

	if(conversant === null)
            conversant = new Conversant({user : request.params.userId});

        if(conversant.status === 'offline')
            conversant.connect();

	response.end(request.query.callback + '({"error" : ""})');

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

    var Conversant = model.Conversant;
    
    Conversant.findOne({user : request.params.userId}, function(error, conversant){
        if(error){
	    response.end(request.query.callback + '({"error" : "'+error+'"})');
            return;
        }

        if(conversant === null) {
	    response.end(request.query.callback + '({"error" : "Usuário não encontrado"})');
	    return;
	}
        
        conversant.enableChat(request.params.chatId, function(error,from,to){
	    response.end(request.query.callback + '(' + JSON.stringify({error : error, from : from, to : to}) + ')');
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

    var Conversant = model.Conversant;
    
    Conversant.findOne({user : request.params.userId}, function(error, conversant){
        if(error){
	    response.end(request.query.callback + '({"error" : "'+error+'"})');
            return;
        }

        if(conversant === undefined) {
	    response.end(request.query.callback + '({"error" : "Usuário não encontrado"})');
	    return;
	}
        
        conversant.disableChat(request.params.chatId, function(error){
	    response.end(request.query.callback + '({"error" : "' + error + '"})');
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

    var Conversant = model.Conversant;
    
    Conversant.findOne({user : request.params.userId}, function(error, conversant){
        if(error){
            response.end(request.query.callback + '({"error" : "'+error+'"})');
            return;
        }

        if(conversant === null)
	{
	    response.end(request.query.callback + '({"error" : "Usário não encontrado"})');
	    return;
	}

        if(conversant.status === 'offline'){
	    response.end(request.query.callback + '({"error" : "Usuário deslogado"})');
	    return;
	}

	conversant.unreadMessages(request.params.chatId, function(messages){
	    response.end(request.query.callback + '(' +JSON.stringify({error : "", messages : messages}) + ')');

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

    var Conversant = model.Conversant;
    
    Conversant.findOne({user : request.params.userId}, function(error, conversant){
        if(error){
            response.end(request.query.callback + '({"error" : "'+error+'"})');
            return;
        }

        if(conversant === null)
	{
	    response.end(request.query.callback + '({"error" : "Usário não encontrado"})');
	    return;
	}
        
        if(conversant.status === 'offline'){
	    response.end(request.query.callback + '({"error" : "Usuário deslogado"})');
	    return;
	}
         
	conversant.messages(request.params.chatId, function(messages){ 
	    response.end(request.query.callback + '(' +JSON.stringify({error : "", messages : messages}) + ')');
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

    var Conversant = model.Conversant;
    
    Conversant.findOne({user : request.params.userId}, function(error, conversant){
        if(error){
            response.end(request.query.callback + '({"error" : "'+error+'"})');
            return;
        }

        if(conversant === null){
	    response.end(request.query.callback + '({"error" : "Usuário não encontrado"})');
	    return;
	}

        if(conversant.status === 'offline'){
	    response.end(request.query.callback + '({"error" : "Usuário deslogado"})');
	    return;
	}

	conversant.sendMessage({message : request.query.message, to : request.params.to});

        response.end(request.query.callback + '({"error" : ""})');
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

    var Conversant = model.Conversant;
    
    Conversant.findOne({user : request.params.userId}, function(error, conversant){
        if(error) response.end(request.query.callback + '({"error" : "'+error+'"})');
	
        if(conversant === null){
            response.end(request.query.callback + '({"error" : "Usuário não encontrado"})');
	    return;
        }

        if(conversant.status === 'offline'){
	    response.end(request.query.callback + '({"error" : "Usuário deslogado"})');
	    return;
	}

        conversant.refreshStatus();
        response.end(request.query.callback + "(" + JSON.stringify({error : "", activeChats : conversant.activeChats}) + ")");
    });
});

/*----------------------------------------------------------------------------*/

app.listen(33889);
