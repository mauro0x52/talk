var Chat = function(chatId, kind){
    var temp = this;
    var from = {};
    var to = {};
    chatId = Chat.clearId(chatId);
    var div_id = chatId;

    var open = function(){
	if($('#chat_' + div_id).length) $('#chat_' + div_id).addClass('chat_active');
	else{
	    if(kind === 'seller')
                $(Chat.target).append('<div id="chat_' + div_id + '" class="chat_container active_chat" style="display:none;"><div class="chat_header">Converse com o visitante na sua página<span class="chat_close">X</span></div><div class="messages_container"></div><div class="form_container"><form><input type="text" class="chat_message" /><input type="submit" value="Enviar" /></form></div></div>');
            else
                $(Chat.target).append('<div id="chat_' + div_id + '" class="chat_container active_chat" style="display:none;"><div class="chat_header">Oi, tudo bem?<span class="chat_close">X</span></div><div class="messages_container"></div><div class="form_container"><form><input type="text" class="chat_message" /><input type="submit" value="Enviar" /></form></div></div>');

	    $.ajax({
                url : 'http://empreendemia.no-ip.org:33889/' + Chat.userId + '/open-chat/' + chatId,
	        dataType     : 'jsonp',
	        cache        : false,
	        timeout      : 1000,
		async        : false,
	        success      : render 
	    });
	}
    };

    var close = function(){
        $.ajax({
            url : 'http://empreendemia.no-ip.org:33889/' + Chat.userId + '/close-chat/' + chatId,
	    dataType     : 'jsonp',
            cache        : false,
	    timeout      : 1000,
            success      : function(data){
	        if(data.error === ""){
		    if(Chat.chatClose) Chat.chatClose(chatId, kind);
		    $('#chat_' + div_id).remove();
		}
	    }
	});   
    }

    var render = function(data){
        if(data.error !== "") return;
	if(Chat.open) Chat.chatOpen(chatId, kind);
        from = data.from;
	to   = data.to;
        $('#chat_' + div_id).fadeIn();
	$('#chat_' + div_id + ' form').submit(sendMessage);
	$('#chat_' + div_id + ' .chat_close').click(close);

	readMessages();
    }
   
    var sendMessage = function()
    {
        try{
            $.ajax({
                url : 'http://empreendemia.no-ip.org:33889/' + Chat.userId + '/send-message/' + chatId,
	        dataType     : 'jsonp',
	        data         :{
	            message  : $('#chat_'+div_id+' .chat_message').val() 
	        },
                success      : messageSent,
	        cache        : false,
	        timeout      : 1000 
	    });
	    return false;
	}
	catch(e){return false;}
    }

    var messageSent = function(){
        $('#chat_' + chatId + ' .messages_container').append((Chat.userId.indexOf('IP') === -1 ? Chat.userId : "Visitante") + " diz: " + $('#chat_' + chatId + ' .chat_message').val() + '<br />');  	
	$('#chat_' + div_id + ' .chat_message').val('');
        $('#chat_' + div_id + ' .messages_container').animate({"scrollTop": 900000});

	if(Chat.messageSend) Chat.messageSend(chatId, kind);
    }

    var readMessages = function(){
        try{	
            $.ajax({
                url : 'http://empreendemia.no-ip.org:33889/' + Chat.userId + '/messages/' + chatId,
	        dataType     : 'jsonp',
                success      : renderMessages,
	        cache        : false,
	        timeout      : 1000
	    });
            setInterval(function(){if($('#chat_' + div_id).length) unreadMessages();}, 1000);
	}
	catch(e){readMessages();}
    };

    var unreadMessages = function(){ {
        $.ajax({
            url : 'http://empreendemia.no-ip.org:33889/' + Chat.userId + '/unread-messages/' + chatId,
	    dataType     : 'jsonp',
            success      : renderMessages,
	    cache        : false,
	    timeout      : 1000
	});
    };

    var renderMessages = function(data){
	if(data.error !== "") unreadMessages();

	var messages = data.messages;
        var length = messages.length;

        for(var i = 0; i < length; i++){
	    if(messages[i].from === from._id)
            	$('#chat_' + div_id + ' .messages_container').append((from.user.indexOf('IP') === -1 ? from.user : "Visitante") + " diz: " + messages[i].message + '<br />');  
            else
	        $('#chat_' + div_id + ' .messages_container').append((to.user.indexOf('IP') === -1 ? to.user : "Visitante") + " diz: " + messages[i].message + '<br />');  

	    $('#chat_' + div_id + ' .messages_container').animate({"scrollTop": 900000});

	    if(messages[i].status === 'unread') Chat.startAlert();

            if(Chat.messageReceive)Chat.messageReceive(chatId, kind);	    
	}
    };

    open();
};

Chat.alerting = false;
Chat.oldTitle = document.title;

Chat.clearId = function (text) {
    text = text.replace(new RegExp('[ÁÀÂÃ]','gi'), 'a');
    text = text.replace(new RegExp('[ÉÈÊ]','gi'), 'e');
    text = text.replace(new RegExp('[ÍÌÎ]','gi'), 'i');
    text = text.replace(new RegExp('[ÓÒÔÕ]','gi'), 'o');
    text = text.replace(new RegExp('[ÚÙÛ]','gi'), 'u');
    text = text.replace(new RegExp('[Ç]','gi'), 'c');
    text = text.replace(new RegExp('[áàâã]','gi'), 'a');
    text = text.replace(new RegExp('[éèê]','gi'), 'e');
    text = text.replace(new RegExp('[íìî]','gi'), 'i');
    text = text.replace(new RegExp('[óòôõ]','gi'), 'o');
    text = text.replace(new RegExp('[úùûũ]','gi'), 'u');
    text = text.replace(new RegExp('[ç]','gi'), 'c');
    text = text.replace(new RegExp(' ','gi'), '');
    return text;
}

Chat.connect = function(params){
    Chat.target        = params.target;
    Chat.userId        = Chat.clearId(params.user);
    Chat.messageSend   = params.messageSend;
    Chat.messageReceive= params.messageReceive;
    Chat.chatOpen      = params.chatOpen;
    Chat.chatClose     = params.chatClose;
    
    setInterval(Chat.alert, 1000);
    $(Chat.target).click(Chat.stopAlert);

    $.ajax({
        url: 'http://empreendemia.no-ip.org:33889/' + Chat.userId + '/connect',
        dataType     : 'jsonp',
        success      : Chat.load,
        cache        : false,
	async        : true,
        timeout      : 1000
    });
};

Chat.startAlert = function(){
    Chat.alerting = true;
}

Chat.stopAlert = function(){
    Chat.alerting = false;
    document.title = Chat.oldTitle;
}

Chat.alert = function(){
    if(Chat.alerting)
        if(document.title === "Nova mensagem")
	    document.title = Chat.oldTitle;
	else
	    document.title = "Nova mensagem";
};

Chat.load = function(data){
    if(data.error !== "") return;
    setTimeout(function(){
        $.ajax({
            url: 'http://empreendemia.no-ip.org:33889/' + Chat.userId + '/active-chats',
            dataType     : 'jsonp',
            success      : Chat.render,
            cache        : false,
            timeout      : 1000,
        });}
	, 5000);
};

Chat.render = function(data){
    if(data.error !== "") return;
    var activeChats = data.activeChats;
    var length = activeChats.length;

    for(var i = 0; i < length; i++)
        if(!$('#chat_' + activeChats[i]).length)
	    new Chat(activeChats[i].user, activeChats[i].kind);		
    
    $('.chat_active').each(function(obj){
	for(var i = 0; i < length; i++)
	    if($(this).attr('id') === 'chat_' + activeChats[i].user) return;
         
	$('#' + $(this).attr('id') + ' .messages_container').append('Usuário saiu da conversa.<br />');
	$('#' + $(this).attr('id') + ' .messages_container').animate({"scrollTop": 900000});

	$(this).removeClass('chat_active');
    });

    Chat.load({error : ""});  
}
