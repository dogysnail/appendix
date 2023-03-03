function ban() {
    var user = document.getElementById("5").value
    var authCookie = document.cookie.split("=")
    var pay = {cookie: authCookie, username: user}
    makeRequest("ban", pay)
}

function unban() {
    var user = document.getElementById("6").value
    var authCookie = document.cookie.split("=")
    var pay = {cookie: authCookie, username: user}
    makeRequest("unban", pay)
}

function deleteUser() {
    var user = document.getElementById("7").value
    var authCookie = document.cookie.split("=")
    var pay = {cookie: authCookie, username: user}
    makeRequest("deleteuser", pay)
}

function verify() {
    var user = document.getElementById("3").value
    var authCookie = document.cookie.split("=")
    var pay = {cookie: authCookie, username: user}
    makeRequest("adminverify", pay)
}


function unverify(){
    var user = document.getElementById("4").value
    var authCookie = document.cookie.split("=")
    var pay = {cookie: authCookie, username: user}
    makeRequest("unverify", pay)
}

function message(){
    var user = document.getElementById("1").value
    var msg = document.getElementById("2").value
    var authCookie = document.cookie.split("=")
    var pay = {cookie: authCookie, username: user, message:msg}
    makeRequest("sendmsg", pay)
}




function makeRequest(path, payload) {
    var xhr = new XMLHttpRequest();
    var y = JSON.stringify(payload)
    xhr.open("POST", "/api/" + path, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(y);
    xhr.onload = function () {
        // Process our return data
        if (xhr.status >= 200 && xhr.status < 300) {
            // Runs when the request is successful
            var x = JSON.parse(xhr.responseText)

            alert(x.status)
            
        } else {
            // Runs when it's not
            console.log(xhr.responseText);
        }
    
    };
}