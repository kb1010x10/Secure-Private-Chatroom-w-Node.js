var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var urlencodedParser = bodyParser.urlencoded({extended : false})
var app = express();
var http = require('http').Server(app)
var io = require('socket.io')(http)

app.use(express.static(__dirname))
app.use(bodyParser.json())
var messages=[]
var users=[]

var anon = 0

app.get('/', (req, res) => {
   res.sendFile('index.html', {root: __dirname })
})

app.post('/send_message', urlencodedParser, (req,res) => {
   messages.push(req.body)
   io.emit('message')
   res.sendStatus(200)
})

app.get('/messages', (req,res)=>{
   res.send(JSON.stringify(messages))
})

io.on('connection', (socket)=>{
   var userId;
   
   console.log("A user has connected.")
   
   socket.on('setUserName', (data)=>{	  
	  if(data[0]=='A') {
		data = data.substring(1); //extract username
		
		if(users.indexOf(data)==-1){ //check if user is already in the chatroom
			if(data=="") { //join anonymously
				anon++
				data = "Anonymous " + anon
			}
			users.push(data);
			userId = data;
			
			console.log(data + " joined the chat!");
			io.emit('is_online', data, '<i>' + data + ' joined the chat!</i>');
			socket.emit('userSet', {username:data});
		 
		} else{ //user is already in the chatroom
			console.log(data + " tried to join the chat again.")
			io.emit('is_online', data, '<b>' + data + ' tried to join the chat again.</b>');
			socket.emit('userExists', `${data} already exists, please change your Username to join the chat`)
		}
	  }
	  else {
			console.log(data + ' attempted to join the chat with the wrong password.');
			io.emit('is_online', data, '<b>' + data + ' attempted to join the chat with the wrong password.</b>');
	  } 
   })
   socket.on('typing', (data)=>{
      if(data.typing==true)
         io.emit('display', data)
      else
         io.emit('display', data)
   })
   
   socket.on('disconnect', (data)=> {
	  console.log(userId + ' left the chat.')
	  
	  io.emit('is_online', userId, '<i>' + userId + ' left the chat.</i>')
   })
})

const port = process.env.PORT || 3000
var server = http.listen(port, () => {
   console.log(`app listening at port ${server.address().port}`)
})