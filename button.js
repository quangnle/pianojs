var ButtonUI = function(x,y,w,h,color,txColor,caption){
	this.x = x;
	this.y = y;
	this.h = h;
	this.w = w;
	this.color = color;
	this.tcColor = txColor
	this.caption = caption;

	this.draw = function(){
		fill(color);
		rect(this.x, this.y, this.w, this.h);
	}
}