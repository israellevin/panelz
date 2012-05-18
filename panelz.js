// List of panelz commands that form the story
var STORY = [
    'p',
    'c:It\'s me.',
    'c:I\'m the ONLY one seeing this.',
    'c:Perhaps the shrooms weren\'t a good idea.',
    '-p',
    'c:...It all starts a few months ago, sometime in the near future...',
    'd:Close up on Deaderman talking. A gentle face. Bad skin. Thick glasses.',
    'b:You\'ll need to sign NDAs and crap before I can even tell you about it.',
    '-p',
    'c:I like to consider myself a gentleman of leisure, but it\'s the 21 century.',
    'c:At best, people consider me a talented bum.',
    'd:Camera moves back a bit. Deaderman is waving his arms enthusiastically behind a little cloud of cigarette smoke.',
    'b:And you need to get tagged too. Just to enter the facility.',
    '-p',
    'c:Still, I have my principles.',
    'b:Fuck that heart of darkness shit. You know I don\'t do proprietary.',
    'd:Close up on Deaderman frowning.',
    'b:Your morals are irrelevant. This project NEEDS you. You will never forgive yourself if you skip this one. Trust my superior intellect.',
    '-p',
    'c:A great salesman he isn\'t, but he IS a genius. No one knows machine learning better than the big D. If HE makes a fuss about it it\'s worth checking out.',
    'c: So I sign.',
    'd:Deaderman from behind, walking towards a hi־tech reinforced door.',
    'b:Right. Blow my mind.',
    '-p',
    'd:Deaderman turns to me as he opens the door.',
    'b:Virtual reality. Neurointerface all the way. No goggles no nothing, the real deal.',
    'b:How real?',
    'b:Like reality.',
    '-p',
    'd:Deaderman goes through the door and motions me to come along',
    'b:Not nearly as complex, but totaly real. The Matrix.',
    'b:This I NEED to see.',
    'b:That\'s precisely what I told you.',
    '-p',
    'd:Deaderman is spreading his arms wide.',
    'b:This is it. This is the machine.',

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
