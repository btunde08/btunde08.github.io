<?php
	//connect to truecount database
	include('includes/sqlconnect.php');
	
	$sql = "SELECT flashcards.card_id, flashcards.dealer_card_value, flashcards.player_hand_value, flashcards.hand_type, 
			player_actions.primary_action, player_actions.secondary_action, flashcard_rules.number_of_decks, flashcard_rules.dealer_hits_soft,
			flashcard_rules.ruleset_id
			FROM flashcards 
			INNER JOIN flashcard_rules ON flashcards.ruleset_id = flashcard_rules.ruleset_id
			INNER JOIN player_actions ON flashcards.action_id = player_actions.action_id
			ORDER BY flashcards.card_id";
	$result = mysqli_query($conn,$sql);
	$resultTable = array();
	
	if (mysqli_num_rows($result) > 0) {
		// output data of each row
		while($row = mysqli_fetch_assoc($result)) {
			$resultRow = (object)array("card_id" => (int)$row["card_id"], "dealer_card_value" => (int)$row["dealer_card_value"],
			"number_of_decks" => (int)$row["number_of_decks"], "dealer_hits_soft" => $row["dealer_hits_soft"], "ruleset_id" => (int)$row["ruleset_id"],
			"player_hand_value" => (int)$row["player_hand_value"], "hand_type" => $row["hand_type"], "primary_action" => $row["primary_action"],
			"secondary_action" => $row["secondary_action"],);
			array_push($resultTable, $resultRow);
		}
	} else {
		echo "0 results";
	}
	
	$myJSON = json_encode($resultTable);

	echo $myJSON;
	
?>