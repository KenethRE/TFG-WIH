var DEVICE_TYPE=null;
var MY_WS_ID=null;
var USER_ID=null;
var REGISTERED_MOUSE=null;
var WEB_CURSOR_ID=null;

var REPLACED_ELEMENT=null;


//var server_url="<?php echo $_SERVER['SERVER_ADDR'];?>";
var server_url=location.hostname;
//var server_url="localhost";
//var socket = new WebSocket('https:'+'/socket.io');


const socket = io();
socket.on('connect', () => {
	MY_WS_ID=socket.id;
	console.log("Connection established! My SocketID is: "+MY_WS_ID);
});

function getDeviceType() {
	if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
		DEVICE_TYPE='mobile';
		return 'mobile';
	} else {
		DEVICE_TYPE='computer';
		return 'computer';
	}
}

function sendFile() {
	var file = document.getElementById('filename').files[0];
	var reader = new FileReader();
	reader.onload = function(e) {
		var data = { 
			file: e.target.result,
			userid: USER_ID
		}
		socket.emit('file', data);
	};
	reader.readAsDataURL(file);
	let confirm = document.createElement('h5');
	confirm.textContent = 'File sent';
	document.body.appendChild(confirm);

}

socket.on('file', function(data) {
	if (getDeviceType() == 'computer') {
		var img = document.createElement('img');
		img.src = data.file;
		document.body.appendChild(img);
	}
});


function register_user(username, userid) {
	USER_ID=userid;
	var msg = {
		userid: userid,
		username: username,
		socketid: MY_WS_ID,
		source: getDeviceType()
	};
	socket.emit('register', msg);
	console.log("Joining room with id: "+userid);
}

function unregister_mouse(id){
	REGISTERED_MOUSE=null;
}

socket.on('registered', function(msg) {
	console.log("Succesfully registered in WSS with id: "+msg.userid);
});

socket.on('deviceConnected', function(msg) {
	console.log("Device connected: "+msg.deviceid);
	REGISTERED_MOUSE=msg.deviceid;
});

socket.on('close', function(msg){
	console.log("Closed: "+msg.id);
	unregister_mouse();
	remove_cursor(msg.id);
});

	function setCursorPosition(x,y){
		if(x>$(window).width()+$(window).scrollLeft()){
			x=$(window).width()+$(window).scrollLeft();
		}
		if(x<$(window).scrollLeft()){
			x=$(window).scrollLeft();
		}
		if(y>$(window).height()+$(window).scrollTop()){
			y=$(window).height()+$(window).scrollTop();
		}
		if(y<$(window).scrollTop()){
			y=$(window).scrollTop();
		}
		$('#cursor').css({left:x,top:y});
		saveCursorPosition(x, y);

	}

	function calculateCursorPosition(desX,desY){
		var offset=$('#cursor').offset();
		newX=offset.left+desX;
		newY=offset.top+desY;
		//console.log(offset.left+"+"+msg.cx+"="+newX);
		setCursorPosition(newX,newY);
	}


	socket.on("message", function(msg) {
		console.log(msg);
		//var msg=JSON.parse(e)
			switch(msg.source){
				case 'computer':
					if(msg.action=='useCursor' && REGISTERED_MOUSE==msg.targetID){
						window.open('/php/mouse.html','_self');
					}
					if(msg.action=='stopCursor' && REGISTERED_MOUSE==msg.targetID){
						window.open('/','_self');
					}
					if(msg.action=='select'){
						REPLACED_ELEMENT=$('#elementPlaceHolder').replaceWith(msg.html);
						$("#elementParent").children().removeAttr('onblur'); // prevent not found functions
						$("#elementParent").children().removeAttr('onchange');
						$("#elementParent").children().val(msg.value);
						$("#elementParent").children().addClass('addedChildren');
						$("#elementParent").children().focus();


						$("#elementParent").children().on('input', function(e){
							var msg={
								source:'mouse',
								action:'select',
								val:$(this).val(),
								userid:USER_ID
								};
							socket.emit('message', msg);
						});
						$("#elementParent").children().change(function(e){ // same as focusout
							var msg={
								source:'mouse',
								action:'select',
								val:$(this).val(),
								userid:USER_ID
								};
							socket.emit('message', msg);
							$("#elementParent").children().remove();
							$("#elementParent").append(`<span id="elementPlaceHolder"></span>`);
						});

						$("#elementParent").children().focusout(function(e){
							var msg={
								source:'mouse',
								action:'select',
								val:$(this).val(),
								userid:USER_ID
								};
							socket.emit('message', msg);
							$("#elementParent").children().remove();
							$("#elementParent").append(`<span id="elementPlaceHolder"></span>`);
						});
					}

					break;
				case 'mouse':
					console.log(msg);
					if(!existsMouse()){
						add_cursor(msg.id);
					}
					if(msg.action=='moveCursor'){
						calculateCursorPosition(msg.cx,msg.cy);
					}
					if(msg.action=='scrollWindow'){
						calculateCursorPosition(0,-msg.cy);
						window.scrollBy(0, -msg.cy);
					}
					if(msg.action=='click'){
						clickOnButton();
					}
					if(msg.action=='select'){
						REPLACED_ELEMENT.val(msg.val);
					}
					break;
			} 

	});


