/*----------------------------------------------------------------------------*/
/** Model.js
*
* @ package : Talk
* @ namespace : Model
*
* @ autor : Rafael Erthal
* @ since : 2012-04
*
* @ description : Modelagem dos chats
*/

var config = require('./config.js')
var mongoose = require('mongoose'),
    schema = mongoose.Schema;
    
mongoose.connect('mongodb://' + config.dbUrl);

/*----------------------------------------------------------------------------*/
/** Conversant
*
* @ autor : Rafael Erthal
* @ since : 2012-04
*/
 
var ConversantSchema = new schema({
    company     : {type : String, trim : true} ,
    user        : {type : String, trim : true, required : true} ,
    label       : {type : String, trim : true, required : true} ,
    typing      : {type : Boolean, required : true, default : false} ,
    status      : {type: String, enum : ['online', 'offline'], default : 'offline'} ,
    lastCheck   : {type : Date}, 
    activeChats : [{user : {type : String}, kind : {type : String, enum : ['buyer','seller']}}]
});

/* chats
 * retorna todos os chats do usuario
 */
ConversantSchema.methods.chats = function(cb){
    var chats = {};
    var that = this;

    Message.find({$or : [{from : this._id}, {to : this._id}], status : 'read', message : {$nin : ['systemcontrolmessageuserstarttyping','systemcontrolmessageuserstoptyping']}},function(error, messages){
        if(error) throw error;
	for(var i = 0; i < messages.length; i++)
	{
	    var id;
	    var from = "";

	    if(messages[i].from.toString() === that._id.toString())
	    {
	        id = messages[i].to.toString();
		messages[i].who = "me";
	    }
	    else
	    {
	        id = messages[i].from.toString();
		messages[i].who = "other";
	    }

	    if(chats[id] === undefined && id !== that._id.toString())
	    {
	        chats[id] = {
		    messages : []
		};
	    }

	    chats[id].messages.push(messages[i])
	}
        cb(that,chats);
    }); 
};

/* indexOfActiveChat
 * retorna o indice do chat com determinado usuario
 */
ConversantSchema.methods.indexOfActiveChat = function(user){
    for(var i = 0; i < this.activeChats.length; i++)
        if(this.activeChats[i].user === user) return i;
    return -1
};

/* enableChat
 * ativa na seção do usuario um chat com o user passado como parametro
 */
ConversantSchema.methods.enableChat = function(user, cb){
    var from = this;
    Conversant.find({user : user}, function(error, conversants){
        if(error) throw error;
        var to = conversants[0];
        if(to === undefined){
	    if(cb) cb("Usuáio não encontrado"); 
	    return;
	}

        if(to.status === 'offline' || from.status === 'offline'){
	    if(cb) cb("Usuário desconectado"); 
	    return;
	}

        if(from.indexOfActiveChat(to.user) === -1)
        {
	    from.activeChats.push({user : to.user, kind : 'buyer'});
            from.save();
        }
        
	if(to.indexOfActiveChat(from.user) === -1)
        {
	    to.activeChats.push({user : from.user, kind : 'seller'});
            to.save();
        }

	if(cb) cb("",from,to);
    });
};

/* disableChat
 * desativa na seção do usuario um chat com o user passado como parametro
 */
ConversantSchema.methods.disableChat = function(user,cb){
    var from = this;
    Conversant.find({user : user}, function(error, conversants){
        if(error) throw error;
        var to = conversants[0];
	var i;

        if(to === undefined){
	    if(cb) cb("Usuáio não encontrado"); 
	    return;
	}
	
	i = from.indexOfActiveChat(to.user);
        if(i !== -1)
        {
	    from.activeChats.splice(i,1);
            from.save();
        }
        
	i = to.indexOfActiveChat(from.user);
	if(i !== -1)
        {
	    to.activeChats.splice(i,1);
            to.save();
        }

	if(cb) cb("");
    });
};

