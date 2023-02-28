const signup = document.getElementById("signup")
const login = document.getElementById("login")

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
            console.log(xhr.responseText);
            var x = JSON.parse(xhr.responseText)

            if(x.status == "authComplete"){
                activeUser = x.user
				window.location.href = "/home"
            }


        } else {
            // Runs when it's not
            console.log(xhr.responseText);
        }
    
    };
}

checkAuth()

signup.addEventListener("submit", (e)=>{
    e.preventDefault()
    document.getElementById("submitSignup").value = "Loading..."
    const payload = {username: document.getElementById("name").value, password: document.getElementById("pass").value, email: document.getElementById("email").value}


    var xhr = new XMLHttpRequest();
xhr.open("POST", "/api/signup", true);
xhr.setRequestHeader('Content-Type', 'application/json');
xhr.send(JSON.stringify(payload));
xhr.onload = function () {
	// Process our return data

	if (xhr.status >= 200 && xhr.status < 300) {
		// Runs when the request is successful
        var x = xhr.responseText
        x = JSON.parse(x)

        if (x.status == "Account created") {
            document.getElementById("blur").style.display = "block"

        } else {
            alert(x.status)
        }

        document.getElementById("submitSignup").value = "Submit"


	} else {
		// Runs when it's not
		console.log(xhr.responseText);
	}



};



})

login.addEventListener("submit", async (e)=>{
    e.preventDefault()
    document.getElementById("submitLogin").value = "Loading..."
    const payload = {username: document.getElementById("nameLogin").value, password: document.getElementById("passLogin").value}



    var xhr = new XMLHttpRequest();
xhr.open("POST", "/api/login", true);
xhr.setRequestHeader('Content-Type', 'application/json');
xhr.send(JSON.stringify(payload));

xhr.onload = function () {
	// Process our return data
	if (xhr.status >= 200 && xhr.status < 300) {
		// Runs when the request is successful
		console.log(xhr.responseText);
        var x = xhr.responseText

        x= JSON.parse(x)

        if (x.status == "loginComplete") {
            var cookie = x.cookie
            var usern = x.username
    
            localStorage.setItem("auth", `{${cookie}: ${usern}}`)
            window.location.href = "/home"
        }

        else{
            document.getElementById("errLogin").innerText = x.status
        }


        document.getElementById("submitLogin").value = "Submit"

        

	} else {
		// Runs when it's not
		console.log(xhr.responseText);
	}

};
})


function signupchange() {
	var loginDiv = document.getElementById("loginDiv")
	var signupDiv = document.getElementById("signupDiv")

	loginDiv.style.display = "none"
	signupDiv.style.display = "block"
}

function loginchange(){
	var loginDiv = document.getElementById("loginDiv")
	var signupDiv = document.getElementById("signupDiv")

	loginDiv.style.display = "block"
	signupDiv.style.display = "none"
}
