//A recurring timer that returns a numerical value representing number of ticks with an interval in milliseconds.
function Timer(interval) {
	var step = interval;
	var time = 0;
	var timer;
	this.start = function () {
		time = 0;
		timer = setInterval(function () {
				time += step;
			}, step);
		return this;
	}
	this.stop = function () {
		clearInterval(timer);
		return this;
	}
	this.time = function() {
		return time;
	}
}
	
//A countdown timer that performs a delegate action after a delay expressed in milliseconds.
function DelayTimer(delay) {
	var timer;
	//Start the countdown
	this.start = function (delegate) {
		timer = setTimeout(delegate, delay);
		return this;
	}
	//Cancel the countdown
	this.cancel = function () {
		clearTimeout(timer);
		return this;
	}
}

