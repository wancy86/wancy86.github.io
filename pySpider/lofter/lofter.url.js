

// chrome "http://imglf1.nosdn.127.net/img/Q0NGZzZBVy9QbEdSOFpiQlh4R3NjNllSWnBNT054b09kV0luZEVhZ2tEcVBNU2N1LzAxWVNRPT0.jpg?imageView&thumbnail=1680x0&quality=96&stripmeta=0&type=jpg"
//https://common.cnblogs.com/script/jquery.js

str=""
$('span.pic img').each(function(){
	str+=$(this).attr('src')+'\r\n';
})
console.log(str)




str=""
$('.img a img').each(function(){
	str+=$(this).attr('src')+'\r\n';
})



