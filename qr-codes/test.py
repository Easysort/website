#!/usr/bin/env python3

import qrcode

img = qrcode.make("https://easysort.org/provas/vojens")
img.save("qr-codes/qr-provas-vojens.png")