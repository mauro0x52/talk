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
    user        : [String] ,
    status      : {type: String, enum : ['online', 'offline'], default : 'offline'} ,
    lastCheck   : {type : Date}, 
    activeChats : [String]
});

ConversantSchema.methods.enableChat = function(user){
    if(this.activeChats.indexOf(user) === -1)
    {
	this.activeChats.push(user);
	this.save();
    }
};

ConversantSchema.methods.disableChat = function(user){
    var i = this.activeChats.indexOf(user);
    if(i !== -1){
	this.activeChats.splice(i, 1);
	this.save();
    }
};

ConversantSchema.methods.sendMessage = function(params){
    var newMessage = new Message({
        message : params.message ,
        from    : this._id ,
	to      : params.to ,
	status  : 'unread' ,
        date    : new Date()
    });

    newMessage.save(function(error){
        if(error) throw error;
	this.enableChat();
    });
};

ConversantSchema.methods.forEachMessage = function(cb){
    var to = this;
    Message.find({to : this._id}, function(error, messages){
	if(error) throw error;
	
	messages.forEach(function(message){
	    cb(message);
	});    
    });
};

ConversantSchema.methods.forEachUnreadMessage = function(cb){
    this.forEachMessage(function(message){
        if(message.status === 'unread') cb(message);
    });
};

ConversantSchema.methods.connect = function(cb){
    this.lastCheck = new Date();
    this.status = 'online';

    this.save(function(error){
        this.checkStatus();
    });
};

ConversantSchema.methods.disconnect = function(cb){
    this.lastCheck = new Date();
    this.status = 'offline';

    this.save();
};

ConversantSchema.methods.refreshStatus = function()
{
    this.lastCheck = new Date();
    this.save();
};

ConversantSchema.methods.checkStatus = function(){
    var now = new Date();

    if(now.getTime() - this.lastCheck.getTime() > 10000) {
	this.disconnect();
	for(var i = 0; i < this.activeChats.lenght; i++) this.disableChat(this.activeChats[i].user);
    }
    else setTimeout(this.checkStatus, 5000);
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

MessageSchema.methods.read = function(){
    this.status='read';
    this.save();
};

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

MessageSchema.methods.findFrom = function(cb){
    Conversant.find({_id : this.from}, function(error, conversants){
        if(error) throw error;
        if(conversants[0] === undefined) throw "Usuário não encontrado";
        cb(conversants[0]);
    });  
};

MessageSchema.methods.findTo = function(cb){
    Conversant.find({_id : this.to}, function(error, conversants){
        if(error) throw error;
        if(conversants[0] === undefined) throw "Usuário não encontrado";
        cb(conversants[0]);
    }); 
};

MessageSchema.methods.toJson = function(){
    return '{"message" : "' + this.message + '", "from" : "' + this.from + '", "to" : "' + this.to + '", "status" : "' + this.status + '", "date" : "' + this.date + '"}'
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
