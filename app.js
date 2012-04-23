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
    
    Conversant.find({user : request.params.userId}, function(error, conversants){
        if(error) response.end('__parseJSONPResponse({"error" : "'+error+'"})');

        var conversant;
	if(conversants[0] === undefined)
            conversant = new Conversant({user : request.params.userId});
	else
	    conversant = conversants[0];

	conversant.connect();

	response.end('__parseJSONPResponse({"error" : ""})');
	
    });
});

/*----------------------------------------------------------------------------*/
/** disconnect
*
* @ autor : Rafael Erthal
* @ since : 2012-04
*
* @ description : Seta o status do usuario como desconectado
*
* @ param userId : identificação do usuário que esta disconectando do chat
*/
 
app.get('/:userId/disconnect', function(request, response){

    var Conversant = model.Conversant;
    
    Conversant.find({user : request.params.userId}, function(error, conversants){
        if(error) response.end('__parseJSONPResponse({"error" : "'+error+'"})');
	if(conversants[0] === undefined) response.end('__parseJSONPResponse({"error" : "Usuário não encontrado"})');
        
	var conversant = conversants[0];
	if(conversant.status === 'offline') response.end('__parseJSONPResponse({"error" : "Usuário deslogado"})');

	conversant.disconnect();

	response.end('__parseJSONPResponse({"error" : ""})');
	
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
 
app.get('/:userId/unread-messages', function(request, response){

    var Conversant = model.Conversant;
    
    Conversant.find({user : request.params.userId}, function(error, conversants){
        if(error) response.end('__parseJSONPResponse({"error" : "'+error+'"})');
	if(conversants[0] === undefined) response.end('__parseJSONPResponse({"error" : "Usuário não encontrado"})');
        
	var conversant = conversants[0];
	if(conversant.status === 'offline') response.end('__parseJSONPResponse({"error" : "Usuário deslogado"})');

	conversant.refreshStatus();
        
	conversant.unreadMessages(function(messages){
	    var length = messages.length;
	    response.write('__parseJSONResponse({"error" : "", "messages" : [');	    
	    
	    for(var i = 0; i < length; i++){	   
                messages[i].read(); 
	        response.write(messages[i].toJson());
                if(i != length - 1) response.write(',');
	    }
	    
	    response.end(']})');
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
 
app.get('/:userId/messages', function(request, response){

    var Conversant = model.Conversant;
    
    Conversant.find({user : request.params.userId}, function(error, conversants){
        if(error) response.end('__parseJSONPResponse({"error" : "'+error+'"})');
	if(conversants[0] === undefined) response.end('__parseJSONPResponse({"error" : "Usuário não encontrado"})');
        
	var conversant = conversants[0];
	if(conversant.status === 'offline') response.end('__parseJSONPResponse({"error" : "Usuário deslogado"})');

	conversant.refreshStatus();
        
	conversant.messages(function(messages){
	    var length = messages.length;
	    response.write('__parseJSONResponse({"error" : "", "messages" : [');	    
	    
	    for(var i = 0; i < length; i++){	    
	        response.write(messages[i].toJson());
                if(i != length - 1) response.write(',');
	    }
	    
	    response.end(']})');
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
 
app.get('/:userId/send-message', function(request, response){

    var Conversant = model.Conversant;
    
    Conversant.find({user : request.params.userId}, function(error, conversants){
        if(error) response.end('__parseJSONPResponse({"error" : "'+error+'"})');
	if(conversants[0] === undefined) response.end('__parseJSONPResponse({"error" : "Usuário não encontrado"})');
        
	var conversant = conversants[0];
	if(conversant.status === 'offline') response.end('__parseJSONPResponse({"error" : "Usuário deslogado"})');

        console.log(request.params.message);
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
    
    Conversant.find({user : request.params.userId}, function(error, conversants){
        if(error) response.end('__parseJSONPResponse({"error" : "'+error+'"})');
	if(conversants[0] === undefined) response.end('__parseJSONPResponse({"error" : "Usuário não encontrado"})');
        
	var conversant = conversants[0];
	if(conversant.status === 'offline') response.end('__parseJSONPResponse({"error" : "Usuário deslogado"})');

	conversant.refreshStatus();
        
	var length = conversant.activeChats.length;
	response.write('__parseJSONResponse({"error" : "", "activeChats" : [');	    
	    
	for(var i = 0; i < length; i++){	    
	    response.write('"' + conversant.activeChats[i] + '"');
            if(i != length - 1) response.write(',');
	}
	    
	response.end(']})');
    });
});

/*----------------------------------------------------------------------------*/

app.listen(33888);
