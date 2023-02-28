const express = require("express")
require('dotenv').config()

var resp = ""
const request = require('request');
const fs = require("fs");
var date = new Date
var month = parseInt(date.getMonth())
month = month+1
var formattedDate = date.getFullYear() + "-" + month + "-" + date.getDate()
var untisResult = undefined

const bcrypt = require('bcrypt');
const unirest = require('unirest');
const saltrnd = 5
const nodemailer = require("nodemailer");
var cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion } = require('mongodb');
const PORT = process.env.PORT || 3000
const app = express()
const path = require("path");
const { randomInt, randomBytes, randomUUID } = require("crypto");
const rateLimit = require("express-rate-limit")
const uri = `mongodb+srv://admin:${process.env.MONGODBPASS}@authcluster.uoxofvv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
app.use('/home', express.static(path.join(__dirname, 'public/home')))
app.use("/auth", express.static(path.join(__dirname, 'public/auth')))
app.use(express.urlencoded({extended: true})); 
app.use(express.json())
app.use(cookieParser());

const limiter = rateLimit({
	windowMs: 300,
	max: 1, 
	standardHeaders: true,
	legacyHeaders: false,
})
app.use("/api", limiter)

async function sendVerificationEmail(email, id){

    var verifyLink = "http://http://139.162.146.133:3000/verify/" + id + "/"
    let transporter = nodemailer.createTransport({
        host: "smtp-mail.outlook.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL, // generated ethereal user
      pass: process.env.EMAILPASS, // generated ethereal password
    }
    })

    var mailData = {
        from: `"Verification Email" <${process.env.EMAIL}>`, // sender address
        to: email, // list of receivers
        subject: "Verify your email!", // Subject line
        text: "Please verify your email by clicking this link: " + verifyLink + "\n\n\n Did you not request this email or create a account? Then please ignore it", // plain text body
      }

    await new Promise((resolve, reject) => {
        transporter.sendMail(mailData, (err, info) => {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            resolve(info);
          }
        });
      });
}

var crntUser = ""
var untisData = undefined

//untis functions

function checkUntisLogin(jses) {
    var options = {
        'method': 'GET',
        'url': `https://erato.webuntis.com/WebUntis/api/public/timetable/weekly/data?elementType=5&elementId=5052&date=${formattedDate}&formatId=6`,
        'headers': {
          'Cookie': `schoolname="_aXNo"; traceId=814e60d2ecfdc9f8a8661c0a8428972364d9e028; JSESSIONID=${jses}`,
          'Refer': 'https://erato.webuntis.com/WebUntis/embedded.do?showSidebar=false'
        }
      };


      request(options, function (error, response) {
        if (error) {
          console.error(error)
        }
        else {      

           try {
            JSON.parse(response.body)


            untisData = response.body

            untisResult =   "is a real account"
           } catch (error) {
            console.log(error)
            untisResult =   "not a real account"
           }

        }
})}

async function getUntisKey(username,password){
    var jsessionid = undefined
    var req = unirest('POST', 'https://erato.webuntis.com/WebUntis/j_spring_security_check')
    .headers({
      'Content-Type': 'application/x-www-form-urlencoded',
    })
    .send('school=ish')
    .send(`j_username=${username}`)
    .send(`j_password=${password}`)
    .send('token=')
    .end(function (res) { 
      if (res.error) throw new Error(res.error); 
        jsessionid = res.cookies.JSESSIONID
        jses = jsessionid
    });


}

// account settings functions

async function setPfp(id, link) {
    try {
        await client.connect(uri)
        const database = client.db('auth');
        const creds = database.collection('creds');
        const updateDoc = {$set:{profilePic:link}}
        const filter = {id: id}
        const result = await creds.updateOne(filter, updateDoc)
        success = result

    }
    finally{
        await client.close()
    }
    
}

async function changeUser(id, username){
    try {
        await client.connect(uri)
        const database = client.db('auth');
        const creds = database.collection('creds');
        const updateDoc = {$set:{username:username}}
        const filter = {id: id}
        const result = await creds.updateOne(filter, updateDoc)
        success = result

    }
    finally{
        await client.close()
    }
}

