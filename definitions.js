var NOTES = ['C','C#/Db','D','D#/Eb','E','F','F#/Gb','G','G#/Ab','A','A#/Bb','B'];
var MAJOR = [1,3,4.5];
var MINOR = [1,2.5,4.5];
var MAJOR_7 = [1,3,4.5,6]
var MAJOR_M7 = [1,3,4.5,6.5];
var MINOR_7 = [1,2.5,4.5,6]
var MINOR_M7 = [1,2.5,4.5,6.5];
var AUG = [1,3,5];
var DIM = [1,2.5,4];

function getKeyPosition(name){
	for (let i = 0; i < NOTES.length; i++){
		let names = NOTES[i].split('/');
		for(let j = 0; j < names.length; j++) {
			if (name == names[j]) return i;
		}
	}
}

function getKeysFromChord(name){
	let root = name[0];
	if (name.length > 1){
		if (name[1] == '#' || name[1] == 'b'){
			root += name[1];
		} else {
			if (name[1] == 'm') { // minor
				if (name.length > 2) {
					// minor M7
				}
			} else if (name[1] == 'M') {
				//M7
			} else if (name[1] == 'd' || name[1] == 'D' || name[1] == '-') {
				if (name[1] == '-'){
					if (name.length > 2) {
						// dim7
					}
				} else {
					if (name.length > 4){
						// dim 7
					} else {
						//dim
					}
				}
			} else if (name[1] == 'a' || name[1] == 'A' || name[1] == '+') {
				if (name[1] == '-'){
					if (name.length > 2) {
						// aug7
					}
				} else {
					if (name.length > 4){
						// aug7
					} else {
						// aug
					}
				}
			}
		} 
		
	}
}