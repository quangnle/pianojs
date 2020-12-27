let pianoui = new PianoUI(50,50,300,100);

function setup(){
	var canvas = createCanvas(640, 480);
	canvas.parent('sketch-holder');
}

function draw(){
	background(255);
	
	pianoui.draw();
}

function mousePressed(){
	pianoui.onClicked(mouseX, mouseY);
}

function touchStarted(){
	pianoui.onClicked(mouseX, mouseY);
}

function keyPressed(){
	
}