// Parser for panelz commands.
// Panel: [-]:[classes][(direction,distance)][(effect)]
// Chunk: [-][classes:][text]
function parseLine(l){
    var cls = '';
    var eff = 'center';

    // Will the item be drawn immediately or buffered?
    var draw = true;
    if('-' === l[0]){
        draw = false;
        l = l.slice(1);
    }

    // Panel
    if(':' === l[0]){
        var dir = 3;
        var dis = 3;
        var tuple;

        // Panels are buffered by default
        draw = !draw;

        // Classes
        l = l.match(/.([^(]*)(.*)/);
        cls = l[1];
        l = l[2];

        // Positioning and effects
        while('(' === l[0]){
            l = l.match(/.([^)]*)\)(.*)/);

            // Direction may be specified without distance
            tuple = l[1].match(/([0-9.]+)(,([0-9]+))?/);
            if(tuple){
                dir = tuple[1];
                if(tuple[3]) dis = tuple[3];
            }else{
                eff = l[1];
            }
            l = l[2];
        }

    // Chunk
    }else{
        l = l.match(/(([^:]*):)?(.*)/);
        cls = l[2];
        l = l[3];
    }

    return {
        draw: draw,
        cls: cls,
        dir: dir,
        dis: dis,
        eff: eff,
        txt: l
    }
}

// TODO: get bookmark into a cookie
var bookmark = 0;
var story;

// Dynamic drawing area
var canvas = $('<div class="canvas"/>');{

    // Offscreen buffer
    canvas.buffer = [];

    // The current position in the story
    canvas.idx = -1;
    canvas.cur = false;

    // Create a panel
    canvas.panel = function(line){
        var p = {};
        p.prev = canvas.cur;
        p.cur = false;
        p.div = $('<div class="panel ' + line.cls + '"/>');

        // Append it to canvas
        p.add = function(){
            canvas.append(p.div);

//            // Anchored location
//            var acls = p.div.attr('class').match(/\bbuoy-([^ ]*)/);
//            if(acls && acls[1]){
//                var a = p.prev;
//                while(a){
//                    if(a.div.hasClass('anchor-' + acls[1])){
//                        break;
//                    }else{
//                        a = a.prev;
//                    }
//                }
//                if(a){
//                    var offset = p.div.css('top');
//                    if('auto' !== offset){
//                        console.log('top');
//                    }
//                }
//            }

            // Make sure we have enough margin on the right
            var pos = p.div.position();
            if(canvas.innerWidth() - pos.left < 1000) canvas.width(canvas.width() + 1000);
        };

        // Add a chunk of text
        p.chunk = function(line){
            var c = {};
            c.panel = p;
            c.prev = p.cur;
            p
            p
            c.div = $('<div class="' + line.cls + '">' + line.txt + '</div>');

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
        var line = story[++canvas.idx];

        // New panel
        if('undefined' !== typeof line.dir){
            canvas.panel(line);

        // New chunk
        }else{
            canvas.cur.chunk(line);
        }

        // Draw if needed, otherwise advance story
        if(false !== line.draw){
            canvas.draw();
            if(line.eff){
                if('center' === line.eff[0]) canvas.center();
                else if('pan' === line.eff[0]) canvas.pan(line.eff[1], line.eff[2]);
            }
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
        var line = story[--canvas.idx];

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
    story = $.map(frame.find('textarea').text().split("\n"), function(l){
        return parseLine(l);
    });
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

