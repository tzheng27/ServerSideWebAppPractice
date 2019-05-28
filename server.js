/*********************************************************************************
* WEB322 – Assignment 06
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source
* (including 3rd party web sites) or distributed to other students.
*
* Name: Tian Zheng       Student ID: 155394174    Date: April 8, 2019
*
* Online (Heroku) Link: https://rocky-hollows-26693.herokuapp.com/
*
********************************************************************************/
const clientSessions = require("client-sessions");
const dataServiceAuth = require("./data-service-auth.js");
const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const path= require("path");
const dataService = require("./data-service.js");
const fs = require('fs');
const exphbs= require('express-handlebars');
const app = express();
/**********************************************************************/
const HTTP_PORT = process.env.PORT || 8080;
/**********************************************************************/
function onHttpStart() {
    console.log("Express http server listening on: " + HTTP_PORT);
}
/**********************************************************************/
app.use(clientSessions({
    cookieName: "session",
    secret:"web322_a6",
    duration: 2 * 60 * 1000,
    activeDuration: 60 * 1000
}));
/**********************************************************************/
app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
});
/**********************************************************************/
function ensureLogin (req, res, next){
    if (!(req.session.user)){
        res.redirect("/login");
    }
    else{
        next();
    }
}
/**********************************************************************/
app.use(express.static('public'));
/**********************************************************************/
app.use(bodyParser.urlencoded({extended : true}));
/**********************************************************************/
const storage = multer.diskStorage({
    destination: "./public/images/uploaded",
    filename: function(req, file, cb){
        cb(null, Date.now()+path.extname(file.originalname));
    }
});
/**********************************************************************/
const upload = multer({ storage:storage });
/**********************************************************************/
app.use(function(req,res,next){     
    let route = req.baseUrl + req.path;     
    app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");     
    next(); 
}); 
/**********************************************************************/
app.engine('.hbs', exphbs({ 
    extname: ".hbs",
    defaultLayout: "main",
    helpers:{
        navLink: function(url, options){     return '<li' +          
            ((url == app.locals.activeRoute) ? ' class="active" ' : '') +  
            '><a href="' + url + '">' + options.fn(this) + '</a></li>'; 
        },   
        equal:function(lvalue, rvalue, options){
            if(arguments.length <3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue){
                return options.inverse(this);
                
            }else{              
                return options.fn(this);
            }
        }
    }
}));
/**********************************************************************/
app.set("view engine", ".hbs");
/**********************************************************************/
app.get("/", function(req, res){
    res.render("home");
});
/**********************************************************************/
app.get("/about", function(req, res){
    res.render("about");
});
/**********************************************************************/
app.get("/login", (req,res)=>{
    res.render("login");
});
/**********************************************************************/
app.get("/register", (req,res)=>{
    res.render("register");
});
/**********************************************************************/
app.post("/register", (req,res)=>{
    dataServiceAuth.registerUser(req.body)
    .then(()=>{
        res.render("register", {successMessage: "User created"});
    })
    .catch((err)=>{
        res.render("register",{errorMessage: err, userName: req.body.userName});
    })
});
/**********************************************************************/
app.post("/login", (req, res)=>{
    req.body.userAgent = req.get('User-Agent');
    dataServiceAuth.checkUser(req.body)
    .then((user)=>{
        req.session.user = {
            userName: user.userName,
            email: user.email,
            loginHistory: user.loginHistory
        };
        res.redirect('/employees');       
    })
    .catch((err)=>{
        res.render("login",{errorMessage: err, userName: req.body.userName} );
    });
});
/**********************************************************************/
app.get("/userHistory", ensureLogin, (req, res)=>{
    res.render("userHistory",{user: req.session.user});
});
/**********************************************************************/
app.get("/logout", (req, res)=>{
    req.session.reset();
    res.redirect("/");
})
/**********************************************************************/
app.get("/employees", ensureLogin, function(req, res){
   if(req.query.status ){
    dataService.getEmployeesByStatus(req.query.status).then((data)=>{   
            res.render("employees", (data.length >0 ) ? {employees: data} : {message: "no result for status  query of employees."});
     
         }).catch(function(err){
                res.render("employees", {message: err + "No result"});
            })
    }else if(req.query.department){
        dataService.getEmployeesByDepartment(req.query.department).then(data=>{
            res.render("employees", {employees: data});
            
        }).catch(err=>{
            res.render({message: err});
        }) }else if(req.query.manager){
            dataService.getEmployeesByManager(req.query.manager).then(data=>{
                res.render("employees", {employees: data});
            }).catch(err=>{ res.render({message: err}); });

        }else{
            dataService.getAllEmployees().then((data)=>{              
                res.render("employees", (data.length >0) ? {employees:data} : {message: "No results returned"});
            }).catch((err)=>{ res.render("employees", {message:  err }); });
        } 
});
/**********************************************************************/
app.get('/employee/:value', ensureLogin, (req, res)=>{
    let viewData ={};
    dataService.getEmployeeByNum(req.params.value).then(data=>{
        if(data){
            viewData.employee = data;
        }else{
            viewData.employee = null;
        }
        
    }).catch(
        (err)=>{
       viewData.employee = null;
      
    }).then(dataService.getDepartments)
    .then((data)=>{
        viewData.departments = data;
        for(let i=0; i<viewData.departments.length; i++){
            if(viewData.departments[i].departmentId == viewData.employee.department ){
                viewData.departments[i].selected = true;
            }
        }
    }).catch(()=>{
        viewData.departments=[];
    }).then(()=>{
        if(viewData.employee== null){
            res.status(404).send("Employee Not Found");
        }else{
            res.render("employee", { viewData: viewData });
        }
    }).catch(err=>{
        res.status(500).send("Unable to Show Employees");
    });
});
/**********************************************************************/
app.get("/managers", ensureLogin, function(req,res){
   dataService.getManagers().then(function(data){
        res.json(data);
   }).catch(function(err){
       res.json({message: err});
   });
 });
