<?php
function junkbot_send_headers() {
	header('Content-Type: text/plain');
	header('Cache-Control: no-cache');
	header('Expires: -1');
}

function junkbot_send_response($status) {
	echo('invalidstate=' . ($status ? '0' : '1'));
}

function junkbot_set_state() {
	$file_name = dirname(__FILE__) . '/state.txt';
	
	junkbot_send_headers();

	if (isset($_POST['state']) === true && isset($_POST['total']) === true && isset($_POST['record']) === true) {
		if (@file_put_contents($file_name, 'rank=1&outof=1&userID=00000000-0000-0000-0000-000000000000&state=' . intval($_POST['state']) . '&total=' . intval($_POST['total']) . '&userName=&domainname=www.lego.com&record=' . $_POST['record']) === false) {
			junkbot_send_response(false);
			return;
		}
		
		junkbot_send_response(true);
		return;
	}
	
	junkbot_send_response(false);
}

junkbot_set_state();
?>