var trueCountApp = (function(){
	
	//amount of time a notificaiton is shown
	const notificationTime = 2000;
	const hiOpt2 = [0,1,1,2,2,1,1,0,0,-2,-2,-2,-2];
	
	//adds event listeners to index.html
	//any further calls to functions that add event listeners must return a function that removes those listeners. these functions are stored in an array
	var eventsToRemove = [];
	document.getElementById("play_blackjack_button").addEventListener("click", function(){eventsToRemove.push(playBlackjack())});
	document.getElementById("practice_skills_button").addEventListener("click", function(){eventsToRemove.push(practiceSkills())});
	
	Array.from(document.getElementsByClassName("return_to_menu_button")).forEach(function(item){item.addEventListener("click", returnToMenu)});
	Array.from(document.getElementsByClassName("tab_container")).forEach(function(item){item.addEventListener("click", changeTab)});
	
	//calls all of the removal functions stored on the array, then empties the array
	function returnToMenu(){
		for(let i=0; i<eventsToRemove.length; i++){
			eventsToRemove[i]();
		}
		eventsToRemove = [];
	}
	
	function exit(e){
		
		let removableItems = document.getElementById(e.target.value).getElementsByClassName("remove");
		for(i=0; i<removableItems.length; ){
			removableItems[i].parentNode.removeChild(removableItems[i]);
		}
		document.getElementById(e.target.value).style.display = "none";
		
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
				
				document.getElementById("clear_overlay").style.display = "block";
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
					
					document.getElementById("clear_overlay").style.display = "none";
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
				document.getElementById("clear_overlay").style.display = "none";
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
					document.getElementsByClassName("deal_cards_button")[0].style.display = "none";
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
						let newIndicator = document.createElement("div");
						let content = document.createElement("div");
						
						newHand.className = "hand_of_cards";
						newIndicator.className = "hand_indicator";
						content.className = "content";
						
						if(player != dealer || turn === "dealer"){
							calculateHands(player);
						}
						
						content.innerHTML = player.handValue[i];
						if(content.innerHTML === "0"){
							content.innerHTML = "";
						}
						newIndicator.appendChild(content);
						newHand.appendChild(newIndicator);
						
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
				
				document.getElementsByClassName("stay_button")[0].style.display = "inline-block";
				
				if(checkForHit()){
					document.getElementsByClassName("hit_button")[0].style.display = "inline-block";
				}
				else{
					document.getElementsByClassName("hit_button")[0].style.display = "none";
				}
				
				if(checkForDouble()){
					document.getElementsByClassName("double_button")[0].style.display = "inline-block";
				}
				else{
					document.getElementsByClassName("double_button")[0].style.display = "none";
				}
				
				if(checkForSplit()){
					document.getElementsByClassName("split_button")[0].style.display = "inline-block";
				}
				else{
					document.getElementsByClassName("split_button")[0].style.display = "none";
				}
				
				if(checkForSurrender()){
					document.getElementsByClassName("surrender_button")[0].style.display = "inline-block";
				}
				else{
					document.getElementsByClassName("surrender_button")[0].style.display = "none";
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
				
				document.getElementsByClassName("deal_cards_button")[0].style.display = "inline-block";
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
					document.getElementsByClassName("hit_button")[0].style.display = "none";
					document.getElementsByClassName("stay_button")[0].style.display = "none";
					document.getElementsByClassName("double_button")[0].style.display = "none";
					document.getElementsByClassName("split_button")[0].style.display = "none";
					document.getElementsByClassName("surrender_button")[0].style.display = "none";
				}
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
		
		
		userSettings.initializeDefaultRules();
		blackjackGame.resetGame();
		addEventListeners();
		generateShoe();
		document.getElementById("play_blackjack_div").style.display = "block";

		//all notifications on this overlay are time-based, so don't need button
		document.getElementById("notification_button").style.display = "none";
		
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
						image.src = "images/cards/cards_" + imageNumber + ".png";
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
			document.getElementById("clear_overlay").addEventListener("click", userSettings.saveRuleSelections);
			
			//blackjack related buttons
			document.getElementsByClassName("deal_cards_button")[0].addEventListener("click", blackjackGame.dealCards);
			document.getElementsByClassName("hit_button")[0].addEventListener("click", blackjackGame.playerHits);
			document.getElementsByClassName("stay_button")[0].addEventListener("click", blackjackGame.playerStays);
			document.getElementsByClassName("double_button")[0].addEventListener("click", blackjackGame.playerDoubles);
			document.getElementsByClassName("split_button")[0].addEventListener("click", blackjackGame.playerSplits);
			document.getElementsByClassName("surrender_button")[0].addEventListener("click", blackjackGame.playerSurrenders);
			
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
			document.getElementById("clear_overlay").removeEventListener("click", userSettings.saveRuleSelections);
			
			//blackjack game buttons
			document.getElementsByClassName("deal_cards_button")[0].removeEventListener("click", blackjackGame.dealCards);
			document.getElementsByClassName("hit_button")[0].removeEventListener("click", blackjackGame.playerHits);
			document.getElementsByClassName("stay_button")[0].removeEventListener("click", blackjackGame.playerStays);
			document.getElementsByClassName("double_button")[0].removeEventListener("click", blackjackGame.playerDoubles);
			document.getElementsByClassName("split_button")[0].removeEventListener("click", blackjackGame.playerSplits);
			document.getElementsByClassName("surrender_button")[0].removeEventListener("click", blackjackGame.playerSurrenders);
			
			//betting buttons
			document.getElementById("place_chips_button").removeEventListener("click", betting.placeChips);
			document.getElementById("clear_bet_button").removeEventListener("click", betting.clearBet);
			
			//other
			document.getElementById("show_count").removeEventListener("mousedown", showCount);
			document.getElementById("show_count").removeEventListener("mouseup", hideCount);
		}
	
	}

	function practiceSkills(){
		let navigationArray = ["practice_home"];
		let flashcardArray = [];
		let practiceDeck = [];
		//an array where each element is an array of the result objects for that review number. 
		//result objects have 2 attributes: result, and interval
		let answerHistory = [];
		
		//stability is the standard amount of time between reviews. 
		//stability[0] is time between new card and first review, stability[1] is between first and second review, etc.
		//increment multiplier is the multiplier for correct answers. m[0]=(s[1]/s[0]). 
		let spacingIncrementData = {
			stability: [],
			incrementMultiplier: []
		};
		
		var deck = (function(){
			return {
				initializeDeck: initializeDeck,
				calculateOverdue: calculateOverdue,
				displayTopCard: displayTopCard,
				sort:			sort,
				checkAnswer:	checkAnswer,
			}
			
			function initializeDeck(e){
				//creates a practice deck and fills it with the relevant cards from flashcardArray and assigns and overdue value
				practiceDeck.splice(0,practiceDeck.length);
				flashcardArray.forEach(function(card){
					if(e.target.value == card.hand_type || e.target.value == "all"){
						practiceDeck.push(card);
					}
					
				});
			}
			
			function calculateOverdue(){
				practiceDeck.forEach(function(card){
					if(card.isNew === false){
						card.percentOverdue = 100*(Date.now()-card.lastSeen)/card.currentIntervalLength
					}else{
						card.percentOverdue = 100;
					}
				})
			}
					
			function displayTopCard(){
				adjustHeaderInfo();
				displayHands();
				displayOptions();
				markCorrect();
				
				//displays info like soft 17 rules and number of decks
				function adjustHeaderInfo(){
					let cardHeaders = document.getElementById("flashcard_overlay").getElementsByClassName("header2");
					let yesNo = ["yes", "no"]
					let afterSplit;
					let decks = practiceDeck[0].number_of_decks
					
					if(decks == 3){
						decks = "3+"
					}
					
					if(practiceDeck[0].primary_action == "split" && practiceDeck[0].actionType == "primary"){
						afterSplit = "yes";
					}else if (practiceDeck[0].primary_action == "split" && practiceDeck[0].actionType == "secondary"){
						afterSplit = "no";
					}else{
						afterSplit = yesNo[Math.floor(Math.random()*2)];
					}
					
					cardHeaders[0].innerHTML = "Number Of Decks: " + decks;
					cardHeaders[1].innerHTML = "Dealer Hits Soft 17: " + practiceDeck[0].dealer_hits_soft;
					cardHeaders[2].innerHTML = "Double After Split Allowed: " + afterSplit;
				}	
				
				function displayHands(){
					
					//displays dealer's up card
					let upCard = document.createElement("img");
					let imageNumber;
					let imageArray = [];
					
					if(practiceDeck[0].dealer_card_value === 11){
						imageNumber = Math.floor(Math.random()*4)*13 + 1;
					}else if(practiceDeck[0].dealer_card_value === 10){
						imageNumber = Math.floor(Math.random()*4)*13 + 10 + Math.floor(Math.random()*4);
					}else{
						imageNumber = Math.floor(Math.random()*4)*13 + practiceDeck[0].dealer_card_value;
					}
					
					imageArray.push(imageNumber);
					
					upCard.src = "images/cards/cards_" + imageNumber + ".png";
					upCard.alt = "dealer up card";
					upCard.className = "card remove";
					upCard.style.marginRight = "0px";
					document.getElementById("flashcard_overlay").getElementsByClassName("hand_of_cards")[0].appendChild(upCard);
				
					//creates player hand
					let card = document.createElement("img");
					let remainingValue = practiceDeck[0].player_hand_value;
					let cardValue;
					let cardArray = [];
					
					switch(practiceDeck[0].hand_type){
						case "hard":
							if(practiceDeck[0].player_hand_value <= 12){
								cardValue = Math.floor( Math.random()*(remainingValue-3) ) + 2;//between 2 and r.v. minus 2
								cardArray.push(cardValue);
								remainingValue -= cardValue;
							}else if(practiceDeck[0].player_hand_value > 12){
								cardValue = Math.floor( Math.random()*10 ) + 1;
								cardArray.push(cardValue);
								remainingValue -= cardValue;
							}
							break;
						case "soft":
							cardArray.push(11);
							remainingValue -= 11;
							break;
						case "split":
							cardArray.push(remainingValue/2);
							cardArray.push(remainingValue/2);
							remainingValue = 0;
							break;
					}
					
					if(practiceDeck[0].actionType == "secondary" && 
					(practiceDeck[0].secondary_action == "hit" || practiceDeck[0].secondary_action == "stay" )){
						//continues to draw cards to fill hand, making sure to avoid soft aces
						while(remainingValue > 0){
							if(remainingValue <= 10){
								cardValue = Math.floor( Math.random()*(remainingValue-2) ) + 2;
								if(cardValue === remainingValue - 1){
									cardValue = remainingValue;
								}
								cardArray.push(cardValue);
								remainingValue -= cardValue;
							}else if(remainingValue === 11){
								cardValue = Math.floor( Math.random()*(remainingValue-3) ) + 2;
								cardArray.push(cardValue);
								remainingValue -= cardValue;
							}else if(remainingValue >= 12){
								cardValue = Math.floor( Math.random()*10 ) + 1;
								cardArray.push(cardValue);
								remainingValue -= cardValue;
							}
						}
						
						//checks array to make sure there are not too many of the same value card
						let tooManyCards;
						do{
							tooManyCards = false;
							cardArray.forEach(function (card){
								let count = 0;
								let numberOfDecks = practiceDeck[0].number_of_decks;
								
								//too many copies of a card only possible for 1 deck: card value<=5 and 2deck:cardValue<=2
								if(card <= 8-3*numberOfDecks){
									cardArray.forEach(function (item){
										if(item === card){ count++;};
									});
									
									if(count>4*numberOfDecks || (count === 4*numberOfDecks - 1 && practiceDeck[0].dealer_card_value === card)){
										tooManyCards = true;
										let value = card;
										card *= 2;
										cardArray.forEach(function (item){
											if(item === value){
												cardArray.splice(cardArray.indexOf(item), 1);
												value = 0;
											}
										})
									}
								}
								
							});
						}while(tooManyCards === true);
					}else if(remainingValue != 0){
						cardArray.push(remainingValue);
					}
					
					//display cards on screen
					cardArray.forEach(function (card){
						let image = document.createElement("img");
						let imageNumber;
						
						if(card === 11 || card === 1){
							imageNumber = Math.floor(Math.random()*4)*13 + 1;
						}else if(card === 10){
							if(practiceDeck[0].hand_type != "split"){
								imageNumber = Math.floor(Math.random()*4)*13 + 10 + Math.floor(Math.random()*4);
							}else{
								if(cardArray.indexOf(card) === 0){
									imageNumber = Math.floor(Math.random()*4)*13 + 10 + Math.floor(Math.random()*4);
								}else if(cardArray.indexOf(card) === 1){
									imageNumber = imageArray[0] + Math.floor(Math.random()*4)*13;
									if(imageNumber != 52){
										imageNumber %= 52;
									}
								}
							}
						}else{
							imageNumber = Math.floor(Math.random()*4)*13 + card;
						}
						
						//checks to see if image has already been used too many times, and selects another if it has
						let wasModified;
						do{
							wasModified = false
							let useCount = 0;
							imageArray.forEach(function(item){
								if(item === imageNumber){ useCount++;}
							})
							if(useCount >= practiceDeck[0].number_of_decks){
								imageNumber += 13;
								if(imageNumber != 52){
									imageNumber %= 52;
								}
								wasModified = true;
							}
						}while(wasModified === true);
						
						imageArray.push(imageNumber);
						
						image.src = "images/cards/cards_" + imageNumber + ".png";
						image.alt = "player card with value of " + card;
						image.className = "card remove";
						
						image.style.marginRight = "-12.5%";
						image.style.marginLeft = "-12.5%";
						
						document.getElementById("flashcard_overlay").getElementsByClassName("hand_of_cards")[1].appendChild(image);
					
					});
				}	
			
				function displayOptions(){
					let flashcard = document.getElementById("flashcard_overlay");
					
					flashcard.getElementsByClassName("hit_button")[0].style.display = "inline-block";
					flashcard.getElementsByClassName("stay_button")[0].style.display = "inline-block";
					
					//check for double
					flashcard.getElementsByClassName("double_button")[0].style.display = "inline-block";
					if(practiceDeck[0].actionType == "secondary" && practiceDeck[0].hand_type != "split"){
						flashcard.getElementsByClassName("double_button")[0].style.display = "none";
					}
					
					//check for split
					if(practiceDeck[0].hand_type == "split"){
						flashcard.getElementsByClassName("split_button")[0].style.display = "inline-block";
					}else{
						flashcard.getElementsByClassName("split_button")[0].style.display = "none";
					}
					
					//check for surrender
					flashcard.getElementsByClassName("surrender_button")[0].style.display = "inline-block";
					if(practiceDeck[0].actionType == "secondary" && practiceDeck[0].hand_type != "split"){
						flashcard.getElementsByClassName("surrender_button")[0].style.display = "none";
					}
					
				}
					
				//assigng the correct button's value to "correct" and all other button values to "incorrect", 
				function markCorrect(){
					let flashcard = document.getElementById("flashcard_overlay");
					let className;
					if(practiceDeck[0].actionType == "primary"){
						className = practiceDeck[0].primary_action + "_button";
					}else{
						className = practiceDeck[0].secondary_action + "_button";
					}
					flashcard.getElementsByClassName("hit_button")[0].value = "incorrect";
					flashcard.getElementsByClassName("stay_button")[0].value = "incorrect";
					flashcard.getElementsByClassName("double_button")[0].value = "incorrect";
					flashcard.getElementsByClassName("split_button")[0].value = "incorrect";
					flashcard.getElementsByClassName("surrender_button")[0].value = "incorrect";
					
					flashcard.getElementsByClassName(className)[0].value = "correct";
				}
				
			}
			
			//sorts an array of cards based on percent overdue value
			function sort(array){
				
				//shuffles the array before sorting so that card order is randomized for cards with same overdue percent
				for (let i=0; i<array.length; i++){
					index = Math.floor( Math.random()*(array.length-i) );
					array.push(array[index]);
					array.splice(index,1);
				}
				
				
				let a1 = [];
				let a2 = [];
				
				array.forEach(function(item){
					if(array.indexOf(item) < array.length / 2){
						a1.push(item);
					}else{
						a2.push(item);
					}
					
				});
				
				if(isOrdered(a1) === false){
					sort(a1);
				}
				if(isOrdered(a2) === false){
					sort(a2);
				}
				
				combine(a1,a2,array);
				
				function isOrdered(array){
					let checker = array[0].percentOverdue;
					let ordered = true;
					
					array.forEach(function(item){
						if(item.percentOverdue > checker){
							ordered = false;
						}else{
							checker = item.percentOverdue;
						}
					})
					
					return ordered;
				}
				function combine(a1,a2, array){
					let index1=0;
					let index2=0;
					array.splice(0,array.length);
					
					while(index1<a1.length || index2<a2.length){
						if(index1<a1.length && index2<a2.length){
							if(a1[index1].percentOverdue >= a2[index2].percentOverdue){
								array.push(a1[index1]);
								index1++;
							}else{
								array.push(a2[index2]);
								index2++;
							}
						}else if(index1 >= a1.length && index2 < a2.length){
							array.push(a2[index2]);
							index2++;
						}else if(index2 >= a2.length && index1 < a1.length){
							array.push(a1[index1]);
							index1++;
						}
					}
					
				}
				
			}
			
			function checkAnswer(e){
				let reviewNumber = practiceDeck[0].reviewNumber;
				let time;
				if(practiceDeck[0].isNew === true){
					time = 1;
				}else{
					time = Date.now()-practiceDeck[0].lastSeen;
				}
				
				displayNotification()
				
				practiceDeck[0].isUpdated = true;
				practiceDeck[0].isNew = false;
				practiceDeck[0].lastSeen = Date.now();
				
				calculateSpacingIncrements();
				calculateInterval();	//also adjusts review number
				calculateOverdue()
				sort(practiceDeck);
				
				let removableItems = document.getElementById("flashcard_overlay").getElementsByClassName("remove");
				for(i=0; i<removableItems.length; ){
					removableItems[i].parentNode.removeChild(removableItems[i]);
				}
				
				displayTopCard();
				
				function calculateInterval(){
					if(e.target.value == "correct"){
						//sets next review interval for this card
						if(reviewNumber != 0){
							let prevInterval = practiceDeck[0].currentIntervalLength;
							let multiplier = spacingIncrementData.incrementMultiplier[reviewNumber-1];
							
							while(time > prevInterval){
								time -= prevInterval;
								prevInterval *= multiplier;
							}
							
							practiceDeck[0].currentIntervalLength = prevInterval * multiplier**(time/prevInterval);
							
						}else{
							practiceDeck[0].currentIntervalLength = spacingIncrementData.stability[0]
						}
						
						practiceDeck[0].reviewNumber++;
						
					}else if(e.target.value == "incorrect"){
						
						practiceDeck[0].reviewNumber = 1;
						practiceDeck[0].currentIntervalLength = spacingIncrementData.stability[0];
					}					
				}
				
				//updates data to the answer history array and calculated the interval spacing
				function calculateSpacingIncrements(){
					//adds data to answer history
					if(answerHistory.length === reviewNumber){
						answerHistory.push([]);
					}
					
					answerHistory[reviewNumber].push({result: e.target.value, interval: time});
					
					//adds initial multiplier
					if(spacingIncrementData.incrementMultiplier.length === reviewNumber){
						spacingIncrementData.incrementMultiplier.push(1.1);
						
						let stability = spacingIncrementData.stability[reviewNumber];
						stability *= spacingIncrementData.incrementMultiplier[reviewNumber];
						
						spacingIncrementData.stability.push(stability);
					}
					
					//calculates stability[r-1] and multiplier[r-2] for this review number
					if(reviewNumber > 0){
						let correctCount = 0;
						answerHistory[reviewNumber].forEach(function(review){
							if(review.result == "correct"){
								correctCount++;
							}
						});
						
						if(correctCount > 10){
							//calculate stability[reviewNumber-1]
							let stability = spacingIncrementData.stability[reviewNumber-1];
							let actualCorrect = correctCount;
							let expectedCorrect = 0;
							
							answerHistory[reviewNumber].forEach(function(review){
								expectedCorrect += 0.9**(review.time/stability);
							})
							
							spacingIncrementData.stability[reviewNumber-1] = stability * ( Math.log(expectedCorrect)/Math.log(actualCorrect) );
							
							if(reviewNumber >= 2){
								let stability1 = stability;
								let stability2 = spacingIncrementData.stability[reviewNumber];
								spacingIncrementData.incrementMultiplier[reviewNumber-2] = stability1/stability2;
							}
						}
					}
				}
			
				function displayNotification(){
					if(e.target.value == "incorrect"){
						let overlay = document.getElementById("notification_overlay");
						let header = document.getElementById("notification_text");
						let noteText;
						let card = practiceDeck[0];
						let yourHand;
						let deckNumber;
						let hitsOrStays = card.dealer_hits_soft
						let properAction;
						
						//assigns string value to yourHand
						switch (card.hand_type){
							case "hard":
								yourHand = "hard " + card.player_hand_value;
								break;
							case "soft":
								yourHand = "soft " + card.player_hand_value;
								break;
							case "split":
								let splitCard = card.player_hand_value/2;
								
								if(splitCard === 10){
									splitCard = "10-value cards"
								}else if(splitCard === 11){
									splitCard = "aces"
								}else{
									splitCard += "'s"
								}
								yourHand = "pair of " + splitCard
								break;
						}
						
						//assigns string value to deckNumber
						switch (card.number_of_decks){
							case 1:
								deckNumber = "single-deck"
								break;
							case 2:
								deckNumber = "2-deck"
								break;
							case 3:
								deckNumber = "multi-deck"
								break;
						}
						
						if(hitsOrStays == "yes"){
							hitsOrStays = "hits";
						}else{
							hitsOrStays = "stays";
						}
						
						//assigns string value to properAction
						switch (card.primary_action){
							case "hit":
								properAction = "always hit";
								break;
							case "stay":
								properAction = "always stay";
								break;
							case "double":
								properAction = "double when possible, otherwise " + card.secondary_action;
								break;
							case "split":
								if(card.primary_action === card.secondary_action){
									properAction = "always split";
								}else{
									properAction = "split when doubling after split is allowed, otherwise " + card.secondary_action;
								}
								break;
							case "surrender":
								properAction = "surrender when possible, otherwise " + card.secondary_action;
								break;
						}
						
						overlay.style.display = "block";
						
						noteText = "When the dealer's up card is " + card.dealer_card_value + " and you have a " + yourHand + "<br>";
						noteText += " in a " + deckNumber + " game where the dealer " + hitsOrStays + " on a soft 17,<br>";
						noteText += " you should " + properAction + ".";

						header.innerHTML = noteText;
						
					}
					
					
				}
			}
			
		})();
		
		
		document.getElementById("practice_skills_overlay").style.display = "block";
		
		//notificaitons on this overlay are closed by pressing the button
		document.getElementById("notification_button").style.display = "block";
		
		Array.from(document.getElementsByClassName("center_navigation")).forEach(function(item){item.style.display = "none"});
		document.getElementById("practice_home").style.display = "block";
		
		addEventListeners();
		loadFlashcards();
		
		
		return removeEverything;
		
		//function that gets called for all navigation buttons in the practice overlay. sets display of all displays other than selected one to "none"
		//html navigation button values are the same as the div container ids that they navigate to 
		function navigateTo(e){
			Array.from(document.getElementsByClassName("center_navigation")).forEach(function(item){item.style.display = "none"});
			document.getElementById(e.target.value).style.display = "block";
			
			navigationArray.push(e.target.value);
		}
		
		//connects to server and loads flashcards from DB if they don't exist in local storage.
		//flashcard array is an array of objects with attributes of the same name and value as columns from flashcard table in database 
		function loadFlashcards(){
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					flashcardArray = JSON.parse(this.responseText);
					
					spacingIncrementData.stability.push(60000);
					
					let copyArray = [];
					
					flashcardArray.forEach(function(card){
						card.reviewNumber = 0; 
						card.isUpdated = false; 
						card.isNew = true;
						card.actionType = "primary";
						
						
						let copy = {};
						Object.assign(copy, card);
						copy.actionType = "secondary";
						copyArray.push(copy);
					
						
					})
					
					copyArray.forEach(function (card){ flashcardArray.push(card)});
				}
			};
			xmlhttp.open("POST", "../loadflashcards.php", true);
			xmlhttp.send();
		}
		
		//practice deck is an array of card objects loaded from server with some properties taken from database and others added in js:
		//*****card_id, number_of_decks, dealer_hits_soft, dealer_card_value, player_hand_value, hand_type, primary_action, secondary_action
		//*****reviewNumber, isUpdated, isNew, percentOverdue, actionType, (lastSeen and currentIntervalLength are added after card is first learned)
		function basicFlashcardPractice(e){
			deck.initializeDeck(e);
			deck.calculateOverdue();
			deck.sort(practiceDeck);
			deck.displayTopCard();
			document.getElementById("flashcard_overlay").style.display = "block";
			
		}
		
		function quickstartPracticeSession(){
			// checks user progress in the various categories and automatically directs to the one most needed
		}
		
		function goBackOne(){
			Array.from(document.getElementsByClassName("center_navigation")).forEach(function(item){item.style.display = "none"});
			document.getElementById(navigationArray[navigationArray.length-2]).style.display = "block";
			
			navigationArray.pop();
		}
		
		function addEventListeners(){
			Array.from(document.getElementsByName("go_back_button")).forEach(function(btn){btn.addEventListener("click", goBackOne)});
			document.getElementById("practice_basic_strategy_button").addEventListener("click", navigateTo);
			document.getElementById("practice_quickstart_button").addEventListener("click", quickstartPracticeSession);
			Array.from(document.getElementsByName("basic_flashcards_button")).forEach(function(btn){btn.addEventListener("click", basicFlashcardPractice)});
			Array.from(document.getElementsByClassName("exit_button")).forEach(function(btn){btn.addEventListener("click", exit)});
			
			document.getElementById("flashcard_overlay").getElementsByClassName("player_options_button_container")[0].addEventListener("click", deck.checkAnswer);
			
		}
		
		function removeEverything(){
			Array.from(document.getElementsByName("go_back_button")).forEach(function(btn){btn.removeEventListener("click", goBackOne)});
			document.getElementById("practice_skills_overlay").style.display = "none";
			document.getElementById("practice_basic_strategy_button").removeEventListener("click", navigateTo);
			document.getElementById("practice_quickstart_button").removeEventListener("click", quickstartPracticeSession);
			Array.from(document.getElementsByName("basic_flashcards_button")).forEach(function(btn){btn.removeEventListener("click", basicFlashcardPractice)});
			Array.from(document.getElementsByClassName("exit_button")).forEach(function(btn){btn.removeEventListener("click", exit)});
			
			document.getElementById("flashcard_overlay").getElementsByClassName("player_options_button_container")[0].removeEventListener("click", deck.checkAnswer);
		}
		
	}
})();