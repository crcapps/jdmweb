function Sliders() {
	//Config Variables
	var totalInterval = 1; //Timer inverval for total time in milliseconds
	//Members
	this.totalTimer = new Timer(totalInterval);
}

var moveLog = "";

var sliders = new Sliders();

function doinit() {
	sliders.totalTimer.start();
	document.getElementById('starttime').value = new Date().toUTCString();
}

function submitSliders() {
	sliders.totalTimer.stop();
	document.getElementById('stoptime').value = new Date().toUTCString();
	document.getElementById('time').value = sliders.totalTimer.time();
}

window.onload = doinit;