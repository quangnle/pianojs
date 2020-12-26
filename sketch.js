let pianoui = new PianoUI(50,50,150,30);

function setup(){
	var canvas = createCanvas(640, 480);
	canvas.parent('sketch-holder');
}

function draw(){
	background(255);
	
	pianoui.draw();
}

function keyPressed(){
	if (keyCode==ENTER) {
		canon.fire(50);
	}
}