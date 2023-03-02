
var activeUser = undefined

function checkAuth() {
    var authCookie = document.cookie.split("=")
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/checkcookie", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(authCookie));
    xhr.onload = function () {
        // Process our return data
        if (xhr.status >= 200 && xhr.status < 300) {
            // Runs when the request is successful
            var x = JSON.parse(xhr.responseText)

            if(x.status == "authComplete"){
                document.getElementById("welcomeText2").innerText = x.user.username
                document.getElementById("profilePic").src = x.user.profilePic
                checkMsgs()
            }

            else{
                window.location.href = "/auth"
            }

        } else {
            // Runs when it's not
            console.log(xhr.responseText);
        }
    
    };
}

checkAuth()



function checkMsgs() {
    var authCookie = document.cookie.split("=")
    console.log(authCookie)
    var y = {cookie:authCookie}
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/messages", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(y));
    xhr.onload = function () {
        // Process our return data
        if (xhr.status >= 200 && xhr.status < 300) {
            // Runs when the request is successful
            var x = JSON.parse(xhr.responseText)
            console.log(x.status)
            if(x.status == "Success"){
                document.getElementById("loadingDiv").style.display = "none"
                console.log(x)
                var ul = document.getElementById("ul")
                console.log(x.messages.length)
                if (x.messages.length == undefined) {
                    console.log("You have no messages")
                    var li = document.createElement("li")
                    var h2 = document.createElement("h2")
                    var h3 = document.createElement("h3")
                    h2.innerText = `You have no messages right now. `
                    li.appendChild(h2)
                    h3.innerText = "Maybe check back later for new messages :)"
                    li.appendChild(h3)
                    ul.appendChild(li)
                } 
                else {
                    for (let index = 0; index < x.messages.length; index++) {
                        const element = x.messages[index];
                        console.log(element)

                        var li = document.createElement("li")
                        var h2 = document.createElement("h2")
                        var h3 = document.createElement("h3")
                        h2.innerText = `Message `+ (parseInt(index)+1)
                        li.appendChild(h2)
                        h3.innerText = element
                        li.appendChild(h3)
                        ul.appendChild(li)
                    }
                }
            }

            else{
                //window.location.href = "/auth"
            }

        } else {
            // Runs when it's not
            console.log(xhr.responseText);
        }
    
    };
    
}

document.getElementById("msgForm").addEventListener("submit", (e)=>{
    e.preventDefault()
    var authCookie = document.cookie.split("=")
    var message = document.getElementById("message").value
    var recipient = document.getElementById("recipient").value
    var xhr = new XMLHttpRequest();
    var payload = {cookie:authCookie, message:message, recipient:recipient}
    xhr.open("POST", "/api/sendmsg", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(payload));
    xhr.onload = function () {
        // Process our return data
        if (xhr.status >= 200 && xhr.status < 300) {
            // Runs when the request is successful
            var x = JSON.parse(xhr.responseText)

            if(x.status == "success"){
                alert("Message succesfully sent")
            }
            else{
                alert(x.status)
            }
            
        } else {
            // Runs when it's not
            console.log(xhr.responseText);
        }
    
    };
})