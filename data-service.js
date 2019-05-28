const Sequelize= require('sequelize');

var sequelize = new Sequelize('d2rkf5f907t55b', 'reejakmhoguafl', 'e697df0e5968883052ff757c772519bce789455ef9d755ad72df2b1f532a1428', {
    host: 'ec2-54-221-243-211.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
    ssl: true
    }
});

var Employee = sequelize.define('Employee', {
    employeeNum: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    email: Sequelize.STRING,
    SSN: Sequelize.STRING,   
    addressStreet: Sequelize.STRING,
    addressCity: Sequelize.STRING,
    addressState: Sequelize.STRING,
    addressPostal: Sequelize.STRING,
    maritalStatus: Sequelize.STRING,
    isManager: Sequelize.BOOLEAN,
    employeeManagerNum: Sequelize.INTEGER,
    status: Sequelize.STRING,
    department: Sequelize.INTEGER,
    hireDate: Sequelize.STRING

});

var Department = sequelize.define('Department', {
    departmentId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    departmentName: Sequelize.STRING

},{
    createdAt: false,
    updatedAt: false
});


module.exports.initialize =function (){
    return new Promise(function(resolve, reject){
       sequelize.sync().then(function(){
           resolve("Successfully initialized");
       }).catch((err)=>{        
           reject("unable to sync the database for: " + err);
       })
    });
};



module.exports.getAllEmployees = function(){
    return new Promise((resolve, reject)=>{
            Employee.findAll().then(function(data){
                resolve(data);
            }).catch((err)=>{           
                reject("Unable to read employees for: "+ err ); 
            });
           
    });
};


module.exports.getManagers= function(){
    return new Promise((resolve, reject)=>{
        Employee.findAll({
            where:{
                isManager: true
            }
        }).then(function(data){
            resolve(data);
        }).catch((err)=>{           
            reject("Unable to read managers for: "+ err ); 
        });  
    });
};

module.exports.getDepartments= function(){
    return new Promise(function(resolve, reject){
        Department.findAll().then(data=>{
            resolve(data);
        }).catch((err)=>{
            reject('No results returned for: ' + err);
        }); 
    });
};


module.exports.addEmployees = function( employeeData ){
    return new Promise(function(resolve, reject){
        employeeData.isManager =(employeeData.isManager) ? true : false;
        for(var i in employeeData){
            if(employeeData[i]=='')
                employeeData[i] = null;
        }
        Employee.create(employeeData).then(()=>{
            resolve();
        }).catch(err=>{
            reject("Failed to create a new employee for: "+ err);
        });

    });
}

module.exports.getEmployeesByStatus=function(status){
    return new Promise(function(resolve, reject){
        Employee.findAll({where:{status: status}}).then(data=>{
            resolve(data);
        }).catch((err)=>{
            reject("No results returned for: " + err);
        })    
      
    });
};

module.exports.getEmployeesByDepartment = function(department){
    return new Promise((resolve, reject)=>{
            Employee.findAll({where: {department: department}}).then(data=>{
                resolve(data);
            }).catch(err=>{
                reject("no resluts returned for: " + err);
            });
        
    });
    
}

module.exports.getEmployeesByManager = function(manager){
    return new Promise((resolve, reject)=>{
            Employee.findAll({where:{employeeManagerNum: manager}}).then(data=>{
                resolve(data);
            }).catch(err=>{
                reject("no resluts returned for: " + err);
            });
       
    });
}

module.exports.getEmployeeByNum = function(num){
    return new Promise((resolve, reject)=>{
           Employee.findAll({ where: { employeeNum: num } }).then(data=>{
               resolve(data[0]);  
           }).catch(err=>{
               reject("no resluts returned for: " + err);
           });         
    });
}

module.exports.updateEmployee= function(employeeData){
    return new Promise((resolve, reject)=>{
        employeeData.isManager=(employeeData.isManager)? true: false;
        for(const i in employeeData){
            if(employeeData[i]=="")
                employeeData[i] = null;
        }
        Employee.update(employeeData, {where: {employeeNum: employeeData.employeeNum}}).then(()=>{
            resolve( )
        }).catch(err=>{
            reject("Unable to update employee for: " + err);
        });
    });
}

module.exports.addDepartment= function(departmentData){
    return new Promise((resolve, reject)=>{
        for(var i in departmentData){
            if(departmentData[i]=="")
                departmentData[i]=null;
        }
        Department.create(departmentData).then(()=>{
            resolve();
        }).catch(err=>{
            reject("Unable to create department for: " + err);
        });
    });
}

module.exports.updateDepartment = function(departmentData){
    return new Promise(function(resolve, reject){
        for(var i in departmentData ){
            if(departmentData[i]== '' ){
                departmentData[i] = null;
            }
        }
        Department.update(departmentData, {
            where: { departmentId: departmentData.departmentId }
        }).then(()=>{
            resolve();
        }).catch((err)=>{
            reject("unable to update department for: "+ err);
        });
    });
};


module.exports.getDepartmentById= function(id){
    return new Promise(function(resolve, reject){
            Department.findAll({where: {departmentId: id}}).then(data=>{
                resolve(data[0]);
            }).catch((err)=>{             
                reject("Unable to get department by id for: " + err);
            });      
    });
};

module.exports.deleteEmployeeByNum= function(empNum){
    return new Promise(function(resolve, reject){
            Employee.destroy({where: { employeeNum: empNum } }).then(()=>{
                resolve();
            }).catch(err=>{
                reject("Unable to delete employee for: " + err);
            });
    });
};

