// paper.install(window);
paper.setup('paper-canvas');
with (paper) {
    // Create a circle
    var circle = new Path.Circle({
        center: view.center,
        radius: 50,
        fillColor: 'red'
    });
    
    // On mouse move
    view.onMouseMove = function(event) {
        circle.position = event.point;
    };
}

