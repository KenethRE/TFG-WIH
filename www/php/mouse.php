<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1">
	<title>Mouse Control</title>
	<link rel="stylesheet" href="">
	<script src="/local/js/jquery-2.1.4.min.js" type="text/javascript" charset="utf-8"></script>
	<script src="/local/js/rcdi.js" type="text/javascript" charset="utf-8"></script>
	<style type="text/css">
		body{
			background-color:lightgray;
		}

		@media(max-width:768px){
			select{
				width:100%;
				display:block;
				font-size:20px;
			}
		}

		textarea{
			-webkit-user-select:text;
		}
		
	</style>
</head>
<body class="webMousePluginMouse">
	<span id="elementParent">
		<span id="elementPlaceHolder"></span>
	</span>
</body>
</html>
