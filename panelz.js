//Hello, and welcome the javascript code of Panelz, which turns specifically structured instructions strings and parses it graphically as panels of text on a web page. We start with declaring strict mode.
'use strict';
// and defining some vars.
var
    // First there's the Frame, which is an existing div in the DOM that will contain the Canvas upon which we will draw the Story. We define it here, but being an existing element, we do not dare touch it till the DOM is ready.
    Frame,

    // Then there is the Story, which turns an array of script lines into indexed instructions.
    Story = {

        // Before using the story, we are expected to fill this array with the lines of the script.
        lines: [],

        // And we initialize a cache that will fill up lazily, as the lines are parsed.
        cache: [],

        // Then we can get a specific line.
        line: function(idx){

            // We try to use the cache,
            if('undefined' !== typeof this.cache[idx]){
                return this.cache[idx];
            // then we try the unparsed text.
            }else if('undefined' !== typeof this.lines[idx]){
                // Not forgetting to cache the newly parsed line.
                return (this.cache[idx] = this.parse(this.lines[idx]));
            }

            // Having failed, we return a stop command, which means the Story is infinitely padded with stop commands on both sides.
            return;
        },

        // And here we hide the actual parser, which involves regular expressions and is not for the weak of heart or gentle of pallet.
        parse: function(l){

            // First of all, we test for a line that has nothing but white-spaces, which separates blocks of commands.
            var m = l.match(/^\s*$/);
            if(m !== null){
                return;
            }

            // Now we check if it's a valid panel command, which is easily the most complex in the system. It starts with an optional label followed by the character ']', followed by an optional list of space separated classes and, optionally, by a colon followed by optional space separated positioning instructions: x offset, y offset, origin point, destination point, and the character '[' followed by the label of a previous panel to be used as anchor.
            m = l.match(/^(?:(.*))?]([^:]*)?(?::(-?[0-9.]+)?(?: (-?[0-9.]+)(?: (-?[0-9.]+)(?: (-?[0-9.]+))?)?)?(?:\s*\[(.*))?)?$/);
            if(m !== null){
                return{
                    type: 'panel',
                    labl: m[1],
                    clss: m[2] || '',
                    posi: $.map(m.slice(3, 7), function(n){
                        if(!isNaN(n)) {return parseFloat(n, 10);}
                    }),
                    ancr: m[7]
                };
            }

            // If it's not a panel, maybe it's an effect, which means it starts with a tilde, followed by the name of the effect followed by optional (space separated) arguments.
            m = l.match(/^~(\S*)(?:\s+(.*))?$/);
            if(m !== null){
                return{
                    type: 'effect',
                    comm: m[1],
                    args: m[2] && m[2].split(/\s+/)
            };
            }

            // Anything else is considered a chunk of text to be printed in the panel, optionally preceded by a space separated, comma terminated list of classes that apply to it.
            m = l.match(/^(?:([^:]*):)?(.*)$/);
            if(m !== null){

                // We default the classes list to empty string, for easier handling.
                if('undefined' === typeof m[1]){
                    m[1] = '';

                // If the first class in the classes list is prefixed with a plus sign, we will not create a new chunk, but try to append the text to an existing chunk of the same class.
                }else{
                    if('+' === m[1][0]){
                        m[1] = m[1].slice(1);
                        m[3] = true;
                    }
                }

                return{
                    type: 'chunk',
                    clss: m[1],
                    text: m[2],
                    apnd: m[3]
                };
            }
        }
    },

    // And finally the Canvas, which starts out as a simple jquery div
    Canvas = $('<div class="canvas"/>').
    // but quickly gets extended with all the properties and functions that it needs to become the dynamic drawing area we crave.
    extend({

        // First of all, we need a reference to the current panel. At this early point, it is initialized to a dummy panel that always returns position and size of 0 (so that we have a starting position) and can even automagically create the first panel for you if you try to add a chunk of text to it.
        cur: {
            position: function(){return {left: 0, top: 0};},
            outerWidth: function(){return 0;},
            outerHeight: function(){return 0;},
            point: function(){return {left: 0, top: 0};},
            chunk: function(clss, text){return Canvas.panel('','','',[]).chunk(clss, text);}
        },

        // And a dictionary of labeled panels, which can be referenced later for all sorts of cool stuff.
        labels: {},

        // The Canvas creates and draws panels (that can create and draw chunks of text) with this function. It takes a string of space separated classes, which defines how the panel looks, and an array of up to four numbers which determines where it will be drawn (x offset, y offset, origin and destination).
        panel: function(labl, clss, posi, ancr){

            // The panel is a jquery div which we extend
            var p = $('<div class="panel ' + clss + '"/>').extend({
                // with a reference to its predecessor
                prev: this.cur,
            // and append to the Canvas.
            }).appendTo(this);

            // If it is labeled, we should keep it in the dictionary.
            if('undefined' !== typeof labl) {this.labels[labl] = p;}

            // Panels are positioned relative to an anchor panel. By default this is the previous panel.
            p.anchor = (ancr && this.labels[ancr]) || p.prev;

            // But the anchor doesn't have to be the top-left corner of the panel (as is the CSS default). Instead, the corners are numbered clockwise from 0 to 3 starting at the top-left. Fractions are used to refer to points between the corners and all negative numbers refer to the center of the panel, just in case you ever wanna go there. Since this corner annotation is used both on the anchor panel and on the panel that is anchored to it (AKA "buoy panel"), we supply the panel with a function that translates it into CSS compatible coordinates.
            p.point = function(corner) {

                // First we need the size of the panel.
                var
                    w = p.outerWidth(),
                    h = p.outerHeight(),

                // Now we start with the base CSS location (top-left corner, which we call 0) and work from there.
                    o = {left: 0, top: 0};

                // Just remember a rectangle has 4 corners and you will be OK.
                corner %= 4;

                // Negative numbers denote the middle of the element.
                if(corner < 0){
                    o.left += w / 2;
                    o.top += h / 2;

                // 0 to 1 is the top edge.
                }else if(corner < 1){
                    o.left += corner * w;

                // 1 to 2 is the right edge.
                }else if(corner < 2){
                    o.left += w;
                    o.top += (corner - 1) * h;

                // 2 to 3 is the bottom edge.
                }else if(corner < 3){
                    o.left += (1 - corner + 2) * w;
                    o.top += h;

                // 3 to 4 is the left edge.
                }else if(corner < 4){
                    o.top += (1 - corner + 3) * h;
                }

                return o;
            };

            // By default, the new panel will be 5 pixels to the left of the anchor point
            p.left = 5;
            // while keeping the same height.
            p.top = 0;
            // The default anchor point is 1, which is the top-right corner,
            p.o = 1;
            // and the default destination point on the new ("buoy", remember?) panel defaults to 0, which is the top-left corner.
            p.d = 0;

            // But we override those defaults if we are supplied with arguments.
            if('undefined' !== typeof posi[0]){
                p.left = posi[0];
                if('undefined' !== typeof posi[1]){
                    p.top = posi[1];
                    if('undefined' !== typeof posi[2]){
                        p.o = posi[2];
                        if('undefined' !== typeof posi[3]){
                            p.d = posi[3];
                        }
                    }
                }
            }

            // Now we can calculate the desired left and top properties of the panel. This is a function because we will do it again every time the involved panels change, but don't worry, we will also call it as soon as we finish defining it.
            p.place = function(){

                // We get some basic numbers:
                var
                    // The position of the anchor panel,
                    o = p.anchor.position(),
                    // the position on that panel
                    a = p.anchor.point(p.o),
                    // and the offset between the destination point and the 0 point (top-left corner) of the new panel.
                    d = p.point(p.d);
                // and we set the position of the panel.
                p.css({
                    'left': (o.left + a.left + p.left - d.left) + 'px',
                    'top': (o.top + a.top + p.top - d.top) + 'px'
                });
            };
            p.place();

            // The panel creates and draws chunks of text with this function. It takes a string of space separated classes, which define how the chunk looks, and a string of text.
            p.chunk = function(clss, text){

                // In case you forgot, if a class is prefixed with a plus sign, we will try to append the text to a previous chunk of the same class.

                // The chunk is a jquery div which we extend
                var c = $('<div class="' + clss + '"/>').text(text).extend({
                    // with a reference to its containing panel
                    panel: p,
                    // and the chunk that preceded it,
                    prev: p.cur
                // and append to the panel.
                }).appendTo(p);

                // Once the chunk has been appended, we tell the containing panel to reposition itself. TODO This should probably be propagated to a chain of buoy panels.

                p.place();

                // And all that remains it to set the new chunk as the current and return it.
                return (p.cur = c);
            };

            // And all that remains it to set the new panel as the current and return it.
            return (this.cur = p);
        },

        // We keep our location in the Story
        bookmark: -1,
        // so that we can advance or rewind it till the next (or previous) stop command. Since these two functions are so similar they share a single function with the direction specified as either 1 (forward) or -1 (backward).
        go: function(dir){

            var
                // We keep a flag that sets when pans occur. If none were explicitly stated, we will center the current panel as a default effect.
                pan = false,
                // And we define a variable for the current line
                l,
                // and one for searching objects.
                o;

            // We are currently on a stop command, so we move away from it and keep getting lines till the next (or previous) stop command.
            this.bookmark += dir;
            while('undefined' !== typeof (l = Story.line(this.bookmark))){
                this.bookmark += dir;

                // If it's a panel,
                if('panel' === l.type){
                    // create it
                    if(1 === dir){
                        this.panel(l.labl, l.clss, l.posi, l.ancr);
                    // or destroy it.
                    }else if(-1 === dir){

                        // We remove the panel
                        this.cur.remove();
                        // and set the previous panel as current.
                        this.cur = this.cur.prev;
                    }

                // If it's a chunk,
                }else if('chunk' === l.type){

                    // We check whether the chunk is new or appended.
                    o = false;
                    if(true === l.apnd){
                        // and whether it can be appended.
                        o = this.cur.cur;
                        // For this we go over the previous chunks in the panel and see if one of them has the first class in the classes list.
                        while('undefined' !== typeof o){
                            if(o.hasClass(l.clss.split(' ')[0])){
                                break;
                            }else{
                                o = o.prev;
                            }
                        }
                    }

                    // If it's a new chunk,
                    if('undefined' === typeof o || false === o){
                        // create it
                        if(1 === dir){
                            this.cur.chunk(l.clss, l.text);
                        // or destroy it
                        }else if(-1 === dir){

                            // We remove the chunk
                            this.cur.cur.remove();
                            // (which means it could change size, so we better reposition it - TODO this should really be in some resize event)
                            this.cur.place();
                            // and set the previous chunk as current.
                            this.cur.cur = this.cur.cur.prev;
                        }

                    // If it's an appendage,
                    }else{
                        // append it with all the new classes
                        if(1 === dir){
                            o.addClass(l.clss).append(l.text);
                            // and update position
                            Canvas.cur.place();
                        // or chop it off.
                        }else if(-1 === dir){
                            o.text(o.text().slice(0, -1 * l.text.length));
                        }
                    }

                // and if it's an effect, execute it.
                }else if('effect' === l.type){

                    // An empty string means no effect,
                    if('' === l.comm){
                        ;
                    // 'pan' with two numbers pans the Canvas
                    }else if('pan' === l.comm){
                        this.pan(l.args[0], l.args[1]);
                    // and 'center' centers a panel.
                    }else if('center' === l.comm){
                        this.center(l.args[0]);
                    }
                    // Oh, and don't forget to set the flag.
                    pan = true;
                }
            }

            // If no effects were used, we center the current panel.
            if(!pan) {this.center();}
        },

        // The Canvas also has built-in effects. Most basic of which is this animation that slides the Canvas to a new position (given as left and top CSS properties - the Canvas is relatively positioned within the Frame).
        pan: function(l, t){
            this.animate({

                // Tried to use jquery's animate() on top and left directly, but it has a bug with zoomed webkit windows (something to do with position() not really working the same way on webkit and mozilla), so had to use fake properties
                ttop: t,
                lleft: l
            },{
                // and write my own step.
                step: function(now, fx){
                    Canvas.css(fx.prop.slice(1), now);
                },

                // Using the queue here is tempting, since it forces the reader to go through all the right places even if he is paging quickly, but in reality it's just tedious
                queue: false,
                // and we do not want to be tedious.
                duration: 200
            });
        },

        // Only slightly more complex is this animation, which centers the current panel. This is the default effect.
        center: function(anchor){

            // If an anchor was given, we try to get it,
            if('string' === typeof anchor){
                anchor = this.labels[anchor];
            }
            // then we default to the current panel.
            if('undefined' === typeof anchor){
                anchor = this.cur;
            }

            // We obtain the position of the current panel in the Frame
            var
                p = anchor.position(),
                l = p.left,
                t = p.top;
            // and subtract it from half a Frame minus half a panel.
            l = (0.5 * (Frame.innerWidth() - anchor.outerWidth())) - l;
            t = (0.5 * (Frame.innerHeight() - anchor.outerHeight())) - t;
            this.pan(l, t);
        }
    });

