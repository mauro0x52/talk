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

var mongoose = require('mongoose'),
    schema = mongoose.Schema;
    
mongoose.connect('mongodb://empreendemia:kawasaki88@staff.mongohq.com:10034/empreendemia');

/*----------------------------------------------------------------------------*/
/** Conversant
*
* @ autor : Rafael Erthal
* @ since : 2012-04
*/
 
var ConversantSchema = new schema({
    user        : {type : String, trim : true, required : true} ,
    status      : {type: String, enum : ['online', 'offline'], default : 'offline'} ,
    lastCheck   : {type : Date}, 
    activeChats : [String]
});

/* enableChat
 * ativa na seção do usuario um chat com o user passado como parametro
 */
ConversantSchema.methods.enableChat = function(user){
    if(this.activeChats.indexOf(user) === -1)
    {
	this.activeChats.push(user);
	this.save();
    }
};

/* disableChat
 * desativa na seção do usuario um chat com o user passado como parametro
 */
ConversantSchema.methods.disableChat = function(user){
    var i = this.activeChats.indexOf(user);
    if(i !== -1){
	this.activeChats.splice(i, 1);
	this.save();
    }
};

/* sendMessage
 * envia uma mensagem e caso o chat ainda nao tenha sido ativado, ativa-o
 */
ConversantSchema.methods.sendMessage = function(params){
    Conversant.find({user : params.to}, function(error,to){ 
        if(error) throw error
        if(to[0] === undefined) throw "Usuário não encontrado."

	var newMessage = new Message({
            message : params.message ,
            from    : this._id ,
	    to      : to[0]._id ,
	    status  : 'unread' ,
            date    : new Date()
        });

        newMessage.save(function(error){
            if(error) throw error;
	    this.enableChat(params.to);
        });
    });
};

/* forEachMessage
 * itera sobre todas as mensagens do usuario
 */
ConversantSchema.methods.messages = function(cb){
    var to = this;
    Message.find({to : this._id}, function(error, messages){
	if(error) throw error;
	cb(messages);
    });
};

/* forEachUnreadMessage
 * itera sobre todas as mensagens não lidas do usuario
 */
ConversantSchema.methods.unreadMessages = function(){
    var to = this;
    Message.find({to : this._id, status : 'unread'}, function(error, messages){
	if(error) throw error;
        cb(messages);
    });
};

/* enableChat
 * ativa a seção do usuario
 */
ConversantSchema.methods.connect = function(){
    this.lastCheck = new Date();
    this.status = 'online';

    var conversant = this;
    this.save(function(error){
        conversant.checkStatus();
    });
};

/* disableChat
 * desativa a seção do usuario
 */
ConversantSchema.methods.disconnect = function(){
    this.lastCheck = new Date();
    this.status = 'offline';
    for(var i = 0; i < this.activeChats.lenght; i++) this.disableChat(this.activeChats[i].user);

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
    var now = new Date();
    var conversant = this;

    console.log(this.status);
    if(now.getTime() - this.lastCheck.getTime() > 10000)
	this.disconnect();
    
    else setTimeout(function(){conversant.checkStatus()}, 5000);
    
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

/* enableChat
 * ativa a seção do chat para os dois usuarios
 */
MessageSchema.methods.enableChat = function(){
    this.findTo(function(to){
        this.findFrom(function(from){
	    if(to.status === 'online' && from.status === 'online'){
                to.enableChat(from.user);
		from.enableChat(to.user);
	    }
	});
    });
};

/* findFrom
 * retorna o Conversant remetente da mensagem
 */
MessageSchema.methods.findFrom = function(cb){
    Conversant.find({_id : this.from}, function(error, conversants){
        if(error) throw error;
        if(conversants[0] === undefined) throw "Usuário não encontrado";
        cb(conversants[0]);
    });  
};

/* findTo
 * retorna o Conversant destinatário da mensagem
 */
MessageSchema.methods.findTo = function(cb){
    Conversant.find({_id : this.to}, function(error, conversants){
        if(error) throw error;
        if(conversants[0] === undefined) throw "Usuário não encontrado";
        cb(conversants[0]);
    }); 
};

MessageSchema.methods.toJson = function(){
    return '{"id" : "' + this._id + '", "message" : "' + this.message + '", "from" : "' + this.from + '", "to" : "' + this.to + '", "status" : "' + this.status + '", "date" : "' + this.date + '"}'
}

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
