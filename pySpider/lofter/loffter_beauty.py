# from pyquery import PyQuery


import requests


def init():
    print(123)


url = 'http://www.lofter.com/dwr/call/plaincall/TagBean.search.dwr'
resp = requests.get(url)
# print(dir(resp))
# print(resp.content.decode())
i = 10000
basePath = 'F:\\lofter\\'
with open('urls.txt', 'r') as f:
    for x in f.readlines():
        # print(x[:-1])
        pic = requests.get(x[:-1])
        file = basePath + str(i) + '.' + x[-4:-1]
        i += 1
        # print(file)
        img = open(file, 'wb')
        img.write(pic.content)
        img.close()
        if i > 100010:
            break
