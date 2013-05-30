//Hello, and welcome the javascript code of Panelz, which parses structured text and turns it into graphical, interactive panels of text on a web page. We start, as is usually recommended, by closing everything in an anonymous function, declaring strict mode and defining some vars.
(function(){'use strict'; var

    // First there's the Frame, which is based on an existing div in the DOM that the user will supply us with. Within it we will plant the Canvas upon which we will draw the Story. We define it here, but we can't really touch it before the user hands it over.
    Frame,

    // Then there's the Canvas, which starts out as a simple jquery div
    Canvas = $('<div class="canvas"/>').
    // but quickly gets extended with all the properties and functions that it needs to become the dynamic drawing area we crave.
    extend({

        // We always maintain a reference to the current panel. At this early point, the reference is initialized to a dummy panel that always returns position and size of 0 (so that we have a starting position) and can even automagically create the first panel for you if you try to add a chunk of text to it.
        cur: {
            pos: {left: '0em', top: '0em'},
            get: function(){return {
                style: this.pos,
                offsetWidth: 0,
                offsetHeight: 0
            };},
            position: function(){return this.pos;},
            outerWidth: function(){return 0;},
            outerHeight: function(){return 0;},
            point: function(){return {left: 0, top: 0};},
            chunk: function(clss, text){return Canvas.panel('','','',[]).chunk(clss, text);}
        },

        // We also hold a dictionary of labeled panels, which can be referenced later for all sorts of cool stuff,
        labels: {},
        // an internal bookmark to keep the index of the current line (set to -1 as we haven't even started),
        bookmark: -1,
        // and the scripted position. Note that this does not have to be the real position. Users can scroll, animations can be stopped, and who knows what the UI is doing, but the scripted position disregards all this nonsense and pretends it lives in a perfect world. That why we need it and can't make do with position().
        pos: {left: 0, top: 0},

        // Now, all we need is an undo stack
        undostack: [],
        // with its own undo function that can either be invoked with a function to store and an optional data object (both will be closured), or with no arguments to execute the top of the stack.
        undo: function(f, d){
            if('function' === typeof f){
                Canvas.undostack.push(
                    function(f, d){
                        return function(){f(d);};
                    }(f, d)
                );
            }else{

                // Note how we pop the double bubble at the end there.
                if(Canvas.undostack.length > 0) Canvas.undostack.pop()();
            }
        },

        // With this we can create and draw panels (that can create and draw chunks of text). The parameters for a new panel are a string of space separated CSS classes (which define the look of the panes) and an array of up to four numbers which determines where it will be drawn (x offset, y offset, origin on anchor and destination on target - this will be made clearer later. I hope).
        panel: function(labl, clss, posi, ancr){

            // The panel is a jquery div which we append to the Canvas and extend with a reference to its predecessor
            var p = $('<div class="panel"/>').addClass(clss).appendTo(Canvas).extend({
                prv: Canvas.cur,
            });

            // If it is labeled, we should keep it in the dictionary.
            if('undefined' !== typeof labl) {Canvas.labels[labl] = p;}

            // Panels are positioned relative to an anchor panel. By default this is the previous one.
            p.anchor = (ancr && Canvas.labels[ancr]) || p.prv;

            // But the anchor doesn't have to be the top-left corner of the panel (as is the CSS default). Instead, the corners are numbered clockwise from 0 to 3 starting at the top-left. Fractions are used to refer to points between the corners and all negative numbers refer to the center of the panel, just in case you ever wanna go there. Since this corner annotation is used both on the anchor panel and on the panel that is anchored to it (AKA "buoy panel"), we supply the panel with a function that translates it into CSS compatible coordinates.
            p.point = function(corner) {

                // First we need the size of the panel, in ems.
                var
                    w = p.get(0).offsetWidth / Canvas.fontsize,
                    h = p.get(0).offsetHeight / Canvas.fontsize,

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

            // By default, the new panel will be 1 em to the left of the anchor point
            p.left = 1;
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

                // We start with basic measurements.
                var
                    // The anchor element,
                    anchor = p.anchor.get(0),
                    // the origin point on the anchor
                    origin = p.anchor.point(p.o),
                    // and the destination point on the current panel.
                    destin = p.point(p.d);

                // Then we get the anchor's top left in ems (look ma no jquery),
                anchor = {
                    top: parseFloat(anchor.style.top.slice(0, -2), 10),
                    left: parseFloat(anchor.style.left.slice(0, -2), 10)
                };
                // and set the position of the panel.
                p.css({
                    'left': (anchor.left + origin.left + p.left - destin.left) + 'em',
                    'top': (anchor.top + origin.top + p.top - destin.top) + 'em'
                });
            };
            p.place();

            // The panel creates and draws chunks of text with this function. It takes a string of space separated classes, which define how the chunk looks, and a string of text.
            p.chunk = function(clss, text){

                // The chunk is a jquery div which we append to the panel and extend.
                var c = $('<div class="' + clss + '"/>').html(text).appendTo(p).extend({
                    // with a reference to its containing panel
                    panel: p,
                    // and the chunk that preceded it,
                    prv: p.cur
                });

                // Then we set the new chunk as the current and return it.
                return (p.cur = c);
            };

            // Then we set the new panel as the current and return it.
            return (Canvas.cur = p);
        },

        // So if you give us a line, we can make it happen on the Canvas, and prepare the undo stack.
        drawline: function(l){

            //We define a variable for chunks, just in case we run into them later on.
            var o;

            // Now we check the line. It might be a panel,
            if('panel' === l.type){
                // and then we create it
                Canvas.panel(l.labl, l.clss, l.posi, l.ancr);
                // and push an undo function that removes it
                Canvas.undo(function(){
                    // by removing the panel
                    Canvas.cur.remove();
                    // and setting the previous panel as current.
                    Canvas.cur = Canvas.cur.prv;
                });
            // it might be a chunk,
            }else if('chunk' === l.type){
                // and then we check if it's meant to be appended to an old chunk.
                if(true === l.apnd){
                    // in which case we go back through the chain of chunks, hoping to find one that shares the first class in the classes list with the chunk we want to add.
                    o = Canvas.cur.cur;
                    while('undefined' !== typeof o){
                        if(o.hasClass(l.clss.split(' ')[0])){
                            break;
                        }else{
                            o = o.prv;
                        }
                    }
                }

                // New chunks are easy:
                if('undefined' === typeof o){
                    // create it
                    Canvas.cur.chunk(l.clss, l.text);
                    // and push an undo function that removes it.
                    Canvas.undo(function(){
                        // by removing the chunk
                        Canvas.cur.cur.remove();
                        // and setting the previous chunk as current.
                        Canvas.cur.cur = Canvas.cur.cur.prv;
                    });

                // Appendages are a little trickier:
                }else{
                    // we know it might change the class attribute of whatever chunk it will be appended to, so we start by pushing a closured function that will chop it off along with the classes it rode to town on. Note that we are using the html() function, as the text of the chunk may very well be.
                    Canvas.undo(function(d){
                        d.o.attr('class', d.clss).html(d.txt);
                    },{o: o, clss: o.attr('class'), txt: o.html()});

                    // Only then do we append the appendage with its potentially new classes.
                    o.addClass(l.clss).append(l.text);

                    // And reset o.
                    o = undefined;
                }

                // After adding chunks we tell the containing panel to reposition itself. TODO This should probably be propagated to a chain of buoy panels, maybe also on some resize event.
                Canvas.cur.place();
                // The same is true also after removing chunks and appendages, so we need to pop out the last item in the undo stack and append a place command.
                Canvas.undo(function(o){
                    o();
                    Canvas.cur.place();
                }, Canvas.undostack.pop());
            // or else it's an effect, in which case we execute it. No need to worry about the undo stack here, the effects should take care of it themselves.
            }else if('effect' === l.type){

                // An empty string means no effect,
                if('' === l.comm){
                    // which doesn't mean it's not counted by the undo stack, dammit!
                    Canvas.undo(function(){;});
                // 'pan' with two numbers pans the Canvas
                }else if('pan' === l.comm){
                    Canvas.pan(l.args[0], l.args[1]);
                // and 'center' centers a panel.
                }else if('center' === l.comm){
                    Canvas.center(l.args && l.args[0]);
                }
            }
        },

        // Now we can advance the story with a positive number of steps or rewind it with a negative number.
        go: function(steps){
            var

                // We isolate the direction in which we are heading, which will be useful later on,
                dir = (steps < 0) ? -1 : 1,
                // get the current position of the Canvas, in case it needs correction,
                pos = Canvas.position(),
                // and define variables for the current line,
                l,
                // and a flag that sets when a scripted effect takes place, so that if none occur till the next stop command we center the current panel (at that time) as a default effect.
                center;

            // If we are told to go off the story borders, we do not go there. It is a silly place.
            if((Canvas.bookmark + dir) < 0 || (Canvas.bookmark + dir) >= Story.lines.length) return;

            // Otherwise, we take the required steps.
            for(; steps !== 0; steps -= dir){

                // If we are currently playing a pan animation, we should finish it.
                Canvas.finish('pan');

                // If we are not currently at the right spot, we should hurry there.
                if((Canvas.pos.left !== pos.left || Canvas.pos.top !== pos.top) && ! Canvas.is(':animated')){
                    Canvas.pan(Canvas.pos.left, Canvas.pos.top, true);
                }

                // We are currently, by definition, on a stop command, so we set the flag and move away from it and keep going till the next stop command.
                center = true;
                for(Canvas.bookmark += dir;
                    'undefined' !== typeof (l = Story.line(Canvas.bookmark));
                    Canvas.bookmark += dir){

                    // We do not autocenter if we encounter an effect.
                    if('effect' === l.type) center = false;

                    // If we are heading back, all we have to do is call undo to pop the top of the undo stack and execute the function which we will have prepared in advance (time is an illusion, execution time doubly so).
                    if(steps < 1){
                        Canvas.undo();
                    // If we are not heading back, we draw the line (and prepare said undo stack).
                    }else{
                        Canvas.drawline(l);
                    }
                }

                // If no effects were used, we either center the current panel, or, if we are heading backward, undo the centering we did when we came by forward.
                if(true === center){
                    if(dir > 0){
                        Canvas.center();
                    }else{
                        Canvas.undo();
                    }
                }
            }
            // And start the animation.
            Canvas.dequeue('pan');
        },

        // This is where we keep the built-in effects of the Canvas. TODO One day this might accept plugins, but ATM if you want your own effects you write them here and parse them above, in the effects section of the go function.

        // The most basic effect is sliding the Canvas to a new position (given as left and top CSS properties - the Canvas is relatively positioned within the Frame).
        pan: function(l, t, isundo){
            var
                // So we get the starting (current) position of the Canvas
                startl = Canvas.position().left,
                startt = Canvas.position().top,
                // and figure out how far it has to go.
                diffl = Math.abs(startl - l),
                difft = Math.abs(startt - t);

            // The duration of the pan is a function of its magnitude, with safe minimum and maximum durations.
            diffl = Math.min(Math.max(diffl, 500), 5000) / 2000;
            difft = Math.min(Math.max(difft, 500), 5000) / 2000;

            // If this isn't already an undo, we push an undo pan to the undo stack, using the scripted position,
            if(true !== isundo) Canvas.undo(function(d){
                Canvas.pan(d.l, d.t, true);
            }, {l: Canvas.pos.left, t: Canvas.pos.top});
            // and change the scripted position.
            Canvas.pos = {left: l, top: t};

            // Jquery does not handle zoomed webkit windows very well, so I'm using a fake properties here.
            Canvas.animate({
                lleft: l,
                ttop: t
            },{
                step: function(x, fx){
                    Canvas.css(fx.prop.slice(1), x);
                },
                queue: 'pan'
            });
        },

        // Only slightly more complex is this animation, which centers a panel (it defaults to the current panel, and centering it is the default effect).
        center: function(anchor){

            // If an anchor was given, we try to get it,
            if('string' === typeof anchor){
                anchor = Canvas.labels[anchor];
            }
            // then we default to the current panel.
            if('undefined' === typeof anchor){
                anchor = Canvas.cur;
            }

            // We obtain the position of the anchor in the Frame
            var
                p = anchor.position(),
                t = p.top,
                l = p.left;
            // and subtract it from half a Frame minus half the anchor.
            l = (0.5 * (Frame.innerWidth() - anchor.outerWidth())) - l;
            t = (0.5 * (Frame.innerHeight() - anchor.outerHeight())) - t;
            Canvas.pan(l, t);
        }
    }),

    // And finally there is the Story, which turns an array of script lines into indexed instructions. TODO It should be rather easy for someone to implement their own Story, which is not dependant on my invented syntax.
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

        // And here we hide the actual parser, which involves regular expressions and is not for the weak of heart or gentle of palate.
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

                // Otherwise, it's just a chunk.
                return{
                    type: 'chunk',
                    clss: m[1],
                    text: m[2],
                    apnd: m[3]
                };
            }
        }
    };

    // Now we can put the parts together to create our API:
    window.panelz = {
        // Give us a string with a script and a DOM element to use as a Frame and we will set up the show.
        load: function(framee, scriptstr, bookmark){

            // To protect the original frame from harm, we save it,
            framee = $(framee);
            // measure its (and the future Canvas's) computed font size so we can convert pixels to ems,
            Canvas.fontsize = parseFloat(framee.css('fontSize').slice(0, -2), 10);
            // and plant the Canvas in an emptied clone of it.
            Frame = framee.clone().empty().append(Canvas);

            // Then we initialize the Story with the lines of the script,
            Story.lines = scriptstr.split("\n");
            Story.cache = [];
            // set the bookmark to the beginning
            Canvas.bookmark = -1;
            // and insert the pimped up clone after the original,
            Frame.insertAfter(framee);
            // which we promptly detach (replaceWith would destroy the events).
            framee = framee.detach();

            // This puts us at a perfect position to create the unload function
            this.unload = function(){

                // Here it's OK to use replaceWith (we don't mind losing our own events), but not before emptying the Canvas, reseting it and getting it ready for a new show.
                Canvas.empty().pan(0,0);
                Frame.replaceWith(framee);

                // And to prove we kept it from harm, we even return the untouched framee.
                return framee;
            };
            // and return the new frame, so whoever is calling us can bind stuff to it.
            return Frame;
        },

        // We expose the go function
        go: Canvas.go,
        // and we give read only access to the bookmark, for bookkeeping.
        getbookmark: function(){return 0 + Canvas.bookmark;}
    };

    // DEBUG
    window.Canvas = Canvas;
    window.Story = Story;

// Then we call the anonymous function we just declared and everything should just run. Simple and fun.
}());
