<?php
	$servername = "localhost";
	$username = "root";
	$password = "root";
	$dbname = "true_count_db";

	// Create connection
	$conn = mysqli_connect($servername, $username, $password, $dbname);
	// Check connection
	if (!$conn) {
		echo"Connection failed: " . mysqli_connect_error();
	}
	
	//sql to drop the tables that are to be initialized here, if they already exist
	$sql = "DROP TABLE IF EXISTS
	flashcards, flashcard_rules, player_actions";
	
	if(mysqli_query($conn, $sql)){
		echo "All tables dropped successfully<br>";
	}
	
	// sql to create rule options table
	$sql = "CREATE TABLE flashcard_rules (
	ruleset_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, 
	number_of_decks INT(6) NOT NULL,
	dealer_hits_soft TINYINT(1) NOT NULL
	)";

	if (mysqli_query($conn, $sql)) {
		
		echo "Table flashcard_rules created successfully<br>";
		
		//sql to insert rows into rules table
		$numberOfDecks = 1;
		$hitSoft = 0;
		$rowsAdded = 0;
		
		while ($numberOfDecks <=3){
			while ($hitSoft <=1){
				$sql = "INSERT INTO flashcard_rules(number_of_decks, dealer_hits_soft)
				VALUES($numberOfDecks, $hitSoft)";
				
				if (mysqli_query($conn, $sql)) {
					$rowsAdded++;
				} else {
					echo "Error adding rows: " . mysqli_error($conn);
				}
				
				$hitSoft++;
			}
			$hitSoft = 0;
			$numberOfDecks++;
		}
		
		echo "$rowsAdded rows successfully added to flashcard_rules table <br>";
		
	} else {
		echo "Error creating table flashcard_rules: " . mysqli_error($conn)."<br>";
	}
	
	// sql to create player_actions table
	$sql = "CREATE TABLE player_actions (
	action_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, 
	primary_action ENUM('hit', 'stay', 'double', 'split', 'surrender') NOT NULL,
	secondary_action ENUM('hit', 'stay', 'double', 'split', 'surrender')
	)";

	if (mysqli_query($conn, $sql)) {
		echo "Table player_actions created successfully<br>";
	} else {
		echo "Error creating table player_actions: " . mysqli_error($conn)."<br>";
	}
	
	//sql to insert rows into player_actions table
	$sql = "INSERT INTO player_actions(primary_action, secondary_action)
				VALUES('hit', 'hit'),('stay', 'stay'),('double', 'hit'),('double', 'stay'),('split', 'split'),
				('split', 'hit'),('split', 'double'),('split', 'stay'),('surrender', 'hit'), ('surrender', 'stay')";
	
	if(mysqli_query($conn, $sql)){
		echo "10 rows added to table player_actions<br>";
	}else{
		echo "failed to add rows to player_actions table<br>";
	}
	
	// sql to create flashcard table
	$sql = "CREATE TABLE flashcards (
	card_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, 
	ruleset_id INT UNSIGNED,
	dealer_card_value INT(6) NOT NULL,
	player_hand_value INT(6) NOT NULL,
	hand_type ENUM('hard', 'soft', 'split') NOT NULL,
	action_id INT UNSIGNED,
	FOREIGN KEY(ruleset_id) REFERENCES flashcard_rules(ruleset_id),
	FOREIGN KEY(action_id) REFERENCES player_actions(action_id)
	)";

	if (mysqli_query($conn, $sql)) {
		echo "Table flashcards created successfully<br>";
	} else {
		echo "Error creating table flashcards: " . mysqli_error($conn)."<br>";
	}	

	//sql to add rows to flashcard table
	$ruleset_id = 1;
	$rowsAdded = 0;
	
	while($ruleset_id <= 2){
		//ruleset 1-2 hard hands
		$hand_type = "'hard'";
		$hand_value = 4;
		while($hand_value<=20){
			
			$dealer_card = 2;
			while($dealer_card<=11){
				
				switch($hand_value){
					case $hand_value <= 7:
						$action = 1;
						break;
					case 8:
						if($dealer_card == 5 || $dealer_card == 6){
							$action = 3;
						}else{
							$action = 1;
						}
						break;
					case 9:
						if($dealer_card<=6){
							$action = 3;
						}else{
							$action = 1;
						}
						break;
					case 10:
						if($dealer_card<=9){
							$action = 3;
						}else{
							$action = 1;
						}
						break;
					case 11:
						$action = 3;
						break;
					case 12:
						if($dealer_card >= 4 && $dealer_card <=6){
							$action = 2;
						}else{
							$action = 1;
						}
						break;
					case $hand_value >= 13 && $hand_value <= 16:
						if($ruleset_id == 2 && $hand_value == 15 && $dealer_card == 11){
							$action = 9;
						}else if($dealer_card <= 6){
							$action = 2;
						}else if($hand_value == 16 && $dealer_card >= 10){
							$action = 9;
						}else{
							$action = 1;
						}
						break;
					case $hand_value >= 17:
						if($ruleset_id == 2 && $dealer_card == 11 && $hand_value == 17){
							$action = 9;
						}else{
							$action = 2;
						}
						break;
				}
				
				$sql = "INSERT INTO flashcards(ruleset_id, dealer_card_value, player_hand_value, hand_type, action_id)
						VALUES($ruleset_id, $dealer_card, $hand_value, $hand_type, $action)";
				
				if (mysqli_query($conn, $sql)) {
					$rowsAdded++;
				} else {
					echo "Error adding rows: " . mysqli_error($conn);
				}
				
				$dealer_card++;
			}
			$hand_value++;
		}
	
		//ruleset #1, soft hands
		$hand_type = "'soft'";
		$hand_value = 12;
		while($hand_value<=20){
			
			$dealer_card = 2;
			while($dealer_card<=11){
				
				switch($hand_value){
					case $hand_value <= 16:
						if($dealer_card >= 4 && $dealer_card <= 6){
							$action = 3;
						}else{
							$action = 1;
						}
						break;
					case 17:
						if($dealer_card <= 6){
							$action = 3;
						}else{
							$action = 1;
						}
						break;
					case 18:
						if($dealer_card >= 3 && $dealer_card <= 6){
							$action = 4;
						}else if($dealer_card == 9 || $dealer_card == 10){
							$action = 1;
						}else if($ruleset_id == 2 && $dealer_card == 11){
							$action = 1;
						}else{
							$action = 2;
						}
						break;
					case $hand_value >= 19:
						if($hand_value == 19 && $dealer_card == 6){
							$action = 4;
						}else {
							$action = 2;
						}
						break;
				}
				
				$sql = "INSERT INTO flashcards(ruleset_id, dealer_card_value, player_hand_value, hand_type, action_id)
						VALUES($ruleset_id, $dealer_card, $hand_value, $hand_type, $action)";
				
				if (mysqli_query($conn, $sql)) {
					$rowsAdded++;
				} else {
					echo "Error adding rows: " . mysqli_error($conn);
				}
				
				$dealer_card++;
			}
			$hand_value++;
		}
		
		//ruleset #1 split hands
		$hand_type = "'split'";
		$hand_value = 4;
		while($hand_value <= 22){
			
			$dealer_card = 2;
			while($dealer_card<=11){
				
				switch($hand_value){
					case 4:
						if($dealer_card == 2){
							$action = 6;
						}else if($dealer_card <= 7){
							$action = 5;
						}else{
							$action = 1;
						}
						break;
					case 6:
						if($dealer_card == 2 || $dealer_card == 3 || $dealer_card == 8){
							$action = 6;
						}else if ($dealer_card >= 4 && $dealer_card <= 7){
							$aciton = 5;
						}else{
							$aciton = 1;
						}
						break;
					case 8:
						if($dealer_card == 4){
							$action = 6;
						}else if($dealer_card ==5 || $dealer_card == 6){
							$action = 7;
						}else{
							$action = 1;
						}
						break;
					case 10:
						if($dealer_card<=9){
							$action = 3;
						}else{
							$action = 1;
						}
						break;
					case 12:
						if($dealer_card <=6){
							$action = 5;
						}else if($dealer_card == 7){
							$action = 6;
						}else{
							$action = 1;
						}
						break;
					case 14:
						if($dealer_card <=7){
							$action = 5;
						}else if($dealer_card == 8){
							$action = 6;
						}else if($dealer_card == 10){
							$action = 10;
						}else if($ruleset_id == 2 && $dealer_card == 11){
							$action = 9;
						}else{
							$action = 1;
						}
						break;
					case 16:
						$action = 5;
						break;
					case 18:
						if($dealer_card == 7 || $dealer_card >= 10){
							$action = 2;
						}else if($ruleset_id == 2 && $dealer_card == 11){
							$action = 8;
						}else{
							$action = 5;
						}
						break;
					case 20:
						$action = 2;
						break;
					case 22:
						$action = 5;
						break;
				}
				
				$sql = "INSERT INTO flashcards(ruleset_id, dealer_card_value, player_hand_value, hand_type, action_id)
						VALUES($ruleset_id, $dealer_card, $hand_value, $hand_type, $action)";
				
				if (mysqli_query($conn, $sql)) {
					$rowsAdded++;
				} else {
					echo "Error adding rows: " . mysqli_error($conn);
				}
				
				$dealer_card++;
			}
			$hand_value += 2;
		}
	
		$ruleset_id++;
	}
	
	echo "$rowsAdded rows added to flashcard table<br>";
	
	mysqli_close($conn);
	
	?>