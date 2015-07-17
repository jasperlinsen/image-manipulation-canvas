var content;
if(content = document.getElementById('script')){
	var pre = document.createElement('pre');
	content = content.text;
	content.replace(new RegExp('<', 'g'), '&lt;');
	content.replace(new RegExp('>', 'g'), '&gt;');
	content.replace(new RegExp('\n', 'g'), '<br />');
	pre.innerHTML = content;
	document.body.appendChild(pre);
}