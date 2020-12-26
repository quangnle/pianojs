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
		let octave = Math.ceil(i/12);
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
}