/* sendMessage
 * envia uma mensagem
 */
ConversantSchema.methods.sendMessage = function(params){
    var id = this._id;
    Conversant.find({user : params.to}, function(error,to){ 
        if(error) throw error
        if(to[0] === undefined) throw "Usuário não encontrado."

	var newMessageFrom = new Message({
            message : params.message ,
            from    : id ,
	    to      : to[0]._id ,
	    status  : 'unread' ,
            date    : new Date()
        });

        newMessageFrom.save();
    });
};

/* messages
 * todas as mensagens do usuario com user
 */
ConversantSchema.methods.messages = function(user, cb){
    var id = this._id;
    Conversant.find({user : user}, function(error, conversants){
        if(error) throw error;
	var user = conversants[0];
	if(user === undefined) throw "Chat não encontrado.";

        Message.find({$or : [{to : id, from : user._id}, {to : user._id, from : id}], status : 'read', message : {$nin : ['systemcontrolmessageuserstarttyping','systemcontrolmessageuserstoptyping']}},function(error, messages){
	    if(error) throw error;
	    cb(messages);
        }); 
    });
};

/* unreadMessages
 * todas as mensagens não lidas do usuario com user
 */
ConversantSchema.methods.unreadMessages = function(user, cb){
    var id = this._id;
    Conversant.find({user : user}, function(error, conversants){
        if(error) throw error;
        var user = conversants[0];
	if(user === undefined) throw "Chat não encontrado.";

        Message.find({to : id, from : user._id, status : 'unread'}, function(error, messages){
	    if(error) throw error;
	    cb(messages);
        }); 
    });
};

/* enableChat
 * ativa a seção do usuario
 */
ConversantSchema.methods.connect = function(){
    this.lastCheck = new Date();
    this.status = 'online';

    this.save(function(error, conversant){
        conversant.checkStatus();
    });
};

/* disableChat
 * desativa a seção do usuario
 */
ConversantSchema.methods.disconnect = function(){
    this.lastCheck = new Date();
    this.status = 'offline';
    this.typing = false;

    var activeChats = this.activeChats;
    
    for(var i = 0; i < activeChats.length; i++)
        if(activeChats[i] !== undefined)
            this.disableChat(activeChats[i].user);

    this.save();
};

/* refreshStatus
 * atualiza a seção do usuario
 */
ConversantSchema.methods.refreshStatus = function()
{
    this.lastCheck = new Date();
    this.save();
};

/* checkStatus
 * verifica se o usuario ainda esta online
 */
ConversantSchema.methods.checkStatus = function(){
    var id = this._id
    setTimeout(function(){
        Conversant.find({_id : id}, function(error,data){
	    if(error) throw error;
            if(data[0] === undefined) throw "Usuário não encontrado.";
            
	    var now = new Date();
	   
	    if(now.getTime() - data[0].lastCheck.getTime() > 20000)
	        data[0].disconnect();
            else
	        data[0].checkStatus();
	});
    }, 5000);
};

var Conversant = mongoose.model('Conversant', ConversantSchema);

/*----------------------------------------------------------------------------*/
/** Message
*
* @ autor : Rafael Erthal
* @ since : 2012-04
*/

var MessageSchema = new schema({
    message    : {type : String} ,
    from       : schema.ObjectId ,
    to         : schema.ObjectId ,
    status     : {type: String, enum : ['read', 'unread'], default : 'unread'},
    date       : Date
});

/* read
 * marca a mensagem como lida
 */
MessageSchema.methods.read = function(){
    this.status='read';
    this.save();
};

var Message = mongoose.model('Message', MessageSchema);

/*----------------------------------------------------------------------------*/
                         /* Montagem do namespace */

module.exports = {
    Message          : Message ,
    Conversant       : Conversant ,

    MessageSchema    : MessageSchema,
    ConversantSchema : ConversantSchema
}

/*----------------------------------------------------------------------------*/
