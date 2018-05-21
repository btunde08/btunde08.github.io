var trueCountApp = (function(){
	
	//amount of time a notificaiton is shown
	const notificationTime = 2000;
	const hiOpt2 = [0,1,1,2,2,1,1,0,0,-2,-2,-2,-2];
	
	//any calls to functions that add event listeners must return a function that removes those listeners. these functions are stored in an array
	var eventsToRemove = [];
	document.getElementById("play_blackjack_button").addEventListener("click", function(){eventsToRemove.push(playBlackjack())});
	
	Array.from(document.getElementsByClassName("return_to_menu_button")).forEach(function(item){item.addEventListener("click", returnToMenu)});
	Array.from(document.getElementsByClassName("tab_container")).forEach(function(item){item.addEventListener("click", changeTab)});
	
	//calls all of the removal functions stored on the array, then empties the array
	function returnToMenu(){
		for(let i=0; i<eventsToRemove.length; i++){
			eventsToRemove[i]();
		}
		eventsToRemove = [];
	}
	
	//clears all tab content on same layer, then uses the html name property of the clicked tab button to select which elements to be displayed
	function changeTab(e){
		Array.from(document.getElementsByClassName("tab_content")).forEach(function(item){
			if(item.style.layer === e.target.style.layer){
				item.style.display="none";
			}
		});
		
		Array.from(document.getElementsByName(e.target.name)).forEach(function(item){item.style.display = "inline-block"});
	}
	

	//Everything associated with the Play Blackjack Overlay	
	function playBlackjack(){
		
		//background variables
		const cardTypes = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Jack", "Queen", "King"];
		const cardSuits = ["Clubs", "Spades", "Hearts", "Diamonds"]
		let dealer;
		let mainPlayer;
		
		let currentLocationInDeck = 0;
		let deckArray = [];
		let bankroll = 1000;
		let betAmount = 0;
		let runningCount = 0;
		let turn = "mainPlayer";
		
		//all the functions related to settings and options
		var userSettings = (function(){
			
			return{
				initializeDefaultRules: initializeDefaultRules,
				openRulesOverlay: openRulesOverlay,
				saveRuleSelections: saveRuleSelections,
				restoreDefaultRules: restoreDefaultRules,
				cancelRuleSelection: cancelRuleSelection
			}
			
			//reads the default html values for the rules and saves them into session storage as "defaultRules"
			function initializeDefaultRules(){
				let defaultRules = [];
				let jsonDefaultRules;
				let slider = document.getElementById("penetration_slider");
				
				document.getElementById("deck_penetration").innerHTML = slider.value;
				
				slider.oninput = function(){
					document.getElementById("deck_penetration").innerHTML = slider.value;
				}
				
				Array.from(document.getElementsByClassName("rule")).forEach(function(rule){defaultRules.push(rule.value)});
				jsonDefaultRules = JSON.stringify(defaultRules);
				sessionStorage.setItem("defaultRules", jsonDefaultRules);
				
				//overwrites default rules with sessionStorage if they exist
				let blackjackRules;
				if(sessionStorage.blackjackRules){
					blackjackRules = JSON.parse(sessionStorage.blackjackRules);
					for(let i=0; i<blackjackRules.length;i++){
						document.getElementsByClassName("rule")[i].value = blackjackRules[i];
					}
					document.getElementById("deck_penetration").innerHTML = slider.value;
				}
				
				//sets initial bet to table min
				if(document.getElementById("table_min").value > betAmount){
					betAmount = document.getElementById("table_min").value;
					document.getElementById("bet_amount").innerHTML = betAmount;
				}
				document.getElementById("bankroll").innerHTML = bankroll;
				document.getElementsByName("table_rules").forEach(function(item){item.style.display = "inline-block"});
				
			}	

			//opens the blackjack rule settings and adjusts them to user preferences(if they exist) saved in session storage
			function openRulesOverlay(){
				
				let clearOverlay = document.createElement("div");
				clearOverlay.id="clear_overlay";
				clearOverlay.addEventListener("click", saveRuleSelections);
				document.getElementById("play_blackjack_div").appendChild(clearOverlay);
				
				document.getElementById("rules_overlay").style.display = "block";
				
			}
		
			//saves current rule selections into session storage and closes rule overlay
			function saveRuleSelections(e){
				
				let jsonBlackjackRules;
				let blackjackRules = [];
				let userInputValid = true;
				
				checkUserInput();
				
				if(userInputValid === true){
					Array.from(document.getElementsByClassName("rule")).forEach(function(rule){blackjackRules.push(rule.value)});
					jsonBlackjackRules = JSON.stringify(blackjackRules);
					
					if(sessionStorage.blackjackRules != jsonBlackjackRules){
						sessionStorage.setItem("blackjackRules", jsonBlackjackRules);
						generateShoe();
					}
					
					let clearOverlay = document.getElementById("clear_overlay")
					document.getElementById("play_blackjack_div").removeChild(clearOverlay);
					
					document.getElementById("rules_overlay").style.display = "none";
					document.getElementById("blackjack_payout_warning").style.display = "none";
					document.getElementById("table_min_warning").style.display = "none";
					document.getElementById("table_max_warning").style.display = "none";
					
					if(document.getElementById("table_min").value > betAmount){
						betAmount = document.getElementById("table_min").value;
						document.getElementById("betAmount").innerHTML = betAmount;
					}
					
					switch(document.getElementById("show_count").value){
						case "never":
							document.getElementById("running_count_button").style.display = "none";
							break;
						case "on_click":
							document.getElementById("running_count_button").style.display = "inline-block";
							document.getElementById("running_count_button").innerHTML = "Click To Show Running Count";
							break;
						case "always":
							document.getElementById("running_count_button").style.display = "inline-block";
							document.getElementById("running_count_button").innerHTML = runningCount;
							break;
						default:
							console.log("switch statement error for running count");
					}
					
				}
				else if(e.target.id === "clear_overlay"){
					cancelRuleSelection();
				}
				
				//checks to see if user input is valid
				function checkUserInput(){
					let numerator = document.getElementById("payout_numerator").value;
					let denominator = document.getElementById("payout_denominator").value;
					let tableMin = document.getElementById("table_min").value;
					let tableMax = document.getElementById("table_max").value;
					
					if(numerator.search(/^\d+$/) === -1 || denominator.search(/^\d+$/) === -1){
						userInputValid = false;
						document.getElementById("blackjack_payout_warning").style.display = "block";
					}
					
					if(parseInt(numerator)/parseInt(denominator) >2 || parseInt(numerator)/parseInt(denominator) <1){
						userInputValid = false;
						document.getElementById("blackjack_payout_warning").style.display = "block";
					}
					
					if(parseInt(tableMin)<1 || tableMin.search(/^\d+$/) === -1){
						userInputValid = false;
						document.getElementById("table_min_warning").style.display = "block";
					}
					if(parseInt(tableMax)<parseInt(tableMin) || tableMax.search(/^\d+$/) === -1){
						userInputValid = false;
						document.getElementById("table_max_warning").style.display = "block";
					}
				}
			}
		
			//reads defaultRules from session storage and restores the rule settings to their default values
			function restoreDefaultRules(){
				
				let defaultRules;
				
				if(sessionStorage.defaultRules){
					defaultRules = JSON.parse(sessionStorage.defaultRules);
					for(let i=0; i<defaultRules.length;i++){
						document.getElementsByClassName("rule")[i].value = defaultRules[i];
					}
				}
				document.getElementById("deck_penetration").innerHTML = document.getElementById("penetration_slider").value;
				document.getElementById("blackjack_payout_warning").style.display = "none";
				document.getElementById("table_min_warning").style.display = "none";
				document.getElementById("table_max_warning").style.display = "none";
			}
				
			function cancelRuleSelection(){
				let clearOverlay = document.getElementById("clear_overlay")
				document.getElementById("play_blackjack_div").removeChild(clearOverlay);
				document.getElementById("rules_overlay").style.display = "none";
				
				//overwrites rules with sessionStorage if they exist
				let blackjackRules;
				if(sessionStorage.blackjackRules){
					blackjackRules = JSON.parse(sessionStorage.blackjackRules);
					for(let i=0; i<blackjackRules.length;i++){
						document.getElementsByClassName("rule")[i].value = blackjackRules[i];
					}
				}
				
				document.getElementById("deck_penetration").innerHTML = document.getElementById("penetration_slider").value;
				document.getElementById("blackjack_payout_warning").style.display = "none";
				document.getElementById("table_min_warning").style.display = "none";
				document.getElementById("table_max_warning").style.display = "none";
			}
		})();
		
		//All the functions related to the game of blackjack
		var blackjackGame = (function(){
			return {
							
				//deals cards to all players
				dealCards: dealCards,
				playerHits: playerHits,
				playerStays: playerStays,			
				playerDoubles: playerDoubles,
				playerSplits: playerSplits,
				playerSurrenders: playerSurrenders,
				createNewHand: createNewHand,
				displayHand: displayHand,
				resetGame: resetGame
	
			};
			
			function dealCards(){
				let tableMin = parseInt(document.getElementById("table_min").value);
				let tableMax = parseInt(document.getElementById("table_max").value);
				
				if(betAmount >= tableMin && betAmount <= tableMax){
					dealOneCard(mainPlayer);
					dealOneCard(dealer, false)
					dealOneCard(mainPlayer);
					dealOneCard(dealer);

					calculateHands(mainPlayer);
					calculateHands(dealer);
					
					checkForBlackjack();
					showPlayerOptions();
					document.getElementById("deal_cards_button").style.display = "none";
					document.getElementById("bet_area").style.display = "none";
					
					bankroll  = bankroll - betAmount;
					document.getElementById("bankroll").innerHTML = bankroll;
					document.getElementById("bet_amount_notification").style.display = "none";
				}
				else{
					document.getElementById("bet_min_note").innerHTML = tableMin;
					document.getElementById("bet_max_note").innerHTML = tableMax;
					document.getElementById("bet_amount_notification").style.display = "block";
				}
			}
			
			function playerHits(){
				dealOneCard(mainPlayer);
				calculateHands(mainPlayer);
				
				if(mainPlayer.handValue[mainPlayer.activeHandIndex]>21){
					mainPlayer.handPayoutFactor[mainPlayer.activeHandIndex] = 0;
					handOutcome("Bust");
				}
				
				showPlayerOptions();
				
				let charlieRule = parseInt(document.getElementById("charlie_rule").value);
				if (mainPlayer.handValue[mainPlayer.activeHandIndex]<22 && mainPlayer.hands[mainPlayer.activeHandIndex].length === charlieRule){
					mainPlayer.handPayoutFactor[mainPlayer.activeHandIndex] = 2;
					handOutcome("Charlie");
				}
				
			}
			
			function playerStays(){
				
				if(mainPlayer.handPayoutFactor[mainPlayer.activeHandIndex] === null){
					mainPlayer.handPayoutFactor[mainPlayer.activeHandIndex] = -2;
				}
				mainPlayer.activeHandIndex++;
				
				while(mainPlayer.activeHandIndex<mainPlayer.hands.length && mainPlayer.handPayoutFactor[mainPlayer.activeHandIndex] != null){
					mainPlayer.activeHandIndex++;
				}
				
				//check to make sure there are no unfinished hands that were skipped,using the winnings values
				for(let i=0; i<mainPlayer.hands.length; i++){
					if(mainPlayer.handPayoutFactor[i] === null && i<mainPlayer.activeHandIndex){mainPlayer.activeHandIndex = i;}
				}
				
				if(mainPlayer.activeHandIndex >= mainPlayer.hands.length){
					turn = "dealer";
					mainPlayer.activeHandIndex = 0;
				}
				else{
					showPlayerOptions();
				}
				
				if(turn === "dealer"){
					revealHoleCard();
				}
				
				while(turn === "dealer"){
					if(dealer.handValue[0] < 17){
						dealOneCard(dealer);
						calculateHands(dealer);
					}
					else if( dealer.handValue[0] === 17 && dealer.softAceCount[0]>0 && document.getElementById("dealer_hits_soft_17").value === "yes" ){
						dealOneCard(dealer);
						calculateHands(dealer);
					}
					else{
						turn = "";
						
						while(mainPlayer.activeHandIndex<mainPlayer.hands.length && mainPlayer.handPayoutFactor[mainPlayer.activeHandIndex] >= 0){
							mainPlayer.activeHandIndex++;
						}
						
						if(mainPlayer.activeHandIndex<mainPlayer.hands.length){
							checkNextHand();
						}
						else{
							setTimeout(resetGame, 1000);
						}
						
					}
				}
				
				function revealHoleCard(){
					dealer.hands[0][0].imageHTML.src = dealer.hands[0][0].backupImageSrc;
					runningCount = runningCount + dealer.hands[0][0].countChange;
					displayHand(dealer);
				}
				
			}
			
			function playerDoubles(){
				bankroll = bankroll - betAmount;
				document.getElementById("bankroll").innerHTML = bankroll;
				
				dealOneCard(mainPlayer);
				calculateHands(mainPlayer);
				if(mainPlayer.handValue[mainPlayer.activeHandIndex]>21){
					mainPlayer.handPayoutFactor[mainPlayer.activeHandIndex] = 0;
					handOutcome("Bust");
				}
				else{
					mainPlayer.handPayoutFactor[mainPlayer.activeHandIndex] = -4;
					playerStays();
				}
			}
			
			function playerSplits(){
					
				let splitCard = mainPlayer.hands[mainPlayer.activeHandIndex][1]
				bankroll = bankroll - betAmount;
				document.getElementById("bankroll").innerHTML = bankroll;
				
				createNewHand(mainPlayer);
				mainPlayer.hands[mainPlayer.hands.length-1].push(splitCard);
				mainPlayer.hands[mainPlayer.activeHandIndex].splice(1,1);
				
				displayHand(mainPlayer);
				dealOneCard(mainPlayer);
				
				let x = mainPlayer.activeHandIndex
				mainPlayer.activeHandIndex = mainPlayer.hands.length - 1;
				dealOneCard(mainPlayer);
				calculateHands(mainPlayer);
				if(document.getElementById("split_hands_blackjack").value === "yes"){checkForBlackjack();}
				
				mainPlayer.activeHandIndex = x;
				calculateHands(mainPlayer);
				if(document.getElementById("split_hands_blackjack").value === "yes"){checkForBlackjack();}
				
				showPlayerOptions();
					
			}
			
			function playerSurrenders(){
				mainPlayer.handPayoutFactor[mainPlayer.activeHandIndex] = 0.5;
				handOutcome("Surrender");
			}
			
			function createNewHand(player){
					player.hands.push([]);
					player.handValue.push(0);
					player.handPayoutFactor.push(null);
					player.softAceCount.push(0);
			}
				
			//removes all hands from the player.handDivId and adds each player hand and card to the screen one by one
			function displayHand(player){
					let hands = Array.from(document.getElementById(player.handDivId).getElementsByClassName("hand_of_cards"));
					hands.forEach(function(item){document.getElementById(player.handDivId).removeChild(item)});
					
					for(let i=0; i<player.hands.length; i++){
						let newHand = document.createElement("div");
						newHand.className = "hand_of_cards";
						if(i < player.hands.length - 1){
							newHand.style.marginBottom = "-120px";
						}
						
						for(let j=0; j<player.hands[i].length; j++){
							newHand.appendChild(player.hands[i][j].imageHTML);
						}
						document.getElementById(player.handDivId).appendChild(newHand);
					}			
				}
			
			//checks for blackjack conditions
			function checkForBlackjack(){
				
				let numerator = parseInt(document.getElementById("payout_numerator").value);
				let denominator = parseInt(document.getElementById("payout_denominator").value);
				
				
				//no one has bj
				if(mainPlayer.handValue[mainPlayer.activeHandIndex] < 21 & dealer.handValue[0] < 21){
					//do nothing
				}
				//dealer only
				else if (mainPlayer.handValue[mainPlayer.activeHandIndex] != 21 && dealer.handValue[0] === 21){
					if(document.getElementById("21vsbj").value === "lose" && document.getElementById("21vsbj").value != "early"){
						mainPlayer.handPayoutFactor[mainPlayer.activeHandIndex] = 0;
						handOutcome("Dealer Blackjack");
					}
				}
				//player only
				else if (dealer.handValue[0] != 21 && mainPlayer.handValue[mainPlayer.activeHandIndex] === 21){
					mainPlayer.handPayoutFactor[mainPlayer.activeHandIndex] = numerator/denominator;
					handOutcome("Blackjack")
				}
				//both
				else if(mainPlayer.handValue[mainPlayer.activeHandIndex] === 21 && dealer.handValue[0] === 21){
					if(document.getElementById("bj_tie").value = "blackjack"){
						mainPlayer.handPayoutFactor[mainPlayer.activeHandIndex] = numerator/denominator;
						handOutcome("Blackjack");
					}
					else{
						mainPlayer.handPayoutFactor[mainPlayer.activeHandIndex] = 1;
						handOutcome("Tie");
					}
				}
				
			}
				
			//deals a single card to the player
			function dealOneCard(player, visible){
				let card = deckArray[currentLocationInDeck];
				
				if(visible === false){card.imageHTML.src = "images/cards/card_back.png";}
				else{runningCount = runningCount + card.countChange;}
				
				player.hands[player.activeHandIndex].push(card);
				currentLocationInDeck++;
				displayHand(player);
				
				if(currentLocationInDeck>=deckArray.length){
					generateShoe();
				}
				
			}	


			function showPlayerOptions(){
				
				document.getElementById("stay_button").style.display = "inline-block";
				
				if(checkForHit()){
					document.getElementById("hit_button").style.display = "inline-block";
				}
				else{
					document.getElementById("hit_button").style.display = "none";
				}
				
				if(checkForDouble()){
					document.getElementById("double_button").style.display = "inline-block";
				}
				else{
					document.getElementById("double_button").style.display = "none";
				}
				
				if(checkForSplit()){
					document.getElementById("split_button").style.display = "inline-block";
				}
				else{
					document.getElementById("split_button").style.display = "none";
				}
				
				if(checkForSurrender()){
					document.getElementById("surrender_button").style.display = "inline-block";
				}
				else{
					document.getElementById("surrender_button").style.display = "none";
				}
				
				//checks to see if surrender is allowed. returns true or false.
				function checkForSurrender(){
					if(document.getElementById("surrender_type").value != "none" 
					&& mainPlayer.hands.length === 1 
					&& mainPlayer.hands[mainPlayer.activeHandIndex].length === 2){
						return true;
					}
					else{
						return false;
					}
				}
				
				//checks to see if hitting is allowed. returns true or false.
				function checkForHit(){
					let active = mainPlayer.activeHandIndex;
					if(mainPlayer.handValue[active]>20){
						return false;
					}
					else if(mainPlayer.hands.length === 1){
						return true;
					}
					else{
						switch(document.getElementById("draw_split_aces").value){
								case "yes":
									if(mainPlayer.handValue[active]<21){return true;}
									else{return false;}
									break;
								case "no":
									if(mainPlayer.handValue[active]<21 && mainPlayer.hands[active][0].value != 11){return true;}
									else{return false;}
									break;
						}
					}
				}
				
				//checks to see if splitting is allowed. returns true or false.
				function checkForSplit(){
					let active = mainPlayer.hands[mainPlayer.activeHandIndex];
					
					if(betAmount>bankroll){
						return false;
					}
					else if(mainPlayer.hands.length === 1 && mainPlayer.hands[0][0].type === mainPlayer.hands[0][1].type){
						return true;
						}
					else{
						switch(document.getElementById("resplitting_allowed").value){
								case "no":
									if(mainPlayer.hands.length != 1){return false;}
									else if(mainPlayer.hands[0].length === 2 && mainPlayer.hands[0][0].type === mainPlayer.hands[0][1].type){return true}
									else{return false};
									break;
								case "yes, no aces":
									if(active[0].value === 11){return false;}
									else if(active.length === 2 && active[0].type === active[1].type){return true}
									else{return false;}
								case "yes, with aces":
									if(active.length === 2 && active[0].type === active[1].type){return true}
									else{return false;}
						}
					}
				}
				
				//checks to see if doubling is allowed. returns true or false
				function checkForDouble(){
					let active = mainPlayer.activeHandIndex;
					
					if(betAmount>bankroll){
						return false;
					}
					else if(document.getElementById("draw_split_aces").value === "no" 
					&& mainPlayer.hands.length > 1 && mainPlayer.hands[active][0].value === 11){
						return false;
					}
					else if(mainPlayer.hands[active].length > 3){
						return false;
					}
					else if(mainPlayer.hands[active].length === 3){
						if(document.getElementById("doubling_allowed_on").value != "any 3 cards"){return false;}
						else if(document.getElementById("double_after_split").value === "yes" || mainPlayer.hands.length === 1){return true;}
						else{return false;}
					}
					else if(document.getElementById("double_after_split").value === "yes" || mainPlayer.hands.length === 1){
						switch(document.getElementById("doubling_allowed_on").value){
							case "10,11":
								if(mainPlayer.handValue[active] > 9 && mainPlayer.handValue[active] < 12 && mainPlayer.softAceCount[active] === 0 ){return true;}
								else{return false;}
								break;
							case "9,10,11":
								if(mainPlayer.handValue[active] > 8 && mainPlayer.handValue[active] < 12 && mainPlayer.softAceCount[active] === 0 ){return true;}
								else{return false;}
								break;
							case "8,9,10,11":
								if(mainPlayer.handValue[active] > 7 && mainPlayer.handValue[active] < 12 && mainPlayer.softAceCount[active] === 0 ){return true;}
								else{return false;}
								break;
							case "all hard hands":
								if(mainPlayer.softAceCount[active] === 0 ){return true;}
								else{return false;}
								break;
							case "any 2 cards":
								return true;
								break;
							case "any 3 cards":
								return true;
								break;
							default:
								console.log("something went wrong");
								console.log("case should be: " + document.getElementById("doubling_allowed_on").value);
						}
					}
					else{
						false;
					}
				}
			}
			
				
			function checkNextHand(){
				let payout = mainPlayer.handPayoutFactor[mainPlayer.activeHandIndex]
				if (mainPlayer.handValue[mainPlayer.activeHandIndex]>21){
					mainPlayer.handPayoutFactor[mainPlayer.activeHandIndex] = 0;
					handOutcome("Lose");
				}
				else if(dealer.handValue[0]>21 && mainPlayer.handValue[mainPlayer.activeHandIndex]<22){
					mainPlayer.handPayoutFactor[mainPlayer.activeHandIndex] = -payout;
					handOutcome("Win");
				}
				else if(dealer.handValue[0]<22 && mainPlayer.handValue[mainPlayer.activeHandIndex]>dealer.handValue[0]){
					mainPlayer.handPayoutFactor[mainPlayer.activeHandIndex] = -payout;
					handOutcome("Win");
				}
				else if(dealer.handValue[0]<22 && mainPlayer.handValue[mainPlayer.activeHandIndex]===dealer.handValue[0]){
					mainPlayer.handPayoutFactor[mainPlayer.activeHandIndex] = -payout-1;
					handOutcome("Tie");
				}
				else{
					mainPlayer.handPayoutFactor[mainPlayer.activeHandIndex] = 0;
					handOutcome("Lose");
				}
			}
			
			//update player data to reflect hand value, number of aces, etc.
			function calculateHands(player){
				
				for(let i=0; i<player.hands.length; i++){
					player.handValue[i] = 0;
					player.softAceCount[i] = 0;
					player.hands[i].forEach(function(card){
							player.handValue[i] = player.handValue[i] + card.value;
							if(card.isAce === true){player.softAceCount[i]++};
						});
				
					while(player.handValue[i]>21 && player.softAceCount[i]>0){
						player.handValue[i] = player.handValue[i] - 10;
						player.softAceCount[i]--;
					}
				}
				
				if(document.getElementById("show_count").value === "always"){
					document.getElementById("running_count_button").innerHTML = runningCount;
				}
			}
			
			function handOutcome(outcome){
				let winnings = Math.ceil(betAmount * mainPlayer.handPayoutFactor[mainPlayer.activeHandIndex]);
				let notificationText = outcome + "\n" + "You Get $" + winnings + "!"
				
				document.getElementById("notification_text").innerHTML = notificationText;
				document.getElementById("notification_overlay").style.display = "block";
				
				bankroll = bankroll + winnings;
				document.getElementById("bankroll").innerHTML = bankroll;
				
				mainPlayer.activeHandIndex++;
				if(turn === "mainPlayer"){
					setTimeout(
						function(){
							document.getElementById("notification_overlay").style.display = "none";
							mainPlayer.activeHandIndex--;
							playerStays();
						}
					,notificationTime);
				}
				else if(mainPlayer.activeHandIndex< mainPlayer.hands.length){
					setTimeout(
						function(){
							document.getElementById("notification_overlay").style.display = "none";
							checkNextHand();
						}
					,notificationTime);
				}
				else{
					setTimeout(
						function(){
							resetGame();
						}
					,notificationTime);
				}
			}
			
			function resetGame(){
				document.getElementById("notification_overlay").style.display = "none";
				initializePlayers();
				removeOptionButtons();
				
				document.getElementById("deal_cards_button").style.display = "inline-block";
				turn = "mainPlayer";
				
				document.getElementById("bet_area").style.display = "inline-block";
				if(betAmount > bankroll){betAmount = bankroll;}
				document.getElementById("bet_amount").innerHTML = betAmount;
				
				let cutCardLocation = Math.floor(parseInt(document.getElementById("penetration_slider").value)*deckArray.length/100)
				if(currentLocationInDeck>=cutCardLocation){
					generateShoe();
				}
				
				//removes the hit, stay, double, split and surrender buttons from the screen
				function removeOptionButtons(){
					document.getElementById("hit_button").style.display = "none";
					document.getElementById("stay_button").style.display = "none";
					document.getElementById("double_button").style.display = "none";
					document.getElementById("split_button").style.display = "none";
					document.getElementById("surrender_button").style.display = "none";
				}
			}
			
			//removes the hit, stay, double, and split buttons from the screen
			function removeOptionButtons(){
				document.getElementById("hit_button").style.display = "none";
				document.getElementById("stay_button").style.display = "none";
				document.getElementById("double_button").style.display = "none";
				document.getElementById("split_button").style.display = "none";
				document.getElementById("surrender_button").style.display = "none";
			}
		
		})();
		
		//all functions related to placing bets
		var betting =(function(){
			return{
				placeChips: placeChips,
				clearBet: clearBet
			};
			
			function placeChips(){
				
				let tableMax = parseInt(document.getElementById("table_max").value);
				let tableMin = parseInt(document.getElementById("table_min").value);
				let chipValueChoices = document.getElementsByName("chips");
				let selectedChipValue;
				
				betAmount = parseInt(document.getElementById("bet_amount").innerHTML);
				for(let i=0; i<chipValueChoices.length; i++){
					if(chipValueChoices[i].checked === true){
						selectedChipValue = parseInt(chipValueChoices[i].value);
					}
				}
				
				betAmount = betAmount + selectedChipValue;
				if(betAmount > bankroll){betAmount = bankroll;}
				if(betAmount > tableMax){betAmount = tableMax;}
				
				document.getElementById("bet_amount").innerHTML = betAmount;
				
			}
			
			
			function clearBet(){
				document.getElementById("bet_amount").innerHTML = 0;
				betAmount = 0;
			}
			
		})();
		
		initializePlayers();
		userSettings.initializeDefaultRules();
		addEventListeners();
		generateShoe();
		document.getElementById("play_blackjack_div").style.display = "block";			
		
		return removeEverything;
		
		//constructor function for new players
		function Player(){
			this.hands = [];
			this.handValue = [];
			this.softAceCount = [];
			this.handPayoutFactor = [];
			this.handDivId = "";
			this.activeHandIndex = 0;
		}
		
		//constructor function that creates a new card with the given properties
		function Card(type, value, suit, isAce) {
			this.type = type;
			this.value = value;
			this.suit = suit;
			this.isAce = isAce;
			this.countChange;
			this.imageHTML;
			this.backupImageSrc;
		}
		
		function initializePlayers(){
			dealer = new Player;
			mainPlayer = new Player;
			
			dealer.handDivId = "dealer_hand";
			mainPlayer.handDivId = "main_player_hands";
			
			blackjackGame.createNewHand(mainPlayer);
			blackjackGame.createNewHand(dealer);
			
			blackjackGame.displayHand(mainPlayer);
			blackjackGame.displayHand(dealer);
		}
		
		//clears array, then generates an array of cards based on the current selected number of decks
		function generateShoe(){
			
			let numberOfDecks = parseInt(document.getElementById("number_of_decks").value);
			deckArray = [];

			for(let i=0; i<numberOfDecks; i++){
				for(let s=0; s<cardSuits.length; s++){
					for(let t=0; t<cardTypes.length; t++){
						
						let card = new Card(cardTypes[t], t+1, cardSuits[s], false);
						
						card.countChange = hiOpt2[t];
						if(card.value>10){
							card.value=10;
						}
						if(card.value === 1){
							card.isAce = true; 
							card.value = 11;
						}
						let image = document.createElement("img");
						let imageNumber = s*13+t+1;
						image.src = "images/cards/cards_" + imageNumber + ".png"
						image.alt = card.type + " Of " + card.suit;
						image.className = "card";
						
						card.imageHTML = image;
						card.backupImageSrc = image.src;
						deckArray.push(card);
					}
				}
			}
			shuffleShoe();
		}
		
		//takes the current shoe, shuffles it, and returns the locator variable to position 0
		function shuffleShoe(){
			
			let index = 0;
			document.getElementById("notification_text").innerHTML = "Shuffle!"
			document.getElementById("notification_overlay").style.display = "block";
			currentLocationInDeck = 0;
			runningCount = 0;
			if(document.getElementById("show_count").value === "always"){
				document.getElementById("running_count_button").innerHTML = runningCount;
			}
			
			setTimeout(function(){
				
				for (let i=0; i<deckArray.length; i++){
					index = Math.floor( Math.random()*(deckArray.length-i) );
					deckArray.push(deckArray[index]);
					deckArray.splice(index,1);
				}
				document.getElementById("notification_overlay").style.display = "none";
				
			},notificationTime);
		}
		
		//reveals running count on click if proper option is selected in settings
		function showCount(e){
			if(document.getElementById("show_count").value === "on_click"){
				e.target.innerHTML = runningCount;
			}
		}
		function hideCount(e){
			if(document.getElementById("show_count").value === "on_click"){
				e.target.innerHTML = "Click To Show Running Count";
			}
		}
		//add event listeners to play blackjack overlay
		function addEventListeners(){
			//settings buttons
			document.getElementById("open_rules_overlay_button").addEventListener("click", userSettings.openRulesOverlay);
			document.getElementById("select_rules_button").addEventListener("click", userSettings.saveRuleSelections);
			document.getElementById("restore_defaults_button").addEventListener("click", userSettings.restoreDefaultRules);
			document.getElementById("cancel_rule_selection_button").addEventListener("click", userSettings.cancelRuleSelection);
			
			//blackjack related buttons
			document.getElementById("deal_cards_button").addEventListener("click", blackjackGame.dealCards);
			document.getElementById("hit_button").addEventListener("click", blackjackGame.playerHits);
			document.getElementById("stay_button").addEventListener("click", blackjackGame.playerStays);
			document.getElementById("double_button").addEventListener("click", blackjackGame.playerDoubles);
			document.getElementById("split_button").addEventListener("click", blackjackGame.playerSplits);
			document.getElementById("surrender_button").addEventListener("click", blackjackGame.playerSurrenders);
			
			//betting buttons
			document.getElementById("place_chips_button").addEventListener("click", betting.placeChips);
			document.getElementById("clear_bet_button").addEventListener("click", betting.clearBet);
			
			//other
			document.getElementById("running_count_button").addEventListener("mousedown", showCount);
			document.getElementById("running_count_button").addEventListener("mouseup", hideCount);
			
		}
		
		//Removes all event listeners from this section and sets display to "none"
		function removeEverything(){
			blackjackGame.resetGame();
			
			document.getElementById("play_blackjack_div").style.display = "none";
			
			//settings buttons
			document.getElementById("open_rules_overlay_button").removeEventListener("click", userSettings.openRulesOverlay);
			document.getElementById("select_rules_button").removeEventListener("click", userSettings.saveRuleSelections);
			document.getElementById("restore_defaults_button").removeEventListener("click", userSettings.restoreDefaultRules);
			document.getElementById("cancel_rule_selection_button").removeEventListener("click", userSettings.cancelRuleSelection);
			
			//blackjack game buttons
			document.getElementById("deal_cards_button").removeEventListener("click", blackjackGame.dealCards);
			document.getElementById("hit_button").removeEventListener("click", blackjackGame.playerHits);
			document.getElementById("stay_button").removeEventListener("click", blackjackGame.playerStays);
			document.getElementById("double_button").removeEventListener("click", blackjackGame.playerDoubles);
			document.getElementById("split_button").removeEventListener("click", blackjackGame.playerSplits);
			document.getElementById("surrender_button").removeEventListener("click", blackjackGame.playerSurrenders);
			
			//betting buttons
			document.getElementById("place_chips_button").removeEventListener("click", betting.placeChips);
			document.getElementById("clear_bet_button").removeEventListener("click", betting.clearBet);
			
			//other
			document.getElementById("show_count").removeEventListener("mousedown", showCount);
			document.getElementById("show_count").removeEventListener("mouseup", hideCount);
		}
	
	}

})();