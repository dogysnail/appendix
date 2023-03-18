    function makeReq(path, newMail){
        var authCookie = document.cookie.split("=")
        var payload = {cookie:authCookie, email:newMail}
        var xhr = new XMLHttpRequest();
        document.getElementById("resend").disabled = true
        xhr.open("POST", "/api/"+path, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(payload));
        xhr.onload = function () {
            var count = 60, timer = setInterval(function() {
                document.getElementById("resend").value = count
                count = count-1
                if(count == 1){
                    document.getAnimations("resend").value = "Resend Email"
                    clearInterval(timer);
                } 
            }, 1000);
        if (xhr.status >= 200 && xhr.status < 300) {
        console.log(xhr.responseText);
        var x = JSON.parse(xhr.responseText)
        alert(x.status)
    } else {
        console.log(xhr.responseText);
    }

};
    }


function checkCookie(){
    var authCookie = document.cookie.split("=")
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/checkcookie", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(authCookie));
    xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 300) {
    console.log(xhr.responseText);
    var x = JSON.parse(xhr.responseText)
    document.getElementById("email").innerText = x.user.email
} else {
    console.log(xhr.responseText);
}
}}

checkCookie()