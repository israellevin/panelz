// List of panelz commands that form the story
var STORY = [
    '-p',
    'c:Sumeria: 747AD',
    'd:The inside of a cheap motel, a black telephone rings in the dark',
    'b:Hello?',
    '-p',
    '-c:Now:',
    '-b:Is there anybody?',
    '-p',
    'c:Sumeria: 747AD',
    'd:The inside of a cheap motel, a black telephone rings in the dark',
    'b:Hello?',
    '-p',
    'c:Now:',
    'b:Is there anybody?',
    '-p',
    'c:Sumeria: 747AD',
    'd:The inside of a cheap motel, a black telephone rings in the dark',
    'b:Hello?',
    '-p',
    'c:Now:',
    'b:Is there anybody?',
    '-p',
    'c:Sumeria: 747AD',
    'd:The inside of a cheap motel, a black telephone rings in the dark',
    'b:Hello?',
    '-p',
    'c:Now:',
    'b:Is there anybody?',
    '-p',
    'c:Sumeria: 747AD',
    'd:The inside of a cheap motel, a black telephone rings in the dark',
    'b:Hello?',
    '-p',
    'c:Now:',
    'b:Is there anybody?',
    '-p',
    'c:Sumeria: 747AD',
    'd:The inside of a cheap motel, a black telephone rings in the dark',
    'b:Hello?',
    '-p',
    'c:Now:',
    'b:Is there anybody?',
    '-p',
    'c:Sumeria: 747AD',
    'd:The inside of a cheap motel, a black telephone rings in the dark',
    'b:Hello?',
    '-p',
    'c:Now:',
    'b:Is there anybody?',
    '-p',
    'c:Sumeria: 747AD',
    'd:The inside of a cheap motel, a black telephone rings in the dark',
    'b:Hello?',
    '-p',
    'c:Now:',
    'b:Is there anybody?',
    '-p',
    'c:Sumeria: 747AD',
    'd:The inside of a cheap motel, a black telephone rings in the dark',
    'b:Hello?',
    '-p',
    'c:Now:',
    'b:Is there anybody?',
];

// Names of CSS classes for chunks of text within panels
var CLASSES = {
    c: 'caption',
    d: 'description',
    b: 'balloon',
};

// Objectify two numbers into a CSS compatible position
function posit(left, top){
    return {
        left: parseInt(left, 10) + 'px',
        top: parseInt(top, 10) + 'px'
    };
}

// Dynamic drawing area
var canvas = $('<div class="canvas"/>');{
    // Offscreen buffer
    canvas.buffer = [];
    canvas.rightmost = 0;
    canvas.bottomost = 0;

    // The current position in the story
    canvas.cur = false;

    // Create a panel
    canvas.panel = function(){
        var p = {};
        p.prev = canvas.cur;
        p.cur = false;
        p.div = $('<div class="panel"/>');

        // Append it to canvas
        p.add = function(){
            canvas.append(p.div);
        };

        // Add a chunk of text
        p.chunk = function(clss, text){
            var c = {};
            c.panel = p;
            c.prev = p.cur;
            c.div = $('<div class="' + clss + '">' + text + '</div>');

            // Append it to panel
            c.add = function(){
                p.div.append(c.div);
            };

            canvas.buffer.push(c);
            p.cur = c;
            return c;
        }

        canvas.buffer.push(p);
        canvas.cur = p;
        return p;
    };

    // Draw the buffer
    canvas.draw = function(){
        $.each(canvas.buffer, function(i, e){
            e.add();
        });
    };

    // Center current panel
    canvas.center = function(){
        var p = canvas.cur.div.position();
        var l = p.left;
        var t = p.top;
        var w = frame.innerWidth() - canvas.cur.div.width();
        var h = frame.innerHeight() - canvas.cur.div.height();
        p = frame.position();
        l = p.left - l + (w / 2);
        t = p.top - t + (h / 2);
        canvas.animate(posit(l, t), {queue: false});
    };
}

// Existing frame
var frame;

// When the page is done loading
$(document).ready(function(){
    frame = $('#panelz');
    frame.append(canvas);

    // Drag in frame to pan canvas
    frame.mousedown(function(e){

        // Get starting position
        var p = canvas.position();
        var l = p.left;
        var t = p.top;
        var difx = e.clientX - l;
        var dify = e.clientY - t;

        frame.mousemove(function(e){
            var l = e.clientX - difx;
            var t = e.clientY - dify;
            canvas.css(posit(l, t));
            return false;
        }).one('mouseup', function(e){
            frame.off('mousemove');
            return false;
        });
        return false;
    });

    // Start story
    frame.keydown();

// When a key is pressed
}).keydown(function(){
    var draw = true;
    var c = STORY.shift();

    // No need to draw
    if('-' == c[0]){
        c = c.slice(1);
        draw = false;
    }

    // New panel
    if('p' == c[0]){
        canvas.panel();

    // New chunk
    }else{
        canvas.cur.chunk(CLASSES[c[0]], c.slice(c.indexOf(':') + 1));
    }

    // Draw if needed, otherwise advance story
    if(draw){
        canvas.draw();
        canvas.center();
    }else{
        $(document).keydown();
    }
    return false;
});
