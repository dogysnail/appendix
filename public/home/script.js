const randColor = () =>  {
    return "#" + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0').toUpperCase();
}

document.getElementById("loadingDiv").style.backgroundColor = randColor()




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

                document.getElementById("welcomeText").innerText = x.user.username
                document.getElementById("welcomeText2").innerText = x.user.username
                document.getElementById("welcomeText3").innerText = x.user.username
                document.getElementById("emailText").innerText = x.user.email
                document.getElementById("numMsgs").innerText = x.messages
                activeUser = x.user

                document.getElementById("profilePic").src = x.user.profilePic
                document.getElementById("profilePic2").src = x.user.profilePic
                document.getElementById("profilePic3").src = x.user.profilePic
                getUntis()

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


function logout() {
    var authCookie = document.cookie.split("=")
    var payload= {cookie:authCookie}
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/logout", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(payload));
    xhr.onload = function () {
        // Process our return data
        if (xhr.status >= 200 && xhr.status < 300) {
            // Runs when the request is successful
            console.log(xhr.responseText);
            var x = JSON.parse(xhr.responseText)
            
            if (x.status == "logoutSuccess!"){
                window.location.href = "/auth"
            }

        } else {
            // Runs when it's not
            console.log(xhr.responseText);
        }
    
    };
}


function getUntis() {
    var authCookie = document.cookie.split("=")

    var payload= {cookie:authCookie}
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/untis", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(payload));
    xhr.onload = function () {
        // Process our return data
        if (xhr.status >= 200 && xhr.status < 300) {
            // Runs when the request is successful


            var x = JSON.parse(xhr.responseText)

            if (x.status == "complete") {
                var cancelled = x.cancelledLessons.cancelled


                if (cancelled != undefined && JSON.stringify(cancelled) != "{}") {
                for (let index = 0; index < Object.keys(cancelled).length; index++) {
    
                    var z = document.getElementById("cancelledForm")
                    var y = document.createElement("li")
                    y.innerText = cancelled[index+1].name + " At: " + cancelled[index+1].time.toString() + " on: " + cancelled[index+1].date
                    z.appendChild(y)
    
                }
                document.getElementById("cancelledLessonsText").innerText = Object.keys(cancelled).length

                }
                else{
                    document.getElementById("cancelledLessonsText").innerText = "0"
                    var z = document.getElementById("cancelledForm")
                    var y = document.createElement("li")
                    y.innerText = "No Lessons Cancelled This Week :("
                    z.appendChild(y)
                }
                
            }
            else{
                console.log("error: Untis not set up")
                var z = document.getElementById("cancelledForm")
                var y = document.createElement("li")
                y.innerText = "Error: Untis is not set up"
                z.appendChild(y)
            }

        } else {
            // Runs when it's not
            console.log(xhr.responseText);
        }



    getMB()
    };
}


function getMB(){
    var authCookie = document.cookie.split("=")

    var payload= {cookie:authCookie}
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/managebac", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(payload));
    xhr.onload = function () {
        // Process our return data
        if (xhr.status >= 200 && xhr.status < 300) {
            // Runs when the request is successful


            var x = JSON.parse(xhr.responseText)
            var ul = document.getElementById("mbList")
            if (x.status == "complete") {

                var resp = JSON.parse(x.resp)

                if (resp.length == 0) {
                    var li = document.createElement("li")
                    li.innerText = "No Work, Whoo Hoo 🥳!"
                    document.getElementById("tasksDueText").innerText = "0"
                    ul.appendChild(li)
                } else {
                    for (let index = 0; index < resp.length; index++) {
                        var li = document.createElement("li")
                        li.innerText = resp[index].title
                        ul.appendChild(li)
                    }
                    document.getElementById("tasksDueText").innerText = resp.length
                }
                
        } 
        else{
            var li = document.createElement("li")
            li.innerText = x.status
            ul.appendChild(li)
        }
        
        document.getElementById("loadingDiv").style.display= "none"
        document.getElementById("main").style.display= "block"


    
    }
    else {
        // Runs when it's not
        console.log(xhr.responseText);
    }
            
}}




function previewImg() {
    var pfpInput = document.getElementById("pfpInput")
    var imgPreview = document.getElementById("imgPreview")
    imgPreview.src = pfpInput.value
    imgPreview.style.display= "block"
    pfpInput.style.display = "none"
    document.getElementById("pfpSubmit").style.display = "none"
}

function uploadImg() {
    var authCookie = document.cookie.split("=")
    var payload= {img:document.getElementById("pfpInput").value, cookie:authCookie}
    console.log(payload)
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/pfpChange", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(payload));
    xhr.onload = function () {
        // Process our return data
        if (xhr.status >= 200 && xhr.status < 300) {
            // Runs when the request is successful
            console.log(xhr.responseText);
            var x = JSON.parse(xhr.responseText)

            if(x.status == "200 OK"){
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
}

function showSettings() {
    document.getElementById("settings").style.display = "block"
    document.getElementById("accnt").style.display = "none"
    document.getElementById("widgets").style.display = "none"
    document.getElementById("dates").style.display = "none"
}

function toDate(){
    document.querySelector("#header > p > a:nth-child(2)").id = "activeHeader"
    document.querySelector("#header > p > a:nth-child(1)").id = ""
    document.getElementById("widgets").style.display = "none"
    document.getElementById("dates").style.display = "block"
}

function toStat(){
    document.querySelector("#header > p > a:nth-child(1)").id = "activeHeader"
    document.querySelector("#header > p > a:nth-child(2)").id = ""
    document.getElementById("widgets").style.display = "grid"
    document.getElementById("dates").style.display = "none"
}

function hideSettings() {
    document.getElementById("settings").style.display = "none"
    document.getElementById("accnt").style.display = "grid"
    document.getElementById("widgets").style.display = "grid"
    document.getElementById("dates").style.display = "none"
    document.querySelector("#header > p > a:nth-child(1)").id = "activeHeader"
    document.querySelector("#header > p > a:nth-child(2)").id = ""
    document.getElementById("widgets").style.display = "grid"
    document.getElementById("dates").style.display = "none"
}

function toUntis() {
    window.location.href = "/home/untis"
}

function toMB() {
    window.location.href = "/home/mb"
}