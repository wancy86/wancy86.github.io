from pyquery import PyQuery


import requests

def  init():
	print(123)

url = 'http://www.lofter.com/dwr/call/plaincall/TagBean.search.dwr'
resp = requests.get(url)
# print(dir(resp))
print(resp.content.decode())