var touchClick=false;

var touchN1=false;
var touchN2=false;


function add_cursor(id){
	remove_cursor();
	$("body").append(`	
	        <div id="cursor" class="cursor"></div>
	`);

	console.log("Mouse "+id+" connected");
	WEB_CURSOR_ID=id;
	$('body').css('cursor', 'none');
	restoreCursorPosition();

}

function remove_cursor(id){
	console.log("Mouse "+id+" disconnected");
	$("#cursor").remove();
	$('body').css('cursor', 'default');

}

function clickOnButton(){
	//btt=document.getElementById('button');
	//cur=document.getElementById('cursor');
	//console.log(doElsCollide(btt,cur));
	testClick("a");
	testClick("button");
	testClick(".usermenu, .moodle-actionmenu, .toggle-display, .userbutton, .usertext");
	testClick("input");
	testClick("select"); // Select element won't work with click. Hard to implement
	testClick("textarea");
}

function testClick(elem){
	
	var hit_list = $("#cursor").collision(elem);
	hit_list.each(function(){
		if(elem=="select" || elem=="textarea" || $(this).is( "[type=text]" )){
			console.log(elem);
			REPLACED_ELEMENT=$(this);
			var html=$(this).wrap('<p/>').parent().html();
			var msg={
				userid:USER_ID,
				source:'computer',
				action:'select',
				html:html,
				value:$(this).val(),
				userid:USER_ID
				};
			socket.emit('message',msg);
		}
		// Open anchors with event
		// open url winth window.open
		if(!$(this).attr('href')){
			$(this).trigger('click');
		}

		if($(this).attr('href') && ($(this).attr('href'))[0]=='#'){
			$(this).trigger('click');
		}else{
			window.open($(this).attr('href'), '_self');		
		}

		//$(this).click();

	});

}


$(document).ready(function() {

	if (USER_ID == null) {
		selectAccount();
	}

	if (getDeviceType() == 'mobile') {
		//we want to show the option to take or upload a photo to the computer
		document.getElementById('fileUpload').classList.remove('d-none');
		document.getElementById('filename').classList.remove('d-none');
	}
	if(isThisMouse()){

		var devInfo = {
			userid: USER_ID,
			source: getDeviceType()
		};

		$(document).on("click", "a:not(.page-scroll)", function(){
	    	window.open($(this).attr('href'), '_self');
		});

	    	var xPos = 0;// e.originalEvent.touches[0].pageX;
	    	var yPos = 0;//e.originalEvent.touches[0].pageY;

		$(document).on('touchstart', function (e) {
			    if (e.originalEvent.touches.length == 1){
			    	touchN1=true;
			    }
			    if (e.originalEvent.touches.length == 2){
			    	touchN2=true;
			    }

				console.log("click");
				touchClick=true;
				xPos = e.originalEvent.touches[0].pageX;
		    	yPos = e.originalEvent.touches[0].pageY;
		});

		$(document).on('touchend', function (e) {
			if(touchClick){
				var msg={
				userid:USER_ID,
				source:'mouse',
				action:'click'
				};
				socket.emit('message',msg);
			}
			touchN1=touchN2=false;
		});

		$(document).on('touchmove', function(e) {
	    	documentClick = false;
	    	console.log("moved");
	    	touchClick=false;

	    	var c = { x:0, y:0 };
	    	if(event) {
		    	var touches = event.touches && event.touches.length ? event.touches : [event];
		      	var e = (event.changedTouches && event.changedTouches[0]) || touches[0];
		      	if(e) {
			        c.x = e.clientX || e.pageX || 0;
			        c.y = e.clientY || e.pageY || 0;
			        c.x=c.x-xPos;
			        c.y=c.y-yPos;
			        // Restoring reference values:
					xPos=e.clientX || e.pageX || 0;
					yPos=e.clientY || e.pageY || 0;

		    	}
	      	}
	      	c.x=Math.round(c.x); // cursor width
	      	c.y=Math.round(c.y); // cursor height
	        console.log(c.x+" # "+c.y);



	        var action='';
	        if(touchN1){
	        	action='moveCursor';
	        }
	        if(touchN2){
	        	action='scrollWindow';
	        }

			var msg={
				userid:USER_ID,
				source:'mouse',
				action:action,
				cx:c.x,
				cy:c.y
			};
			socket.emit('message',msg);
		});
		socket.emit('startDevice', devInfo);
	}

}); // end document ready

