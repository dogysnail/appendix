const express = require("express")
require('dotenv').config()
const cheerio = require("cheerio")
const schedule = require('node-schedule');
const axios = require("axios")
const io = require('@pm2/io')
const request = require('request');
const fs = require("fs");
const stripe = require('stripe')(process.env.STRIPETEST);
const bcrypt = require('bcrypt');
const unirest = require('unirest');
const saltrnd = 5
const nodemailer = require("nodemailer");
var cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion } = require('mongodb');
const PORT = process.env.PORT || 3000
const app = express()
const path = require("path");
const { randomUUID } = require("crypto");
const rateLimit = require("express-rate-limit")
const uri = `mongodb+srv://admin:${process.env.MONGODBPASS}@authcluster.uoxofvv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
app.use("/", express.static(path.join(__dirname, "/public/")))
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

    var verifyLink = "https://tymeloux.eu/verify/" + id + "/"
    let transporter = nodemailer.createTransport({
        host: "mail.smtp2go.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL, // generated ethereal user
      pass: process.env.EMAILPASS, // generated ethereal password
    }
    })
    var mailData = {
        from: `"Tymeloux Verification" <${process.env.EMAIL}>`, // sender address
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
var success = ""
var crntUser = ""
var untisData = undefined
var untisResult = undefined
var emailSuc = undefined
var date = new Date
var month = parseInt(date.getMonth())
month = month+1
var formattedDate = date.getFullYear() + "-" + month + "-" + date.getDate()
var jses = undefined

const realtimeUser = io.metric({
    name: 'Realtime user',
  })

var realTimeUsers = 0

//---------------------------


// Payments

app.post('/api/create-payment-intent', async (req, res) => {
    // Create a PaymentIntent with the order amount and currency
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000,
      currency: "eur",
      automatic_payment_methods: {
        enabled: true,
      },
    });
  
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  });

async function paymentCompleted(email, option, cookie) {
    try {
        var x = null
        if (option == "email") {
            x = {email:email}
        }
        else{
            x = {cookie:{[cookie]:"s"}}

        }

        await client.connect(uri)
        const database = client.db('auth');
        const creds = database.collection('creds');
        const updateDoc = {$set:{"permissions.paid":true}}
        const filter = x
        const result = await creds.updateOne(filter, updateDoc)
        success = result

    }
    finally{
        await client.close()
    }
}

async function sendReceipt(email, paymentID) {
    
    let transporter = nodemailer.createTransport({
        host: "mail.smtp2go.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.NOREPLY, 
      pass: process.env.NOREPLYPASS, 
    }
    })


    

    var mailData = {
        from: `"Tymeloux Payments" <${process.env.NOREPLY}>`,
        to: email,
        subject: "Receipt for Tymeloux purchase: " + paymentID, // Subject line
        text: "Dear " + email + ",\n\n Thank you for your purchase at Tymeloux (PaymentId: " + paymentID + "). We hope you enjoy the software.\n Please contact us at contact@tymeloux.eu if you need any help with either this purchase or anything else.\n\n Best Regards,\n The Tymeloux Team"
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

//---------------------------


// auth system

async function logout(cookie){
    try {
        await client.connect(uri)
        const database = client.db('auth');
        const creds = database.collection('creds');
        const updateDoc2 = {$set:{cookie:{}}}
        const filter = {cookie: {[cookie]:"s"}}
        const result = await creds.updateOne(filter, updateDoc2)
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
        const doc = {
            id:randID,
            username: username, 
            email: email, 
            password: password, 
            profilePic: "https://iili.io/HG5BF9t.png", 
            untis:undefined, 
            mbSession:undefined, 
            messages:["Welcome To the Tymeloux Club!"], 
            lastSent: new Date(0),
            permissions: {
                verified:false, 
                paid:false, 
                admin:false,
                banned:false, 
                earlyUser:true
            }
        }
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
        const updateDoc = {$set:{"permissions.verified":true}}
        const filter = {id: userid}
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

async function runEmail(email) {
    try {
      await client.connect(uri)
      const database = client.db('auth');
      const creds = database.collection('creds');
      const query = { email: email };
      const result = await creds.findOne(query);
      emailSuc = result
      
    } finally {
      // Ensures that the client will close when you finish/error
      
      await client.close();
  
      
    }
}

async function changeEmail(id, newEmail){
    try {
        await client.connect(uri)
        const database = client.db('auth');
        const creds = database.collection('creds');
        const updateDoc = {$set:{email:newEmail}}
        const filter = {id: id}
        const result = await creds.updateOne(filter, updateDoc)
        success = result

    }
    finally{
        await client.close()
    }
}

app.post("/api/resendemail", async(req,res)=>{
    var cookie = req.body.cookie[1]
    await checkCookie(cookie)
    if(success == undefined){
        res.send({status:"Error: wrong cookie"})
    }
    else{
        sendVerificationEmail(success.email, success.id)
        res.send({status: "resent email"})
    }
})

app.post("/api/changeemail", async (req,res)=>{
    var cookie = req.body.cookie[1]
    var newEmail = req.body.email
    await checkCookie(cookie)
    if(success == undefined){
        res.send({status:"Error: wrong cookie"})
    }
    else{
        var user = success.id
        await runEmail(newEmail)

        if (emailSuc == undefined) {
            await changeEmail(user, newEmail)
            sendVerificationEmail(newEmail, user)
            res.send({status:"updated email and resent"})
        }
        else{
            res.send({status:"Error: email already in use"})
        }


    }
})

app.post("/api/logout", async (req,res)=>{
    realTimeUsers = realTimeUsers -1
    realtimeUser.set(realTimeUsers)
    var cookie = req.body.cookie[1]
    await logout(cookie)
    res.send({status:"logoutSuccess!"})
})

app.get("/verify/:userID/", async (req,res)=>{
    var id = req.params.userID
    await verifyUpdate(id)

    if(success.permissions.verified == false){
        await verifyTrue(id)
        res.redirect("/payment")
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
    } 
    
    else if (user.length >= 25){
        res.send({status: "Error: Username too long"})
    }
        
    else {
        

    await run(user)
    await runEmail(email)
    
    var usr = crntUser

    


    if (usr != null){
        res.send({status:"Error: Account under that name already exists"})
        

    }

    else if (emailSuc != null){
        res.send({status:"Error: Account with that email already exists"})
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

app.post("/api/checkcookie", async (req,res)=>{

    realTimeUsers = realTimeUsers +1
    realtimeUser.set(realTimeUsers)
    var cookie = req.body[1]
    await checkCookie(cookie)

     if (success == undefined){
         // cookie doesnt exist
         res.send({status: "Error: Cookie doesnt exist..."})
     }
     else {

        if (success.permissions.verified == false) {
            res.send({status:"unverified", user:{username: success.username, email: success.email, profilePic: success.profilePic}, messages:k, permissions:success.permissions})
        }
        else{
            if (success.permissions.paid == false) {
                res.send({status:"unpaid"})
            } else {
                if (success.messages.length == undefined) {
                    var k = 0
                } else {
                    k = success.messages.length
                }
                res.send({status: "authComplete", user:{username: success.username, email: success.email, profilePic: success.profilePic}, messages:k, permissions:success.permissions})
            }
            
        }
     }
    
})

app.post("/api/login", async (req, res) =>{
    var user = req.body.username
    var pass = req.body.password
    var accntPass = undefined
    var stayLoggedIn = req.body.stay

    //check if user actually exists
    await login(user)
    if (success != null){
        accntPass = success.password


        bcrypt.compare(pass, accntPass, async function(err, result) {
            // result == true


            if (result == true){
                    var cookie = randomUUID()
                    await asignCookie(user, cookie)
                   if (stayLoggedIn == true) {
                    res.cookie("auth", cookie, {maxAge: 86400000*30})
                    res.send({status:"loginComplete", cookie:cookie, username:user})
                   }
                   else{
                    res.cookie("auth", cookie, {maxAge: 86400000})
                    res.send({status:"loginComplete", cookie:cookie, username:user})
                   }

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

//---------------------------


// messaging system

async function sendMsg(recipient, msg, sender) {
    try {
        
        await client.connect(uri)
        var x ="Message from " + sender +": "+ msg
        const database = client.db('auth');
        const creds = database.collection('creds');
        const updateDoc = {$push:{messages:x}}
        const updateDoc2 = {$set:{lastSent:new Date()}}
        const filter = {username: recipient}
        const filter2 = {username:sender}
        await creds.updateOne(filter2, updateDoc2)
        const result = await creds.updateOne(filter, updateDoc)
        success = result
    }
    finally{
        await client.close()
    }
}

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

app.post("/api/sendmsg", async (req,res)=>{
    var cookie = req.body.cookie[1]
    var recipient = req.body.recipient
    var msg = req.body.message
    if (recipient == "" || msg == "") {
        res.send({status:"Error: Incomplete fields"})
    } else{
        if (cookie == ""){
            res.send({status:"Error: Incorrect cookie"})
        }
        else{
            await checkCookie(cookie)
            if (success == undefined) {
                res.send({status:"Error: Incorrect cookie"})
            } 
            else if (success.permissions.admin == true){
                var sender = success
                    await run(recipient)
                    var recipientCheck = crntUser
    
                    if (recipientCheck == undefined || recipient == success.username) {
                        res.send({status:"Invalid recipient"})
                    } else {
                        await sendMsg(recipient, msg, success.username)
                        res.send({status: "success"})
                    }
            }
            
            else {
                var date = new Date().getTime() - new Date(success.lastSent).getTime()
                var OneDay = (1 * 12 * 60 * 60 * 1000)
                if (OneDay > date) {
                    res.send({status: "Error: Too many messages sent in the last 12 hours"})
                }
                else if (OneDay < date) {
                    var sender = success
                    await run(recipient)
                    var recipientCheck = crntUser
    
                    if (recipientCheck == undefined || recipient == success.username) {
                        res.send({status:"Invalid recipient"})
                    } else {
                        await sendMsg(recipient, msg, success.username)
                        res.send({status: "success"})
                    }
                }

               
            }
        }
    }
    
})

//---------------------------


// Untis Scraper

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
            if (sus.status == undefined) {
                sus = sus.data.result.data.elementPeriods[5052]
            var cancelledLessons = {cancelled:{}}
            var count = 0
            for (var i = 0; i < sus.length; i++){
                if (sus[i].elements[0].state != "REGULAR" || sus[i].cellState == "CANCEL" || sus[i].cellState == "SUBSTITUTION"){
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
            } else {
                res.send({status:"Error: Untis not set up correctly"})
            }
            

        }, 800);
        }, 800);
        

        



        
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


//---------------------------


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



            untisResult =   "is a real account"
            
           } catch (error) {
            untisResult =   "not a real account"
           }


           if (untisResult == "is a real account") {
            untisData = response.body
        } else {
            untisData = JSON.stringify({status:"Error: Untis not set up correctly"})
        }

        }
})
}

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

app.post("/api/managebacsetup", async (req, res)=>{
    if (req.body.cookie == undefined){
        res.send({status:"Error: Invalid Cookie"})
    }
    else{
        await checkCookie(req.body.cookie[1])

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

app.post("/api/managebacscrapepage", async(req,res)=>{
    await checkCookie(req.body.cookie[1])

    var MB_Session = success.mbSession

    if (MB_Session == undefined) {
        res.send({status:"Error: ManageBac not set up"})
    }
    else{
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: 'https://ishthehague.managebac.com/student/classes/my',
            headers: { 
              'Cookie': '_managebac_session=' + MB_Session
            }
          };
        const axiosResponse = await axios.request(config)
        const $ = cheerio.load(axiosResponse.data)
        var classes = []
        var ids = []
        $(".ib-class-component")
            .find(".title")
            .each((index, element) => {
                var y = $(element).text()
                var y = y.replace(/\n/g, " ")
                var y = y.trim()
                classes.push(y)
            })
        
        $(".ib-class-component")
            .find(".title")
            .find("a")
            .each((index, element)=>{
                var y = $(element).attr("href")
                y = y.substring(17)
                ids.push(y)
            })


            res.send({status: "complete", result:{id: ids, classes: classes}})
    }


        
})

//---------------------------


// Admin Posts

async function changePerms(permission, permissionVal, username) {
    try {
        await client.connect(uri)
        const database = client.db('auth');
        const creds = database.collection('creds');
        var path = "permissions."+permission
        const updateDoc = {$set:{[path]:permissionVal}}
        const filter = {username: username}
        const result = await creds.updateOne(filter, updateDoc)
        success = result
    }
    finally{
        await client.close()
    }
}

async function deleteUser(username){
    try {
        await client.connect(uri)
        const database = client.db('auth');
        const creds = database.collection('creds');
        const filter = {username: username}
        const result = await creds.deleteOne(filter)
        success = result
    }
    finally{
        await client.close()
    }
}

app.post("/api/ban", async (req,res)=>{
    var cookie = req.body.cookie[1]
    var username = req.body.username
    await checkCookie(cookie)
    if (success == undefined) {
        res.send({status:"Error: Wrong cookie"})
    } else if (success.permissions.admin == false){
        res.send({status:"Error: not a admin"})
    }
    else if(success.permissions.admin == true){
        await run(username)
        if (crntUser == undefined) {
            res.send({status:"Error: invalid user"})
        } else {
            await changePerms("banned", true, username)
            res.send({status:"success"})
        }

    }

})

app.post("/api/unban", async (req,res)=>{
    var cookie = req.body.cookie[1]
    var username = req.body.username
    await checkCookie(cookie)
    if (success == undefined) {
        res.send({status:"Error: Wrong cookie"})
    } else if (success.permissions.admin == false){
        res.send({status:"Error: not a admin"})
    }
    else if(success.permissions.admin == true){
        await run(username)
        if (crntUser == undefined) {
            res.send({status:"Error: invalid user"})
        } else {
            await changePerms("banned", false, username)
            res.send({status:"success"})
        }

    }

})

app.post("/api/adminverify", async (req,res)=>{
    var cookie = req.body.cookie[1]
    var username = req.body.username
    await checkCookie(cookie)
    if (success == undefined) {
        res.send({status:"Error: Wrong cookie"})
    } else if (success.permissions.admin == false){
        res.send({status:"Error: not a admin"})
    }
    else if(success.permissions.admin == true){
        await run(username)

        if (crntUser == undefined) {
            res.send({status:"Error: invalid user"})
        } else {
            await changePerms("verified", true, username)
            res.send({status:"success"})
        }
}})

app.post("/api/unverify", async (req,res)=>{
    var cookie = req.body.cookie[1]
    var username = req.body.username
    await checkCookie(cookie)
    if (success == undefined) {
        res.send({status:"Error: Wrong cookie"})
    } else if (success.permissions.admin == false){
        res.send({status:"Error: not a admin"})
    }
    else if(success.permissions.admin == true){
        await run(username)

        if (crntUser == undefined) {
            res.send({status:"Error: invalid user"})
        } else {
            await changePerms("verified", false, username)
            res.send({status:"success"})
        }
}})

app.post("/api/deleteuser", async(req,res)=>{
    var cookie = req.body.cookie[1]
    var username = req.body.username
    await checkCookie(cookie)
    if (success == undefined) {
        res.send({status:"Error: Wrong cookie"})
    } else if (success.permissions.admin == false){
        res.send({status:"Error: not a admin"})
    }
    else if(success.permissions.admin == true){
        await run(username)

        if (crntUser == undefined) {
            res.send({status:"Error: invalid user"})
        } else {
            await deleteUser(username)
            res.send({status:"success"})
        }
}
})

//---------------------------


//* Account Changes *//

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

//---------------------------


// routes //

app.get("/auth", async (req,res)=>{
    var cookie = req.cookies.auth
    await checkCookie(cookie)

    if(success != undefined){
        res.redirect("/home")
    }
    else{
        res.sendFile(__dirname + "/private/auth.html")
    }
})

app.get("/home", async (req,res)=>{
    var cookie = req.cookies.auth
    await checkCookie(cookie)

    if(success == undefined){
        res.redirect("/auth")
    }

    else if (success.permissions.banned == true){
        res.sendFile(__dirname + "/private/banned.html")
    }

    else if (success.permissions.verified == false){
        res.redirect("/pendingVerify")
    }

    else if (success.permissions.paid == false){
        res.redirect("/payment")
    }

    else{
        res.sendFile(__dirname + "/private/home.html")

    }
})

app.get("/untis", async(req,res)=>{
    var cookie = req.cookies.auth
    await checkCookie(cookie)

    if(success != undefined){
        res.sendFile(__dirname + "/private/untis.html")
    }

    else if (success.permissions.banned == true){
        res.sendFile(__dirname + "/private/banned.html")
    }

    else if (success.permissions.verified == false){
        res.redirect("/pendingVerify")
    }

    else if (success.permissions.paid == false){
        res.redirect("/payment")
    }

    else{
        res.redirect("/auth")
    }
})

app.get("/mb", async(req,res)=>{
    var cookie = req.cookies.auth
    await checkCookie(cookie)

    if(success == undefined){
        res.redirect("/auth")
    }

    else if (success.permissions.banned == true){
        res.sendFile(__dirname + "/private/banned.html")
    }

    else if (success.permissions.verified == false){
        res.redirect("/pendingVerify")
    }

    else if (success.permissions.paid == false){
        res.redirect("/payment")
    }

    else{
        res.sendFile(__dirname + "/private/managebac.html")

    }
})

app.get("/message", async(req,res)=>{
    var cookie = req.cookies.auth

    await checkCookie(cookie)

    if(success == undefined){
        res.redirect("/auth")
    }

    else if (success.permissions.banned == true){
        res.sendFile(__dirname + "/private/banned.html")
    }

    else if (success.permissions.verified == false){
        res.redirect("/pendingVerify")
    }

    else if (success.permissions.paid == false){
        res.redirect("/payment")
    }

    else{
        res.sendFile(__dirname + "/private/messages.html")
    }
})

app.get("/payment", async(req,res)=>{
    var cookie = req.cookies.auth
    await checkCookie(cookie)
    if (success == undefined) {
        res.redirect("/auth")
    }
    else if (success.permissions.paid == false){
        res.sendFile(__dirname + "/private/payment.html")
    }

    else {
        res.redirect("/home")
    }
})

app.get("/pendingVerify", async(req,res)=>{
    var cookie = req.cookies.auth
    await checkCookie(cookie)
    if (success == undefined) {
        res.redirect("/auth")
    }

    else if (success.permissions.banned == true){
        res.sendFile(__dirname + "/private/banned.html")
    }

    else if (success.permissions.verified == false){
        res.sendFile(__dirname + "/private/verify.html")
    }
    else {
        res.redirect("/home")
    }
})

app.get("/", (r, s)=>{
    s.redirect("/landing")  
})

app.get("/admin", async (req,res)=>{
    var cookie = req.cookies.auth
    await checkCookie(cookie)
    if (success == undefined) {
        res.redirect("/auth")
    }
    else if (success.permissions.admin == false) {
        res.redirect("/home")
    }
    else if(success.permissions.admin == true){
        res.sendFile(__dirname+ "/private/admin.html")
    }

})

app.get("/paymentcomplete", async (req,res)=>{
    

    var paymentIntent = req.query.payment_intent

    const intent = await stripe.paymentIntents.retrieve(paymentIntent);
    const latest_charge = intent.charges.data
    if (JSON.stringify(latest_charge) == "[]"){
        res.send("payment didnt succeed.")
    }
    else if (latest_charge[0].paid == true) {
        var email = latest_charge[0].receipt_email
        await paymentCompleted(email, "email")
        if (success.modifiedCount == 1) {
            var z = Object.keys(req.cookies)
            if(z.length > 1){
                for (let index = 0; index < z.length; index++) {
                    const element = array[index];
                    if (element != "auth") {
                        res.clearCookie(element)
                    }
                }
            }
            res.sendFile(__dirname + "/private/congrats.html")
            sendReceipt(email, latest_charge[0].id)
            console.log("yay, new payment")
        }
        else{
            await paymentCompleted("email", "cookie", req.cookies.auth)
            if (success.modifiedCount == 1) {
                var z = Object.keys(req.cookies)
                if(z.length > 1){
                    for (let index = 0; index < z.length; index++) {
                        const element = array[index];
                        if (element != "auth") {
                            res.clearCookie(element)
                        }
                    }
                }
                res.sendFile(__dirname + "/private/congrats.html")
                sendReceipt(email, latest_charge[0].id)
                console.log("yay, new payment")

            }
            else{
                console.log("Error: manual update for " + latest_charge[0].email)
                res.send(`There was a error updating your account, this has to thus be done manually. Contact info@tymeloux.eu or support@tymeloux.eu with your email and your transaction ID (${latest_charge[0].id}).`)
            }
        }
    }
    else{
        res.sendFile(__dirname + "/private/payError.html")
    }
    

    
})

app.get("/tos", (req,res)=>{
    res.sendFile(__dirname + "/public/policies/tos.html")
})

app.get("/privacy", (req,res)=>{
    res.sendFile(__dirname + "/public/policies/privacy.html")
})

//---------------------------

// Scheduler

app.get("/api/testing", async(req,res)=>{
 
})



const job = schedule.scheduleJob("0 7 * * MON",async function(){
    try {
        await client.connect(uri)
        const database = client.db("auth");
        const creds = database.collection("creds");
        const estimate = await creds.countDocuments();
        const query = {permissions:{verified:true, paid:true, admin:false, banned:false, earlyUser:true}};
        const options = {
          sort: { username: 1 },
          projection: {_id:0, "username":1,"email":1, "untis":1},
        };
        const cursor = creds.find(query, options);
        if ((await creds.countDocuments(query)) === 0) {
        }
        await cursor.forEach(async (doc)=>{
            if (doc.untis == null) {
            } else {

                getUntisKey(doc.untis.user, doc.untis.pass)
                setTimeout(() => {
                    checkUntisLogin(jses)
                setTimeout(async () => {
                    sus = JSON.parse(untisData)
                    if (sus.status == undefined) {
                        sus = sus.data.result.data.elementPeriods[5052]
                    var cancelledLessons = []
                    var count = 0
                    for (var i = 0; i < sus.length; i++){
                        if (sus[i].elements[0].state != "REGULAR" || sus[i].cellState == "CANCEL" || sus[i].cellState == "SUBSTITUTION"){
                          var cancelDate = sus[i].date
                          cancelDate = JSON.stringify(cancelDate)
                          var formattedcancelDate =cancelDate.slice(6) +"/"+cancelDate.slice(4, 6) + "/" + cancelDate.slice(0, 4)
                        var name = JSON.stringify(sus[i].studentGroup).slice(1,8)
                        var time = sus[i].startTime
                        count = count+1
                        cancelledLessons.push(`<li>Lesson: ${name} cancelled at: ${time} on: ${formattedcancelDate}</li>`)
                        }}

                let transporter = nodemailer.createTransport({
                    host: "mail.smtp2go.com",
                port: 465,
                secure: true,
                auth: {
                  user: process.env.NOREPLY,
                  pass: process.env.NOREPLYPASS,
                }
                })
                var mailData = {
                    from: `"Tymeloux Untis Update" <${process.env.NOREPLY}>`,
                    to: doc.email,
                    subject: `Cancelled Lessons ${new Date}`,
                    html:`
                    <html lang="en">
                    <body>
                        <style>
                            body{
                                background-color: #111111;
                                padding-left: 3vw;
                                padding-top: 3vw;
                                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                            }
                            h1{
                                color: white;
                            }
                            h2{
                                color: white;
                                font-weight: 100;
                                font-style: italic;
                            }
                            ul{
                                background-color: #FFF972;
                                width: 45vw;
                                padding-top: 2vh;
                                padding-bottom: 2vh;
                                padding-right: 2vw;
                                border-radius: 10px;
                                list-style: none;
                            }
                            li{
                                padding-top: 2vh;
                                padding-bottom: 2vh;
                                padding-left: 1vw;
                                color: #111111;
                                background-color: white;
                                font-size: 1.5vw;
                                margin-bottom: 2vh;
                            }
                            li:last-child{
                                margin-bottom: 0vh !important;
                            }
                        </style>
                        <h1>Dear ${doc.username},</h1>
                        <h2>The following lessons have been cancelled. Enjoy the time off 😉😉</h2>
                        <ul>
                            ${cancelledLessons}
                        </ul>
                        <h2>Best Regards,</h2>
                        <h1>The Tymeloux Team</h1>
                    
                    </body>
                    </html>`
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
            }}, 1000);
                }, 1000);
            }
        });
      } finally {     
        await client.close();    
      }
  })


app.listen(PORT, ()=>{
    console.log("server running on http://localhost:" + PORT)
})