/* construct_form_node(query, cls, textbox, checkbox, datebox, radio, select,
 *                     button, input)
 * This constructs the appropriate dojo/dijit object from the input provided and
 * returns it to the calling function.  query and cls are needed for select box
 * and textbox class detection.  input is the node.  The others are appropriate
 * dijit/dojo classes for the widgets.
 */

function construct_form_node(query, cls, registry,
                        textbox, checkbox, datebox, radio, select, button, 
                        input)
{
    
    if (input.nodeName == 'INPUT'){ 
        if (input.type == 'hidden') {
            return undefined;
        } else if (input.type == 'text'){
            if (cls.contains(input, 'date')){
                // logic to pick dates
                // TODO.  This looks pretty complex
                // and the documentation in Dojo appears
                // to be in flux.  I am setting this
                // as a standard text box for now and
                // letting others turn this into a 
                // DateTextBox --CT
                var df = dateformat;
                df.replace('mm', 'MM');
                var val = input.value;
                var style = {};
                if (val == undefined || val == ''){
                   val = null;
                }
                
                if (input.size !== undefined && input.size !== ''){
                   style['width'] = input.size + 'em';
                }
                return new datebox({
                    "label": input.title,
                    "value": val,
                     "name": input.name,
                       "id": input.id,
                    "style": style,
              "constraints": { "datePattern": df }
                }, input);
             } else if (cls.contains(input, 'AccountBox')){
                return require(['lsmb/accounts/AccountSelector'],
                            function(accountselector){
                                return new accountselector({}, input);
                            }
                );
             } else {
                var style = {};
                if (input.size !== undefined && input.size !== ''){
                   style['width'] = input.size + 'em';
                }
                return new textbox({
                    "label": input.title,
                    "value": input.value,
                    "name": input.name,
                    "style": style,
                       "id": input.id
                }, input);
             } 
            
         } else if (input.type == 'checkbox'){
         }
         if (input.type == 'radio'){
         }
           
     } else if (input.nodeName == 'SELECT'){
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
              "label": input.title,
                       "id": input.id
            } , input); 
     } else if (input.nodeName == 'BUTTON'){
         return new button(
            { "name": input.name,
              "type": input.type,
                       "id": input.id,
             "label": input.innerHTML,
             "value": input.value
            }, input
         );
     
     }
     return undefined; 
}

/* Set up form.tabular forms.  
 * Supports the following additional classes for setting columns
 * cols-1
 * cols-2
 * cols-3
 *
 * Normally tabular will attach to the form element in most simple forms, but
 * for more complex ones, you can use div instead.
 *
 * Also sets up textboxes, checkboxes, and date pickers in the forms.
 *
 * As of first commit only setting up table containers.
 */

require(     ['dojo/query', 
              'dijit/registry',
              'dojo/dom-class',
              'dojo/dom-construct',
              'dojox/layout/TableContainer',
              'dijit/form/TextBox',
              'dijit/form/CheckBox',
              'dijit/form/DateTextBox',
              'dijit/form/RadioButton',
              'dijit/form/Select',
              'dijit/form/Button',
              'dijit/layout/ContentPane',
              'dojo/ready'
             ],
      function(query, registry, cls, construct, table, textbox, checkbox, datebox, 
               radio, select, button, contentpane)
      {
             query('.tabular').forEach(
                  function(node){
                      var tabparams = {
                             'data-dojo-type': 'dojox/layout/TableContainer',
                             'showLabels': 'True',
                             'orientation': 'horiz',
                             'customClass': 'tabularform',
                             'cols': 1
                      };
                      var mycols;
                      if (cls.contains(node, 'col-1')){
                         tabparams['cols'] = 1;
                      } else if (cls.contains(node, 'col-2')){
                         tabparams['cols'] = 2;
                      } else if (cls.contains(node, 'col-3')){
                         tabparams['cols'] = 3;
                      } 
                      var mytabular = new table(tabparams, node);
                      // Must hide labels in such a form!
                      query('label', node).forEach(function(node2){
                         construct.destroy(node2);
                      });

                      var counter = 0;
                      // Process inputs
                      query('*', node).forEach(
                         function(input){
                             if (input.nodeName == 'DIV')
                             {
                                 if (cls.contains(input, 'input_line')){
                                    var nodes_to_add = counter % mycols;
                                    for (i=nodes_to_add; i<mycols; i++){
                                        mytabular.addChild(new contentpane({
                                           "content": ""
                                        })); // spacer
                                    }
                                    counter = 0;
                                 }
                             } 
                             var widget = construct_form_node(
                                               query, cls, registry, textbox, checkbox, 
                                               datebox, radio, select,
                                               button, input
                             );
                             if (widget !== undefined){
                                ++counter;
                                if (input.nodeName == 'BUTTON'){
                                    var mycp = new contentpane(
                                        { content: "" }
                                    );
                                 
                                    mytabular.addChild(mycp);
                                    mycp.addChild(widget); // obscures label
                                     
                                } else {
                                     mytabular.addChild(widget);
                                } 
                             }
                         }
                      ); 
                      mytabular.startup();
                  }
             );

             query('input, button, textarea').forEach(
                  function(node){
                      var val;
                      var ntype = node.nodeName;
                      if (registry.byId(node.id) !== undefined){
                          return undefined;
                      }
                      var widget = construct_form_node(
                                           query, cls, registry, textbox, checkbox, 
                                           datebox, radio, select,
                                           button, node
                      );
                      if (widget !== undefined){
                          if (widget.declaredClass !== undefined){
                              widget.startup();
                          }
                      }
                  });
      }
);