// mongodb / auth functions

var success = ""

async function updateUntisInfo(user, pass, id){
    try {
        await client.connect(uri)
        const database = client.db('auth');
        const creds = database.collection('creds');
        const updateDoc = {$set:{untis:{user: user, pass:pass}}}
        const filter = {id: id}
        await creds.updateOne(filter, updateDoc)
        const result = await creds.updateOne(filter, updateDoc)
        success = result

    }
    finally{
        await client.close()
    }
}

async function signup(username, password, email) {
    try {
        await client.connect(uri)
        const database = client.db('auth');
        const creds = database.collection('creds');
        var randID = randomUUID()
        const doc = {id:randID ,username: username, email: email, password: password, profilePic: "https://iili.io/HG5BF9t.png", untis:undefined, mbSession:undefined, messages:{}, verified: false}
        const result = await creds.insertOne(doc)
        await run(username)   
        sendVerificationEmail(crntUser.email, crntUser.id)
        //
    }
    finally{
        await client.close()
    }
}

async function login(username){
    try {
        await client.connect(uri)
        const database = client.db('auth');
        const creds = database.collection('creds');
        const result = await creds.findOne({username: username})
        success = result

    }
    finally{
        await client.close()
    }
}

async function asignCookie(username, cookie) {
    try {
        await client.connect(uri)
        const database = client.db('auth');
        const creds = database.collection('creds');
        const updateDoc = {$set:{cookie:{[cookie]:"s"}}}
        const updateDoc2 = {$set:{cookie:{}}}
        const filter = {username: username}
        await creds.updateOne(filter, updateDoc2)
        const result = await creds.updateOne(filter, updateDoc)
        success = result

    }
    finally{
        await client.close()
    }
}

async function checkCookie(cookie){
    try {
        await client.connect(uri)
        const database = client.db('auth');
        const creds = database.collection('creds');
        const result = await creds.findOne({cookie:{[cookie]:"s"}})
        success = result

    }
    finally{
        await client.close()
    }
}

async function verifyUpdate(userid){
    try {
        await client.connect(uri)
        const database = client.db('auth');
        const creds = database.collection('creds');
        const query = { id: userid };
        const result = await creds.findOne(query);
        success = result
        
      } finally {        
        await client.close();    
      }
}

async function verifyTrue(userid){
    try {
        await client.connect(uri)
        const database = client.db('auth');
        const creds = database.collection('creds');
        const updateDoc = {$set:{verified:true}}
        const filter = {id: userid}
        await creds.updateOne(filter, updateDoc)
        const result = await creds.updateOne(filter, updateDoc)
        success = result

    }
    finally{
        await client.close()
    }
}

async function run(usr) {
    try {
      await client.connect(uri)
      const database = client.db('auth');
      const creds = database.collection('creds');
      const query = { username: usr };
      const result = await creds.findOne(query);
      crntUser = result
      
    } finally {
      // Ensures that the client will close when you finish/error
      
      await client.close();
  
      
    }
  }


async function logout(user){
    try {
        await client.connect(uri)
        const database = client.db('auth');
        const creds = database.collection('creds');
        const updateDoc2 = {$set:{cookie:{}}}
        const filter = {username: user}
        const result = await creds.updateOne(filter, updateDoc2)
        success = result

    }
    finally{
        await client.close()
    }
}



// friends system


var jses = undefined








// auth system

app.post("/api/logout", async (req,res)=>{
    var username = req.body.user
    await logout(username)
    res.send({status:"logoutSuccess!"})
})


app.get("/verify/:userID/", async (req,res)=>{
    var id = req.params.userID
    await verifyUpdate(id)


    if(success.verified == false){
        await verifyTrue(id)
        res.redirect("/home")
    }
    else{
        res.send("You have already been verified.")
    }
})


