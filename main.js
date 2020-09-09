var socket = io()
var user=""
var typing=false
var timeout=undefined

function setUserName(){
    socket.emit('setUserName', $('#unit').val())
}

socket.on('userExists', (data)=>{
    $('.error').text(`${data}`)
})

$(document).ready(function(){
    socket.on('userSet', (data)=>{
    user=data.username
    console.log(user)
    $("#area").html("<span class=\"input-group-text\">Message</span>")
    $("#unit").val("")
    $("#unit").attr("placeholder", "")
    $("#send").attr("onclick", "sendMessage()")
    $("#send").attr("value", "Send")
    $('.error').text("")
    getMessages()
    })
    $('#unit').keypress((e)=>{
    if($("#unit").attr("placeholder")!="Username"){
    if(e.which!=13){
        typing=true
        socket.emit('typing', {user:user, typing:true})
        clearTimeout(timeout)
        timeout=setTimeout(typingTimeout, 1500)
    } else{
        clearTimeout(timeout)
        typingTimeout()
        sendMessage()
    }
    }
    })

    socket.on('display', (data)=>{
    if(data.typing==true && user)
        $('.typing').text(`${data.user} is typing...`)
    else
        $('.typing').text("")
    })
})

socket.on('message',getMessages)

socket.on('is_online', function(username, userjoinedinfo) {
	if(user) {
		$('#messages').append($('<li>').html(userjoinedinfo))
	}
})

function typingTimeout(){
    typing=false
	socket.emit('typing', {user:user, typing:false})
}

function getMessages(){
    $.getJSON("http://localhost:3000/messages/", (data)=>{
        var message = []
        $.each(data, (key, val) => {
        $.each(val, (key, val) => {
            var username = key
            var msg = val
            message.push(`<h6>${username}</h6><p>${msg}</p>`)
        })
        })
    if(user) { //if user has joined the chat, display messages
		$(".chatbox").html(message)
	}
    })
}

function sendMessage(){
    var userName = user 
    var message = $('#unit').val()
    var unit = `{"${userName}" : "${message}"}`
    $.post('/send_message', JSON.parse(unit), ()=>{
    console.log('unit posted succesfully')
    })
    $('#unit').val("")
}