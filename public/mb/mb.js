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
                document.getElementById("numMsgs").innerText = x.messages
                getMbData()
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

function getMbData() {
    var authCookie = {cookie: document.cookie.split("=")}
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/managebacscrapepage", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(authCookie));
    xhr.onload = function () {
        // Process our return data
        if (xhr.status >= 200 && xhr.status < 300) {
            // Runs when the request is successful
            var x = JSON.parse(xhr.responseText)
            if (x.status == "complete") {
                
            } else {
                
            }

        } else {
            // Runs when it's not
            console.log(xhr.responseText);
        }
    
    };
}

checkAuth()

function getMbSes(){
    window.open("https://ishthehague.managebac.com/tymelouxSetup", "_blank", 'location=yes,height=1,width=1,scrollbars=yes,status=yes')
}

function submit(){
    var x = document.getElementById("mbRequest").value
    const cookieString = x.match(/-H 'cookie: ([^']+)'/)[1];
    const managebacSession = cookieString.match(/_managebac_session=([^;]+)/)[1];
    console.log(managebacSession);
}