// When the DOM is ready, we can put all the parts together.
$(function(){

    // We get the Frame div, append the Canvas to it
    Frame = $('#panelz').append(Canvas).
    // And bind the mouse down event within the Frame to enable mouse drag which will pan the Canvas. Note that we return false on all the related events (mousedown, mousemove and mouseup) to make sure they do not propagate and, e.g., select pieces of the page.
    mousedown(function(e){

        // First we save the starting position of the mouse drag and the starting position of the Canvas.
        var
            startx = e.pageX,
            starty = e.pageY,
            o = Canvas.offset(),
            l = o.left,
            t = o.top;

        // Then we bind a function so that when the mouse moves we calculate how much it moved since the drag started and modify the top and left CSS properties of the Canvas to move it along with the pointer.
        Frame.mousemove(function(e){
            Canvas.offset({
                left: l + (e.pageX - startx),
                top: t + (e.pageY - starty)
            });
            return false;

        // Once the drag ends, we unbind the mouse move function.
        }).one('mouseup', function(e){
            Frame.off('mousemove');
            return false;
        });
        return false;
    });

    // Then we initialize the Story.
    Story.lines =

        // We find and detach the textarea inside the Frame which contains the script (TODO In the far future we may have an edit mode which brings it back)
        Frame.find('textarea').detach().
        // and split its text into an array of lines.
        text().split("\n");

    // Lastly we forward the story to a hard coded bookmark, so we don't have to page from the beginning every time. TODO In the future, this value will be taken from a cookie, or the cursor position in the textarea. Maybe it will even get its own global object.
    for(var x = 0; x < 741; (x++)) Canvas.go(1);

// And we bind the keyboard driven interface.
}).keydown(function(e){

    // Right arrow and space go forward.
    if(39 === e.which || 32 === e.which){
        Canvas.go(1);

    // Left arrow goes back.
    }else if(37 === e.which){
        Canvas.go(-1);

    // Anything else will log itself, to make it easier for me to bind new keys to new functions, and return true so that someone else will handle it.
    }else{
        console.log('unknown key', e.which);
        return true;
    }

    // If the keystroke was recognized as a command and handled, we return false, to stop propagation.
    return false;
});
