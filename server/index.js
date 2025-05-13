const http = require("http");
const fs = require("fs");
const path =  require("path");

const userFile = path.join(__dirname,'data','User.json');
function getUsers(){
    const data = fs.readFileSync(userFile,"utf-8");
    return JSON.parse(data);
}
function saveUsers(users){
    fs.writeFileSync(userFile,JSON.stringify(users,null, 2),"utf-8");
    
}
function body(req, callback){
    let body ="";
    req.on("data",chunk => body += chunk);
    req.on("end", ()=>callback(JSON.parse(body)));
     
}
// creation du server http 
const server = http.createServer(req, res)=>{
    if (req.url === "/inscrip" && req.method === "POST"){
        body(req, (userData)=>{
            const data = getUsers();
            const userFound = user.find((u) => u.email === email && u.motDePasse === motDePasse);
            if (userFound){
                res.writeHead(201, "Content-Type":"application/json");
                return res.end(JSON.stringify(error:"l'email existe deja"))
            }
        })
    }
}
