import requests
from pyquery import PyQuery
import os
import traceback
import threading

# url = 'http://docs.embarcadero.com/products/rad_studio/delphiAndcpp2009/HelpUpdate2/EN/html/delphivclwin32/idx.html'

# print(111)
# req = requests.get(url)
# pq = PyQuery(req.content)
# for link in pq('a:eq(100)').items():
#     print(link.html()+ ': http://docs.embarcadero.com/products/rad_studio/delphiAndcpp2009/HelpUpdate2/EN/html/delphivclwin32/' + link.attr['href'])
# print('dong...')

# import sys
# import io
# sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf8')  # 改变标准输出的默认编码
# print(resp.text)


def download_api(filename):
    baseurl = 'http://docs.embarcadero.com/products/rad_studio/delphiAndcpp2009/HelpUpdate2/EN/html/delphivclwin32/'
    rootdir = r'E:\DelphiAPI'

    with open(filename, 'r') as f:
        for line in f.readlines():
            line = line[:len(line) - 1]
            if len(line) <= 0:
                print('enpty line.....')
                continue
            if os.path.exists(line):
                print(line+' - exists......')
                continue

            print(filename)
            print(line)
            print('\n')
            resp = requests.get(baseurl + line)
            # print(line + ' - ' + resp.status_code)
            resp.encoding = 'utf-8'
            html = open(os.path.join(rootdir,line), 'w', encoding='utf-8')
            try:
                html.writelines(resp.text)
            except:
                traceback.print_exc()
            html.close()
            f.close()


def split_url():
    with open('url.txt', 'r') as f:
        lines = f.readlines()
        print(len(lines))
        print(lines[10])
        import math
        page = 1000
        for u in range(1, math.ceil(len(lines) * 1.0 / page + 1)):
            print(u)
            sfile = open('urls/url' + str(u) + '.txt', 'w', encoding='utf-8')

            for l in lines[(u - 1) * page:(u * page if u * page < len(lines) else len(lines))]:
                sfile.writelines(l)
            sfile.close()
        f.close()


# split_url()

def mult_run():
    rootdir = r'E:\DelphiAPI\urls'
    # filename = "url/url1.txt"
    threadings=[]
    for filename in os.listdir(rootdir):
        filename = (os.path.join(rootdir, filename))
        # print(filename)
        threadings.append(threading.Thread(target=download_api, args=(filename,)))
        
    for t in threadings:
        # setDeamon反而被挂起
        # t.setDaemon(True)
        # print('start')
        t.start()

mult_run()
