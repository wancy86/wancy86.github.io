import random

def getRandomChar():
    chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    r = random.randint(0,35)
    return chars[r]

def getRandomCode(length):
    s=''
    for i in range(length):
        s+=getRandomChar()
    print(s)
    return s

getRandomCode(12)
# 6OWH8B7X5TUA