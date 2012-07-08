// The existing panelz frame
var frame;

// TODO: get bookmark into a cookie
var bookmark = 0;

// Dynamic drawing area, filled up on ready
var canvas = $('<div class="canvas"/>');
canvas.create = function(text){

    // Parsed instructions
    canvas.story = {};

    // Offscreen buffer
    canvas.buffer = [];

    // The current position in the story
    canvas.idx = -1;
    canvas.cur = false;

    // Draw a panel
    canvas.panel = function(clss, posi){
        var p = {};
        p.prev = canvas.cur;
        p.cur = false;
        p.div = $('<div class="panel ' + clss + '"/>');
        canvas.append(p.div);

        // Make sure we have enough margin on the right
        var pos = p.div.position();
        if(canvas.innerWidth() - pos.left < 1000) canvas.width(canvas.width() + 1000);

        // Add a chunk of text
        p.chunk = function(clss, text){
            var c = {};
            c.panel = p;
            c.prev = p.cur;
            c.div = $('<div class="' + clss + '">' + text + '</div>');

            // Append it to panel
            p.div.append(c.div);

            p.cur = c;
            return c;
        }

        canvas.cur = p;
        return p;
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
        l = l + (w / 2);
        t = t + (h / 2);
        canvas.pan(l, t);
    };

    // Move story forward
    canvas.forward = function(){

        // Get the next line in the story
        if('undefined' === typeof canvas.story[++canvas.idx]){
            canvas.story[canvas.idx] = parseLine(text[canvas.idx]);
        }
        var l = canvas.story[canvas.idx];

        // Buffer lines till it's time to draw
        if('draw' !== l.type){
            canvas.buffer.push(l);
            canvas.forward();

        // Draw the buffer
        }else{
            while(canvas.buffer.length > 0){
                l = canvas.buffer.shift();
                if('panel' === l.type){
                    canvas.panel(l.clss, l.posi);
                }else if('chunk' === l.type){
                    canvas.cur.chunk(l.clss, l.text);
                }else if('effect' === l.type){
                    console.log(l);
                }
            }
        }
    };

    // Move story backward
    canvas.backward = function(){

        // Remove and relink
        var l = canvas.story[--canvas.idx];
        if(canvas.cur.cur){
            canvas.cur.cur.div.remove();
            canvas.cur.cur = canvas.cur.cur.prev;
        }else if(canvas.cur){
            canvas.cur.div.remove();
            canvas.cur = canvas.cur.prev;
        }

        // Keep going back till we hit a draw command
        // TODO undo effects
        if('draw' !== l.type){
            canvas.backward();
        }else{
            canvas.center();
        }
    };
}

// When the page is done loading
$(document).ready(function(){
    frame = $('#panelz').append(canvas);

    // Fix up the canvas
    canvas.create(frame.find('textarea').detach().text().split("\n"));

    // Drag in frame to pan canvas
    frame.mousedown(function(e){

        // Get starting position
        var startx = e.pageX;
        var starty = e.pageY;
        var o = canvas.position();
        var x = o.left - startx;
        var y = o.top - starty;

        frame.mousemove(function(e){
            canvas.offset(posit(x + e.clientX, y + e.clientY));
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

// Parser for panelz commands.
function parseLine(l){
    var m;

    // Draw: empty line
    m = l.match(/^\s*$/);
    if(m !== null){
        return{
            type: 'draw'
        };
    }

    // Panel: starts with the character ']', followed by an optional
    // list of classes (space separated) and an optional colon with up
    // to 4 optional comma separated positioning instructions: x offset,
    // y offset, origin and destination (floating point numbers).
    m = l.match(/^]([^:]*)?:?(?:(-?[0-9.]+)(?:,(-?[0-9.]+)(?:,(-?[0-9.]+)(?:,(-?[0-9.]+))?)?)?)?$/);
    if(m !== null){
        return{
            type: 'panel',
            clss: m[1] || '',
            posi: $.map(m.slice(2), function(n){
                if(!isNaN(n)) return parseFloat(n, 10);
            })
        };
    }

    // Effect: starts with the character '~', followed by a commands
    // and optional arguments (space separated).
    m = l.match(/^~(\S*)\s+(.*)$/);
    if(m !== null){
        return{
            type: 'effect',
            command: m[1],
            arguments: m[2] && m[2].split(/\s+/)
        };
    }

    // Chunk: a optional list of classes (space separated) separated by
    // a colon from the optional free text of the chunk.
    m = l.match(/^(?:([^:]*):)?(.*)$/);
    if(m !== null){
        return{
            type: 'chunk',
            clss: m[1] || '',
            text: m[2]
        };
    }
}

// Objectify two numbers into jquery's position format
function posit(left, top){
    return {
        left: parseInt(left, 10),
        top: parseInt(top, 10)
    };
}