/**********************************************************************/
app.get("/departments", ensureLogin, function(req,res){
    dataService.getDepartments().then(function(data){
        res.render("departments", { departments: data });
    }).catch(function(err){
        res.render("departments", { data: {} });
    }); 
});
/**********************************************************************/
app.get("/employees/add", ensureLogin, function(req,res){
    dataService.getDepartments().then(data=>{
        res.render("addEmployee", {departments: data })
    }).catch(err=>{
        res.render("addEmployee", {departments: []});
    });
    
});
/**********************************************************************/
app.get('/images/add', ensureLogin, function(req, res){
    res.render("addImage");
})
/**********************************************************************/
app.post('/images/add', ensureLogin, upload.single("imageFile"), function(req,res){
    res.redirect("/images");
});
/**********************************************************************/
app.get("/images",  ensureLogin, function(req, res){  
    fs.readdir("./public/images/uploaded", function(err, items){      
        res.render("images", {data:items});
   });
});
/**********************************************************************/
app.post("/employees/add", ensureLogin, function(req, res){
    dataService.addEmployees(req.body).then(()=>{
        res.redirect('/employees');
    }).catch(function(err){
        res.send(+err);
   })
});
/**********************************************************************/
app.post("/employee/update", ensureLogin, function(req, res){
    dataService.updateEmployee(req.body).then(()=>{
        res.redirect('/employees'); 
    }).catch((err)=>{
        res.send(err);
    });
    
});
/**********************************************************************/
app.get("/departments/add", ensureLogin, function(req, res){
    res.render('addDepartment');
});
/**********************************************************************/
app.post("/departments/add", ensureLogin, function(req, res){ 
   dataService.addDepartment(req.body).then(()=>{
       res.redirect("/departments");
   }).catch(err=>{
       res.send("Unable to add the department for: " + err);
   });

}); 
/**********************************************************************/
app.get("/department/:departmentId", ensureLogin, function(req, res){
    dataService.getDepartmentById(req.params.departmentId).then((data)=>{
        res.render("department", {department: data});
    }).catch(err=>{
        res.status(404).send("Department not found for: " + err);
    });
});
/**********************************************************************/
app.post("/department/update", ensureLogin, function(req, res){
    dataService.updateDepartment(req.body).then(()=>{
        res.redirect("/departments");
    }).catch(err=>{
        res.status(500).send("Unable to update the department for: " + err );
    });
});
/**********************************************************************/ 
app.get("/employees/delete/:empNum", ensureLogin, function(req, res){
    dataService.deleteEmployeeByNum(req.params.empNum).then(()=>{
        res.redirect("/employees");
    }).catch(err=>{
        res.status(500).send("Unable to Remove Employee/Employee not found");
    });
});
/**********************************************************************/
app.use(function(req, res){
    res.status(404).send("PAGE NOT FOUND");
});
/**********************************************************************/
dataService.initialize()
.then(dataServiceAuth.initialize)
.then(function(){
    app.listen(HTTP_PORT, onHttpStart);
})
.catch((err) => {
    console.log("unable to start server: " + err.message);
});


