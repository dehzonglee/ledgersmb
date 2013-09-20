

function show_indicator() {
        var e = document.getElementById('login-indicator');
        e.style.visibility='visible';
}

function submit_form() {
        window.setTimeout(show_indicator, 0);
        window.setTimeout(send_form, 10);
        return false;
}

function send_form() {
	var http = get_http_request_object();
    var username = document.login.login.value;
	var password = document.login.password.value;
	var company = document.login.company.value;
	var action = document.login.action.value;
        //alert('document.login.company.value='+document.login.company.value);
	http.open("get", 'login.pl?action=authenticate&company='+company, false, username, password);
	http.send("");
        if (http.status != 200){
                if (http.status == '454'){
                     alert('Company does not exist.');
                } else {
  		     alert("Access Denied:  Bad username/Password");
                }
                var e = document.getElementById('login-indicator');
                e.style.visibility='hidden';
		return false;
	}
	document.location=document.login.action.value+".pl?action=login&company="+document.login.company.value;
}

function check_auth() {
    
    var http = get_http_request_object();
    var username = "admin";
    var password = document.login.password.value;
    
    http.open("get", "login.pl?action=authenticate&company="
        + document.login.company.value, false, 
		username, password
    );
}

function set_indicator() {
    require(['dojo/on', 'dijit/registry', 'dojo/ready!'],
    function(on, registry){
        var button = registry.byId('action-login');
        button.set('type', 'button');
        on(button, 'click', function(evt){
           require(['dojo/dom', 'dijit/ProgressBar', 'dojo/_base/window'],
           function(dom, progressbar, win){
               var indicator = new progressbar({
                  "indeterminate": true,
                  "style": "width: 25em"
               }, dom.byId("login-indicator"));
               indicator.startup();
               
           });
           send_form();
           return false;
        });
      });
}

