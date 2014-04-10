var wotteams = [];
var parsedteams = [];
var filtered = [];
var teamscompleted = 0;
var teamParseTimeout = null;

var DEBUG = true;

chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);
		// ----------------------------------------------------------
		// This part of the script triggers when page is done loading
		//console.log("Hello. This message was sent from scripts/main.js");
		//only load for tournament pages
		if(window.location.href.indexOf('uc/tournaments/') != -1 && window.location.href.indexOf('Group') != -1)
		{
			if(teamParseTimeout == null)
				teamParseTimeout = setTimeout(function(){parseTeams();}, 1000);
		}
		// ----------------------------------------------------------
	}
	}, 10);
});

function parseTeams()
{
	var placeholder = '<div id="WoTGroupStatsContainer" style="margin: 15px;"><h4 class="b-head-team">Team Stats</h4><img src="http://worldoftanks.com/static/3.18.0.1/common/css/scss/content/tournaments/img/wot_waiter.gif"></div>'
	$('h4.b-head-team__indent-top:last').before(placeholder);
	
	
	if(DEBUG) console.log("parseTeams start");
	var links = $('a.b-team-name-link');
	var hrefs = [];
	filtered = $.grep(links,function(ele, index){
		if($.inArray(ele.href,hrefs) != -1)
			return false;
		else {
			hrefs.push(ele.href);
			return true;
		}
	});
	links = null; hrefs = null;
	
	teamscompleted = 0;
	for (var i in filtered)
	{
		getTeam(i,filtered[i]);
	}
}

function getTeam(index,link)
{
	$.get(link.href,null, function (data, status, xhr ) {
			if(DEBUG) console.log("got team "+index+" "+link.innerText);
			var users = $(data).find('td.b-user > a');
			wotteams.push({'name':link.innerText,'playerlinks':users,'players':[],'sum':0,'best':0});	
			if(wotteams.length == filtered.length) {
				parsePlayers();
			}
			data=null;
		}
	);
}

function parsePlayers()
{
	if(DEBUG) console.log("parsePlayers start");
	for (var i=0; i< wotteams.length; i++)
	{
		for (var j=0; j < wotteams[i].playerlinks.length; j++) {
			getPlayer(j,i,wotteams[i].playerlinks[j]);
		}
	}
}

function getPlayer(index,teamindex,link)
{
	if("undefined" == typeof(link))
	{
		return;
	}
	$.get(link.href,null, function (data, status, xhr ) {
			var rating = $(data).find('p.t-personal-data_value__pr')[0].innerText;
			var p = {"rating":rating,"name":link.innerText};
			if(rating > wotteams[teamindex].best) wotteams[teamindex].best = rating;
			wotteams[teamindex].players[index] = p;
			wotteams[teamindex].sum += parseFloat(rating);
			if(wotteams[teamindex].players.length == wotteams[teamindex].playerlinks.length) {
				parsedteams[teamindex] = wotteams[teamindex];
				if(DEBUG) console.log("finished team "+teamindex+" "+wotteams[teamindex].name);
				updateStatsTable();
			}
			data=null;
			if(parsedteams.length == wotteams.length) {
				doneParsing();
			}
		}
	);
}

function doneParsing()
{
	if(DEBUG) console.log("doneParsing")
}

function updateStatsTable() {
	$("#WoTGroupStatsContainer").remove();
	var container = '<div id="WoTGroupStatsContainer" style="margin: 15px;"><h4 class="b-head-team">Team Stats</h4>';
	var table = '<table id="WoTGroupStatsList" class="t-table t-tournament">';
	table += '<tr><th>#</th><th>Team Name</th><th>Average Rating</th><th>Best Player</th></tr>';
	for(var i in parsedteams)
	{
		var avg = (parsedteams[i].sum/parsedteams[i].players.length).toFixed(0)
		table += '<tr class="WoTGroupStatItem">'
		table += '<td class="b-points">'+(i+1)+'</td>'
		table += '<td class="b-points">'+parsedteams[i].name+'</td>'
		table += '<td class="b-points" style="color:'+colorForRating(avg)+'">'+avg+'</td>'
		table += '<td class="b-points" style="color:'+colorForRating(parsedteams[i].best)+'">'+parsedteams[i].best+'</td></tr>';
	}
	table += '</table>';
	container += table;
	container += '</div>';
	
	$('h4.b-head-team__indent-top:last').before(container);
}

function colorForRating(rating)
{
	if(rating > 8000) {
		return '#C718C7';
	} else if (rating > 7000) {
		return '#2DD6D6';
	} else if (rating > 6000) {
		return '#18C718';
	} else if (rating > 4499) {
		return '#E2E82A';
	} else if (rating > 2500) {
		return '#E62020';
	} else {
		return '#AAAAAA;'
	}
}
