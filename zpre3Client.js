var Zpre3Client = function() {

	var config = Zpre3Config || {  //Adjust custom config in zpre3Config.js
		websocketUrl : 'ws://localhost:8989/ws',
		serialPortDevice: '/dev/ttyUSB0',
		input1: 'INPUT1',
		input2: 'INPUT2',
		input3: 'INPUT3',
		input4: 'INPUT4',
		bypass: 'BYPASS'
	};

	var self = this;

	this.volume = null;
	this.power = null;
	this.mute = null;
	this.inputLabel = null;
	this.tone = null;
	this.bass = null;
	this.treble = null;
	this.balance = null;
	this.play_status = null;
	this.freq = null;
	this.display1 = null;
	this.display2 = null;
	
	this.stateChanged = function() {
		console.log(	"volume: " + this.volume + 
				", power: " + this.power + 
				", mute: " + this.mute + 
				", inputSource: " + this.inputSource + 
				", inputLabel: " + this.inputLabel + 
				", bass: " + this.bass + 
				", treble: " + this.treble + 
				", balance: " + this.balance +
				", tone: " + this.tone /*+ 
				", freq: " + this.freq + 
				", play_status: " + this.play_status +
				", display1: '" + this.display1 + "'" +  
				", display2: '" + this.display2  + "'" */
				)

		this.detachEventHandlers();		
		$("#power-flipswitch").val(this.power).flipswitch('refresh');
		$("#mute-flipswitch").val(this.mute).flipswitch('refresh');
		$("#tone-flipswitch").val(this.tone).flipswitch('refresh');
		$("#volume-slider").val(this.volume).slider('refresh');
		$("#source").val(this.inputSource).selectmenu('refresh');
		/*if ("off" == $("#tone-flipswitch").val()) {
			$("#bass-slider").slider("disable");
			$("#treble-slider").slider("disable");
		} else {
			$("#bass-slider").slider("enable");
			$("#treble-slider").slider("enable");
		}*/
		$("#bass-slider").val(Number(this.bass)).slider('refresh');
		$("#treble-slider").val(Number(this.treble)).slider('refresh');
		if (this.balance != null) {
			$("#balance-slider").val(Number(this.balance.replace('L', '-').replace('R', ''))).slider('refresh');
		}
		if (this.display1 != null && this.display2 != null) {
			var display = "" + this.display1 + this.display2;
			$("#lcd-display").text((display.slice(0,21) + "\n" + display.slice(21)));
		}
		if (this.inputSource != null && this.volume != null) {
			//document.title = (config[this.inputSource] != null ? config[this.inputSource] : this.inputSource) +	", Volume: " + this.volume;
			var d1=$("#source option:selected").text();
			var d2=(this.mute==0)?'':'MUTED ';
			var d3="Volume: " + this.volume;

			document.title = d1 + ", " + d2 + d3;
			$("#lcd-display").text(d1 + "\n" + d2 + d3);
		}
		this.attachEventHandlers();
	}


	this.initializeZpre3State = function() {
		self.webSocket.send(self.getCurrentPowerEvent());
		self.webSocket.send(self.getCurrentSourceEvent());
		self.webSocket.send(self.getVolumeEvent());
		self.webSocket.send(self.getSummaryEvent());
		
		self.webSocket.send(self.getBassEvent());
		self.webSocket.send(self.getTrebleEvent());
		self.webSocket.send(self.getBalanceEvent());
		
		/*
		self.webSocket.send(self.getToneEvent());
		self.webSocket.send(self.getDisplayEvent());
		*/

		config.input1 ? $("#input1").text(config.input1) : $("#input1").attr("disabled","disabled");
		config.input2 ? $("#input2").text(config.input2) : $("#input2").attr("disabled","disabled");
		config.input3 ? $("#input3").text(config.input3) : $("#input3").attr("disabled","disabled");
		config.input4 ? $("#input4").text(config.input4) : $("#input4").attr("disabled","disabled");
		config.bypass ? $("#bypass").text(config.bypass) : $("#bypass").attr("disabled","disabled");
	}

	this.detachEventHandlers = function() {
	    	$("#source").unbind("change");
	    	$("#mute-flipswitch").unbind("change");
	    	$("#power-flipswitch").unbind("change");
	    	$("#tone-flipswitch").unbind("change");
	    	$("#volume-slider").unbind("change");
	    	$("#bass-slider").unbind("change");
	    	$("#treble-slider").unbind("change");
			$("#balance-slider").unbind("change");
			$("button").unbind("click");
	}

	this.attachEventHandlers = function() {
	    	$("#source").on("change", function() {
				//var a = self.createActionEvent('W 1 2 ' + $("#source").val());
				//self.inputSource=$("#source").text;
				var a = self.sourceSetEvent($("#source").val());
				self.webSocket.send(a);
			} );

	    	$("#mute-flipswitch").on("change", function() {
				var v = parseInt($("#mute-flipswitch").val())+1;
				var a = self.muteSetEvent(v);
				
				self.webSocket.send(a);
			} );

	    	$("#power-flipswitch").on("change", function() {
				var c = $("#power-flipswitch").val();
				if (c == "standby") {
					c = "off";
				}
				var a = self.powerSetEvent(c);
				self.webSocket.send(a);
			} );

	    	$("#tone-flipswitch").on("change", function() {
				var a = self.toneSetEvent($("#tone-flipswitch").val());
				self.webSocket.send(a);
			} );

	    	$("#volume-slider").on("change", function() {
				var a = self.volumeSetEvent($("#volume-slider").val());
				self.webSocket.send(a);
			} );

			$("button").on("click", function() {
				console.log(this.id);
				var idparts=this.id.split('-');
				var feature=idparts[0];
				var direction=idparts[1];
				var a=null;
				console.log('feature = ' + feature + '; direction = ' + direction);
				switch(feature) {
					case "treble":
						if (direction=='plus') {
							a=self.trebleUpEvent();
						} else {
							a=self.trebleDownEvent();
						}
						break;
					case "bass":
						if (direction=='plus') {
							a=self.bassUpEvent();
						} else {
							a=self.bassDownEvent();
						}
						break;
					case "balance":
						if (direction=='plus') {
							a=self.balanceUpEvent();
						} else {
							a=self.balanceDownEvent();
						}
						break;
					case "volume":
						if (direction=='plus') {
							a=self.volumeUpEvent();
						} else {
							a=self.volumeDownEvent();
						}
						break;
				}
				if (a) {
					self.webSocket.send(a);
				}
			})

			/*
			$("#bass-slider").on("change", function() {
				var v = $("#bass-slider").val();
				var a = null;
				if (v < 0) {
					a = self.bassSetEvent('-' + ('0' + Math.abs(v)).slice(-2));
				} else if (v == 0) {
					a = self.bassSetEvent('000');
				} else if (v > 0) {
					a = self.bassSetEvent('+' + ('0' + Math.abs(v)).slice(-2));
				}
				self.webSocket.send(a);
			} );

	    	$("#treble-slider").on("change", function() {
				var v = $("#treble-slider").val();
				var a = null;
				if (v) {
					a = self.trebleSetEvent(v);
					self.webSocket.send(a);
				}
			} );

	    	$("#balance-slider").on("change", function() {
				var v = $("#balance-slider").val();
				var a = null;
				if (v < 0) {
					a = self.balanceSetEvent('L' + ('0' + Math.abs(v)).slice(-2));
				} else if (v == 0) {
					a = self.balanceSetEvent('000');
				} else if (v > 0) {
					a = self.balanceSetEvent('R' + ('0' + Math.abs(v)).slice(-2));
				}
				self.webSocket.send(a);
			} );
			*/

	}

	this.webSocket = new ReconnectingWebSocket(config.websocketUrl);
	this.webSocket.timeoutInterval = 1000;
	this.webSocket.maxReconnectInterval = 8000;
	this.webSocket.onopen = function() {
		self.webSocket.send('open '+config.serialPortDevice+' 9600');
		self.initializeZpre3State();
	};

	this.webSocket.onerror = function(error) {
		console.log("error: " + error);	
	};

	this.webSocket.onmessage = function(e) {
		parseEvent(e);
	};

	this.sourceSetEvent = function(v) { return this.createActionEvent('W 1 2 ' + v); }
	this.sourceInput1Event =  function() { return this.createActionEvent('W 1 2 6'); }
	this.sourceInput2Event =  function() { return this.createActionEvent('W 1 2 7'); }
	this.sourceInput3Event =  function() { return this.createActionEvent('W 1 2 8'); }
	this.sourceInput4Event =  function() { return this.createActionEvent('W 1 2 9'); }
	this.sourceBypassEvent =  function() { return this.createActionEvent('W 1 2 3'); }
	
	this.toggleMuteEvent = function() { return this.createActionEvent('W 1 10 3'); }
	this.muteOnEvent = function() { return this.createActionEvent('W 1 10 2'); }
	this.muteOffEvent = function() { return this.createActionEvent('W 1 10 1'); }
	this.muteSetEvent = function(v) { return this.createActionEvent('W 1 10 ' + v); }
	
	this.togglePowerEvent = function() { return this.createActionEvent('W 1 1 3'); }
	this.powerOnEvent = function() { return this.createActionEvent('W 1 1 2'); }
	this.powerOffEvent = function() { return this.createActionEvent('W 1 1 1'); }
	this.powerSetEvent = function(v) { 
		val = (v=='on')?2:1;
		return this.createActionEvent('W 1 1 ' + val);
	}
	this.volumeSetEvent = function(v) { return this.createActionEvent('W 2 ' + v); }
	this.volumeUpEvent = function() { return this.createActionEvent('W 1 9 1'); }
	this.volumeDownEvent = function() { return this.createActionEvent('W 1 9 2'); }
	
/*
	this.toneOnEvent = function() { return this.createActionEvent('tone_on'); }
	this.toneOffEvent = function() { return this.createActionEvent('tone_off'); }
	this.toneSetEvent = function(v) { return this.createActionEvent('tone_' + v); }
*/
	this.bassSetEvent = function(v) { return this.createActionEvent('W 1 3 ' + v); }
	this.bassUpEvent = function() { return this.createActionEvent('W 1 3 1'); }
	this.bassDownEvent = function() { return this.createActionEvent('W 1 3 2'); }

	this.trebleSetEvent = function(v) { return this.createActionEvent('W 1 3 ' + v); }
	this.trebleUpEvent = function() { return this.createActionEvent('W 1 3 3'); }
	this.trebleDownEvent = function() { return this.createActionEvent('W 1 3 4'); }

	this.balanceSetEvent = function(v) { return this.createActionEvent('W 1 3 ' + v); }
	this.balanceLeftEvent = function() { return this.createActionEvent('W 1 3 7'); }
	this.balanceRightEvent = function() { return this.createActionEvent('W 1 3 8'); }

	this.getCurrentPowerEvent = function() { return this.createActionEvent('R 1 1'); }
	this.getCurrentSourceEvent = function() { return this.createActionEvent('R 1 2'); }

	this.getBassEvent = function() { return this.createActionEvent('R 1 4'); }
	this.getTrebleEvent = function() { return this.createActionEvent('R 1 5'); }
	this.getBalanceEvent = function() { return this.createActionEvent('R 1 6'); }

	//this.getToneEvent = function() { return this.createActionEvent('get_tone'); }
	//this.getCurrentFreqEvent = function() { return this.createActionEvent('get_current_freq'); }

	this.getVolumeEvent = function() { return this.createActionEvent('R 1 7'); }
	this.getDisplayEvent = function() { return this.createActionEvent('R 1 13'); }
	this.getSummaryEvent = function() { return this.createActionEvent('R 1 13'); }

	this.createActionEvent = function(action) {
		return 'sendjson {"P":"/dev/ttyUSB0","Data":[{"D":"'+action+'\\r"}]}';
	};

	var incompleteEvent = null;
	var partialEvent = '';
	var remainingDisplayCharCount = null;

	var parseEvent = function(evt) {
		console.log("server: " + evt.data);
		if (typeof evt.data == "string") {
			var data = null;
			try {
				data = JSON.parse(evt.data);
			} catch (err) {
				console.log("Could not parse as JSON:" + JSON.stringify(evt.data));
				return;
			}

			console.log("data:" + data);
			if (data && data.D) {
				//Incomplete event check... must contain \r
				if (!data.D.includes("\r")) {
					console.log('Partial event detected!');
					incompleteEvent=true;
					partialEvent+=data.D;
					return;
				}

				if (incompleteEvent) {
					console.log('Partial event combined!')
					console.log('evt1:'+partialEvent+'\nevt2:'+data.D);
					data.D=partialEvent+data.D;
					incompleteEvent=false;
					partialEvent='';
				}

				//most responeses are separated by an asterisk "*" and have a carriage return at the end
				//full status request provides space delimited function and value
				fullResponse=data.D.trim();
				cleanResponse=fullResponse.replace(/\*/g, ' ');
				//console.log('Full Response:' + fullResponse);
				//console.log('Clean Response:' + cleanResponse);
				
				var responses = cleanResponse.split(" ");
				if (responses) {
					for (var i = 0; i < responses.length; i++)  {
						console.log("responses[" + i + "]: "  + responses[i]);
						response = responses[i].replace('\r','');
						
						if (response != null) {
							
							type=response.charAt(0);
							value=response.substring(1);
							console.log("type: '" + type+"', value: '"+value+"'");
							if (type && value) {
								incompleteEvent = null;
								switch (type) {
									case "G":
										//console.log("Power Event");
										setVal = (value==0)?"off":"on"
										self.power=setVal;
										break;
									case "S":
										//console.log("Input Event");
										switch(value) {
											case "1": 
												setVal="6";
												break;
											case "2":
												setVal="7";
												break;
											case "3":
												setVal="8";
												break;
											case "4":
												setVal="9";
												break;
											case "5":
												setVal="3";
												break;
										}
										//self.inputCode=setVal;
										self.inputSource=setVal;
										break;
									case "V":
										//console.log('Volume Event');
										self.volume=value;
										break;
									case "M":
										console.log('Mute Event');
										self.mute=value;
										break;
									case "L":
										//console.log('Balance Event');
										self.balance=value;
										break;
									case "B":
										//console.log('Bass Event');
										self.bass=value;
										break;
									case "T":
										//console.log('Treble Event');
										self.treble=value;
										break;
								}

								if (self.remainingDisplayCharCount == null) {
									self.stateChanged();
								}
							}
						}
					}
				}
			}
		}
	}

	var discard = function() {
		webSocket.close();
	}
};

