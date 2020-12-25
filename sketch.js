let canon =new Canon(100,100,-30);

function setup(){
	var canvas = createCanvas(640, 480);
	canvas.parent('sketch-holder');
}

function draw(){
	background(255);
	
	if (keyIsDown(LEFT_ARROW)) {
		canon.angle -= 1;
	}
	if (keyIsDown(RIGHT_ARROW)) {
		canon.angle += 1;
	}
	
	canon.draw();
}

function keyPressed(){
	if (keyCode==ENTER) {
		canon.fire(50);
	}
}