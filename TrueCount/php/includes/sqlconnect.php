<?php
	$configs = include('config.php');
	
	// Create connection
	$conn = mysqli_connect($configs[servername], $configs[username], $configs[password], $configs[dbname]);
	// Check connection
	if (!$conn) {
		echo"Connection failed: " . mysqli_connect_error();
	}
?>