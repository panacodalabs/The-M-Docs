/* Bookmarks
---------------------------------------------------------------- */

var bookmarks = function(){
	var lasthash = '';
	var isie = false;
	var iec = 0;
	var iev = 0;
	var bookmarked = new Array();
	return {
		initialize:function(){
			var quirks = document.compatMode;
			if(document.all){
				if(/MSIE (\d+\.\d+);/.test(navigator.userAgent)){iev = new Number(RegExp.$1);}
				if(iev>=8 && quirks=='BackCompat' || iev<8){
					bookmarks.iframe();
					isie = true;
				}
			}
			setInterval("bookmarks.checkhash();", 400);
		},
		sethash:function(hash,url,container){
			if(hash){
				if(isie){iec++;}
				var str = hash + ',' + url + ',' + container + ',' + iec;
				var num = '';
				var partof = false;
				lasthash = hash;
				window.location.href = hash;
				for(var i=0;i<bookmarked.length;i++){
					var tmp = bookmarked[i].split(",");
					if(tmp[0]==hash){
						partof = true;
						num = tmp[3];
					}
				}
				if(isie){
					if(!partof){
						bookmarks.setiframe(hash,iec);
					}else{
						bookmarks.setiframe(hash,num);
					}
				}
				if(!partof){bookmarked.push(str);}
			}
		},
		checkhash:function(){
			var obj = window.location.hash;
			var purl, pctn, phas;
			if(obj){
				if(obj!=lasthash){
					if(lasthash!=undefined){
						for(var i=0;i<bookmarked.length;i++){
							var tmp = bookmarked[i].split(",");
							if(tmp[0]==obj){
								phas = tmp[0];purl = tmp[1];pctn = tmp[2];
								break;
							}
						}
						if(phas && purl && pctn){
							lasthash = phas;
							ajax.load(purl,pctn,false,'','');
						}
					}
				}
			}
		},
		iframe:function(){
			var bug = document.createElement("iframe");
			bug.src = '/bookmarks/blank.html';
			bug.id = 'bugframe';
			bug.style.width = '100px';
			bug.style.height = '100px';
			bug.style.display = 'none';
			document.body.appendChild(bug);
		},
		setiframe:function(f,num){
			document.getElementById('bugframe').src = '/bookmarks/blank.html?' + num + f;
		},
		fixiframe:function(f){
			var obj = window.location.hash;
			if(f){if(f!=obj){window.location.href = f;}}
		}
	};
}();

/* Ajax <|> ajax.load('http://www.','ajaxdiv',true,hash,['customfunction()','anotherfunction()']);
---------------------------------------------------------------- */

var ajax = function(){
	return {
		nocache:function(){
			var minutes = 1000 * 60;
			var hours = minutes * 60;
			var days = hours * 24;
			var years = days * 365;
			var d = new Date();
			var t = d.getTime();
			return t;
		},
		load:function(url,container,load,store,functions){
			var obj = document.getElementById(container);
			var loader = '<div class="loading">Loading...</div>';
			if(obj && url){
				if(load){obj.innerHTML = loader;}
				ajax.page(url,container,functions);
				if(store){bookmarks.sethash(store,url,container);}
			}
		},
		page:function(url,container,functions){
			var _url = '';var _no = '';var page_request = false;
			if(url.indexOf("?")==-1){_no = '?~' + ajax.nocache();}else{_no = '&~' + ajax.nocache();}
			_url = url + _no;
			
			if(window.XMLHttpRequest){
				page_request = new XMLHttpRequest();
			}else if(window.ActiveXObject){
				try{
					page_request = new ActiveXObject('Msxml2.XMLHTTP');
				}catch(e){
					try{
						page_request = new ActiveXObject('Microsoft.XMLHTTP');
					}catch(e){}
				}
			}else{
				return false;
			}

			page_request.onreadystatechange = function(){
				ajax.parse(page_request,container,functions);
			}
			page_request.open('GET', _url, true);
			page_request.send(null);
		},
		parse:function(page_request,container,functions){
			if(page_request.readyState==4 && (page_request.status==200 || window.location.href.indexOf('http')==-1)){
				document.getElementById(container).innerHTML = page_request.responseText;
				ajax.completed(functions);
			}
		},
		completed:function(functions){
			// After complete functions here..
			if(functions){
				for(var i=0;i<functions.length;i++){
					try{eval(functions[i]);}catch(e){alert(e.description);}
				}
			}
		}
	};
}();

/* Initialize onload */
//window.onload = function(){
//	bookmarks.initialize();
//}