app.post("/api/signup", async (req, res) =>{

    var user = req.body.username
    var pass = req.body.password
    var email = req.body.email

    if (user == "" || pass == "" || email == "") {
        res.send({status:"Error: Empty Fields"})
    } else {
        
    


    await run(user)
    
    var usr = crntUser

    


    if (usr != null){
        res.send({status:"Error: Account under that name already exists"})
        

    }
    else {


        bcrypt.genSalt(saltrnd, async(err, salt)  =>{
            bcrypt.hash(pass, salt, async function(err, hash) {
                await signup(user, hash, email)
                var cookie = randomUUID()
                await asignCookie(user, cookie)
                res.cookie("auth", cookie, {expires: new Date().now+900000})
                res.send({status: "Account created"})
            });
        })
        
        
        
        
    }
    
    }
})

app.post("/api/messages", async (req,res)=>{

    var cookie = req.body.cookie[1]

    if (cookie == undefined) {
        res.send({status:"Error: wrong cookie"})
    }
    else{
        await checkCookie(cookie)

        if (success == undefined) {
            res.send({status:"Error: wrong cookie"})
        } else {
            res.send({status:"Success", messages:success.messages})
        }
    }
})


app.post("/api/checkcookie", async (req,res)=>{


    var cookie = req.body[1]
    await checkCookie(cookie)

     if (success == undefined){
         // cookie doesnt exist
         res.send({status: "Error: Cookie doesnt exist..."})
     }
     else {

        if (success.verified == false) {
            res.sendFile(__dirname + "/public/unverified.html")
        }
        else{

            if (success.messages.length == undefined) {
                var k = 0
            } else {
                k = success.messages.length
            }
            res.send({status: "authComplete", user:{username: success.username, email: success.email, profilePic: success.profilePic}, messages:k})
        }
     }
    
})

app.post("/api/login", async (req, res) =>{
    var user = req.body.username
    var pass = req.body.password
    var accntPass = undefined

    //check if user actually exists
    await login(user)
    if (success != null){
        accntPass = success.password


        bcrypt.compare(pass, accntPass, async function(err, result) {
            // result == true


            if (result == true){
                    var cookie = randomUUID()
                    await asignCookie(user, cookie)
                   
                    res.cookie("auth", cookie, {expires: new Date().now+900000})
                    res.send({status:"loginComplete", cookie:cookie, username:user})
            }

            else {
                res.send({status:"Error: Wrong username / password"})
            }
        });

    }
    else{
        res.send({status:"Error: Wrong username / password"})
    }

})

app.post("/api/untis", async (req, res)=>{

    if (req.body.cookie == undefined){
        res.send({status:"Error: Invalid Cookie"})
    }

    else{

    var cookie = req.body.cookie[1]

    await checkCookie(cookie)

    var untisLogin = success.untis

    if (untisLogin == undefined) {
        res.send({status: "Error: Untis not set up"})
    }

    else{
        getUntisKey(untisLogin.user, untisLogin.pass)
        setTimeout(() => {
            checkUntisLogin(jses)

        setTimeout(() => {
            var sus = untisData
            sus = JSON.parse(sus)
            sus = sus.data.result.data.elementPeriods[5052]
            var cancelledLessons = {cancelled:{}}
            var count = 0
            for (var i = 0; i < sus.length-1; i++){
                if (sus[i].elements[0].state != "REGULAR" || sus[i].cellState == "CANCEL"){
                  var cancelDate = sus[i].date
                  cancelDate = JSON.stringify(cancelDate)
                  var formattedcancelDate =cancelDate.slice(6) +"/"+cancelDate.slice(4, 6) + "/" + cancelDate.slice(0, 4)
                var name = JSON.stringify(sus[i].studentGroup).slice(1,8)
                var time = sus[i].startTime
                count = count+1
                  cancelledLessons.cancelled[count] = 
                    {
                        name: name,
                        time: time,
                        date: formattedcancelDate
                    }

                  

                }
            }
            res.send({status:"complete", cancelledLessons})

        }, 500);
        }, 500);
        

        



        
    }}
    

})

