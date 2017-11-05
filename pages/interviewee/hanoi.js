function hanoi(layer, poleA, poleB, poleC) {
    var layer = layer || 1;
    var poleA = poleA || 'A';
    var poleB = poleB || 'B';
    var poleC = poleC || 'C';

    if (layer==1) {
        moveLog(poleA, poleC);
    }else{
    	hanoi(layer-1, poleA, poleC, poleB);
    	hanoi(1, poleA, poleB, poleC);
    	hanoi(layer-1, poleB, poleA, poleC);
    }
}

var steps = [];

function moveLog(poleFrom, poleTo) {
    steps.push(steps.length + '. ' + poleFrom + ' --> ' + poleTo)
    console.log(steps[steps.length-1]);
}

hanoi(3);