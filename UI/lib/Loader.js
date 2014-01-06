/* lsmb/lib/Loader
 * A module for loading and setting up Dojo on LSMB screens.
 * 
 * This exposes two methods:
 *
 * setup() 
 *
 * sets up all widgets on a page
 *
 * createWidget(dnode) 
 *
 * creates a wedget from a DOM node.  Returns undef if the widget already 
 * exists. The choice to return undef allows one to check the return value 
 * of the function, and avoid calling if the widget already exists.
 */

define([
     // base
    'dojo/_base/declare',
    'dijit/registry',
    'dojo/parser',
    'dojo/query',
    'dojo/ready',
    'dijit/_WidgetBase',
    'dojo/dom-construct',
    // widgets
    // row1
    'lsmb/lib/TabularForm',
    'dijit/form/Textarea',
    'lsmb/lib/DateTextBox',
    'dijit/form/CheckBox',
    'dijit/form/RadioButton',
    'dijit/form/TextBox',
    //row2
    'dijit/form/Select',
    'dijit/form/Button'
    ],
function(
    // base
    declare, registry, parser, query, ready, wbase, construct,
    // widgets
    tabular, textarea, datebox, checkbox, radio, textbox, 
    select, button) {
    return declare(wbase, {
        nodeMap: { // hierarchy nodeName->class, input type treated as class
                   // for INPUT elements, type beats class.
               DIV: {
               '__default': function(){ return undefined; },
                 'tabular': function(node){
                                        return new tabular({
                                              showLabels: true,
                                              customClass: 'lsmbtabular',
                                              orientation: 'horiz'
                                                     }, node);
                            }
             
                    },
          TEXTAREA: { '__default': function(input){
                                    return new textarea(
                                           { "name": input.name,
                                            "value": input.innerHTML,
                                            "title": input.title, 
                                             "cols": input.cols,
                                             "rows": input.rows}, input);
                                   }
                    },
             INPUT: {   'hidden': function(){ return undefined},
                          'date': function(input){
                                                var style = {};
                                                if (input.size !== undefined 
                                                    && input.size !== '')
                                                {
                                                   style['width'] = 
                                                          (input.size * 0.7) 
                                                           + 'em';
                                                   }
                                                var val = input.value;
                                                if (val == ''){
                                                     val = undefined;
                                                }
                                                return new datebox({
                                                    "label": input.title,
                                                    "title": input.title,
                                                    "value": val,
                                                     "name": input.name,
                                                       "id": input.id,
                                                    "style": style,
                                                }, input);

                                  },
                      'checkbox': function(input){
                                        return new checkbox({
                                             "name": input.name,
                                            "value": input.value,
                                          "checked": input.checked
                                         }, input);
                                 },
                         'radio': function(input){
                                         return new radio({
                                             "name": input.name,
                                            "value": input.value,
                                          "checked": input.checked
                                        }, input);
                                 },
                      'password': function(input){
                                     if (undefined !== registry.byNode(input)){
                                        return undefined;
                                     }
                                     var style = {};
                                     if (input.size !== undefined 
                                        && input.size !== '')
                                     {
                                         style['width'] = (input.size * 0.6) 
                                                           + 'em';
                                     }
                                     return new textbox({
                                             "title": input.title,
                                             "label": input.title,
                                             "value": input.value,
                                              "name": input.name,
                                             "style": style,
                                                "id": input.id,
                                              "type": 'password'
                                     
                                     }, input);
                                },
                    'AccountBox': function(input){
                                    // Since this requires db components, it
                                    // cannot be preloaded on every page.
                                    require(['lsmb/accounts/AccountSelector',
                                             'dojo/ready'],
                                    function(accountselector, ready){
                                      ready(function(){
                                          return new accountselector({
                                              "name": input.name
                                          }, input);
                                      });
                                    });
                                 },
                     '__default': function(input){
                                     if (undefined !== registry.byNode(input)){
                                        return undefined;
                                     }
                                     var style = {};
                                     if (input.size !== undefined 
                                         && input.size !== '')
                                     {
                                         style['width'] = (input.size * 0.6) 
                                                           + 'em';
                                     }
                                     return new textbox({
                                         "title": input.title,
                                         "label": input.title,
                                         "value": input.value,
                                          "name": input.name,
                                         "style": style,
                                            "id": input.id
                                     }, input);
                                  }
                    },
            SELECT: {  '__default': function(input){
                                      var optlist = [];
                                      query('option', input).forEach(
                                      function(opt){
                                          var entry = {
                                             "label": opt.innerHTML,
                                                "id": input.id,
                                             "value": opt.value
                                         };
                                         if (opt.selected){
                                             entry["selected"] = true;
                                         }
                                         optlist.push(entry);
                                      });
             
                                      return new select(
                                             { "name": input.name,
                                            "options": optlist,
                                              "title": input.title,
                                                 "id": input.id,
                                            "on_load": input.on_load
                                             } , input); 
                                  }
                 },
          BUTTON: {
                    '__default': function(input){
                          return new button(
                              { "name": input.name,
                                "type": input.type,
                                  "id": input.id,
                               "title": input.innerHTML,
                               "value": input.value
                              }, input
                          );
                     }
                 }
        },
        constructor: function(){
        },
        // createWidget(domNode)
        //
        // Creates a widget from a domNode.  This is used in a number of cases,
        // including the main dynamic parser and the lsmb/lib/TabularForm
        // widget.
        //
        // Note that this *must* be called inside a ready() block, either by 
        // the parser.parse() or by setup().
        getInputSize: function(dnode) {
            return dnode.size * 0.6 + 'em';
        },
        createWidget: function(dnode) {
            if (undefined !== registry.byId(dnode.id)){
               return undefined;
            }
            if (undefined == this.nodeMap[dnode.nodeName]){
               return undefined;
            }
            if ('INPUT' == dnode.nodeName && 'file' == dnode.type){
               // otherwise renders as a text field.  We should change this
               // down the road.  --CT
               return undefined;
            }
            if ('INPUT' == dnode.nodeName){
                var classKey;
                classKey = dnode.type;
                if (undefined !== this.nodeMap.INPUT[classKey]){
                    return this.nodeMap.INPUT[classKey](dnode);
                }
            }
            var classes = dnode.className.split(' ');
            for (var i = 0; i <= classes.length; i++){
                classKey=classes[i];
                if (undefined !== this.nodeMap[dnode.nodeName][classKey]){
                    return this.nodeMap[dnode.nodeName][classKey](dnode);
                }
            }
            if (undefined !== this.nodeMap[dnode.nodeName].__default){
                return this.nodeMap[dnode.nodeName].__default(dnode);
            }
            return undefined;
        },
        setup: function(){
            var declarative = false;
            var myself = this;
            query('body.dojo-declarative').forEach(function(){
                 declarative = true;
            });
            if (declarative){
               return parser.parse(); 
            } 
            query('.tabular label').forEach(function(dnode){
                 construct.destroy(dnode);
            });
            query('*').forEach(function(dnode){
                ready(function(){
                   widget = myself.createWidget(dnode);
                   if (undefined !== widget){
                       ready(function(){
                           registry.byId(dnode.id).startup();
                        });
                   }
                });
            });
        }
   }); 
});   
