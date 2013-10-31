function ChoiceGrid() {
	
	//Config Variables
	var totalInterval = 1; //Timer inverval for total time in milliseconds
	var activationDelay = 250; //Delay for activation of a grid square in milliseconds
	var choiceInterval = 1;
	var lagInterval = 1;
	//Members
	this.totalTimer = new Timer(totalInterval);
	this.choiceTimer = new Timer(choiceInterval);
	this.activationDelay = new DelayTimer(activationDelay);
	this.lagTimer = new Timer(lagInterval);
}

var initial = 0;
var movedAlternativeWise = 1;
var movedAttributeWise = 2;
var movedDiagonally = 3;
var movedNonDirectionally = 4;
var madeChoice = 5;

var totalMoves = 0;
var altMoves = 0;
var attMoves = 0;
var diagMoves = 0;
var nonDirMoves = 0;

var viewTime = 0;

var lastCoords = ["-1","-1"];

var moveLog = "";

var cellActive = false;

var choiceGrid = new ChoiceGrid();

function moveType(rowOrigin, colOrigin, rowDestination, colDestination) {
	return (rowOrigin == -1 || colDestination == -1) ? initial : (Math.abs(rowOrigin - rowDestination) > 1 || Math.abs(colOrigin - colDestination) > 1 ) ? movedNonDirectionally : (colOrigin != colDestination && rowOrigin != rowDestination) ? movedDiagonally : (colOrigin != colDestination) ? movedAttributeWise : movedAlternativeWise;
}

function doinit() {
	moveLog += "\nBEGIN CHOICE GRID";
	moveLog += "STARTTIME:" + new Date().toUTCString() + "\n";
}

function makeChoice(id,label) {
	choiceGrid.lagTimer.stop()
	choiceGrid.totalTimer.stop();
	moveLog += "DIR:" + madeChoice + " CHOICE:" + id + " (" + label + ") LAGTIME:" + choiceGrid.lagTimer.time(); + " TOTALTIME:" + choiceGrid.totalTimer.time();
	moveLog += " STOPTIME:" + new Date().toUTCString() + "\n";
	moveLog += "END CHOICE GRID";
	alert(moveLog);
}

function mouseOverGrid(row,column) {
	var id = "cell:" + row + "," + column;
	var cell = document.getElementById(id);
	choiceGrid.activationDelay.start(function () {
		choiceGrid.lagTimer.stop();
		cellActive = true;
		cell.className = "showcontent";
		var type = moveType(lastCoords[1], lastCoords[0], row, column);
		switch (moveType) {
			case movedAlternativeWise:
				altMoves++;
				break;
			case movedAttributeWise:
				attMoves++;
				break;
			case movedDiagonally:
				diagMoves++;
				break;
			case movedNonDirectionally:
				nonDirMoves++;
				break;
			default:
				break;
		}
		moveLog += "MOVE:" + totalMoves + " DIR:" + type + " ALT:" + row + " ATT:" + column + " LAGTIME:" + choiceGrid.lagTimer.time();
		totalMoves++;
		lastCoords = [column,row];
		choiceGrid.choiceTimer.start();	
	});
}

function mouseOutGrid(row,column) {
	choiceGrid.choiceTimer.stop();
	var time = choiceGrid.choiceTimer.time();
	if (cellActive) {
		moveLog += " CHOICETIME:" + time + "\n";
		viewTime += time;
		cellActive = false;
	}
	choiceGrid.lagTimer.start();
	choiceGrid.activationDelay.cancel();
	var id = "cell:" + row + "," + column;
	var cell = document.getElementById(id);
	cell.className = "gridcontent";
	
}