const randColor = () =>  {
    return "#" + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0').toUpperCase();
}

document.getElementById("loadingDiv").style.backgroundColor = randColor()


document.getElementById("form").addEventListener("submit",(e)=>{
    e.preventDefault()

    var payload= {session:document.getElementById("managebacCookie").value, cookie:document.cookie.split("=")}
var xhr = new XMLHttpRequest();
xhr.open("POST", "/api/managebacsetup", true);
xhr.setRequestHeader('Content-Type', 'application/json');
xhr.send(JSON.stringify(payload));
xhr.onload = function () {
    // Process our return data
    if (xhr.status >= 200 && xhr.status < 300) {
        // Runs when the request is successful
        console.log(xhr.responseText);
        var x = JSON.parse(xhr.responseText)

        if(x.status =="set succesfully"){
            window.location.href = "/home"
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
                document.getElementById("loadingDiv").style.display = "none"
                document.getElementById("welcomeText2").innerText = x.user.username
                document.getElementById("profilePic").src = x.user.profilePic
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

function toHome(){
    window.location.href = "/home"
}
function toUntis() {
    window.location.href = "/home/untis"
}