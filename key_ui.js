var KeyUI = function(name,o,t,x,y,w,h){
	this.name = name;
	this.o = o;
	this.t = t;
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	
	this.draw = function(){
		push();
		translate(this.x, this.y);
		if (this.t == 'white'){
			fill('#fff');
		} else {
			fill('#000');
		}
		rect(0,0,this.w, this.h);
		pop();
	}
}