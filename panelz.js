// List of panelz commands that form the story
var STORY = [
    'p',
    'c:It\'s me.',
    'c:I\'m the ONLY one seeing this.',
    '-p newline',
    'c:...It starts some months ago, sometime in the near future...',
    'd:Close up on Deaderman talking. A gentle face. Bad skin. Thick glasses.',
    'b deaderman bright:You\'ll need to sign the NDA before I can even tell you about it.',
    'd deaderman right:*cough*',
    '-p',
    'c:I like to consider myself a gentleman of leisure, but it\'s the 21 century.',
    'c:Other people consider me a talented bum. At best.',
    'd:Camera moves back a bit. Deaderman is waving his arms enthusiastically behind a little cloud of cigarette smoke.',
    'b deaderman bright:And you need to get tagged before you enter the lab.',
    '-p',
    'c:Still, I have my principles.',
    'b narrator bleft:Fuck that heart of darkness shit. You know I don\'t do proprietary.',
    'd:Close up on Deaderman frowning.',
    'b deaderman bright:This is beyond your morals – you will NEVER forgive yourself if you skip this one. Trust my superior intellect.',
    '-p newline',
    'c:A great salesman he isn\'t, but he IS a genius. No one groks machine learning like the big D. If HE makes a fuss about it, it\'s worth checking out.',
    'c: So I sign.',
    'd:Deaderman from behind, approaching a hi־tech reinforced door.',
    'b narrator bleft:Right. Blow my mind.',
    '-p',
    'd:Deaderman turning to the camera as he fumbles with a key־card.',
    'b deaderman bright:It\'s right here. Full neuro. No goggles no nothing.',
    'b narrator bleft:And you say it feels real. Like...',
    'b deaderman bright:Like reality.',
    '-p',
    'd:Deaderman goes through the door and motions me to come along',
    'b deaderman bright:Not nearly as complex, but totally real.',
    'b narrator bleft: Like the Matrix.',
    'b deaderman bright:Like the Matrix.',
    '-p',
    'c: You can\'t say technology hasn\'t been going in that direction for a while, but still – about fucking time.',
    'd:Beyond the open door there is a large space, almost a hangar, with several workstations around a hospital bed with wires dangling about it.',
    '-p',
    'c: Deaderman standing beside the bed, laying a hand on the mattress.',
    'b narrator bleft:This I NEED to see.',
    'b deaderman bright:That\'s precisely what I told you.',
    '-p fullpage',
    '-d right:Deaderman is spreading his arms wide.',
    ':pan 0 0:b deaderamn bright right:This is it. This is the machine.',

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

// TODO: get bookmark into a cookie
var bookmark = 0;

// Dynamic drawing area
var canvas = $('<div class="canvas"/>');{

    // Offscreen buffer
    canvas.buffer = [];

    // The current position in the story
    canvas.idx = -1;
    canvas.cur = false;

    // Create a panel
    canvas.panel = function(clss){
        var p = {};
        p.prev = canvas.cur;
        p.cur = false;
        p.div = $('<div class="panel' + clss + '"/>');

        // Append it to canvas
        p.add = function(){
            canvas.append(p.div);
            var pos = p.div.position();
            if(canvas.innerWidth() - pos.left < 1000) canvas.width(canvas.width() + 1000);
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
        while(canvas.buffer.length > 0) canvas.buffer.shift().add();
    };

    // Pan canvas
    canvas.pan = function(l, t){
        canvas.animate(posit(l, t), {queue: false});
    }

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
        canvas.pan(l, t);
    };

    // Move story forward
    canvas.forward = function(){

        // Get the next line in the story
        var line = STORY[++canvas.idx];

        // Default drawing action
        var draw = ['center'];

        // Lines that start with a colon contain a custom draw command
        if(':' == line[0]){
            line = line.slice(1);
            line = line.split(':');
            draw = line.shift().split(' ');
            line = line.join(':');
        }

        // Lines that start with a dash are buffered instead of drawn
        else if('-' == line[0]){
            line = line.slice(1);
            draw = false;
        }

        // New panel
        if('p' == line[0]){
            canvas.panel(line.slice(1));

        // New chunk
        }else{
            line = line.split(':');
            canvas.cur.chunk(line.shift(), line.join(':'));
        }

        // Draw if needed, otherwise advance story
        if(false !== draw){
            canvas.draw();
            if('center' === draw[0]) canvas.center();
            else if('pan' === draw[0]) canvas.pan(draw[1], draw[2]);
        }else{
            canvas.forward();
        }
    };

    // Move story backward
    canvas.backward = function(){
        if(canvas.cur.cur){
            canvas.cur.cur.div.remove();
            canvas.cur.cur = canvas.cur.cur.prev;
        }else if(canvas.cur){
            canvas.cur.div.remove();
            canvas.cur = canvas.cur.prev;
        }

        // Get the prev line in the story
        var line = STORY[--canvas.idx];

        // Lines that start with a dash were buffered, so keep going
        if('-' == line[0]){
            canvas.backward();
        }else{
            canvas.center();
        }
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

    // Page forward to current location
    while(canvas.idx < bookmark) canvas.forward();

// When a key is pressed
}).keydown(function(e){

    // Right arrow and space go forward
    if(39 === e.which || 32 === e.which){
        canvas.forward();

    // Left arrow goes back
    }else if(37 === e.which){
        canvas.backward();

    }else{
        console.log(e.which);
        return true;
    }
    return false;
});

// Objectify two numbers into a CSS compatible position
function posit(left, top){
    return {
        left: parseInt(left, 10) + 'px',
        top: parseInt(top, 10) + 'px'
    };
}

