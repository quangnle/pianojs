function isInRegion(x,y,rect){
	return (x > rect.x && x <= rect.x + rect.w && y > rect.y && y <= rect.y + rect.h);
}

var PianoUI = function(x,y,w,h){
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	
	this.keys = [];
	
	let step = 0;
	let stepWidth = this.w / 15;
	for (let i = 0; i < 25; i++){
		let name = NOTES[i%12];
		let octave = Math.ceil((i+1)/12);
		if (name.length == 1){
			let key = new KeyUI(name,octave,'white',stepWidth*step,0,stepWidth,this.h);
			this.keys.push(key);
			step++;
		} else {
			let key = new KeyUI(name,octave,'black',stepWidth*(step-0.25),0,stepWidth>>1,this.h>>1);
			this.keys.push(key);
		}			
	}
	
	this.draw = function(){
		push();
		translate(this.x, this.y);
		for (let i = 0; i< this.keys.length; i++){
			if (this.keys[i].t == 'white')
				this.keys[i].draw();
		}
		
		for (let i = 0; i< this.keys.length; i++){
			if (this.keys[i].t == 'black')
				this.keys[i].draw();
		}
		pop();
	}
	
	let playedKey = null;
	this.onClicked = function(mx, my){
		let nx = mx - this.x;
		let ny = my - this.y;
		
		let clickedKeys = [];
		
		for (let i=0; i<this.keys.length; i++){
			if (isInRegion(nx, ny, this.keys[i])) {
				clickedKeys.push(this.keys[i]);
			}
		}
		
		if (clickedKeys.length == 1) {
			playedKey = clickedKeys[0];
		} else if (clickedKeys.length == 2) {
			if (clickedKeys[0].t == 'black') playedKey = clickedKeys[0];
			else playedKey = clickedKeys[1];
		}
		
		if (playedKey != null) {
			playSound(playedKey.getName(), 1);
			playedKey.state = 1;
			console.log(playedKey.getName());
		}
	}
	
	this.onReleased = function(){
		if (playedKey != null){
			playedKey.state = 0;
			playedKey = null;
		}
	}
}