function Sliders() {
	//Config Variables
	var totalInterval = 1; //Timer inverval for total time in milliseconds
	//Members
	this.totalTimer = new Timer(totalInterval);
}

var moveLog = "";

var sliders = new Sliders();

function doinit() {
	moveLog += "\nBEGIN SLIDERS\n";
	moveLog += "STARTTIME:" + new Date().toUTCString() + "\n";
	sliders.totalTimer.start();
}

function submitSliders() {
	sliders.totalTimer.stop();
	var slides = document.querySelectorAll('input[type="range"]');
	for (var index = 0; index < slides.length; index++) {
		moveLog += "SLIDER: " + slides[index].name + " " + slides[index].value + "\n";
	}
	moveLog += "TOTAL TIME: " + sliders.totalTimer.time() + " STOPTIME:" + new Date().toUTCString() + "\n";
	moveLog += "END SLIDERS";
	alert(moveLog);
}

window.onload = doinit;