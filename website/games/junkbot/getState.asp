<?php
function junkbot_send_headers() {
	header('Content-Type: text/plain');
	header('Cache-Control: no-cache');
	header('Expires: -1');
}

function junkbot_get_state() {
	$file_name = dirname(__FILE__) . '/state.txt';

	junkbot_send_headers();

	if (is_file($file_name) === true) {
		$file_contents = @file_get_contents($file_name);
		
		if ($file_contents !== false) {
			echo($file_contents);
			return;
		}
	}

	echo('rank=1&outof=1&userID=00000000-0000-0000-0000-000000000000&state=0&total=0&userName=&domainname=www.lego.com&record=');
}

junkbot_get_state();
?>