const fs = require("fs");
const asar = require("asar");
var _this;
var UtilityWorker;
var rootPath;

module.exports = UtilityWorker = function() {
	this.pid = process.pid;
	_this = this;
};

UtilityWorker.prototype.stop = function() {
	process.kill(_this.pid);
}

UtilityWorker.prototype.completePatch = function() {
	process.disconnect();
	process.noAsar = true;

	var delInterval = setInterval(function() {

		fs.open(rootPath + "app.asar", 'r+', function(err, fd){
	        if (err && err.code === 'EBUSY'){
	            //do nothing till next loop
	            console.log("File locked. Waiting...");
	        } else if (err && err.code === 'ENOENT'){
	            console.log(rootPath + "app.asar", 'deleted');
	            clearInterval(delInterval);
	            fs.renameSync(rootPath + "app-FRAMELESS.asar", rootPath + "app.asar");
	            _this.stop();
	        } else {
	            fs.close(fd, function(){
	                fs.unlink(rootPath + "app.asar", function(err){
	                    if(err){
	                    	console.log(err);
	                    } else {
		                    console.log(rootPath + "app.asar", 'deleted');
		                    clearInterval(delInterval);
		                    fs.renameSync(rootPath + "app-FRAMELESS.asar", rootPath + "app.asar");
		                    _this.stop();
	                    }
	                });
	            });
	        }
	    });

	}, 500);
}

UtilityWorker = new UtilityWorker();

process.on("message", function(data) {

    if (data.type == "extract") {
		process.noAsar = true;
        asar.extractAll(data.source, data.target);
        process.send({
        	type: "extract",
        	status: "success"
        });
    }

    if (data.type == "complete-patch") {
    	rootPath = data.root;
    	_this.completePatch();
    }

    if (data.type == "stop") {
    	_this.stop();
    }


});
