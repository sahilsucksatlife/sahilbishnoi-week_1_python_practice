import random

num = random.randint(100, 999)

t = str(num)

rev = t[::-1]

if t == rev:
    print(f"{num} is a palindrome.")
else:
    print(f"{num} is not a palindrome.")
