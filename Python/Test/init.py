def fn(p1, p2 , x):
    rate1 = p1 / (p1 + p2)
    rate2 = p2 / (p1 + p2)

    res1 = 0
    res2 = 0

    if x > p1 + p2:
        res1 = rate1 * x
        res2 = p1 + (x - (p1 + p2)) * rate1
    if x <= p1 + p2:
        res1 = rate1 * x
        res2 = rate2 * x


    print(res1, res2)



fn(100, 200, 500)
