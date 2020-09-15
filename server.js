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

var mysql = require('mysql')

var con = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "Mathgenius1998",
	database: "mydb"
});

var pw = new String("123"); //this is the password

con.connect(function(err) {
	if (err) throw err;
	console.log("Connected to MySQL database.");
	
	/*con.query("CREATE DATABASE mydb", function (err, result) {
		if (err) throw err;
		console.log("Database created.");
	});
	
	var sql = "CREATE TABLE users (name VARCHAR(15))";
	con.query(sql, function (err, result){
		if (err) throw err;
		console.log("Table Created.");
	});
	
	var sql = "ALTER TABLE users ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY";
	con.query(sql, function (err, result) {
		if(err) throw err;
		console.log("Table altered.");
	});*/
});

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
	  if(data.substring(0,pw.length)==pw) {
		data = data.substring(pw.length); //extract username
		
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
			
			//add user to database
			var sql = "INSERT INTO users (name) VALUES ('" + data + "')";
			con.query(sql, function(err, result) {
				if (err) throw err;
				console.log("1 record inserted.");
			});
			
			con.query("SELECT * FROM users", function(err, result, fields) {
				if (err) throw err;
				console.log(result);
				
			});
		 
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
	  
	  var sql = "DELETE FROM users WHERE name='" + userId + "'";
	  con.query(sql, function(err, result) {
		  if (err) throw err;
	  });
	  
	  io.emit('is_online', userId, '<i>' + userId + ' left the chat.</i>')
   })
})

const port = process.env.PORT || 3000
var server = http.listen(port, () => {
   console.log(`app listening at port ${server.address().port}`)
})