app.post("/api/untissetup", async (req, res)=>{

    if (req.body.cookie == undefined){
        res.send({status:"Error: Invalid Cookie"})
    }

    else{
        var user = req.body.user
        var pass = req.body.pass
        var cookie = req.body.cookie[1]
        await getUntisKey(user, pass)
    
        setTimeout(async () => {
            await checkUntisLogin(jses)
    
            setTimeout(async () => {
    
                if (untisResult == "is a real account") {
                    await checkCookie(cookie)
                    
    
                    await updateUntisInfo(user, pass, success.id)
    
    
                    res.send("untis updated")
                }
    
                else{
                    res.send("invalid credentials")
                }
            }, 1000);
    
    
    
    
        }, 1000);
        
    
    }

    

})


// Managebac Scraper


async function uploadMB(session, id) {
    try {
        await client.connect(uri)
        const database = client.db('auth');
        const creds = database.collection('creds');
        const updateDoc = {$set:{mbSession:session}}
        const filter = {id: id}
        await creds.updateOne(filter, updateDoc)
        const result = await creds.updateOne(filter, updateDoc)
        success = result
    }
    finally{
        await client.close()
    }
}


app.post("/api/managebacsetup", async (req, res)=>{
    if (req.body.cookie == undefined){
        res.send({status:"Error: Invalid Cookie"})
    }
    else{
        await checkCookie(req.body.cookie[1])
        if(success.mbSession == undefined){


            var request = require('request');
            var options = {
            'method': 'GET',
          'url': 'https://ishthehague.managebac.com/student/events.json',
          'headers': {
            'cookie': '_managebac_session=' + req.body.session,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
            form: {
            'start': '2023-03-01',
            'end': '2023-03-09'
          }
            };
        request(options, async function (error, response) {
          if (error) throw new Error(error);
          if (response.body == '{"location":"/login"}') {
            res.send({status:"Error: bad session"})

          } else {
            await uploadMB(req.body.session, success.id)
            res.send({status:"set succesfully"})
          }
        });
        }       
    }
})



app.post("/api/managebac", async (req,res)=>{

    await checkCookie(req.body.cookie[1])

    var MB_Session = success.mbSession

    if (MB_Session == undefined) {
        res.send({status:"Error: ManageBac not set up"})
    }
    else{
        var request = require('request');
        var options = {
        'method': 'GET',
      'url': 'https://ishthehague.managebac.com/student/events.json',
      'headers': {
        'cookie': '_managebac_session=' + MB_Session,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
        form: {
    
        'start': formattedDate,
        'end': formattedDate
      }
        };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      res.send({resp:response.body, status:"complete"})
    });
    }

    
    

})

app.get("/home/mb", (req,res)=>{
    res.redirect("/home/managebac.html")
})

app.get("/", (req,res)=>{
    res.redirect("/home")
})
 app.get('/users/:userId/', (req, res) => {
      res.send(req.params)
    })

app.get("/home/untis", (req,res)=>{
    res.redirect("/home/untis.html")
})


// Account Changes


app.get("/api/resetpass", async (req,res)=>{
    res.send("You cant reset your password atm, its coming soon.")
})

app.post("/api/pfpChange", async (req, res)=>{
    var img = req.body.img
    var cookie = req.body.cookie[1]

    await checkCookie(cookie)
    if (success != null){
       await setPfp(success.id, img)

       res.send({status:"200 OK"})

    }
    else {
        res.send({status:"Error: Wrong Cookie"})
    }

})

app.post("/api/usernameChange", async (req, res)=>{
    var cookie = req.body.cookie[1]
    var newUser = req.body.newUser
    
    await checkCookie(cookie)
    await run(newUser)
    var exists = crntUser
    if (success == null) {
        res.send({status:"Error: Invalid Cookie"})
    } else {
        if (exists != null){
            res.send({status:"Error: Account under that name already exists"})
        }
        else {
            if (newUser.length > 20) {
                res.send({status:"Error: New username is longer than 20 characters"})
            } else {
                await changeUser(success.id, newUser)

                res.send({status: "Success"})
            }
            
        }
    }
    


   
})


app.listen(PORT, ()=>{
    console.log("server running on http://localhost:" + PORT)
})