function startUsingWebCursor(){
	console.log("startUsingWebCursor");
	var msg={
				source:DEVICE_TYPE,
				action:'useCursor',
				targetID: REGISTERED_MOUSE,
				userid:USER_ID
			};
	socket.emit('message',msg);
	hideMyModal();
}

function startUsingThisWebCursor() {
	window.open('/php/mouse.html','_self');
}

function stopUsingWebCursor(){
	var msg={
				source:DEVICE_TYPE,
				action:'stopCursor',
				targetID: WEB_CURSOR_ID,
				userid:USER_ID
			};
	socket.emit('message',msg);
	hideMyModal();
	WEB_CURSOR_ID=null;
}

function webMouseManagement(){
	removeMyModal();
	addMyModal();
	showMyModal();
}

function hideMyModal(){
	$("#myModal").modal("hide");
}

function removeMyModal(){
	$("#myModal").remove();
}

function showMyModal(){
	$("#myModal").modal('show');
}

function addMyModal(){

	var registered_mouse_info="";
	var registered_cursor_info="";

	if(REGISTERED_MOUSE){
		registered_mouse_info=`
		<p>
        <div id='registered_mouse_info'>
        	<button id='modal_button_select_cursor' type='button_modal_save' class='btn btn-primary' onclick='startUsingWebCursor()'>A Mobile device is available using WEB CURSOR (`+REGISTERED_MOUSE+`)</button>
        </div>
        </p>
		`
	}
	;
	if(WEB_CURSOR_ID){
		registered_cursor_info=`
		<p>
        <div id='registered_cursor_info'>
        	<button id='modal_button_select_cursor' type='button_modal_save' class='btn btn-primary' onclick='stopUsingWebCursor()'>Stop using WEB CURSOR (`+WEB_CURSOR_ID+`)</button>
        </div>
        </p>
		`;
	}

	$("body").append(`	
		<!-- Modal -->
<div id='myModal' class='modal fade' role='dialog'>
  <div class='modal-dialog'>
    <!-- Modal content-->
    <div class='modal-content'>
      <div class='modal-header'>
        <button type='button' class='close' data-dismiss='modal'></button>
        <h4 class='modal-title'>Web Mouse Management</h4>
      </div>
      <div class='modal-body'>
      	`+registered_mouse_info+`
      	`+registered_cursor_info+`
        <p>
        <div id='own_registered_mouse_info'>
        	<button id='modal_button_select_cursor' type='button_modal_save' class='btn btn-primary' onclick='startUsingThisWebCursor()'>Start using this device as a WEB CURSOR</button>
        </div>
        </p>

      </div>
      <div class='modal-footer'>
        <button type='button' class='btn btn-default' data-dismiss='modal' onclick=''>Close</button>
      </div>
    </div>
  </div>
</div>
	`);
}

function isThisMouse(){
	return $('.webMousePluginMouse').length;
}

function existsMouse(){
	console.log($('#cursor').length);
	return $('#cursor').length;
}

function saveCursorPosition(x,y){
	sessionStorage.setItem('webCursorPositionX',x);
	sessionStorage.setItem('webCursorPositionY',y);
}

function restoreCursorPosition(){
	setCursorPosition(parseInt(sessionStorage.getItem('webCursorPositionX')), parseInt(sessionStorage.getItem('webCursorPositionY')));
}