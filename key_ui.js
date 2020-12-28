var KeyUI = function(name,o,t,x,y,w,h){
	this.name = name;
	this.o = o;
	this.t = t;
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.state = 0;
	
	this.getName = function() {
		return this.name.split("/")[0]+this.o;
	}
	
	this.draw = function(){
		push();
		translate(this.x, this.y);
		if (this.t == 'white'){
			fill('#fff');
		} else {
			fill('#000');
		}
		rect(0,0,this.w, this.h);
		
		if (this.state == 1){
			fill('#f00');
			ellipse(this.w >> 1, (this.h >> 1) + (this.h >> 2), 4, 4);
		}
		pop();
	}
}